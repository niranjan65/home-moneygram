
// customer.js
import { buildApiUrl, getFetchOptions } from "../config/erpConfig";

/**
 * Normalize Government ID Type
 */
const normalizeGovId = (type) => {
  if (!type) return "";

  const map = {
    "Driver's Licence": "Driver's Licence",
    "TIN Card": "TIN Card",
    "Voter ID Card": "Voter ID Card",
    Passport: "Passport",
  };

  return map[type] || type;
};

/**
 * Format date as YYYY-MM-DD
 */
const formatDate = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    throw new Error("Invalid date supplied.");
  }

  return d.toISOString().split("T")[0];
};

/**
 * Fetch Customer by ID
 *
 * Customer ID format:
 *   Full Name_YYYY-MM-DD
 *
 * Example:
 *   John Doe_1990-05-12
 */
export const getCustomerById = async (customerId, loginUser) => {
  if (!customerId || customerId.length < 3) return null;

  try {
    const res = await fetch(
      buildApiUrl(`api/resource/Customer/${encodeURIComponent(customerId)}`),
      getFetchOptions({
        method: "GET",
      })
    );

    if (!res.ok) {
      if (res.status === 404) {
        console.log("Customer not found");
        return null;
      }

      const errorData = await res.json().catch(() => ({}));
      console.error("Error fetching customer:", errorData);
      return null;
    }

    const { data } = await res.json();

    // Determine Government ID Type
    const governmentIdType =
      data.custom_government_id ||
      data.government_id_type ||
      "";

    // Determine Government ID Number based on selected type
    let governmentIdNumber = "";

    switch (governmentIdType) {
      case "Passport":
        governmentIdNumber = data.custom_passport_number || "";
        break;

      case "Driver's Licence":
        governmentIdNumber =
          data.custom_drivers_licence_number || "";
        break;

      case "TIN Card":
        governmentIdNumber = data.custom_tin_number || "";
        break;

      case "Voter ID Card":
        governmentIdNumber =
          data.custom_voter_id_number || "";
        break;

      default:
        governmentIdNumber = "";
    }

    // Return original data along with normalized fields
    return {
      ...data,
      government_id_type: governmentIdType,
      government_id_number: governmentIdNumber,
    };
  } catch (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
};

/**
 * Create Customer
 */
// export const createCustomer = async (
//   form,
//   documentUrl,
//   loginUser
// ) => {
//   try {
//     // Generate Customer ID
//     const cleanName = form.full_name
//       .trim()
//       .replace(/\s+/g, " ");

//     const customerId = `${cleanName}_${formatDate(form.dob)}`;

//     // Check if customer already exists before creating
//     const existing = await getCustomerById(customerId, loginUser);
//     const existingCustomer = existing?.data || existing;
//     if (existingCustomer?.name) {
//       console.log("Customer already exists, reusing existing customer:", existingCustomer.name);
//       return existingCustomer;
//     }

//     // Normalize Government ID Type
//     const normalizedGovId = normalizeGovId(
//       form.government_id_type
//     );

//     // Government ID Number
//     const idNumber =
//       (form.government_id_number || "").trim();

//     // Base Payload
//     const payload = {
//       customer_name: customerId,
//       customer_type: "Individual",
//       customer_group: "All Customer Groups",
//       territory: "All Territories",

//       custom_full_name: form.full_name,
//       custom_date_of_birth: form.dob,
//       custom_government_id: normalizedGovId,
//       custom_government_document:
//         documentUrl || form.document_upload || "",
//     };

//     /**
//      * Map Government ID Number to the correct custom field
//      */
//     if (idNumber) {
//       switch (normalizedGovId) {
//         case "Passport":
//           payload.custom_passport_number = idNumber;
//           break;

//         case "Driver's Licence":
//           payload.custom_drivers_licence_number =
//             idNumber;
//           break;

//         case "TIN Card":
//           payload.custom_tin_number = idNumber;
//           break;

//         case "Voter ID Card":
//           payload.custom_voter_id_number = idNumber;
//           break;

//         default:
//           break;
//       }
//     }

//     console.log(
//       "Creating Customer Payload:",
//       JSON.stringify(payload, null, 2)
//     );

//     console.log("Creating customer using active Frappe session:", {
//       email: loginUser?.user?.email,
//       sessionActive: loginUser?.user?.sessionActive,
//     });

//     const res = await fetch(
//       buildApiUrl("api/resource/Customer"),
//       getFetchOptions({
//         method: "POST",
//         body: JSON.stringify(payload),
//       })
//     );

//     const data = await res.json();

//     if (!res.ok) {
//       console.error("Create customer failed:", data);

//       throw new Error(
//         data?.exception ||
//           data?.message ||
//           data?._server_messages ||
//           "Customer creation failed"
//       );
//     }


//     console.log("Customer created successfully:", data);

//     return data.data;
//   } catch (err) {
//     console.error("Error creating customer:", err);
//     throw err;
//   }
// };
export const createCustomer = async (
  form,
  documentUrl,
  loginUser
) => {
  try {
    // --------------------------------------------------
    // 1. Generate Customer ID
    // --------------------------------------------------
    const cleanName = form.full_name
      .trim()
      .replace(/\s+/g, " ");

    const customerId = `${cleanName}_${formatDate(form.dob)}`;

    // --------------------------------------------------
    // 2. Check if customer already exists
    // --------------------------------------------------
    const existing = await getCustomerById(
      customerId,
      loginUser
    );

    const existingCustomer = existing?.data || existing;

    if (existingCustomer?.name) {
      console.log(
        "Customer already exists, reusing existing customer:",
        existingCustomer.name
      );

      return existingCustomer;
    }

    // --------------------------------------------------
    // 3. Fetch App Configuration
    // --------------------------------------------------
    console.log("Fetching App Configuration...");

    const configRes = await fetch(
      buildApiUrl(
        "api/resource/App Configuration/App Configuration"
      ),
      getFetchOptions({
        method: "GET",
      })
    );

    const configData = await configRes.json();

    if (!configRes.ok) {
      console.error(
        "Failed to fetch App Configuration:",
        configData
      );

      throw new Error(
        configData?.exception ||
        configData?.message ||
        configData?._server_messages ||
        "Failed to fetch App Configuration"
      );
    }

    const appConfig = configData?.data || {};

    console.log("App Configuration:", appConfig);

    // --------------------------------------------------
    // 4. Normalize Government ID Type
    // --------------------------------------------------
    const normalizedGovId = normalizeGovId(
      form.government_id_type
    );

    const idNumber =
      (form.government_id_number || "").trim();

    // --------------------------------------------------
    // 5. Create Customer Payload
    // --------------------------------------------------
    const payload = {
      customer_name: customerId,
      customer_type: "Individual",
      customer_group: "All Customer Groups",
      territory: "All Territories",

      custom_full_name: form.full_name,
      custom_date_of_birth: form.dob,
      custom_government_id: normalizedGovId,

      custom_government_document:
        documentUrl || form.document_upload || "",

      // ----------------------------------------------
      // Customer limits from App Configuration
      // ----------------------------------------------
      custom_available_currency_transfer_balance:
        Number(appConfig.annual_fx_limit) || 0,

      custom_annual_fx_and_moneygram_limit:
        Number(appConfig.annual_fx_and_moneygram_limit) || 0,

      custom_annual_compliance_limit:
        Number(appConfig.annual_compliance_limit) || 0,
    };

    // --------------------------------------------------
    // 6. Map Government ID Number
    // --------------------------------------------------
    if (idNumber) {
      switch (normalizedGovId) {
        case "Passport":
          payload.custom_passport_number = idNumber;
          break;

        case "Driver's Licence":
          payload.custom_drivers_licence_number =
            idNumber;
          break;

        case "TIN Card":
          payload.custom_tin_number = idNumber;
          break;

        case "Voter ID Card":
          payload.custom_voter_id_number = idNumber;
          break;

        default:
          break;
      }
    }

    console.log(
      "Creating Customer Payload:",
      JSON.stringify(payload, null, 2)
    );

    console.log(
      "Creating customer using active Frappe session:",
      {
        email: loginUser?.user?.email,
        sessionActive: loginUser?.user?.sessionActive,
      }
    );

    // --------------------------------------------------
    // 7. Create Customer
    // --------------------------------------------------
    const res = await fetch(
      buildApiUrl("api/resource/Customer"),
      getFetchOptions({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );

    const data = await res.json();

    if (!res.ok) {
      console.error(
        "Create customer failed:",
        data
      );

      throw new Error(
        data?.exception ||
        data?.message ||
        data?._server_messages ||
        "Customer creation failed"
      );
    }

    console.log(
      "Customer created successfully:",
      data
    );

    return data.data;
  } catch (err) {
    console.error(
      "Error creating customer:",
      err
    );

    throw err;
  }
};
/**
 * Update Customer
 */
export const updateCustomer = async (
  customerId,
  updateData,
  loginUser
) => {
  if (!customerId) return null;

  try {
    const res = await fetch(
      buildApiUrl(`api/resource/Customer/${encodeURIComponent(customerId)}`),
      getFetchOptions({
        method: "PUT",
        body: JSON.stringify(updateData),
      })
    );

    if (!res.ok) {
      console.warn("Update customer response not ok:", res.status);
      return null;
    }

    const data = await res.json();
    return data?.data || data;
  } catch (err) {
    console.warn("Error updating customer:", err);
    return null;
  }
};



// import { getBaseURL, getHeaders } from "../config/erpConfig";

// // ✅ GET CUSTOMER
// export const getCustomerById = async (idNumber, loginUser) => {
//   if (!idNumber || idNumber.length < 3) return null;

//   try {
//     const res = await fetch(
//       `${getBaseURL(ERP_ENV.PROD)}/api/resource/Customer/${idNumber}`,
//       {
//         method: "GET",
//         headers: getHeaders(loginUser, ERP_ENV.PROD),
//       }
//     );

//     if (!res.ok) {
//       console.log("Customer not found");
//       return null;
//     }

//     const { data } = await res.json();
//     return data;

//   } catch (error) {
//     console.error("Error fetching customer:", error);
//     return null;
//   }
// };

// // ✅ CREATE CUSTOMER
// export const createCustomer = async (form, file, loginUser, uploadFile) => {
//   try {
//     const formatDate = (date) => {
//       const d = new Date(date);
//       return d.toISOString().split("T")[0];
//     };

//     const cleanName = form.full_name.trim().replace(/\s+/g, " ");
//     const customerId = `${cleanName}_${formatDate(form.date_of_birth)}`;

//     let documentUrl = "";

//     if (file) {
//       documentUrl = await uploadFile(file, { isPrivate: 1 });
//     }

//     const payload = {
//       customer_name: customerId,
//       customer_type: "Individual",
//       customer_group: "All Customer Groups",
//       territory: "All Territories",

//       custom_full_name: form.full_name,
//       custom_date_of_birth: form.date_of_birth,
//       custom_government_id: form.government_id,
//       custom_passport_number: form.passport_number,
//       custom_drivers_license_number: form.id_number,
//       custom_government_document: documentUrl,
//     };

//     const res = await fetch(
//       `${getBaseURL(ERP_ENV.DEMO)}/api/resource/Customer`,
//       {
//         method: "POST",
//         headers: getHeaders(loginUser, ERP_ENV.DEMO),
//         body: JSON.stringify(payload),
//       }
//     );

//     const data = await res.json();

//     if (!res.ok) {
//       throw new Error(data?.message || "Customer creation failed");
//     }

//     return data.data;

//   } catch (err) {
//     console.error("Error creating customer:", err);
//     throw err;
//   }
// };