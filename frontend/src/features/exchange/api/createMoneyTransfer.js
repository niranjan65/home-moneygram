//createMoneyTransfer.js
import { getBaseURL, getHeaders, ERP_ENV } from "../config/erpConfig";

// Always use DEMO base URL, but authenticate using loginUser credentials
const MONEY_TRANSFER_BASE_ENV = ERP_ENV.DEMO;

export const createMoneyTransfer = async (
  form,
  customerId,
  loginUser,
  documentUrl,
  currencyDenominationRows = []
) => {
  try {
    const baseURL = getBaseURL(MONEY_TRANSFER_BASE_ENV);
    const headers = getHeaders(loginUser, ERP_ENV.PROD);

    console.log("Creating Money Transfer using loginUser:", {
      api_key: loginUser?.api_key,
      api_secret: loginUser?.api_secret,
      headers,
    });

    // Prepare child table rows
    const currencyDenomination = currencyDenominationRows
      .filter((row) => (row.qty || row.quantity || 0) > 0)
      .map((row, idx) => {
        const itemValue = String(
          row.denomination || row.item_name || row.name || ""
        ).trim();

        return {
          doctype: "Currency Denomination", // REQUIRED for child table rows
          denomination: itemValue,
          qty: Number(row.qty || row.quantity || 0),
          amount: Number(row.amount ?? row.rate ?? 0),
          idx: idx + 1,
        };
      });

    const enableCurrencyDenomination =
      form.enable_currency_denomination === 1 ||
      form.enable_currency_denomination === "1" ||
      form.enable_currency_denomination === true
        ? 1
        : 0;
console.log(
  "Enable Currency Denomination:",
  form.enable_currency_denomination,
  "=> Sent as:",
  enableCurrencyDenomination
);
    // Main payload
    const payload = {
  doctype: "Money Transfer",
  enable_currency_denomination: enableCurrencyDenomination,

  customer_id: customerId,
  full_name: form.full_name,
  dob: form.dob,

  government_id_type: form.government_id_type,
  government_id_number: form.government_id_number,

  document_upload: documentUrl || form.document_upload,
  transaction_id: form.transaction_id,

  amount: form.amount ? Number(form.amount) : 0,
  currency_denomination: enableCurrencyDenomination ? currencyDenomination : [],
};

    console.log(
      "Creating Money Transfer Payload:",
      JSON.stringify(payload, null, 2)
    );

    const res = await fetch(`${baseURL}/api/resource/Money Transfer`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    console.log("Money Transfer Response:", {
      status: res.status,
      ok: res.ok,
      data,
    });

    if (!res.ok) {
      // ERPNext returns detailed validation errors in _server_messages or exception
      let errorMessage = "Creation failed";

      if (data?._server_messages) {
        try {
          const messages = JSON.parse(data._server_messages);
          errorMessage = messages
            .map((msg) => {
              try {
                return JSON.parse(msg).message;
              } catch {
                return msg;
              }
            })
            .join("\n");
        } catch {
          errorMessage = data._server_messages;
        }
      } else if (data?.exception) {
        errorMessage = data.exception;
      } else if (data?.message) {
        errorMessage =
          typeof data.message === "string"
            ? data.message
            : JSON.stringify(data.message);
      }

      throw new Error(errorMessage);
    }

    return data.data;
  } catch (err) {
    console.error("Error creating Money Transfer:", err);
    throw err;
  }
};