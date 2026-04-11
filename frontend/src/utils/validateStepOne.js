export const validateStepOne = ({
  payMode,

  // Sender
  senderFullName,
  senderEmail,
  senderPhone,
  senderCountry,
  senderBankName,
  senderAccountNumber,
  senderSwiftCode,
  senderDocType,
  senderOtherDocType,
  senderDocNumber,
  senderDocFile,

  // Receiver
  receiverFullName,
  receiverEmail,
  receiverPhone,
  receiverCountry,
  receiverBankName,
  receiverAccountNumber,
  receiverSwiftCode,
  receiverDocType,
  receiverOtherDocType,
  receiverDocNumber,
  receiverDocFile,
}) => {
  
  /* ================= SENDER ================= */

  if (!senderFullName) return "Please enter Sender Full Name.";
  if (!senderEmail) return "Please enter Sender Email Address.";
  if (!senderPhone) return "Please enter Sender Phone Number.";
  if (!senderCountry) return "Please select Sender Country.";

  // Sender Bank (only bank_to_bank)
  if (payMode === "bank_to_bank") {
    if (!senderBankName) return "Please enter Sender Bank Name.";
    if (!senderAccountNumber) return "Please enter Sender Account Number.";
    if (!senderSwiftCode) return "Please enter Sender SWIFT Code.";
  }

  // Sender Document
  if (!senderDocType) return "Please select Sender Document Type.";
  if (senderDocType === "Other" && !senderOtherDocType)
    return "Please enter Sender Custom Document Type.";
  if (!senderDocNumber) return "Please enter Sender Document Number.";
  if (!senderDocFile) return "Please upload Sender Document File.";

  /* ================= RECEIVER ================= */

  if (!receiverFullName) return "Please enter Receiver Full Name.";
  if (!receiverEmail) return "Please enter Receiver Email Address.";
  if (!receiverPhone) return "Please enter Receiver Phone Number.";
  if (!receiverCountry) return "Please select Receiver Country.";

  // Receiver Bank
  if (payMode === "cash_to_bank" || payMode === "bank_to_bank") {
    if (!receiverBankName) return "Please enter Receiver Bank Name.";
    if (!receiverAccountNumber)
      return "Please enter Receiver Account Number.";
    if (!receiverSwiftCode)
      return "Please enter Receiver SWIFT Code.";
  }

  // Receiver Document
  // if (!receiverDocType) return "Please select Receiver Document Type.";
  // if (receiverDocType === "Other" && !receiverOtherDocType)
  //   return "Please enter Receiver Custom Document Type.";
  // if (!receiverDocNumber)
  //   return "Please enter Receiver Document Number.";
  // if (!receiverDocFile)
  //   return "Please upload Receiver Document File.";

  return null; // ✅ everything valid
};