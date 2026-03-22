const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Complaint = require("../models/Complaint");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

const uploadsDir = path.join(__dirname, "../uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

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
router.post("/upload", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { location, latitude, longitude, lat, lng, path, routePath, description, severity } = req.body;
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
      const complaints = await Complaint.find({
        $or: [
          { lat: { $ne: null }, lng: { $ne: null } },
          { latitude: { $ne: null }, longitude: { $ne: null } }
        ]
      });

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

    const complaint = await Complaint.create({
      user: userId,
      image: req.file?.filename,
      location,
      description,
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

module.exports = router;
