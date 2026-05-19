// // createMoneyTransfer.js

// import { getBaseURL, getHeaders, ERP_ENV } from "../config/erpConfig";

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
//       api_key: loginUser?.api_key,
//       api_secret: loginUser?.api_secret,
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

import { getBaseURL, getHeaders, ERP_ENV } from "../config/erpConfig";

// Always use DEMO base URL, but authenticate using loginUser credentials
const MONEY_TRANSFER_BASE_ENV = ERP_ENV.DEMO;


export const createMoneyTransfer = async (
  form,
  customerId,
  loginUser,
  documentUrl,
  currencyDenominationRows = [],
  selectedWarehouse = null
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

      currency_denomination: enableCurrencyDenomination
        ? currencyDenomination
        : [],
      warehouse: selectedWarehouse.warehouse,
    };

    console.log(
      "Creating Money Transfer Payload:",
      JSON.stringify(payload, null, 2)
    );

    // STEP 1: CREATE DRAFT DOCUMENT
    const createRes = await fetch(
      `${baseURL}/api/resource/Money Transfer`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }
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
      `${baseURL}/api/method/frappe.client.submit`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          doc: docToSubmit,
        }),
      }
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