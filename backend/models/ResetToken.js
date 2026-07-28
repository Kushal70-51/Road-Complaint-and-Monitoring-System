const mongoose = require("mongoose");

const resetTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  token: { type: String, index: true },
  expiresAt: { type: Date, expires: 0 }
});

module.exports = mongoose.model("ResetToken", resetTokenSchema);
