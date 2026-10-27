import { sessionFetch as fetch } from "../../../api/sessionClient.js";

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
 * Fetch a guaranteed unique 6-character uppercase Customer ID from backend
 */
export const fetchNewCustomerId = async (loginUser) => {
  try {
    const res = await fetch(
      "/api/method/moneygram.moneygram.api.get_transactions.get_new_customer_id",
      getFetchOptions({ method: "GET" })
    );
    if (!res.ok) throw new Error("Failed to fetch customer id");
    const json = await res.json();
    return json.message;
  } catch (err) {
    console.error("Error fetching new customer ID, using local generation:", err);
    return "ME0001";
  }
};

/**
 * Fetch Customer by ID (6-character uppercase code or primary key)
 */
export const getCustomerById = async (customerId, loginUser) => {
  if (!customerId || customerId.length < 2) return null;

  const authHeaders = {};

  try {
    let res = await fetch(
      buildApiUrl(`api/resource/Customer/${encodeURIComponent(customerId)}`),
      getFetchOptions({
        method: "GET",
        headers: authHeaders,
      })
    );

    if (!res.ok) {
      // Fallback: search by custom_customer_id
      const queryRes = await fetch(
        buildApiUrl(`api/resource/Customer?filters=[["custom_customer_id","=","${encodeURIComponent(customerId)}"]]&fields=["*"]&limit=1`),
        getFetchOptions({ method: "GET", headers: authHeaders })
      );
      if (queryRes.ok) {
        const queryJson = await queryRes.json();
        if (queryJson.data && queryJson.data.length > 0) {
          const cust = queryJson.data[0];
          if (["Warehouse Branch", "Warehouse Vault"].includes(cust.customer_group)) {
            return null;
          }
          const phoneVal = cust.mobile_no || cust.phone || cust.phone_number || cust.custom_contact_number || cust.contact_number || "";
          return {
            ...cust,
            phone_number: phoneVal,
            mobile_no: phoneVal,
            risk_level: cust.custom_risk_level || cust.risk_level || "Low",
            custom_risk_level: cust.custom_risk_level || cust.risk_level || "Low",
            government_id_type: cust.custom_government_id || "",
            government_id_number: cust.custom_passport_number || cust.custom_drivers_licence_number || cust.custom_voter_id_number || cust.custom_tin_number || "",
          };
        }
      }
      return null;
    }

    const { data } = await res.json();
    if (["Warehouse Branch", "Warehouse Vault"].includes(data?.customer_group)) {
      return null;
    }

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

    let resolvedPhone = data.mobile_no || data.phone || data.phone_number || data.custom_contact_number || data.contact_number || "";
    if (!resolvedPhone && (data.name || customerId)) {
      try {
        const listRes = await fetch(
          buildApiUrl(`api/method/moneygram.moneygram.api.get_transactions.get_customers_list?selected=${encodeURIComponent(data.name || customerId)}&limit=1`),
          getFetchOptions({ method: "GET", headers: authHeaders })
        );
        if (listRes.ok) {
          const listJson = await listRes.json();
          const found = listJson.message?.[0];
          if (found && (found.mobile_no || found.phone_number)) {
            resolvedPhone = found.mobile_no || found.phone_number;
          }
        }
      } catch (err) {
        // Fallback silently if get_customers_list query fails
      }
    }

    return {
      ...data,
      phone_number: resolvedPhone,
      mobile_no: resolvedPhone,
      risk_level: data.custom_risk_level || data.risk_level || "Low",
      custom_risk_level: data.custom_risk_level || data.risk_level || "Low",
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
  loginUser,
  customerImageUrl = ""
) => {
  try {
    // --------------------------------------------------
    // 1. Obtain Customer ID (6-character unique code)
    // --------------------------------------------------
    let customerId = (form.customer_id || form.customerId || "").trim().toUpperCase();
    if (!customerId) {
      customerId = await fetchNewCustomerId(loginUser);
    }

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
      name: customerId,
      custom_customer_id: customerId,
      customer_type: "Individual",
      customer_group: "Individual",
      // territory: "All Territories",

      custom_full_name: form.full_name,
      custom_date_of_birth: form.dob,
      custom_government_id: normalizedGovId,

      custom_government_document:
        documentUrl || form.document_upload || "",

      image: customerImageUrl || form.customer_image || form.image || "",

      mobile_no: (form.phone_number || form.mobile_no || form.phone || "").trim(),
      custom_risk_level: form.risk_level || form.custom_risk_level || "Low",

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
 * Directly update customer risk level using whitelisted endpoint
 */
export const updateCustomerRiskLevel = async (customer, riskLevel, loginUser) => {
  if (!customer || !riskLevel) return null;
  const authHeaders = {};
  try {
    const res = await fetch(
      buildApiUrl(
        `api/method/moneygram.moneygram.api.get_transactions.update_customer_risk_level?customer=${encodeURIComponent(
          customer
        )}&risk_level=${encodeURIComponent(riskLevel)}`
      ),
      getFetchOptions({ method: "POST", headers: authHeaders })
    );
    if (!res.ok) {
      console.warn("updateCustomerRiskLevel error status:", res.status);
      return null;
    }
    const json = await res.json();
    return json.message;
  } catch (err) {
    console.warn("updateCustomerRiskLevel failed:", err);
    return null;
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

  const authHeaders = {};

  // If custom_risk_level or risk_level is in updateData, call updateCustomerRiskLevel as well
  if (updateData.custom_risk_level || updateData.risk_level) {
    const rVal = updateData.custom_risk_level || updateData.risk_level;
    updateCustomerRiskLevel(customerId, rVal, loginUser).catch(() => {});
  }

  try {
    let res = await fetch(
      buildApiUrl(`api/resource/Customer/${encodeURIComponent(customerId)}`),
      getFetchOptions({
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(updateData),
      })
    );

    if (!res.ok) {
      // Fallback: customerId might be custom_customer_id rather than primary key name
      try {
        const queryRes = await fetch(
          buildApiUrl(`api/resource/Customer?filters=[["custom_customer_id","=","${encodeURIComponent(customerId)}"]]&fields=["name"]&limit=1`),
          getFetchOptions({ method: "GET", headers: authHeaders })
        );
        if (queryRes.ok) {
          const queryJson = await queryRes.json();
          const actualName = queryJson.data?.[0]?.name;
          if (actualName && actualName !== customerId) {
            res = await fetch(
              buildApiUrl(`api/resource/Customer/${encodeURIComponent(actualName)}`),
              getFetchOptions({
                method: "PUT",
                headers: authHeaders,
                body: JSON.stringify(updateData),
              })
            );
          }
        }
      } catch (fallbackErr) {
        console.warn("Fallback customer update failed:", fallbackErr);
      }
    }

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