const nodemailer = require("nodemailer");

const getEmailAuth = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.SMTP_FROM || (user ? `Road Complaint <${user}>` : undefined);

  return { user, pass, from };
};

const createTransporter = () => {
  const { user, pass } = getEmailAuth();

  if (!user || !pass) {
    const error = new Error("Missing EMAIL_USER or EMAIL_PASS in environment");
    error.code = "MISSING_CREDENTIALS";
    throw error;
  }

  console.log("[EMAIL] Creating SMTP transporter for user:", user);
  console.log("Using SMTP host:", "smtp.gmail.com");
  console.log("Using SMTP port:", 587);
  console.log("Using IPv4 family:", 4);

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4,
    auth: {
      user,
      pass
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000
  });
};

let verifiedTransport = false;

const verifyEmailTransport = async (transporter) => {
  if (verifiedTransport) {
    return;
  }

  try {
    await transporter.verify();
    verifiedTransport = true;
    console.log("[EMAIL] SMTP transporter verified");
  } catch (error) {
    console.warn("[EMAIL] SMTP verify failed, continuing with direct send", {
      code: error.code,
      message: error.message
    });
  }
};

const sendOtpEmail = async ({ toEmail, otp, expiryMinutes = 5 }) => {
  const { from } = getEmailAuth();
  
  try {
    const transporter = createTransporter();

    await verifyEmailTransport(transporter);

    const mail = {
      from,
      to: toEmail,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}. It will expire in ${expiryMinutes} minutes.`
    };

    try {
      const info = await transporter.sendMail(mail);
      console.log("[EMAIL] OTP email sent successfully", {
        to: toEmail,
        messageId: info.messageId
      });
      return info;
    } catch (sendError) {
      console.error("[EMAIL] Failed to send OTP email - SMTP Error", {
        to: toEmail,
        code: sendError.code,
        command: sendError.command,
        response: sendError.response,
        message: sendError.message
      });
      throw sendError;
    }
  } catch (error) {
    console.error("[EMAIL] OTP process failed", {
      toEmail,
      errorCode: error.code,
      errorMessage: error.message,
      isCredentialsError: error.code === "MISSING_CREDENTIALS"
    });
    throw error;
  }
};

module.exports = {
  sendOtpEmail
};
