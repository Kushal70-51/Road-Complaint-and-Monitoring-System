const nodemailer = require("nodemailer");
const dns = require("dns");

const getEmailAuth = () => {
  const user = String(process.env.EMAIL_USER || "").trim();
  // Gmail app passwords are sometimes copied with spaces; normalize before SMTP auth.
  const pass = String(process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();
  const from = process.env.SMTP_FROM || (user ? `Road Complaint <${user}>` : undefined);

  return { user, pass, from };
};

const resolveSmtpHost = async () => {
  try {
    const result = await dns.promises.lookup("smtp.gmail.com", { family: 4 });
    if (result && result.address) {
      console.log("[EMAIL] Using IPv4 SMTP address:", result.address);
      return result.address;
    }
  } catch (error) {
    console.warn("[EMAIL] IPv4 DNS lookup failed, falling back to hostname", {
      code: error.code,
      message: error.message
    });
  }

  return "smtp.gmail.com";
};

const createTransporter = async () => {
  const { user, pass } = getEmailAuth();

  if (!user || !pass) {
    const error = new Error("Missing EMAIL_USER or EMAIL_PASS in environment");
    error.code = "MISSING_CREDENTIALS";
    throw error;
  }

  const smtpHost = await resolveSmtpHost();

  console.log("[EMAIL] Creating SMTP transporter for user:", user);
  console.log("Using SMTP host:", smtpHost);
  console.log("Using SMTP port:", 587);

  // Primary transporter config
  const primaryConfig = {
    host: smtpHost,
    port: 587,
    secure: false,
    auth: {
      user,
      pass
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    requireTLS: true,
    tls: {
      servername: "smtp.gmail.com",
      rejectUnauthorized: true,
      minVersion: "TLSv1.2"
    }
  };

  return nodemailer.createTransport(primaryConfig);
};

let verifiedTransport = false;

const verifyEmailTransport = async (transporter) => {
  if (verifiedTransport) {
    return;
  }

  try {
    console.log("[EMAIL] Attempting to verify SMTP connection...");
    await transporter.verify();
    verifiedTransport = true;
    console.log("[EMAIL] ✅ SMTP transporter verified successfully");
  } catch (error) {
    console.warn("[EMAIL] ⚠️ SMTP verify failed, will try direct send", {
      code: error.code,
      message: error.message,
      command: error.command
    });
    // Don't throw - allow direct send attempt
  }
};

const sendOtpEmail = async ({ toEmail, otp, expiryMinutes = 5 }) => {
  const { from } = getEmailAuth();
  const MAX_RETRIES = 3;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[EMAIL] === Attempt ${attempt}/${MAX_RETRIES} - Starting OTP email send ===`);
      console.log("[EMAIL] Target:", toEmail);
      console.log("[EMAIL] From:", from);

      const transporter = await createTransporter();
      console.log("[EMAIL] Transporter created");

      await verifyEmailTransport(transporter);

      const mail = {
        from,
        to: toEmail,
        subject: "OTP Verification",
        text: `Your OTP is ${otp}. It will expire in ${expiryMinutes} minutes.`
      };

      console.log("[EMAIL] Calling transporter.sendMail()...");
      const info = await transporter.sendMail(mail);
      
      console.log("[EMAIL] ✅ SUCCESS - OTP email sent", {
        attempt,
        to: toEmail,
        messageId: info.messageId,
        response: info.response
      });
      return info;

    } catch (error) {
      console.error(`[EMAIL] ❌ Attempt ${attempt} failed:`, {
        code: error.code,
        command: error.command,
        message: error.message,
        response: error.response
      });

      // Log full error details
      if (error.stack) {
        console.error("[EMAIL] Stack trace:", error.stack);
      }

      // If last attempt, throw
      if (attempt === MAX_RETRIES) {
        console.error("[EMAIL] ❌ All attempts failed. Throwing error.");
        console.error("[EMAIL] Final error details:", {
          type: error.constructor.name,
          code: error.code,
          message: error.message,
          isNetworkError: error.code && (error.code.includes("ECONNREFUSED") || error.code.includes("ENOTFOUND") || error.code.includes("ETIMEDOUT")),
          isAuthError: error.code && (error.code === "EAUTH" || error.message.includes("Invalid login")),
          isSMTPError: error.code && error.code.startsWith("SMTP")
        });
        throw error;
      }

      // Wait before retry with exponential backoff
      const waitMs = Math.pow(2, attempt - 1) * 1000;
      console.warn(`[EMAIL] Retrying in ${waitMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }
};

module.exports = {
  sendOtpEmail
};
