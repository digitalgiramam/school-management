const nodemailer = require('nodemailer');
const config = require('./index');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: { user: config.email.user, pass: config.email.pass },
});

/**
 * Send an email.
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 */
const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error('Failed to send email:', err);
    throw err;
  }
};

const emailTemplates = {
  resetPassword: (name, link) => `
    <h2>Password Reset Request</h2>
    <p>Hi ${name},</p>
    <p>Click the link below to reset your password. This link expires in 1 hour.</p>
    <a href="${link}" style="background:#1976d2;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;">Reset Password</a>
    <p>If you did not request this, please ignore this email.</p>
  `,

  welcomeUser: (name, role, password) => `
    <h2>Welcome to School Management System</h2>
    <p>Hi ${name},</p>
    <p>Your account has been created with the role <strong>${role}</strong>.</p>
    <p>Temporary Password: <strong>${password}</strong></p>
    <p>Please change your password after logging in.</p>
  `,

  feeReminder: (name, amount, dueDate, invoiceNo) => `
    <h2>Fee Payment Reminder</h2>
    <p>Dear ${name},</p>
    <p>This is a reminder that invoice <strong>${invoiceNo}</strong> of amount <strong>₹${amount}</strong> is due on <strong>${dueDate}</strong>.</p>
    <p>Please make the payment to avoid late fees.</p>
  `,
};

module.exports = { sendMail, emailTemplates };
