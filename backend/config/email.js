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
    throw new Error("Missing EMAIL_USER or EMAIL_PASS");
  }

  console.log("Using SMTP host:", "smtp.gmail.com");
  console.log("Using SMTP port:", 587);

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
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

  await transporter.verify();
  verifiedTransport = true;
  console.log("[EMAIL] SMTP transporter verified");
};

const sendOtpEmail = async ({ toEmail, otp, expiryMinutes = 5 }) => {
  const { from } = getEmailAuth();
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
    console.log("[EMAIL] OTP email sent", {
      to: toEmail,
      messageId: info.messageId
    });
    return info;
  } catch (error) {
    console.error("[EMAIL] Failed to send OTP email", {
      to: toEmail,
      code: error.code,
      response: error.response,
      message: error.message
    });
    throw error;
  }
};

module.exports = {
  sendOtpEmail
};
