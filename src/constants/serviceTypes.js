const ACTIVE_SERVICE_TYPES = [
  "12A/80G Registration",
  "Accounts Preparation",
  "Accounts Review",
  "Aadhaar PAN Linking",
  "Annual Compliance",
  "Bookkeeping",
  "Certificate- Others",
  "Company Incorporation",
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
  "LLP Incorporation",
  "Networth Certificate",
  "NRI Status Updation",
  "NSS Utilization Certificate",
  "PAN Application",
  "Project Report",
  "Share Transfer",
  "Statutory Audit",
  "TAN Application",
  "Tax Audit",
  "TDS/TCS Returns",
  "Trade Mark hearing",
  "Utilization Certificate",
].sort((left, right) => left.localeCompare(right));

const RETIRED_COMBINED_REGISTRATION = "ESI/EPF Registration";
const RETIRED_SERVICE_TYPES = [
  RETIRED_COMBINED_REGISTRATION,
  "NSS Certification",
  "Deed Drafting",
  "Deed Preparation",
  "KGST Audit",
];

function canonicalServiceType(value) {
  const serviceType = String(value || "").trim().replace(/\s+/g, " ");
  if (/^net\s*worth certificate$/i.test(serviceType)) return "Networth Certificate";
  if (/^independend audit$/i.test(serviceType)) return "Independent Audit";
  if (/^trade\s*mark(?:\s+hearing)?$/i.test(serviceType)) return "Trade Mark hearing";
  return serviceType;
}

function isRetiredCombinedRegistration(value) {
  return canonicalServiceType(value).toLowerCase() === RETIRED_COMBINED_REGISTRATION.toLowerCase();
}

function isRetiredServiceType(value) {
  const normalized = canonicalServiceType(value).toLowerCase();
  return RETIRED_SERVICE_TYPES.some((serviceType) => serviceType.toLowerCase() === normalized);
}

module.exports = {
  ACTIVE_SERVICE_TYPES,
  RETIRED_COMBINED_REGISTRATION,
  RETIRED_SERVICE_TYPES,
  canonicalServiceType,
  isRetiredCombinedRegistration,
  isRetiredServiceType,
};
