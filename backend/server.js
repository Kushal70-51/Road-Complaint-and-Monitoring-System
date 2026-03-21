const path = require("path");
const dotenvResult = require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");

const fs = require("fs");
const app = express();

if (dotenvResult.error) {
  console.error("[ENV] Failed to load backend/.env", dotenvResult.error.message);
} else {
  console.log("[ENV] Loaded environment variables from backend/.env");
}

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "EMAIL_USER", "EMAIL_PASS"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error("[ENV] Missing required variables:", missingEnvVars.join(", "));
}

console.log("[ENV] OTP email config status", {
  hasEmailUser: Boolean(process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.SMTP_USER),
  hasEmailPass: Boolean(process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS),
  smtpFromConfigured: Boolean(process.env.SMTP_FROM || process.env.EMAIL_FROM)
});

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://road-complaint-and-monitoring-system.onrender.com"
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("[CORS] Blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true
};

// create uploads folder if missing (multer doesn't auto-create it)
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// connect to mongo
// start app after DB connection and run any initializers
const start = async () => {
  await connectDB();

  // Ensure the configured super admin can always log in.
  // In development/demo setups this prevents stale DB passwords
  // from breaking documented default credentials.
  try {
    const Admin = require("./models/Admin");
    const bcrypt = require("bcryptjs");

    const username = process.env.SUPER_ADMIN_USERNAME || "admin";
    const password = process.env.SUPER_ADMIN_PASSWORD || "admin123";
    const existingSuperAdmin = await Admin.findOne({ username });

    if (!existingSuperAdmin) {
      const hashed = await bcrypt.hash(password, 10);
      await Admin.create({ username, password: hashed, role: "superadmin" });
      console.log("✅ Super admin created:", username);
    } else {
      const isPasswordMatch = await bcrypt.compare(password, existingSuperAdmin.password);

      if (!isPasswordMatch || existingSuperAdmin.role !== "superadmin") {
        existingSuperAdmin.password = await bcrypt.hash(password, 10);
        existingSuperAdmin.role = "superadmin";
        await existingSuperAdmin.save();
        console.log("✅ Super admin credentials synchronized:", username);
      }
    }
  } catch (err) {
    console.error("Error during superadmin initialization:", err);
  }

  app.get("/", (req, res) => {
    res.json({ message: "API is running" });
  });

  // mount routes
  app.use("/api/auth", authRoutes);
  app.use("/api/complaints", complaintRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/chat", chatRoutes);

  // Always return JSON for unknown API routes
  app.use("/api", (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.originalUrl}`
    });
  });

  // Centralized JSON error handler for API requests
  app.use((err, req, res, next) => {
    if (req.originalUrl && req.originalUrl.startsWith("/api")) {
      console.error("API error:", err);
      return res.status(err.status || 500).json({
        error: err.message || "Internal server error"
      });
    }

    return next(err);
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
