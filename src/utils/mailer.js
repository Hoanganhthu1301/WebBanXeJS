const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Hàm gửi mail dùng chung
const sendMail = async ({ to, subject, html }) => {
  console.log("=== RESEND MAIL DEBUG START ===");
  console.log("MAIL_FROM:", process.env.MAIL_FROM);
  console.log("Sending to:", to);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM || "Web Bán Xe <noreply@webbanxe.store>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message || "Gửi mail thất bại");
    }

    console.log("Send mail success:", data);
    console.log("=== RESEND MAIL DEBUG END ===");
    return data;
  } catch (sendError) {
    console.error("Send mail error:", sendError);
    console.log("=== RESEND MAIL DEBUG END ===");
    throw sendError;
  }
};

// Hàm gửi mail đặt lại mật khẩu
const sendResetPasswordEmail = async (to, resetLink) => {
  return sendMail({
    to,
    subject: "Yêu cầu đặt lại mật khẩu",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2 style="color: #1976d2;">Đặt lại mật khẩu</h2>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
        <p>Nhấn vào link bên dưới để đặt lại mật khẩu:</p>
        <p>
          <a href="${resetLink}" target="_blank" style="color: #1976d2; font-weight: bold;">
            ${resetLink}
          </a>
        </p>
        <p>Link này sẽ hết hạn sau 15 phút.</p>
        <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      </div>
    `,
  });
};

// Hàm gửi mail phản hồi yêu cầu
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
        <h2 style="color: #1976d2;">Phản hồi từ WEB BÁN XE</h2>

        <p>Xin chào <strong>${customerName || "Quý khách"}</strong>,</p>

        <p>Chúng tôi đã tiếp nhận và xử lý yêu cầu của bạn.</p>

        <ul style="list-style: none; padding: 0;">
          <li><strong>Loại yêu cầu:</strong> ${requestTypeMap[requestType] || "Yêu cầu"}</li>
          <li><strong>Xe quan tâm:</strong> ${carName || "—"}</li>
          <li><strong>Trạng thái:</strong> ${statusMap[status] || status}</li>
        </ul>

        ${
          extraInfo
            ? `<p><strong>Thông tin thêm:</strong><br>${extraInfo}</p>`
            : ""
        }

        <p><strong>Nội dung phản hồi từ showroom:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #1976d2;">
          ${adminReply || "Chuyên viên của chúng tôi sẽ sớm liên hệ với bạn."}
        </div>

        <p style="margin-top: 20px;">Cảm ơn bạn đã quan tâm đến sản phẩm của chúng tôi.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888;">Đây là email tự động, vui lòng không phản hồi trực tiếp vào email này.</p>
      </div>
    `,
  });
};

module.exports = {
  sendMail,
  sendResetPasswordEmail,
  sendRequestReplyEmail,
};