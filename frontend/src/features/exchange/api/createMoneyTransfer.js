//createMoneyTransfer.js
import { getBaseURL, getHeaders, ERP_ENV } from "../config/erpConfig";

// 👉 Always use DEMO for Money Transfer (as per your setup)
const MONEY_TRANSFER_ENV = ERP_ENV.DEMO;

export const createMoneyTransfer = async (
  form,
  customerId,
  transferType, // SEND / RECEIVE
  loginUser,
  documentUrl
) => {
  try {
    const baseURL = getBaseURL(MONEY_TRANSFER_ENV);
    const headers = getHeaders(loginUser, MONEY_TRANSFER_ENV);

   const payload = {
  doctype: "Money Transfer for Customer",

  customer: customerId,
  customer_id: customerId,

  customer_full_name: form.full_name,

  date_of_birth: form.date_of_birth,
  id_type: form.id_type,
  government_id: form.government_id,
  passport_number: form.passport_number,
  id_number: form.id_number,
  transaction_id: form.transaction_id,
  transaction_type: transferType,
};

// ✅ Attach correct file field
if (form.id_type === "PASSPORT") {
  payload.passport_photo_file = documentUrl;
}

if (form.id_type === "GOVERNMENT_ID") {
  payload.government_id_file = documentUrl;
}

    console.log("Creating Money Transfer:", payload);

    const res = await fetch(`${baseURL}/api/resource/Money Transfer for Customer`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Money Transfer failed:", data);
      throw new Error(data?.message || "Money Transfer creation failed");
    }

    return data.data;
  } catch (err) {
    console.error("Error creating Money Transfer:", err);
    throw err;
  }
};