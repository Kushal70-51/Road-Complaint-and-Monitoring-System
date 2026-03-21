const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["superadmin", "admin"],
    default: "admin"
  },
  otpSecret: String
}, { timestamps: true });

module.exports = mongoose.model("Admin", adminSchema);
