import { sessionFetch as fetch } from "../../../api/sessionClient.js";
// // createMoneyTransfer.js

// import { buildApiUrl, getFetchOptions } from "../config/erpConfig";

// // Always use DEMO base URL, but authenticate using loginUser credentials
// const MONEY_TRANSFER_BASE_ENV = ERP_ENV.DEMO;


// export const createMoneyTransfer = async (
//   form,
//   customerId,
//   loginUser,
//   documentUrl,
//   currencyDenominationRows = [],
//   selectedWarehouse = null
// ) => {
  
//   try {
//     const baseURL = getBaseURL(MONEY_TRANSFER_BASE_ENV);
//     const headers = getHeaders(loginUser, ERP_ENV.PROD);

//     console.log("Creating Money Transfer using loginUser:", {
//       headers,
//     });

//     // Prepare child table rows
//     const currencyDenomination = currencyDenominationRows
//       .filter((row) => (row.qty || row.quantity || 0) > 0)
//       .map((row, idx) => {
//         const itemValue = String(
//           row.denomination || row.item_name || row.name || ""
//         ).trim();

//         return {
//           doctype: "Currency Denomination",
//           denomination: itemValue,
//           qty: Number(row.qty || row.quantity || 0),
//           amount: Number(row.amount ?? row.rate ?? 0),
//           idx: idx + 1,
//         };
//       });

//     // Convert checkbox value properly
//     const enableCurrencyDenomination =
//       form.enable_currency_denomination === 1 ||
//       form.enable_currency_denomination === "1" ||
//       form.enable_currency_denomination === true
//         ? 1
//         : 0;

//     console.log(
//       "Enable Currency Denomination:",
//       form.enable_currency_denomination,
//       "=> Sent as:",
//       enableCurrencyDenomination
//     );

//     // Main payload
//     const payload = {
//       doctype: "Money Transfer",

//       enable_currency_denomination: enableCurrencyDenomination,

//       customer_id: customerId,
//       full_name: form.full_name,
//       dob: form.dob,

//       government_id_type: form.government_id_type,
//       government_id_number: form.government_id_number,

//       document_upload: documentUrl || form.document_upload,

//       transaction_id: form.transaction_id,

//       amount: form.amount ? Number(form.amount) : 0,

//       currency_denomination: enableCurrencyDenomination
//         ? currencyDenomination
//         : [],
//       warehouse: selectedWarehouse.warehouse,
//     };

//     console.log(
//       "Creating Money Transfer Payload:",
//       JSON.stringify(payload, null, 2)
//     );

//     // STEP 1: CREATE DRAFT DOCUMENT
//     const createRes = await fetch(
//       `${baseURL}/api/resource/Money Transfer`,
//       {
//         method: "POST",
//         headers,
//         body: JSON.stringify(payload),
//       }
//     );

//     const createData = await createRes.json();

//     console.log("Money Transfer Create Response:", {
//       status: createRes.status,
//       ok: createRes.ok,
//       data: createData,
//     });

//     // Handle create errors
//     if (!createRes.ok) {
//       let errorMessage = "Creation failed";

//       if (createData?._server_messages) {
//         try {
//           const messages = JSON.parse(createData._server_messages);

//           errorMessage = messages
//             .map((msg) => {
//               try {
//                 return JSON.parse(msg).message;
//               } catch {
//                 return msg;
//               }
//             })
//             .join("\n");
//         } catch {
//           errorMessage = createData._server_messages;
//         }
//       } else if (createData?.exception) {
//         errorMessage = createData.exception;
//       } else if (createData?.message) {
//         errorMessage =
//           typeof createData.message === "string"
//             ? createData.message
//             : JSON.stringify(createData.message);
//       }

//       throw new Error(errorMessage);
//     }

//     // Draft created successfully
//     const createdDoc = createData.data;

//     console.log("Draft Money Transfer Created:", createdDoc.name);

//     // STEP 2: SUBMIT DOCUMENT
//     const submitRes = await fetch(
//       `${baseURL}/api/method/frappe.client.submit`,
//       {
//         method: "POST",
//         headers,
//         body: JSON.stringify({
//           doc: createdDoc,
//         }),
//       }
//     );

//     const submitData = await submitRes.json();

//     console.log("Money Transfer Submit Response:", {
//       status: submitRes.status,
//       ok: submitRes.ok,
//       data: submitData,
//     });

//     // Handle submit errors
//     if (!submitRes.ok) {
//       let errorMessage = "Submit failed";

//       if (submitData?._server_messages) {
//         try {
//           const messages = JSON.parse(submitData._server_messages);

//           errorMessage = messages
//             .map((msg) => {
//               try {
//                 return JSON.parse(msg).message;
//               } catch {
//                 return msg;
//               }
//             })
//             .join("\n");
//         } catch {
//           errorMessage = submitData._server_messages;
//         }
//       } else if (submitData?.exception) {
//         errorMessage = submitData.exception;
//       } else if (submitData?.message) {
//         errorMessage =
//           typeof submitData.message === "string"
//             ? submitData.message
//             : JSON.stringify(submitData.message);
//       }

//       throw new Error(errorMessage);
//     }

//     console.log("Money Transfer Submitted Successfully");

//     // Return submitted document
//     return submitData.message;
//   } catch (err) {
//     console.error("Error creating/submitting Money Transfer:", err);
//     throw err;
//   }
// };





// createMoneyTransfer.js

import { buildApiUrl, getFetchOptions } from "../config/erpConfig";

export const createMoneyTransfer = async (
  form,
  customerId,
  loginUser,
  documentUrl,
  currencyDenominationRows = [],
  selectedWarehouse = null
) => {

  try {
    console.log("Creating Money Transfer using active Frappe session:", {
      email: loginUser?.user?.email,
      sessionActive: loginUser?.user?.sessionActive,
    });

    // Prepare child table rows
    const currencyDenomination = currencyDenominationRows
      .filter((row) => (row.qty || row.quantity || 0) > 0)
      .map((row, idx) => {
        const itemValue = String(
          row.denomination || row.item_name || row.name || ""
        ).trim();

        return {
          doctype: "Currency Denomination",
          denomination: itemValue,
          qty: Number(row.qty || row.quantity || 0),
          amount: Number(row.amount ?? row.rate ?? 0),
          idx: idx + 1,
        };
      });

    // Convert checkbox value properly
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

    // Helper to format dates to YYYY-MM-DD
    const formatDateStr = (val) => {
      if (!val) return null;
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (!trimmed) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        }
        return trimmed;
      }
      if (val instanceof Date && !isNaN(val.getTime())) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, "0");
        const day = String(val.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
      return null;
    };

    // Main payload
    const payload = {
      doctype: "Money Transfer",
      documents: form.documents || [],

      enable_currency_denomination: enableCurrencyDenomination,

      customer_id: customerId || form.customer_id || form.customer || null,
      full_name: form.full_name || form.custom_full_name || "",
      dob: formatDateStr(form.dob || form.custom_date_of_birth),

      transfer_type: form.transfer_type || "Send",
      risk_level: form.risk_level || "Low",

      phone_number:
        form.phone_number ||
        form.contact_number ||
        form.mobile_no ||
        form.phone ||
        null,
      tin_number: form.tin_number || form.custom_tin_number || null,
      occupation: form.occupation || form.custom_occupation || null,

      government_id_type: form.government_id_type || form.custom_government_id || "",
      government_id_number: form.government_id_number || "",

      id_issue_date: formatDateStr(form.id_issue_date || form.custom_id_issue_date),
      id_expiry_date: formatDateStr(form.id_expiry_date || form.custom_id_expiry_date),

      document_upload: documentUrl || form.document_upload || null,

      transaction_id: form.transaction_id || form.reference_number || "",
      reference_number: form.reference_number || form.transaction_id || "",
      upload_additional_info: form.upload_additional_info || null,

      amount: form.amount ? Number(form.amount) : 0,

      // Sender Details
      address: form.address || form.custom_address || null,
      address_line_2: form.address_line_2 || null,
      city: form.city || form.custom_city || null,
      stateprovince: form.stateprovince || form.custom_state_province || form.custom_stateprovince || null,
      postal_code: form.postal_code || form.custom_postal_code || null,
      country: form.country || form.custom_country || null,

      // Receiver Details
      receiver_address: form.receiver_address || null,
      receiver_address_line_2: form.receiver_address_line_2 || null,
      receiver_city: form.receiver_city || null,
      receiver_stateprovince: form.receiver_stateprovince || null,
      receiver_postal_code: form.receiver_postal_code || null,
      receiver_country: form.receiver_country || null,

      currency_denomination: enableCurrencyDenomination
        ? currencyDenomination
        : [],
      warehouse:
        selectedWarehouse?.warehouse ||
        (typeof selectedWarehouse === "string" ? selectedWarehouse : null) ||
        form.warehouse ||
        null,
    };

    // Forward any other non-internal form fields dynamically
    const excludedKeys = new Set([
      "customerFound",
      "customerLookupDone",
      "customerFullName",
      "custom_available_currency_transfer_balance",
      "custom_annual_fx_and_moneygram_limit",
      "custom_annual_compliance_limit",
      "customer",
      "custom_full_name",
      "custom_date_of_birth",
      "custom_passport_number",
      "custom_drivers_licence_number",
      "custom_tin_number",
      "custom_voter_id_number",
      "custom_government_id",
      "custom_government_document",
      "custom_address",
      "custom_city",
      "custom_state_province",
      "custom_stateprovince",
      "custom_postal_code",
      "custom_country",
      "custom_email",
      "custom_contact_number",
      "custom_gender",
      "custom_occupation",
      "custom_id_issue_date",
      "custom_id_expiry_date",
      "custom_risk_level",
      "passport_number",
      "contact_number",
      "email",
      "gender",
      "rate",
    ]);

    Object.keys(form).forEach((k) => {
      if (!excludedKeys.has(k) && !(k in payload) && form[k] !== undefined && form[k] !== null && form[k] !== "") {
        payload[k] = form[k];
      }
    });

    console.log(
      "Creating Money Transfer Payload:",
      JSON.stringify(payload, null, 2)
    );

    // STEP 1: CREATE DRAFT DOCUMENT
    const createRes = await fetch(
      buildApiUrl("api/resource/Money Transfer"),
      getFetchOptions({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );

    const createData = await createRes.json();

    console.log("Money Transfer Create Response:", {
      status: createRes.status,
      ok: createRes.ok,
      data: createData,
    });

    // Handle create errors
    if (!createRes.ok) {
      throw new Error(parseERPNextError(createData, "Creation failed"));
    }

    // Draft created successfully
    const createdDoc = createData.data;

    console.log("Draft Money Transfer Created:", createdDoc.name);

    // STEP 2: SUBMIT DOCUMENT
    // Merge denomination rows back into createdDoc before submitting.
    // ERPNext may strip child table rows from the create response, which causes
    // the before_submit hook to throw "No denomination rows found for Stock Entry".
    const docToSubmit = {
      ...createdDoc,
      enable_currency_denomination: enableCurrencyDenomination,
      currency_denomination: enableCurrencyDenomination
        ? currencyDenomination
        : [],
    };

    console.log(
      "Submitting Money Transfer with doc:",
      JSON.stringify(docToSubmit, null, 2)
    );

    const submitRes = await fetch(
      buildApiUrl("api/method/frappe.client.submit"),
      getFetchOptions({
        method: "POST",
        body: JSON.stringify({
          doc: docToSubmit,
        }),
      })
    );

    const submitData = await submitRes.json();

    console.log("Money Transfer Submit Response:", {
      status: submitRes.status,
      ok: submitRes.ok,
      data: submitData,
    });

    // Handle submit errors
    if (!submitRes.ok) {
      throw new Error(parseERPNextError(submitData, "Submit failed"));
    }

    console.log("Money Transfer Submitted Successfully");

    // Return submitted document
    return submitData.message;

  } catch (err) {
    console.error("Error creating/submitting Money Transfer:", err);
    throw err;
  }
};


// ---------------------------------------------------------------------------
// Helper: extract a readable error message from an ERPNext error response
// ---------------------------------------------------------------------------
function parseERPNextError(data, fallback = "Request failed") {
  if (data?._server_messages) {
    try {
      const messages = JSON.parse(data._server_messages);
      return messages
        .map((msg) => {
          try {
            return JSON.parse(msg).message;
          } catch {
            return msg;
          }
        })
        .join("\n");
    } catch {
      return data._server_messages;
    }
  }

  if (data?.exception) return data.exception;

  if (data?.message) {
    return typeof data.message === "string"
      ? data.message
      : JSON.stringify(data.message);
  }

  return fallback;
}