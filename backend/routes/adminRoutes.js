const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const Admin = require("../models/Admin");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const { getJwtSecret } = require("../middleware/authMiddleware");
const { logAudit } = require("../utils/auditLog");
const { loginLimiter, createAdminLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, GIF and WEBP are allowed"));
    }
  }
});

// Middleware to check admin authentication
const adminAuthMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Only a superadmin may manage other admin accounts
const requireSuperAdmin = (req, res, next) => {
  if (req.admin?.role !== "superadmin") {
    return res.status(403).json({ error: "Superadmin privileges required" });
  }
  next();
};

// Utility route to create a new admin account.
// If there are no admins in the system this endpoint is open so the first
// administrator can be bootstrapped. Once at least one admin exists, further
// calls require an authenticated superadmin token in the Authorization header.
router.post("/create-admin", createAdminLimiter, async (req, res) => {
  try {
    const { username = "admin", password = "admin123" } = req.body;

    // if admins already exist, enforce superadmin authentication
    const count = await Admin.countDocuments();
    if (count > 0) {
      const authHeader = req.header("Authorization") || "";
      const token = authHeader.replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "No token provided" });
      let decoded;
      try {
        decoded = jwt.verify(token, getJwtSecret());
      } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
      }
      if (decoded.role !== "superadmin") {
        return res.status(403).json({ error: "Superadmin privileges required" });
      }
    }

    const existing = await Admin.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: "Admin already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ username, password: hashed });
    await logAudit(username, "ADMIN_CREATED", admin._id);
    res.json({ message: "Admin created", admin });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Creation failed" });
  }
});

// Admin login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    admin.lastLoginAt = new Date();
    await admin.save();

    await logAudit(admin.username, "ADMIN_LOGIN", admin._id);

    res.json({
      message: "Admin logged in successfully",
      token,
      admin: {
        _id: admin._id,
        username: admin.username,
        role: admin.role,
        name: admin.name,
        avatarUrl: admin.avatarUrl,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Login failed" });
  }
});

// Get all complaints (admin only)
router.get("/complaints", adminAuthMiddleware, async (req, res) => {
  try {
    const { status, location } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const complaints = await Complaint.find(query)
      .populate("user", "name email mobile village")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Complaint.countDocuments(query);

    res.json({
      complaints,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to fetch complaints" });
  }
});

// Get complaint details (admin only)
router.get("/complaints/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate("user");

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json({ complaint });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to fetch complaint" });
  }
});

// Update complaint status (admin only)
router.put("/complaints/:id/status", adminAuthMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user");

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    await logAudit(req.admin?.username, `COMPLAINT_STATUS_${status.toUpperCase().replace(/\s+/g, "_")}`, complaint._id);

    res.json({
      message: "Complaint status updated successfully",
      complaint
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Update failed" });
  }
});

// Delete a complaint (admin only)
router.delete("/complaints/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    await logAudit(req.admin?.username, "COMPLAINT_DELETED", req.params.id);
    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Delete failed" });
  }
});

// Get admin dashboard statistics
router.get("/stats", adminAuthMiddleware, async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: "Pending" });
    const inProgressComplaints = await Complaint.countDocuments({ status: "In Progress" });
    const resolvedComplaints = await Complaint.countDocuments({ status: "Resolved" });
    const totalUsers = await User.countDocuments();

    res.json({
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      totalUsers
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to fetch statistics" });
  }
});

// Get all admin users (admin only)
router.get("/admins", adminAuthMiddleware, async (req, res) => {
  try {
    const admins = await Admin.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json({ admins });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to fetch admins" });
  }
});

// Get current admin's profile (admin only)
router.get("/profile", adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id, { password: 0 });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    res.json({ admin });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to fetch profile" });
  }
});

// Update current admin's profile (name + avatar photo)
router.put("/profile", adminAuthMiddleware, (req, res, next) => {
  avatarUpload.single("avatar")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Avatar upload failed" });
    }
    next();
  });
}, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    if (typeof req.body.name === "string") {
      admin.name = req.body.name.trim().slice(0, 60);
    }

    if (req.file) {
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "admin_avatars", resource_type: "image" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        admin.avatarUrl = uploadResult.secure_url;
      } catch (cloudinaryError) {
        console.error("Avatar upload error:", cloudinaryError);
        return res.status(400).json({ error: "Avatar upload failed" });
      }
    }

    await admin.save();
    await logAudit(admin.username, "ADMIN_PROFILE_UPDATED", admin._id);

    const { password, ...adminWithoutPassword } = admin.toObject();

    res.json({
      message: "Profile updated successfully",
      admin: adminWithoutPassword
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to update profile" });
  }
});

// Change admin password (admin only)
router.put("/change-password", adminAuthMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    await logAudit(admin.username, "ADMIN_PASSWORD_CHANGED", admin._id);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to change password" });
  }
});

// Delete an admin user (superadmin only)
router.delete("/admins/:id", adminAuthMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (req.admin.id === id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Ensure at least one admin remains
    const adminCount = await Admin.countDocuments();
    if (adminCount <= 1) {
      return res.status(400).json({ error: "Cannot delete the only admin. At least one admin must exist." });
    }

    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    await logAudit(req.admin.username, "ADMIN_DELETED", id);

    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to delete admin" });
  }
});

module.exports = router;
