const { PayOS } = require("@payos/node");

const requiredEnv = [
  "PAYOS_PAYOUT_CLIENT_ID",
  "PAYOS_PAYOUT_API_KEY",
  "PAYOS_PAYOUT_CHECKSUM_KEY",
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
const isConfigured = missingEnv.length === 0;

const payoutPayOS = isConfigured
  ? new PayOS({
      clientId: process.env.PAYOS_PAYOUT_CLIENT_ID,
      apiKey: process.env.PAYOS_PAYOUT_API_KEY,
      checksumKey: process.env.PAYOS_PAYOUT_CHECKSUM_KEY,
    })
  : null;

const getPayoutClient = () => {
  if (!isConfigured || !payoutPayOS) {
    throw new Error(`Thiếu cấu hình payOS payout: ${missingEnv.join(", ")}`);
  }
  return payoutPayOS;
};

const createPayout = async ({
  referenceId,
  amount,
  description,
  toBin,
  toAccountNumber,
  category = ["refund"],
}) => {
  try {
    if (!referenceId) {
      throw new Error("Thiếu referenceId");
    }

    if (!amount || Number(amount) <= 0) {
      throw new Error("Số tiền hoàn không hợp lệ");
    }

    if (!description) {
      throw new Error("Thiếu description");
    }

    if (!toBin) {
      throw new Error("Thiếu mã ngân hàng nhận tiền (toBin)");
    }

    if (!toAccountNumber) {
      throw new Error("Thiếu số tài khoản nhận tiền");
    }

    const client = getPayoutClient();

    const payload = {
      referenceId: String(referenceId).trim(),
      category: Array.isArray(category) ? category : ["refund"],
      validateDestination: true,
      payouts: [
        {
          referenceId: `${String(referenceId).trim()}_1`,
          amount: Number(amount),
          description: String(description).trim().slice(0, 25),
          toBin: String(toBin).trim(),
          toAccountNumber: String(toAccountNumber).trim(),
        },
      ],
    };

    console.log("PAYOS PAYOUT REQUEST:", payload);

    const response = await client.payouts.batch.create(payload);

    console.log("PAYOS PAYOUT RAW RESPONSE:", response);

    return {
      success: true,
      data: response,
      message: "Gửi yêu cầu hoàn tiền thành công",
    };
  } catch (error) {
    const errorData = error?.response?.data || null;

    console.error("PAYOS PAYOUT ERROR:", {
      message: error.message,
      status: error?.response?.status,
      data: errorData,
    });

    return {
      success: false,
      message:
        errorData?.desc ||
        errorData?.message ||
        error.message ||
        "Gửi yêu cầu hoàn tiền thất bại",
      data: errorData,
      statusCode: error?.response?.status || 500,
    };
  }
};

module.exports = {
  createPayout,
};