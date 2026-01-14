const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services or SMTP host/port
  auth: {
    user: process.env.GMAIL_USER, // Your email address
    pass: process.env.GMAIL_PASS, // Your email password or app password
  },
});

const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"Darmax" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendEmail };
