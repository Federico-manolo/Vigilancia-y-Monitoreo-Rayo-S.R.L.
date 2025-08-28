let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

const isEmailConfigured = () => {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
};

const createTransport = () => {
  if (!nodemailer || !isEmailConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transport = createTransport();
  if (!transport) {
    console.log('[EmailService] Envío simulado:', { to, subject, text, html });
    return { success: true, simulated: true };
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  await transport.sendMail({ from, to, subject, html, text });
  return { success: true };
};

module.exports = { sendEmail };
