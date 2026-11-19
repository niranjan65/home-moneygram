import { sessionFetch as fetch } from "../../../api/sessionClient.js";
import { buildApiUrl, getFetchOptions } from "../config/erpConfig";

/**
 * Fetch the customer's last transaction from Frappe REST API.
 * Supports searching by name, custom_customer_id, and customer_id.
 * Prioritizes preferredType ("Money Transfer" or "Currency Exchange For Customer"),
 * falling back to the other transaction type if no record is found.
 */
export async function fetchCustomerLastTransaction(customer, preferredType = "Money Transfer") {
  if (!customer) return null;

  const candidateIds = Array.from(
    new Set(
      [
        typeof customer === "string" ? customer : null,
        customer?.name,
        customer?.custom_customer_id,
        customer?.customer_id,
        customer?.customer,
      ]
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter((id) => id.length > 0)
    )
  );

  if (candidateIds.length === 0) return null;

  const isExchange =
    preferredType === "Currency Exchange" ||
    preferredType === "Currency Exchange For Customer";

  const primaryDoctype = isExchange
    ? "Currency Exchange For Customer"
    : "Money Transfer";
  const secondaryDoctype = isExchange
    ? "Money Transfer"
    : "Currency Exchange For Customer";

  const doctypesToTry = [primaryDoctype, secondaryDoctype];

  for (const doctype of doctypesToTry) {
    try {
      const filters = JSON.stringify([
        ["customer_id", "in", candidateIds],
        ["docstatus", "<", 2],
      ]);

      const url = buildApiUrl(
        `api/resource/${encodeURIComponent(doctype)}?filters=${encodeURIComponent(
          filters
        )}&order_by=creation desc&limit_page_length=1&fields=["*"]`
      );

      const res = await fetch(url, getFetchOptions({ method: "GET" }));
      if (!res.ok) continue;

      const json = await res.json();
      const row = json?.data?.[0];

      if (row && row.name) {
        let fullDoc = row;
        // Fetch full document with child tables (e.g. documents) if needed
        if (!Array.isArray(fullDoc.documents) || fullDoc.documents.length === 0) {
          try {
            const detailRes = await fetch(
              buildApiUrl(
                `api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(
                  row.name
                )}`
              ),
              getFetchOptions({ method: "GET" })
            );
            if (detailRes.ok) {
              const detailJson = await detailRes.json();
              if (detailJson.data) {
                fullDoc = detailJson.data;
              }
            }
          } catch (_) {}
        }
        return { doctype, data: fullDoc };
      }
    } catch (err) {
      console.warn(`[lastTransaction] Error querying ${doctype}:`, err);
    }
  }

  return null;
}

/**
 * Extract form fields for Money Transfer pages (/money-transfer, /money-transfer-new)
 * SKIPS:
 * 1. amount (and cash denomination rows)
 * 2. selected forex for exchange (N/A)
 * 3. reference_number, remarks / transaction_remarks
 */
export function extractMoneyTransferPrefill(lastTx) {
  if (!lastTx) return {};

  const updates = {};

  // Receiver details
  if (lastTx.receiver_name) updates.receiver_name = lastTx.receiver_name;
  else if (lastTx.customer_full_name) updates.receiver_name = lastTx.customer_full_name;

  if (lastTx.receiver_address) updates.receiver_address = lastTx.receiver_address;
  if (lastTx.receiver_address_line_2) updates.receiver_address_line_2 = lastTx.receiver_address_line_2;
  if (lastTx.receiver_city || lastTx.c_or_p) updates.receiver_city = lastTx.receiver_city || lastTx.c_or_p;
  if (lastTx.receiver_stateprovince) updates.receiver_stateprovince = lastTx.receiver_stateprovince;
  if (lastTx.receiver_postal_code) updates.receiver_postal_code = lastTx.receiver_postal_code;
  if (lastTx.receiver_country || lastTx.destination_country) {
    updates.receiver_country = lastTx.receiver_country || lastTx.destination_country;
  }

  // Sender details
  if (lastTx.address) updates.address = lastTx.address;
  if (lastTx.address_line_2) updates.address_line_2 = lastTx.address_line_2;
  if (lastTx.city || lastTx.c_or_p) updates.city = lastTx.city || lastTx.c_or_p;
  if (lastTx.stateprovince) updates.stateprovince = lastTx.stateprovince;
  if (lastTx.postal_code) updates.postal_code = lastTx.postal_code;
  if (lastTx.country || lastTx.destination_country) {
    updates.country = lastTx.country || lastTx.destination_country;
  }

  // Transfer & compliance details
  // Note: Do not prefill transfer_type so that the active page/tab selection (Send vs Receive) is preserved
  if (lastTx.oet_code) updates.oet_code = lastTx.oet_code;
  if (lastTx.occupation) updates.occupation = lastTx.occupation;
  if (lastTx.warehouse) updates.warehouse = lastTx.warehouse;
  if (lastTx.tin_number) updates.tin_number = lastTx.tin_number;

  const govIdType =
    lastTx.government_id_type || lastTx.government_id || lastTx.verification_id_type;
  if (govIdType) {
    updates.government_id_type = govIdType;
    updates.custom_government_id = govIdType;
  }

  const govIdNum =
    lastTx.government_id_number || lastTx.id_number || lastTx.passport_number;
  if (govIdNum) {
    updates.government_id_number = govIdNum;
    if (govIdType === "Passport") {
      updates.passport_number = govIdNum;
      updates.custom_passport_number = govIdNum;
    }
  }

  if (lastTx.id_issue_date) updates.id_issue_date = lastTx.id_issue_date;
  if (lastTx.id_expiry_date) updates.id_expiry_date = lastTx.id_expiry_date;
  if (lastTx.id_issue_country) updates.id_issue_country = lastTx.id_issue_country;
  if (lastTx.id_issue_stateprovince) updates.id_issue_state = lastTx.id_issue_stateprovince;
  if (lastTx.risk_level) updates.risk_level = lastTx.risk_level;

  // RBF compliance
  if (lastTx.rbf_purpose) updates.rbf_purpose = lastTx.rbf_purpose;
  if (lastTx.rbf_source_of_funds) updates.rbf_source_of_funds = lastTx.rbf_source_of_funds;
  if (lastTx.rbf_nationality_type) updates.rbf_nationality_type = lastTx.rbf_nationality_type;
  if (lastTx.rbf_nationality) updates.rbf_nationality = lastTx.rbf_nationality;
  if (lastTx.rbf_other_nationality) updates.rbf_other_nationality = lastTx.rbf_other_nationality;
  if (lastTx.rbf_residency_status) updates.rbf_residency_status = lastTx.rbf_residency_status;
  if (lastTx.rbf_beneficiary_reference) updates.rbf_beneficiary_reference = lastTx.rbf_beneficiary_reference;
  if (lastTx.rbf_student_reference) updates.rbf_student_reference = lastTx.rbf_student_reference;
  if (lastTx.rbf_family_reference) updates.rbf_family_reference = lastTx.rbf_family_reference;
  if (lastTx.rbf_invoice_reference) updates.rbf_invoice_reference = lastTx.rbf_invoice_reference;
  if (lastTx.tf_form_reference) updates.tf_form_reference = lastTx.tf_form_reference;
  if (
    lastTx.passport_endorsement_completed !== undefined &&
    lastTx.passport_endorsement_completed !== null
  ) {
    updates.passport_endorsement_completed = lastTx.passport_endorsement_completed;
  }

  // Documents
  if (Array.isArray(lastTx.documents) && lastTx.documents.length > 0) {
    updates.documents = lastTx.documents.map((d) => ({
      document_type: d.document_type || govIdType || "Passport",
      document_number: d.document_number || govIdNum || "",
      issue_date: d.issue_date || lastTx.id_issue_date || "",
      expiry_date: d.expiry_date || lastTx.id_expiry_date || "",
      issue_country: d.issue_country || lastTx.id_issue_country || "",
      attachment: d.attachment || "",
      notes: d.notes || "",
    }));
    const firstAttach = lastTx.documents[0]?.attachment;
    if (firstAttach) {
      updates.document_upload = firstAttach;
      updates.custom_government_document = firstAttach;
    }
  } else if (
    lastTx.document_upload ||
    lastTx.passport_photo__scan ||
    lastTx.government_id_photo__scan
  ) {
    const docUrl =
      lastTx.document_upload ||
      lastTx.passport_photo__scan ||
      lastTx.government_id_photo__scan;
    updates.document_upload = docUrl;
    updates.custom_government_document = docUrl;
    updates.documents = [
      {
        document_type: govIdType || "Passport",
        document_number: govIdNum || "",
        issue_date: lastTx.id_issue_date || "",
        expiry_date: lastTx.id_expiry_date || "",
        issue_country: lastTx.id_issue_country || "",
        attachment: docUrl,
        notes: "",
      },
    ];
  }

  return updates;
}

/**
 * Extract form fields for Currency Exchange pages (/exchange, /exchange-new)
 * SKIPS:
 * 1. amount (sendAmount, total_foreign_currency, they_receive, total_to_pay, final_amount, denomination counts)
 * 2. selected forex for exchange (toCurrency, foreignCurrency, currency, my_currency, send_or_receive_currency)
 * 3. reference_number, transaction_remarks / remarks
 */
export function extractExchangePrefill(lastTx) {
  if (!lastTx) return {};

  const updates = {};

  // Personal details
  if (lastTx.first_name) updates.firstName = lastTx.first_name;
  if (lastTx.last_name) updates.lastName = lastTx.last_name;
  if (lastTx.middle_name) updates.middleName = lastTx.middle_name;
  if (lastTx.second_last_name_family_name) {
    updates.secondLastName = lastTx.second_last_name_family_name;
  }
  if (lastTx.customer_full_name || lastTx.full_name) {
    updates.idName = lastTx.customer_full_name || lastTx.full_name;
  }
  if (lastTx.date_of_birth || lastTx.dob) {
    updates.dateOfBirth = lastTx.date_of_birth || lastTx.dob;
  }
  if (lastTx.phone_number) {
    updates.phone_number = lastTx.phone_number;
    updates.phoneNumber = lastTx.phone_number;
  }
  if (lastTx.receiver_mailid || lastTx.email) {
    updates.email = lastTx.receiver_mailid || lastTx.email;
  }
  if (lastTx.destination_country || lastTx.country || lastTx.receiver_country) {
    updates.country =
      lastTx.destination_country || lastTx.country || lastTx.receiver_country;
  }
  if (lastTx.c_or_p || lastTx.city || lastTx.receiver_city) {
    updates.city = lastTx.c_or_p || lastTx.city || lastTx.receiver_city;
  }
  if (lastTx.occupation) updates.occupation = lastTx.occupation;
  if (lastTx.tin_number) updates.tinNumber = lastTx.tin_number;
  if (lastTx.risk_level) updates.risk_level = lastTx.risk_level;
  if (lastTx.purposeoftransaction || lastTx.purposeOfTransaction || lastTx.purpose_of_transaction) {
    updates.purposeOfTransaction = lastTx.purposeoftransaction || lastTx.purposeOfTransaction || lastTx.purpose_of_transaction;
  }

  // Identification
  const govIdType =
    lastTx.government_id || lastTx.verification_id_type || lastTx.government_id_type;
  if (govIdType) {
    updates.government_id = govIdType;
    updates.idType = govIdType;
  }
  const govIdNum =
    lastTx.id_number || lastTx.passport_number || lastTx.government_id_number;
  if (govIdNum) updates.idNumber = govIdNum;
  if (lastTx.id_issue_date) updates.id_issue_date = lastTx.id_issue_date;
  if (lastTx.id_expiry_date) updates.id_expiry_date = lastTx.id_expiry_date;
  if (lastTx.id_issue_country) updates.idIssueCountry = lastTx.id_issue_country;
  if (lastTx.id_issue_stateprovince || lastTx.stateprovince) {
    updates.idIssueState = lastTx.id_issue_stateprovince || lastTx.stateprovince;
  }

  // Travel details (for SELL)
  if (lastTx.travel_destination) updates.destination = lastTx.travel_destination;
  if (lastTx.travel_date) updates.travelDate = lastTx.travel_date;
  if (lastTx.airways_name) updates.airwaysName = lastTx.airways_name;
  if (lastTx.flight_number) updates.flightNumber = lastTx.flight_number;
  if (lastTx.pnrnumber) updates.pnrNumber = lastTx.pnrnumber;
  if (lastTx.ticket) updates.ticket = lastTx.ticket;

  // Compliance & OET
  if (lastTx.oet_code) updates.oet_code = lastTx.oet_code;
  if (lastTx.rbf_purpose) updates.rbf_purpose = lastTx.rbf_purpose;
  if (lastTx.rbf_source_of_funds) updates.source_of_funds = lastTx.rbf_source_of_funds;
  if (lastTx.rbf_nationality_type) updates.nationality_type = lastTx.rbf_nationality_type;
  if (lastTx.rbf_nationality) updates.nationality = lastTx.rbf_nationality;
  if (lastTx.rbf_other_nationality) updates.other_nationality = lastTx.rbf_other_nationality;
  if (lastTx.rbf_residency_status) updates.residency_status = lastTx.rbf_residency_status;
  if (lastTx.rbf_beneficiary_reference) updates.rbf_beneficiary_reference = lastTx.rbf_beneficiary_reference;
  if (lastTx.rbf_student_reference) updates.rbf_student_reference = lastTx.rbf_student_reference;
  if (lastTx.rbf_family_reference) updates.rbf_family_reference = lastTx.rbf_family_reference;
  if (lastTx.rbf_invoice_reference) updates.rbf_invoice_reference = lastTx.rbf_invoice_reference;
  if (lastTx.tf_form_reference) updates.tf_form_reference = lastTx.tf_form_reference;
  if (
    lastTx.passport_endorsement_completed !== undefined &&
    lastTx.passport_endorsement_completed !== null
  ) {
    updates.passport_endorsed = Boolean(lastTx.passport_endorsement_completed);
  }

  // Exchange Type: Do not prefill exchangeType so that the active page/tab selection (BUY vs SELL) is preserved

  // Documents Table
  if (Array.isArray(lastTx.documents) && lastTx.documents.length > 0) {
    updates.documents = lastTx.documents.map((d) => ({
      document_type: d.document_type || govIdType || "Passport",
      document_number: d.document_number || govIdNum || "",
      issue_date: d.issue_date || lastTx.id_issue_date || "",
      expiry_date: d.expiry_date || lastTx.id_expiry_date || "",
      issue_country: d.issue_country || lastTx.id_issue_country || "",
      attachment: d.attachment || "",
      notes: d.notes || "",
    }));
    const firstAttach = lastTx.documents[0]?.attachment;
    if (firstAttach) {
      const docUrl = firstAttach.startsWith("http")
        ? firstAttach
        : `/${firstAttach.replace(/^\/+/, "")}`;
      updates.docFile = docUrl;
    }
  } else if (
    lastTx.passport_photo__scan ||
    lastTx.government_id_photo__scan ||
    lastTx.document_upload
  ) {
    const rawAttach =
      lastTx.passport_photo__scan ||
      lastTx.government_id_photo__scan ||
      lastTx.document_upload;
    const docUrl = rawAttach.startsWith("http")
      ? rawAttach
      : `/${rawAttach.replace(/^\/+/, "")}`;
    updates.docFile = docUrl;
    updates.documents = [
      {
        document_type: govIdType || "Passport",
        document_number: govIdNum || "",
        issue_date: lastTx.id_issue_date || "",
        expiry_date: lastTx.id_expiry_date || "",
        issue_country: lastTx.id_issue_country || "",
        attachment: docUrl,
        notes: "",
      },
    ];
  }

  return updates;
}
