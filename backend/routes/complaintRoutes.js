const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Complaint = require("../models/Complaint");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const { suggestCategoryLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

const cloudinary = require("../config/cloudinary");
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, GIF and WEBP are allowed"));
    }
  }
});

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = x => x * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Upload a new complaint
router.post("/upload", authMiddleware, (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Image upload failed" });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { location, latitude, longitude, lat, lng, path, routePath, description, severity, category } = req.body;
    const userId = req.user.id;
    let parsedPath = [];
    let parsedRoutePath = [];

    if (typeof path === 'string') {
      try {
        const candidate = JSON.parse(path);
        if (Array.isArray(candidate)) {
          parsedPath = candidate
            .map((point) => ({
              lat: Number(point?.lat),
              lng: Number(point?.lng)
            }))
            .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
        }
      } catch (parseError) {
        parsedPath = [];
      }
    }

    // Parse the actual road route path from OSRM
    if (typeof routePath === 'string') {
      try {
        const candidate = JSON.parse(routePath);
        if (Array.isArray(candidate)) {
          parsedRoutePath = candidate
            .map((point) => ({
              lat: Number(point?.lat),
              lng: Number(point?.lng)
            }))
            .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
        }
      } catch (parseError) {
        parsedRoutePath = [];
      }
    }

    const firstPathPoint = parsedPath[0];
    const parsedLat = parseFloat(firstPathPoint?.lat ?? lat ?? latitude);
    const parsedLng = parseFloat(firstPathPoint?.lng ?? lng ?? longitude);
    const hasCoordinates = !isNaN(parsedLat) && !isNaN(parsedLng);

    let flags = [];

    const recent = await Complaint.countDocuments({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
    });

    if (recent >= 5) flags.push("Suspicious");

    // only try distance check if we have valid coordinates
    if (hasCoordinates) {
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      const complaints = await Complaint.find({
        createdAt: { $gte: sixMonthsAgo },
        $or: [
          { lat: { $ne: null }, lng: { $ne: null } },
          { latitude: { $ne: null }, longitude: { $ne: null } }
        ]
      }).select("lat lng latitude longitude");

      for (let c of complaints) {
        const complaintLat = typeof c.lat === 'number' ? c.lat : c.latitude;
        const complaintLng = typeof c.lng === 'number' ? c.lng : c.longitude;

        if (typeof complaintLat !== 'number' || typeof complaintLng !== 'number') {
          continue;
        }

        const dist = haversine(parsedLat, parsedLng, complaintLat, complaintLng);
        if (dist <= 100) {
          flags.push("Duplicate Area Alert");
          break;
        }
      }
    }

    let imageUrl = null;
    
    if (req.file) {
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { 
              folder: "road_complaints",
              resource_type: "auto"
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        imageUrl = uploadResult.secure_url;
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError);
        return res.status(400).json({ error: "Image upload failed" });
      }
    }

    const validCategories = [
      "Pothole",
      "Waterlogging",
      "Broken Streetlight",
      "Road Crack",
      "Missing Signage",
      "Garbage Dump",
      "Other"
    ];

    const complaint = await Complaint.create({
      user: userId,
      image: imageUrl,
      location,
      description,
      category: validCategories.includes(category) ? category : "Other",
      severity: severity || "Medium",
      path: parsedPath,
      routePath: parsedRoutePath,
      lat: hasCoordinates ? parsedLat : undefined,
      lng: hasCoordinates ? parsedLng : undefined,
      latitude: hasCoordinates ? parsedLat : undefined,
      longitude: hasCoordinates ? parsedLng : undefined,
      flags: flags.length > 0 ? flags.join("; ") : ""
    });

    await complaint.populate("user", "name email mobile village");

    res.json({
      message: "Complaint submitted successfully",
      complaint
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Upload failed" });
  }
});

// Get all complaints for current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, location } = req.query;
    const userId = req.user.id;

    let query = { user: userId };

    if (status) {
      query.status = status;
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    const complaints = await Complaint.find(query)
      .populate("user", "name email mobile village")
      .sort({ createdAt: -1 });

    res.json({ complaints });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to fetch complaints" });
  }
});

// Get complaint by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate("user");

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Check if user owns this complaint
    if (complaint.user._id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({ complaint });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to fetch complaint" });
  }
});

// Update complaint
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { status, location, description } = req.body;

    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Check if user owns this complaint
    if (complaint.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (status) complaint.status = status;
    if (location) complaint.location = location;
    if (description) complaint.description = description;

    await complaint.save();
    await complaint.populate("user", "name email mobile village");

    res.json({
      message: "Complaint updated successfully",
      complaint
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Update failed" });
  }
});

// AI Categorization endpoint
router.post("/suggest-category", suggestCategoryLimiter, async (req, res) => {
  try {
    const { description, severity } = req.body;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ 
        error: "Description must be at least 10 characters" 
      });
    }

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a road complaint categorization system for Indian cities. Analyze the complaint description and return ONLY a valid JSON object (no markdown, no code blocks) with these exact fields:
{
  "category": "One of: Pothole, Waterlogging, Broken Streetlight, Road Crack, Missing Signage, Garbage Dump, Other",
  "confidence": "A number between 0 and 1 representing confidence level",
  "reason": "Brief 1-2 sentence explanation of why this category"
}
Important: Return ONLY the JSON object, nothing else.`
          },
          {
            role: "user",
            content: `Severity: ${severity || 'Medium'}. Description: ${description}`
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (!openaiResponse.ok) {
      console.error("OpenAI API error:", await openaiResponse.text());
      // Return default response on API failure
      return res.json({
        category: "Other",
        confidence: 0,
        reason: "Unable to categorize at this moment. Please select manually."
      });
    }

    const openaiData = await openaiResponse.json();
    const responseText = openaiData.choices[0]?.message?.content || "";

    // Parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return res.json({
        category: "Other",
        confidence: 0,
        reason: "Could not parse AI response. Please select manually."
      });
    }

    // Validate the response structure
    const validCategories = [
      "Pothole",
      "Waterlogging",
      "Broken Streetlight",
      "Road Crack",
      "Missing Signage",
      "Garbage Dump",
      "Other"
    ];

    const category = validCategories.includes(parsedResponse.category) 
      ? parsedResponse.category 
      : "Other";
    
    const confidence = Math.min(Math.max(Number(parsedResponse.confidence) || 0, 0), 1);
    const reason = parsedResponse.reason || "AI categorization complete.";

    res.json({
      category,
      confidence,
      reason
    });

  } catch (error) {
    console.error("Categorization error:", error);
    res.json({
      category: "Other",
      confidence: 0,
      reason: "Error in AI processing. Please select manually."
    });
  }
});

module.exports = router;
