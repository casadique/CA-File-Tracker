const ACTIVE_SERVICE_TYPES = [
  "12A/80G Registration",
  "Accounts Preparation",
  "Accounts Review",
  "Aadhaar PAN Linking",
  "Annual Compliance",
  "Bookkeeping",
  "Certificate- Others",
  "Company Incorporation",
  "Deed Drafting",
  "DPT-3 Filing",
  "DSC",
  "EPF Registration",
  "ESI Registration",
  "ESI/EPF Return Filing",
  "Feasibility Studies",
  "Form 15 Filing",
  "Form 3 Filing",
  "GST Audit",
  "GST Notice",
  "GSTR Filing",
  "IE Code",
  "Independent Audit",
  "IT Notice",
  "ITR Filing",
  "KGST Audit",
  "LLP Incorporation",
  "Networth Certificate",
  "NRI Status Updation",
  "NSS Certification",
  "NSS Utilization Certificate",
  "PAN Application",
  "Project Report",
  "Share Transfer",
  "Statutory Audit",
  "TAN Application",
  "Tax Audit",
  "TDS/TCS Returns",
  "Trade Mark",
  "Utilization Certificate",
].sort((left, right) => left.localeCompare(right));

const RETIRED_COMBINED_REGISTRATION = "ESI/EPF Registration";

function canonicalServiceType(value) {
  const serviceType = String(value || "").trim().replace(/\s+/g, " ");
  if (/^net\s*worth certificate$/i.test(serviceType)) return "Networth Certificate";
  if (/^independend audit$/i.test(serviceType)) return "Independent Audit";
  return serviceType;
}

function isRetiredCombinedRegistration(value) {
  return canonicalServiceType(value).toLowerCase() === RETIRED_COMBINED_REGISTRATION.toLowerCase();
}

module.exports = {
  ACTIVE_SERVICE_TYPES,
  RETIRED_COMBINED_REGISTRATION,
  canonicalServiceType,
  isRetiredCombinedRegistration,
};
