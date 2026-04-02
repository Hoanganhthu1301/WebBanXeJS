const axios = require("axios");
const crypto = require("crypto");

const PAYOS_BASE_URL = "https://api-merchant.payos.vn";

const createPayoutSignature = (data, checksumKey) => {
  // sort alphabet như docs payout
  const raw = [
    `amount=${data.amount}`,
    `description=${data.description}`,
    `referenceId=${data.referenceId}`,
    `toAccountNumber=${data.toAccountNumber}`,
    `toBin=${data.toBin}`,
  ].join("&");

  return crypto.createHmac("sha256", checksumKey).update(raw).digest("hex");
};

const createPayout = async ({
  referenceId,
  amount,
  description,
  toBin,
  toAccountNumber,
  category = ["refund"],
}) => {
  const body = {
    referenceId,
    amount: Number(amount),
    description,
    toBin,
    toAccountNumber,
    category,
  };

  const signature = createPayoutSignature(
    body,
    process.env.PAYOS_CHECKSUM_KEY
  );

  const response = await axios.post(
    `${PAYOS_BASE_URL}/v1/payouts`,
    body,
    {
      headers: {
        "x-client-id": process.env.PAYOS_CLIENT_ID,
        "x-api-key": process.env.PAYOS_API_KEY,
        "x-idempotency-key": referenceId,
        "x-signature": signature,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

module.exports = {
  createPayout,
};