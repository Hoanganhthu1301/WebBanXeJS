const { PayOS } = require("@payos/node");

const requiredEnv = [
  "PAYOS_CLIENT_ID",
  "PAYOS_API_KEY",
  "PAYOS_CHECKSUM_KEY",
  "PAYOS_RETURN_URL",
  "PAYOS_CANCEL_URL",
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
const isConfigured = missingEnv.length === 0;

const payOS = isConfigured
  ? new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID,
      apiKey: process.env.PAYOS_API_KEY,
      checksumKey: process.env.PAYOS_CHECKSUM_KEY,
    })
  : null;

const getPayOSClient = () => {
  if (!isConfigured || !payOS) {
    throw new Error(`Thiếu cấu hình payOS: ${missingEnv.join(", ")}`);
  }
  return payOS;
};

const buildReturnUrl = (carId, orderCode) => {
  const base = process.env.PAYOS_RETURN_URL;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}carId=${carId}&orderCode=${orderCode}`;
};

const buildCancelUrl = (carId, orderCode) => {
  const base = process.env.PAYOS_CANCEL_URL;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}carId=${carId}&orderCode=${orderCode}`;
};

const normalizeText = (text = "") => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, " ")
    .trim();
};

const safeDescription = (text = "") => {
  const normalized = normalizeText(text);
  if (!normalized) return "Dat coc";
  return normalized.slice(0, 25);
};

const generateOrderCode = () => {
  return Number(String(Date.now()).slice(-9));
};

const createPaymentLink = async ({
  orderCode,
  amount,
  description,
  carName,
  carId,
}) => {
  const client = getPayOSClient();

  const body = {
    orderCode: Number(orderCode),
    amount: Number(amount),
    description: safeDescription(description),
    items: [
      {
        name: (carName || "Dat coc xe").slice(0, 25),
        quantity: 1,
        price: Number(amount),
      },
    ],
    returnUrl: buildReturnUrl(carId, orderCode),
    cancelUrl: buildCancelUrl(carId, orderCode),
  };

  console.log("PAYOS REQUEST BODY:", body);

  try {
    const paymentLink = await client.paymentRequests.create(body);

    console.log("PAYOS RAW RESPONSE:", paymentLink);

    const checkoutUrl =
      paymentLink?.checkoutUrl ||
      paymentLink?.data?.checkoutUrl ||
      paymentLink?.checkout_url ||
      "";

    const qrCode =
      paymentLink?.qrCode ||
      paymentLink?.data?.qrCode ||
      "";

    if (!checkoutUrl) {
      throw new Error("PayOS không trả về checkoutUrl");
    }

    return {
      ...paymentLink,
      checkoutUrl,
      qrCode,
    };
  } catch (error) {
    console.error("PAYOS CREATE LINK ERROR:", error?.response?.data || error.message);
    throw error;
  }
};

const verifyWebhookSignature = async (body) => {
  const client = getPayOSClient();
  return await client.webhooks.verify(body);
};

module.exports = {
  createPaymentLink,
  safeDescription,
  generateOrderCode,
  verifyWebhookSignature,
  isPayOSConfigured: isConfigured,
};