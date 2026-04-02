const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const sendResetPasswordEmail = async (to, resetLink) => {
  const mailOptions = {
    from: `"Web Bán Xe" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Yêu cầu đặt lại mật khẩu',
    html: `
      <h2>Đặt lại mật khẩu</h2>
      <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
      <p>Nhấn vào link bên dưới để đặt lại mật khẩu:</p>
      <a href="${resetLink}" target="_blank">${resetLink}</a>
      <p>Link này sẽ hết hạn sau 15 phút.</p>
      <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendResetPasswordEmail
};