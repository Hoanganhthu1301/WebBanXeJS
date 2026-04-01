const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendMail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.MAIL_FROM || `"Web Bán Xe" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

const sendResetPasswordEmail = async (to, resetLink) => {
  return sendMail({
    to,
    subject: "Yêu cầu đặt lại mật khẩu",
    html: `
      <h2>Đặt lại mật khẩu</h2>
      <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
      <p>Nhấn vào link bên dưới để đặt lại mật khẩu:</p>
      <a href="${resetLink}" target="_blank">${resetLink}</a>
      <p>Link này sẽ hết hạn sau 15 phút.</p>
      <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    `,
  });
};

const sendRequestReplyEmail = async ({
  to,
  customerName,
  carName,
  requestType,
  status,
  adminReply,
  extraInfo = "",
}) => {
  const requestTypeMap = {
    consultation: "Yêu cầu tư vấn",
    quotation: "Yêu cầu báo giá",
    view: "Đặt lịch xem xe",
    test_drive: "Đặt lịch lái thử",
  };

  const statusMap = {
    new: "Mới",
    processing: "Đang xử lý",
    contacted: "Đã liên hệ",
    quoted: "Đã báo giá",
    done: "Hoàn tất",
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    cancelled: "Đã hủy",
  };

  return sendMail({
    to,
    subject: `${requestTypeMap[requestType] || "Phản hồi yêu cầu"} - ${carName || "Web Bán Xe"}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2>Phản hồi từ WEB BÁN XE</h2>

        <p>Xin chào <strong>${customerName || "Quý khách"}</strong>,</p>

        <p>Chúng tôi đã tiếp nhận và xử lý yêu cầu của bạn.</p>

        <ul>
          <li><strong>Loại yêu cầu:</strong> ${requestTypeMap[requestType] || "Yêu cầu"}</li>
          <li><strong>Xe quan tâm:</strong> ${carName || "—"}</li>
        </ul>

        ${
          extraInfo
            ? `<p><strong>Thông tin thêm:</strong><br>${extraInfo}</p>`
            : ""
        }

        <p><strong>Nội dung phản hồi từ showroom:</strong></p>
        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px;">
          ${adminReply || "Chưa có nội dung phản hồi."}
        </div>

        <p style="margin-top: 20px;">Cảm ơn bạn đã quan tâm đến sản phẩm của chúng tôi.</p>
      </div>
    `,
  });
};

module.exports = {
  sendMail,
  sendResetPasswordEmail,
  sendRequestReplyEmail,
};