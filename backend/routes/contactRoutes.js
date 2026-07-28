const express = require("express");
const { sendEmail } = require("../config/email");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email and message are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const recipient = process.env.CONTACT_EMAIL || process.env.EMAIL_USER;
    if (!recipient) {
      console.error("[CONTACT] No CONTACT_EMAIL or EMAIL_USER configured to receive messages");
      return res.status(500).json({ error: "Contact form is not configured. Please try again later." });
    }

    await sendEmail({
      toEmail: recipient,
      subject: `New contact message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`
    });

    return res.json({ message: "Your message has been sent successfully." });
  } catch (error) {
    console.error("[CONTACT] Failed to send message:", error.message);
    return res.status(500).json({ error: "Failed to send your message. Please try again later." });
  }
});

module.exports = router;
