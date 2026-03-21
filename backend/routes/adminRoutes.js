const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Complaint = require("../models/Complaint");
const User = require("../models/User");

const router = express.Router();

// Middleware to check admin authentication
const adminAuthMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Utility route to create a new admin account.
// If there are no admins in the system this endpoint is open so the first
// administrator can be bootstrapped. Once at least one admin exists, further
// calls require an authenticated admin token in the Authorization header.
router.post("/create-admin", async (req, res) => {
  try {
    const { username = "admin", password = "admin123" } = req.body;

    // if admins already exist, enforce authentication
    const count = await Admin.countDocuments();
    if (count > 0) {
      const authHeader = req.header("Authorization") || "";
      const token = authHeader.replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "No token provided" });
      try {
        jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
      } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
      }
    }

    const existing = await Admin.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: "Admin already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ username, password: hashed });
    res.json({ message: "Admin created", admin });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Creation failed" });
  }
});

// Register a new admin (for initial setup)
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ username, password: hashed });

    const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET || "your_jwt_secret");

    res.json({
      message: "Admin registered successfully",
      token,
      admin: { _id: admin._id, username: admin.username, role: admin.role }
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Admin registration failed" });
  }
});

// Admin login
router.post("/login", async (req, res) => {
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

    const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET || "your_jwt_secret");

    res.json({
      message: "Admin logged in successfully",
      token,
      admin: { _id: admin._id, username: admin.username, role: admin.role }
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Login failed" });
  }
});

// Get all complaints (admin only)
router.get("/complaints", adminAuthMiddleware, async (req, res) => {
  try {
    const { status, location, page = 1, limit = 10 } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const complaints = await Complaint.find(query)
      .populate("user", "name email mobile village")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(query);

    res.json({
      complaints,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
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

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to change password" });
  }
});

// Delete an admin user (admin only)
router.delete("/admins/:id", adminAuthMiddleware, async (req, res) => {
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

    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to delete admin" });
  }
});

module.exports = router;
