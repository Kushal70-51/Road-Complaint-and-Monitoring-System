const express = require("express");
const { chatLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

const GEMINI_MODEL = "gemini-flash-lite-latest";
const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_TURNS = 10;

const SYSTEM_INSTRUCTION = `You are the friendly AI assistant embedded in the "Road Complaint System" — India's National Portal for Road Infrastructure Grievances.

What this platform does:
- Citizens register with name, mobile number, email and password (email is verified with an OTP).
- Logged-in citizens submit road complaints from the "Submit Complaint" page: a photo, a location picked on a map, a text description, a category (Pothole, Waterlogging, Broken Streetlight, Road Crack, Missing Signage, Garbage Dump, Other — an AI feature can auto-suggest this from the description), and a severity level (Low/Medium/High/Critical).
- Citizens track their own complaints from "Dashboard" (list + filters) and "Statistics" (charts), and can view a public map of all complaint locations under "View Status" / "View Map".
- Complaint statuses are Pending, In Progress, and Resolved, updated by government administrators through a separate admin panel.
- "Profile" lets a citizen update their name, village and (for admins) a photo and display name.
- "Contact Us" sends a message straight to the support team; "Help & Support" has an FAQ.

How to answer:
- Be concise and friendly — 2 to 4 short sentences is usually enough, more only if the question genuinely needs it.
- Guide users to the exact page/button name when relevant (e.g., "click Submit Complaint in the top menu").
- You do NOT have access to any specific user's account or complaint data — never invent a complaint status, ID, or personal detail. If asked about a specific complaint, tell them to check their Dashboard or Contact Us.
- If asked something unrelated to this portal, answer briefly and helpfully if you can, then gently steer back to how you can help with road complaints.
- Never claim to be able to take actions yourself (you cannot submit, edit, or resolve complaints) — just explain how the user can do it.`;

// Legacy keyword-based fallback, used only if Gemini is unavailable or misconfigured.
const fallbackReply = (message) => {
  const text = String(message || "").toLowerCase();
  if (text.includes("register") || text.includes("sign up")) {
    return "To register, click the 'Register' link in the navigation bar, fill out the form with your details and submit. You'll receive a confirmation email if the process succeeds.";
  }
  if (text.includes("complaint") || text.includes("file")) {
    return "To file a complaint, log in and go to the 'Upload' page (or Dashboard). Provide the required information and submit the form; your complaint will then be visible on your dashboard.";
  }
  if (text.includes("status")) {
    return "You can check the status of your complaint by logging in and visiting your 'Dashboard' where all your submitted complaints appear with their current status.";
  }
  if (text.includes("profile") || text.includes("update")) {
    return "To update your profile, log in and navigate to the 'Profile' page. From there you can change any of your personal information and save the updates.";
  }
  return "I'm here to help! You can ask me about registration, complaints, checking status or updating your profile. If you need a step-by-step walkthrough, ask something like 'how do I register' or 'how to check complaint status?'.";
};

router.post("/message", chatLimiter, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const trimmedMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({ success: true, reply: fallbackReply(trimmedMessage) });
    }

    const contents = [];
    if (Array.isArray(history)) {
      history.slice(-MAX_HISTORY_TURNS).forEach((turn) => {
        if (turn && typeof turn.text === "string" && turn.text.trim()) {
          contents.push({
            role: turn.isBot ? "model" : "user",
            parts: [{ text: turn.text.trim().slice(0, MAX_MESSAGE_LENGTH) }]
          });
        }
      });
    }
    contents.push({ role: "user", parts: [{ text: trimmedMessage }] });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    let response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents,
            generationConfig: { maxOutputTokens: 300, temperature: 0.4 }
          })
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.error("Gemini chat API error:", response.status, await response.text());
      return res.json({ success: true, reply: fallbackReply(trimmedMessage) });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!reply) {
      console.error("Gemini chat API returned no text", JSON.stringify(data));
      return res.json({ success: true, reply: fallbackReply(trimmedMessage) });
    }

    return res.json({ success: true, reply });
  } catch (err) {
    console.error("Chat route error:", err);
    return res.json({ success: true, reply: fallbackReply(req.body?.message) });
  }
});

// Health check for chat route
router.get("/ping", (req, res) => {
  res.json({ message: "Chat service is alive" });
});

module.exports = router;
