const STORAGE_KEY = "ma-ca-document-tracker-v1";
const TAB_SESSION_KEY = `${STORAGE_KEY}-tab-session`;
const SYNC_EVENT_KEY = `${STORAGE_KEY}-sync-event`;
const API_TOKEN_KEY = `${STORAGE_KEY}-api-token`;
const API_REFRESH_TOKEN_KEY = `${STORAGE_KEY}-api-refresh-token`;
const API_MODE_KEY = `${STORAGE_KEY}-api-mode`;
const AUTO_BACKUP_DONE_KEY = `${STORAGE_KEY}-auto-backup-done-ist-date`;
const DAILY_QUOTE_MINIMIZED_KEY = `${STORAGE_KEY}-daily-quote-minimized`;
const FILE_DATA_RESET_VERSION = "all-file-data-cleared-2026-07-16-fresh-import";
const ACTIVE_FILE_DATA_RESET_VERSION = "active-files-cleared-2026-07-14";
const COMPLETED_FILES_CHECKED_VERSION = "completed-files-checked-by-chindu-2026-07-14";
const ACTIVE_FILE_DATES_CLEAR_VERSION = "active-file-dates-cleared-2026-07-14";
const MASTER_LIST_RESET_VERSION = "approved-master-users-2026-07-13";
const MS_DAY = 86400000;

const defaultDailyQuotes = [
  { text: "Success comes from consistent small efforts.", author: "Robert Collier" },
  { text: "Small progress each day adds up to big results.", author: "Satya Nani" },
  { text: "Discipline is choosing what you want most over what you want now.", author: "Abraham Lincoln" },
  { text: "Quality is never an accident; it is always the result of intelligent effort.", author: "John Ruskin" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
];

const stages = [
  "Received",
  "Allotted",
  "WIP",
  "Work Done",
  "On Hold",
  "Client Pending",
  "Approval Pending",
  "Approved",
  "Completed",
  "Correction Required",
  "Billed",
];

const staff = sortByName([
  userAccount("CA Sadique", "casadique@gmail.com", "Admin", "Casadique@233487", "u1", "system"),
  userAccount("Najmunnisa", "pvnajmunnisa123@gmail.com", "Manager", "Najma@696"),
  userAccount("Chindu", "craveendran06@gmail.com", "Manager", "Chindu#357"),
  userAccount("Abhinandana", "abhinandanakmadhu@gmail.com", "Staff", "Abhi@369"),
  userAccount("Althaf", "althafmk2210@gmail.com", "Staff Manager", "Althaf@2210"),
  userAccount("Anusree", "anusreekvmathil@gmail.com", "Staff Manager", "Anusree@741"),
  userAccount("Arya", "aryatv142001@gmail.com", "Staff", "Arya@001"),
  userAccount("Dheeraj", "dheerajvv11@gmail.com", "Staff", "Dheeraj@11"),
  userAccount("Mirsab", "abdulkareemc796@gmail.com", "Staff", "Mirsab@796"),
  userAccount("Naveen", "naveenvv001@gmail.com", "Staff", "Naveen@001"),
  userAccount("Nisha", "nishagireesh986@gmail.com", "Staff Manager", "Nisha@986"),
  userAccount("Rabiyath", "ckrabiyath@gmail.com", "Staff", "Rabiyath@789"),
  userAccount("Rasha", "rashamp7@gmail.com", "Staff", "Rasha@007"),
  userAccount("Rizwana", "rizwanashir06@gmail.com", "Staff Manager", "Rizwana@06"),
  userAccount("Shada", "shadapp004@gmail.com", "Staff", "Shada@004"),
  userAccount("Shadiya", "shadiyasadiq7@gmail.com", "Staff", "Shadiya@007"),
  userAccount("Shurafa", "shurafasameer00@gmail.com", "Staff", "Shurafa@00"),
  userAccount("Sidharth", "sidharthkorom@gmail.com", "Staff", "Sidharth@456"),
  userAccount("Sneha", "snehasantosh1952002@gmail.com", "Staff", "Sneha@002"),
]);

const defaultServices = sortList([
  "12A/80G Registration",
  "Accounts Preparation",
  "Accounts Review",
  "Annual Compliance",
  "Bookkeeping",
  "Certificate- Others",
  "Company Incorporation",
  "Deed Drafting",
  "DSC",
  "ESI/EPF Registration",
  "ESI/EPF Return Filing",
  "Feasibility Studies",
  "GST Audit",
  "GST Notice",
  "GSTR Filing",
  "IE Code",
  "Independent Audit",
  "IT Notice",
  "ITR Filing",
  "KGST Audit",
  "LLP Incorporation",
  "NSS Certification",
  "PAN Application",
  "Project Report",
  "Share Transfer",
  "Statutory Audit",
  "TAN Application",
  "Tax Audit",
  "TDS/TCS Returns",
  "Trade Mark",
  "Utilization Certificate",
]);

const defaultCareOfList = sortList([
  "Bin",
  "Bygesh",
  "CA Sadique",
  "Direct",
  "Ikey",
  "Janeesh",
  "Khidma",
  "Lakshman",
  "Mariyama",
  "Nitheesh",
  "Rafeeq",
  "Rajesh Armi",
  "Rajesh Swift",
  "Ravi",
  "Rejin",
  "Roy",
  "Shaz",
  "Staff",
  "Taxmate",
  "Valsala",
  "Viswan",
]);

const defaultFyList = ["2024-25", "2025-26", "2026-27", "2027-28", "NA"];

const modes = ["Whatsapp", "Physical", "Email"];
const collectionTypeLabels = {
  fee_collection: "Fee Collection",
  other_cash_collection: "Other Cash Collection",
  other_bank_collection: "Other Bank Collection",
  refund: "Refund",
  other: "Other",
};
const collectionTypeOptions = Object.entries(collectionTypeLabels).map(([value, label]) => ({ value, label }));
const approvedStaffNames = new Set(staff.map((user) => user.name.toLowerCase()));
const approvedServices = new Set(defaultServices.map((item) => item.toLowerCase()));
const approvedCareOfNames = new Set(defaultCareOfList.map((item) => item.toLowerCase()));
const essentialTeamUserEmails = new Set([
  "casadique@gmail.com",
  "anusreekvmathil@gmail.com",
  "pvnajmunnisa123@gmail.com",
  "craveendran06@gmail.com",
]);
const essentialTeamUserNames = new Set(["ca sadique", "sadique", "anusree", "najmunnisa", "najma", "chindu"]);

const dummyFileNames = new Set([
  "acme traders",
  "blue peak foods llp",
  "crescent infra pvt ltd",
  "delta medicals",
  "evergreen exports",
  "fusion design studio",
  "galaxy retail mart",
  "harbour logistics",
  "iris education trust",
  "jupiter textiles",
]);

const forcedNonBilledFileRows = [
  ["Archana P J - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Adithya. C - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Adithya. M. P - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Gopika N K - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Animol Binoy - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Raihana Cm - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Himatha K - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Nandana P - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Kadeejath Rahna Em - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Bijisha Balakrishnan. K - Adam & Eve", "NA", "ESI KYC Filing"],
  ["I Key Home Studio Llp", "NA", "ESI/EPF Return Filing"],
  ["Shyamili K V - Adam & Eve", "NA", "PF Withdrawal"],
  ["I Key Home Studio Llp", "NA", "TDS/TCS Returns"],
  ["Adam & Eve Health Solutions Private Limited", "NA", "TDS/TCS Returns"],
  ["Al Amaan Build Mart Private Limited", "NA", "TDS/TCS Returns"],
  ["I Key Home Studio", "AAGFI5926B", "GST Notice"],
  ["Alfiya Vinod - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Bichu Bastian - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Anupama K - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Fathima K - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Kesiya K Sajan - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Parvathi P - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Dhannya K Valsan - Adam & Eve", "NA", "ESI KYC Filing"],
  ["Sayad Nabeel Shameem M", "FEFPM2859D", "ITR Filing"],
  ["Zunnun Mandiyan Basheer", "COGPB4228B", "ITR Filing"],
  ["Thayyib Syed Mohamed", "ASCPT2501M", "ITR Filing"],
  ["Faizal Mandian", "ABTPF6724E", "ITR Filing"],
  ["Chokiyatakath Abdul Kareem", "AQMPA0892L", "ITR Filing"],
  ["Muhammed Kunhi Mandiyan", "BDDPA0382C", "ITR Filing"],
  ["Niyas Mettammal Puzhakkarayillath", "FBNPP7031R", "ITR Filing"],
  ["Mohammed Jaseem Mailan Toat Cadavath", "NA", "DIN Activation"],
  ["Muhammed Nihal Mahamood", "NA", "DIN Activation"],
  ["Ramya Premrajan", "NA", "DIN Activation"],
  ["Mohammed Jaseem Mailan Toat Cadavath", "NA", "DSC"],
];

const forcedNonBilledFileKeys = new Set(forcedNonBilledFileRows.map(([name, pan, service]) => fileMatchKey(name, pan, service)));

const seedFiles = [];

function fileSeed(name, pan, service, receivedOffset, dueOffset, assignedStaff, priority, stageIndexes, billed, remarks) {
  const now = new Date();
  const received = new Date(now.getTime() + receivedOffset * MS_DAY);
  const due = new Date(now.getTime() + dueOffset * MS_DAY);
  const checked = Object.fromEntries(stages.map((s, i) => [s, stageIndexes.includes(i)]));
  checked.Billed = billed || checked.Billed;
  return {
    id: crypto.randomUUID(),
    name,
    pan,
    serviceType: service,
    careOf: "Direct",
    mode: "Whatsapp",
    fileReceivedDate: dateInput(received),
    workDone: checked["Work Done"],
    shared: checked["Approval Pending"],
    reportPrepared: checked["Work Done"],
    approved: checked.Approved,
    filed: checked.Completed,
    billed: checked.Billed,
    stages: checked,
    assignedStaff,
    workAllotmentDate: dateInput(received),
    workStartedDate: checked.WIP ? dateInput(received) : "",
    reAssignedStaff: "",
    reAssignedDate: "",
    dueDate: dateInput(due),
    priority,
    remarks,
    attachments: [
      { id: crypto.randomUUID(), name: `${name.replaceAll(" ", "_")}_working.pdf`, uploadDate: dateInput(received), uploadedBy: assignedStaff },
    ],
    lastUpdatedDate: dateInput(new Date(now.getTime() - Math.floor(Math.random() * 5) * MS_DAY)),
  };
}

const permissions = {
  Admin: { edit: true, delete: true, export: true, users: true, invite: true, assign: true, allFiles: true, roles: true },
  Manager: { edit: true, delete: true, export: true, users: false, invite: false, assign: true, allFiles: true, roles: false },
  "Staff Manager": { edit: true, delete: false, export: true, users: false, invite: false, assign: false, allFiles: false, roles: false },
  Staff: { edit: true, delete: false, export: false, users: false, invite: false, assign: false, allFiles: false, roles: false },
  Guest: { edit: false, delete: false, export: false, users: false, invite: false, assign: false, allFiles: true, roles: false },
};

const checkingStaffNames = new Set(["nisha", "rizwana", "althaf"]);
const fileCreatorStaffNames = new Set(["nisha", "anusree"]);
const notCheckedStaffManagerNames = new Set(["nisha", "rizwana", "althaf"]);

function isRemovedStaff(name) {
  return ["sadiya", "najuma"].includes((name || "").trim().toLowerCase());
}

function sortList(items) {
  return [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function dedupeByNormalizedText(items) {
  const map = new Map();
  (items || []).forEach((item) => {
    const text = String(item || "").trim().replace(/\s+/g, " ");
    const key = normalizeDropdownKey(text);
    if (!key) return;
    if (!map.has(key) || text.length < map.get(key).length) map.set(key, text);
  });
  return sortList([...map.values()]);
}

function normalizeDropdownKey(value) {
  return String(value || "").trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function sortByName(items) {
  return [...items].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}

function properCaseName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").split(" ").map((part) => {
    if (!part) return "";
    if (/^ca$/i.test(part)) return "CA";
    if (/^[a-z]$/i.test(part)) return part.toUpperCase();
    if (/^[a-z]{2}$/i.test(part) && part === part.toUpperCase()) return part.toUpperCase();
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join(" ");
}

function userAccount(name, email, role, password, id = "", source = "team-login") {
  const cleanEmail = String(email || "").trim().toLowerCase();
  return {
    id: id || `user-${cleanEmail.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`,
    name: properCaseName(name),
    email: cleanEmail,
    role,
    password,
    source,
  };
}

function staffUser(name) {
  const emailName = name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
  return {
    id: `staff-${emailName}`,
    name,
    email: `${emailName}@mandaca.in`,
    role: "Staff",
    password: "Password@123",
  };
}

let state = loadState();
let editingId = null;
let activePage = "dashboard";
let filterTimer = null;
let remoteSaveTimer = null;
let lastRemoteSaveSnapshot = "";
let lastCentralRefreshAt = 0;
let lastCentralVersion = "";
let lastCentralVersionCheckAt = 0;
let chatSendInFlight = false;
let chatSearchTimer = null;
const chatUiState = {
  targetType: "group",
  recipientId: "team",
  filter: "all",
  search: "",
  newChatOpen: false,
  newChatMode: "private",
  groupName: "",
  groupMembers: [],
};
const accessRestoreEmails = new Set();
let syncChannel = null;
try {
  syncChannel = new BroadcastChannel(`${STORAGE_KEY}-channel`);
  syncChannel.onmessage = () => {
    if (isSupabaseMode()) refreshCentralState();
    else syncSharedState(localStorage.getItem(STORAGE_KEY), true);
  };
} catch {
  syncChannel = null;
}
restoreActivePage();
saveState();
startAutoBackupScheduler();

window.addEventListener("storage", (event) => {
  if (isSupabaseMode()) {
    refreshCentralState();
    return;
  }
  if (event.key === STORAGE_KEY && event.newValue) {
    syncSharedState(event.newValue, true);
  }
  if (event.key === SYNC_EVENT_KEY) {
    syncSharedState(localStorage.getItem(STORAGE_KEY), true);
  }
});

window.addEventListener("focus", () => {
  if (isSupabaseMode()) refreshCentralState({ force: true });
  else syncSharedState(localStorage.getItem(STORAGE_KEY), true);
});

setInterval(() => {
  if (state.session?.loggedIn && isSupabaseMode()) {
    checkCentralStateVersion();
  } else if (state.session?.loggedIn) {
    syncSharedState(localStorage.getItem(STORAGE_KEY), true);
  }
}, 3000);

setInterval(() => {
  if (state.session?.loggedIn && isSupabaseMode() && document.querySelector("#teamChatPanel")?.classList.contains("open")) {
    refreshCentralState({ force: true, preserveDraft: true });
  }
}, 1500);

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return applyTabSession(normalizeState(JSON.parse(saved)));
  return applyTabSession(normalizeState({
    files: seedFiles,
    services: defaultServices,
    careOfList: defaultCareOfList,
    users: staff,
    invites: [],
    revokedAccess: [],
    chatMessages: [],
    chatGroups: [],
    staffDetails: [],
    fileNotifications: [],
    visitors: [],
    expenses: [],
    otherCashCollections: [],
    openingBalances: [],
    otherCashCollectionSources: ["CA Sadique"],
    expenseItems: ["Office Expense", "Travelling", "Printing & Stationery", "Staff Welfare"],
    openingCashBalance: 0,
    dailyQuotes: [],
    dailyQuoteSettings: { enabled: true },
    deletedVisitorIds: [],
    auditLog: [],
    bulkBillingReports: null,
    currentRole: "Admin",
    currentUser: "CA Sadique",
    company: {
      name: "",
      address: "",
    },
    theme: "professional",
    readNotifications: [],
    session: { loggedIn: false },
    filters: {
      search: "",
      client: "",
      pan: "",
      staff: "",
      service: "",
      workflow: "",
      due: "",
      priority: "",
      status: "",
      billing: "",
      overdue: "",
      pendingApproval: "",
      listView: "",
      dashboardKind: "",
      fromDashboard: "",
      reportFrom: "",
      reportTo: "",
      fileFrom: "",
      fileTo: "",
      staffPerformanceFrom: "",
      staffPerformanceTo: "",
      expenseTab: "collections",
      expenseFrom: "",
      expenseTo: "",
      expenseParticulars: "",
      expenseName: "",
      expenseMode: "",
      expensePaidTo: "",
      expenseVoucher: "",
      cashFrom: "",
      cashTo: "",
      cashParticulars: "",
      cashMode: "",
      cashReceivedFrom: "",
      cashVoucher: "",
      balanceFrom: "",
      balanceTo: "",
    },
  }));
}

function normalizeState(appState) {
  const oldToNewStaff = {
    "CA": "CA Sadique",
    "Chindu Raveendran": "Chindu",
    "Abhinandana K Madhu": "Abhinandana",
    "Althaf M K": "Althaf",
    "Anusree KV": "Anusree",
    "Naveen VV": "Naveen",
    "Rabiyath CK": "Rabiyath",
    "Rasha MP": "Rasha",
    "Rizwana Shirin K A": "Rizwana",
    "Shada PP": "Shada",
    "Shurafa Sameer": "Shurafa",
    "Sidharth V K": "Sidharth",
    "Meera Anand": "CA Sadique",
    "Nikhil Batra": "Sidharth",
    "Riya Sharma": "Nisha",
    "Amit Jain": "Arya",
    "Farah Khan": "Anusree",
    "Office Viewer": "Najmunnisa",
  };
  const shouldResetMasterLists = appState.masterListResetVersion !== MASTER_LIST_RESET_VERSION;
  let savedUsers = (appState.users || []).filter((user) => !isRemovedStaff(user.name));
  if (shouldResetMasterLists) {
    savedUsers = savedUsers.filter((user) => approvedStaffNames.has(String(user.name || "").toLowerCase()));
    appState.invites = (appState.invites || []).filter((invite) => approvedStaffNames.has(String(invite.name || "").toLowerCase()));
    appState.services = defaultServices;
    appState.careOfList = defaultCareOfList;
    appState.masterListResetVersion = MASTER_LIST_RESET_VERSION;
  }
  const mergedUsers = [...staff];
  savedUsers.forEach((saved) => {
    const existing = mergedUsers.find((user) => user.name === saved.name || user.email === saved.email);
    if (existing) {
      existing.email = saved.email || existing.email;
      existing.role = saved.role === "Viewer" ? "Guest" : (saved.role || existing.role);
      existing.password = saved.password || existing.password || "Password@123";
    } else {
      mergedUsers.push({
        ...saved,
        id: saved.id || crypto.randomUUID(),
        role: saved.role === "Viewer" ? "Guest" : (saved.role || "Staff"),
        password: saved.password || "Password@123",
      });
    }
  });
  mergedUsers.forEach((user) => {
    user.name = oldToNewStaff[user.name] || user.name;
  });
  const oldAdmin = mergedUsers.find((user) => user.name === "CA");
  if (oldAdmin) oldAdmin.name = "CA Sadique";
  const adminUser = mergedUsers.find((user) => user.name === "CA Sadique") || mergedUsers[0];
  adminUser.email = "casadique@gmail.com";
  adminUser.password = "Casadique@233487";
  adminUser.role = "Admin";
  const chinduUser = mergedUsers.find((user) =>
    user.name === "Chindu" ||
    user.name === "Chindu Raveendran" ||
    normalizeEmail(user.email) === "craveendran06@gmail.com"
  );
  if (chinduUser) {
    chinduUser.name = "Chindu";
    chinduUser.email = "craveendran06@gmail.com";
    chinduUser.role = "Manager";
    chinduUser.password = "Chindu#357";
  } else {
    mergedUsers.push(userAccount("Chindu", "craveendran06@gmail.com", "Manager", "Chindu#357"));
  }
  staff.forEach((masterUser) => {
    const existing = mergedUsers.find((user) =>
      normalizeEmail(user.email) === normalizeEmail(masterUser.email) ||
      sameStaffName(user.name, masterUser.name)
    );
    if (existing) {
      existing.name = masterUser.name;
      existing.email = masterUser.email;
      existing.role = masterUser.role;
      existing.password = masterUser.password;
      existing.id = existing.id || masterUser.id;
      existing.source = existing.source || masterUser.source;
    } else {
      mergedUsers.push({ ...masterUser });
    }
  });
  for (let i = mergedUsers.length - 1; i >= 0; i -= 1) {
    if (isRemovedStaff(mergedUsers[i].name)) mergedUsers.splice(i, 1);
  }
  appState.users = sortByName(mergedUsers.map((user) => ({ ...user, name: properCaseName(user.name) })));
  restoreMasterTeamUsers(appState);
  appState.services = sortList([...(appState.services || []), ...defaultServices]);
  appState.careOfList = sortList([...(appState.careOfList || []), ...defaultCareOfList]);
  appState.currentUser = properCaseName(oldToNewStaff[appState.currentUser] || appState.currentUser || "CA Sadique");
  if (!appState.users.some((user) => user.name === appState.currentUser)) appState.currentUser = "CA Sadique";
  if (appState.currentRole === "Viewer") appState.currentRole = "Guest";
  appState.currentRole = appState.currentRole || "Admin";
  appState.company = {
    name: appState.company?.name || "",
    address: appState.company?.address || "",
  };
  const dailyQuoteSettings = appState.dailyQuoteSettings || {};
  appState.dailyQuotes = Array.isArray(appState.dailyQuotes) ? appState.dailyQuotes : [];
  appState.dailyQuoteSettings = {
    ...dailyQuoteSettings,
    enabled: dailyQuoteSettings.enabled !== false,
  };
  appState.theme = "professional";
  appState.revokedAccess = appState.revokedAccess || [];
  appState.deletedFileIds = [...new Set(appState.deletedFileIds || [])];
  appState.deletedVisitorIds = [...new Set(appState.deletedVisitorIds || [])];
  const deletedVisitorIds = new Set(appState.deletedVisitorIds || []);
  appState.visitors = (appState.visitors || [])
    .filter((visitor) => visitor?.id && !deletedVisitorIds.has(visitor.id))
    .map((visitor) => ({
      ...visitor,
      date: normalizeImportDate(visitor.date || visitor.visit_date) || indiaTodayDate(),
      visitTime: visitor.visitTime || visitor.visit_time || "",
      visitorName: visitor.visitorName || visitor.visitor_name || visitor.name || "",
      mobileNumber: visitor.mobileNumber || visitor.mobile_number || "",
      company: visitor.company || visitor.company_or_organisation || "",
      purpose: visitor.purpose || "",
      metWhom: visitor.metWhom || visitor.met_whom || "",
      remarks: visitor.remarks || visitor.followUp || visitor.followup || visitor.Followup || visitor["Follow-up"] || "",
      followUp: visitor.followUp || visitor.remarks || visitor.followup || visitor.Followup || visitor["Follow-up"] || "",
      enteredBy: visitor.enteredBy || visitor.entered_by_user_name || appState.currentUser || "CA Sadique",
      createdAt: visitor.createdAt || visitor.created_at || Date.now(),
      updatedAt: visitor.updatedAt || visitor.updated_at || Date.now(),
    }))
    .sort(visitorNewestFirst);
  const revokedEmails = new Set((appState.revokedAccess || []).map((item) => String(item.email || item).toLowerCase()));
  const revokedIds = new Set((appState.revokedAccess || []).map((item) => String(item.id || "").toLowerCase()).filter(Boolean));
  for (let i = mergedUsers.length - 1; i >= 0; i -= 1) {
    const user = mergedUsers[i];
    if (revokedEmails.has(String(user.email || "").toLowerCase()) || revokedIds.has(String(user.id || "").toLowerCase())) {
      mergedUsers.splice(i, 1);
    }
  }
  const seenUsers = new Set();
  const uniqueUsers = [];
  mergedUsers.forEach((user) => {
    const key = normalizeEmail(user.email) || normalizePersonName(user.name);
    if (!key || seenUsers.has(key)) return;
    seenUsers.add(key);
    uniqueUsers.push(user);
  });
  mergedUsers.splice(0, mergedUsers.length, ...uniqueUsers);
  appState.users = sortByName(mergedUsers.map((user) => ({ ...user, name: properCaseName(user.name) })));
  restoreMasterTeamUsers(appState);
  appState.readNotifications = appState.readNotifications || [];
  appState.readChatMessages = appState.readChatMessages || [];
  appState.auditLog = appState.auditLog || [];
  appState.correctionHistory = appState.correctionHistory || [];
  appState.expenses = (appState.expenses || []).map((item) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    date: normalizeImportDate(item.date) || todayDate(),
    particulars: item.particulars || item.expenseItem || "",
    voucherNo: item.voucherNo || item.voucher || "",
    amount: Number(item.amount || 0) || 0,
    mode: item.mode || "Cash",
    paidTo: item.paidTo || "",
    remarks: item.remarks || "",
    attachmentName: item.attachmentName || "",
    createdAt: item.createdAt || item.created_at || Date.now(),
    updatedAt: item.updatedAt || item.updated_at || Date.now(),
  })).sort(financeNewestFirst);
  appState.otherCashCollections = (appState.otherCashCollections || []).map((item) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    date: normalizeImportDate(item.date) || todayDate(),
    particulars: item.particulars || "",
    voucherNo: item.voucherNo || item.referenceNo || "",
    amount: Number(item.amount || 0) || 0,
    mode: item.mode || "Cash",
    collectionType: normalizeCollectionType(item.collectionType || item.collection_type),
    collection_type: normalizeCollectionType(item.collectionType || item.collection_type),
    receivedFrom: properCaseName(item.receivedFrom || ""),
    remarks: item.remarks || "",
    attachmentName: item.attachmentName || "",
    createdAt: item.createdAt || item.created_at || Date.now(),
    updatedAt: item.updatedAt || item.updated_at || Date.now(),
  })).sort(financeNewestFirst);
  const staffSourceNames = new Set((appState.users || []).map((user) => normalizePersonName(user.name)).filter(Boolean));
  appState.otherCashCollectionSources = sortList([
    "CA Sadique",
    ...(appState.otherCashCollectionSources || []),
    ...(appState.otherCashCollections || []).map((item) => item.receivedFrom),
  ].map(properCaseName).filter((name) => name === "CA Sadique" || !staffSourceNames.has(normalizePersonName(name))));
  appState.openingBalances = (appState.openingBalances || []).map((item) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    particulars: item.particulars || "",
    date: normalizeImportDate(item.date) || todayDate(),
    amount: Number(item.amount || 0) || 0,
    createdAt: Number(item.createdAt || 0) || Date.now(),
  }));
  appState.expenseItems = sortList([...(appState.expenseItems || []), "Office Expense", "Travelling", "Printing & Stationery", "Staff Welfare"]);
  appState.openingCashBalance = Number(appState.openingCashBalance || 0) || 0;
  appState.bulkBillingReports = appState.bulkBillingReports || null;
  appState.bulkFeeReceivedReports = appState.bulkFeeReceivedReports || null;
  appState.fileNotifications = (appState.fileNotifications || []).map((item) => ({
    ...item,
    targetUserId: item.targetUserId || "",
    targetUserEmail: item.targetUserEmail || "",
    targetUserName: item.targetUserName || "",
  }));
  appState.chatGroups = (appState.chatGroups || []).map((group) => ({
    ...group,
    id: group.id || `group-${crypto.randomUUID()}`,
    name: group.name || "Group Chat",
    memberIds: Array.isArray(group.memberIds) ? group.memberIds : [],
  }));
  appState.staffDetails = normalizeStaffDetails(appState.staffDetails || [], mergedUsers);
  appState.chatMessages = (appState.chatMessages || []).map((message) => {
    const sender = findUserByStaffIdentity(message.userId, mergedUsers)
      || findUserByStaffIdentity(message.userEmail, mergedUsers)
      || findUserByStaffIdentity(message.user, mergedUsers);
    const target = findUserByStaffIdentity(message.targetUserId, mergedUsers)
      || findUserByStaffIdentity(message.targetUserEmail, mergedUsers)
      || findUserByStaffIdentity(message.targetUserName, mergedUsers);
    return {
      ...message,
      targetType: message.targetType || "group",
      attachments: message.attachments || [],
      userId: message.userId || sender?.id || "",
      user: message.user || sender?.name || "Team Member",
      userEmail: message.userEmail || sender?.email || "",
      targetUserId: message.targetUserId || target?.id || "",
      targetUserName: message.targetUserName || target?.name || "",
      targetUserEmail: message.targetUserEmail || target?.email || "",
      groupId: message.groupId || message.group_id || "team",
      groupName: message.groupName || message.group_name || "Team Chat",
    };
  });
  appState.session = appState.session || { loggedIn: false };
  appState.filters = {
    ...(appState.filters || {}),
    staffPerformanceFrom: appState.filters?.staffPerformanceFrom || "",
    staffPerformanceTo: appState.filters?.staffPerformanceTo || "",
    expenseTab: appState.filters?.expenseTab || "collections",
    expenseFrom: appState.filters?.expenseFrom || "",
    expenseTo: appState.filters?.expenseTo || "",
    expenseParticulars: appState.filters?.expenseParticulars || "",
    expenseName: appState.filters?.expenseName || "",
    expenseMode: appState.filters?.expenseMode || "",
    expensePaidTo: appState.filters?.expensePaidTo || "",
    expenseVoucher: appState.filters?.expenseVoucher || "",
    cashFrom: appState.filters?.cashFrom || "",
    cashTo: appState.filters?.cashTo || "",
    cashParticulars: appState.filters?.cashParticulars || "",
    cashMode: appState.filters?.cashMode || "",
    cashReceivedFrom: appState.filters?.cashReceivedFrom || "",
    cashVoucher: appState.filters?.cashVoucher || "",
    balanceFrom: appState.filters?.balanceFrom || "",
    balanceTo: appState.filters?.balanceTo || "",
  };
  if (appState.fileDataResetVersion !== FILE_DATA_RESET_VERSION) {
    appState.files = [];
    appState.fileDataResetVersion = FILE_DATA_RESET_VERSION;
  }
  if (appState.activeFileDataResetVersion !== ACTIVE_FILE_DATA_RESET_VERSION) {
    const activeFiles = (appState.files || []).filter(isActiveFileRecord);
    const activeFileIds = activeFiles.map((file) => file.id).filter(Boolean);
    appState.deletedFileIds = [...new Set([...(appState.deletedFileIds || []), ...activeFileIds])];
    appState.files = (appState.files || []).filter((file) => !isActiveFileRecord(file));
    appState.activeFileDataResetVersion = ACTIVE_FILE_DATA_RESET_VERSION;
  }
  const deletedFileIds = new Set(appState.deletedFileIds || []);
  const shouldMarkCompletedChecked = false;
  appState.files = (appState.files || seedFiles)
    .filter((file) => !deletedFileIds.has(file.id))
    .filter((file) => !dummyFileNames.has(String(file.name || "").trim().toLowerCase()))
    .map((file, index) => {
    const rawAssignedStaff = oldToNewStaff[file.assignedStaff] || file.assignedStaff || staff[index % staff.length].name;
    const rawReAssignedStaff = oldToNewStaff[file.reAssignedStaff] || file.reAssignedStaff || "";
    const assignedStaff = isRemovedStaff(rawAssignedStaff) ? "Not Assigned" : canonicalStaffName(rawAssignedStaff, "Not Assigned", mergedUsers);
    const reAssignedStaff = isRemovedStaff(rawReAssignedStaff) ? "" : canonicalStaffName(rawReAssignedStaff, "", mergedUsers);
    const assignedUser = findUserByStaffIdentity(assignedStaff, mergedUsers) || {};
    const reAssignedUser = findUserByStaffIdentity(reAssignedStaff, mergedUsers) || {};
    const normalizedStages = normalizeStages(file);
    const shouldSetChecked = shouldMarkCompletedChecked && (file.filed || normalizedStages.Completed);
    const fileReceivedDate = normalizeImportDate(file.fileReceivedDate);
    const workAllotmentDate = normalizeImportDate(file.workAllotmentDate) || fileReceivedDate;
    const workStartedDate = normalizeImportDate(file.workStartedDate);
    const reAssignedDate = normalizeImportDate(file.reAssignedDate);
    const dueDate = normalizeImportDate(file.dueDate);
    const billedDate = normalizeImportDate(file.billedDate);
    const feeReceivedDate = normalizeImportDate(file.feeReceivedDate);
    const checkedDate = normalizeImportDate(file.checkedDate);
    const lastUpdatedDate = normalizeImportDate(file.lastUpdatedDate);
    return {
      ...file,
      careOf: file.careOf || "Direct",
      fy: file.fy || file.financialYear || "NA",
      mode: modes.includes(file.mode) ? file.mode : "Whatsapp",
      fileReceivedDate,
      assignedStaff,
      assignedStaffId: assignedUser.id || "",
      assignedStaffEmail: assignedUser.email || "",
      workAllotmentDate,
      workStartedDate,
      reAssignedStaff,
      reAssignedStaffId: reAssignedUser.id || "",
      reAssignedStaffEmail: reAssignedUser.email || "",
      reAssignedDate,
      dueDate,
      billed: Boolean(file.billed),
      billedDate,
      billingType: ["Billable", "Non-Billable"].includes(file.billingType) ? file.billingType : "",
      feeReceived: Boolean(file.feeReceived),
      feeReceivedDate,
      feeReceivedAmount: file.feeReceivedAmount || "",
      receivedBy: properCaseName(file.receivedBy || ""),
      receivedById: file.receivedById || "",
      receivedByEmail: file.receivedByEmail || "",
      allottedBy: properCaseName(file.allottedBy || ""),
      allottedById: file.allottedById || "",
      allottedByEmail: file.allottedByEmail || "",
      previousAllottedTo: properCaseName(file.previousAllottedTo || ""),
      completionDate: normalizeImportDate(file.completionDate) || (file.filed || normalizedStages.Completed ? (normalizeImportDate(file.completedDate) || normalizeImportDate(file.lastUpdatedDate) || "") : ""),
      workDoneBy: properCaseName(file.workDoneBy || ""),
      workDoneById: file.workDoneById || "",
      workDoneByEmail: file.workDoneByEmail || "",
      completedBy: properCaseName(file.completedBy || ""),
      completedById: file.completedById || "",
      completedByEmail: file.completedByEmail || "",
      checkedBy: shouldSetChecked ? "Chindu" : properCaseName(oldToNewStaff[file.checkedBy] || file.checkedBy || ""),
      checkedDate: shouldSetChecked ? "2026-07-14" : checkedDate,
      checkingRemarks: file.checkingRemarks || "",
      correctionRemarks: file.correctionRemarks || "",
      returnedBy: file.returnedBy || "",
      returnedDate: normalizeImportDate(file.returnedDate),
      lastUpdatedDate: lastUpdatedDate || file.lastUpdatedDate || "",
      updatedAt: file.updatedAt || Date.parse(lastUpdatedDate || file.lastUpdatedDate || "") || 0,
      stages: normalizedStages,
    };
  });
  if (shouldMarkCompletedChecked) appState.completedFilesCheckedVersion = COMPLETED_FILES_CHECKED_VERSION;
  appState.invites = (appState.invites || [])
    .filter((invite) => !["karan@example.com", "pooja@example.com"].includes((invite.email || "").toLowerCase()))
    .filter((invite) => !isRemovedStaff(invite.name))
    .filter((invite) => !revokedEmails.has((invite.email || "").toLowerCase()))
    .map((invite) => ({
      ...invite,
      role: invite.role === "Viewer" ? "Guest" : invite.role,
    }));
  ensureInviteRecord(appState.invites, mergedUsers.find((user) => user.email.toLowerCase() === "craveendran06@gmail.com"));
  ensureInviteRecord(appState.invites, mergedUsers.find((user) => user.email.toLowerCase() === "pvnajmunnisa123@gmail.com"));
  appState.filters = {
    search: "",
    client: "",
    pan: "",
    staff: "",
    service: "",
    careOfFilter: "",
    workflow: "",
    due: "",
    receivedSort: "Newest First",
    priority: "",
    status: "",
    billing: "",
    overdue: "",
    pendingApproval: "",
    listView: "",
    dashboardKind: "",
    fromDashboard: "",
    reportFrom: "",
    reportTo: "",
    fileFrom: "",
    fileTo: "",
    staffFileName: "",
    staffCareOf: "",
    staffAllottedDate: "",
    staffDueDate: "",
    staffPriority: "",
    visitorDate: "",
    visitorFrom: "",
    visitorTo: "",
    visitorName: "",
    visitorPurpose: "",
      visitorMetWhom: "",
      checkingStatus: "",
      dailyReportDate: todayDate(),
    ...(appState.filters || {}),
  };
  appState.files = sortFilesNewestFirst(appState.files || []);
  appState.chatMessages = sortChatMessages(appState.chatMessages || []).slice(-1000);
  appState.correctionHistory = sortCorrectionHistory(appState.correctionHistory || []);
  cleanDropdownMasterData(appState);
  return refreshFileStaffLinks(appState);
}

function cleanDropdownMasterData(appState = state) {
  const before = {
    services: [...(appState.services || [])],
    careOfList: [...(appState.careOfList || [])],
  };
  const usedServices = dedupeByNormalizedText((appState.files || []).map((file) => file.serviceType));
  const usedCareOf = dedupeByNormalizedText((appState.files || []).map((file) => file.careOf || "Direct"));
  appState.services = usedServices.length ? usedServices : dedupeByNormalizedText(appState.services || defaultServices);
  appState.careOfList = usedCareOf.length ? usedCareOf : dedupeByNormalizedText(appState.careOfList || defaultCareOfList);
  if (JSON.stringify(before.services) !== JSON.stringify(appState.services) || JSON.stringify(before.careOfList) !== JSON.stringify(appState.careOfList)) {
    appState.auditLog = [
      ...(appState.auditLog || []),
      {
        id: crypto.randomUUID(),
        action: "Dropdown cleanup performed",
        details: {
          servicesBefore: before.services.length,
          servicesAfter: appState.services.length,
          careOfBefore: before.careOfList.length,
          careOfAfter: appState.careOfList.length,
          actionTaken: "Unused and duplicate Service Type/C/o dropdown entries removed from master lists only; file records preserved.",
        },
        user: appState.currentUser || "System",
        role: appState.currentRole || "",
        at: new Date().toISOString(),
      },
    ].slice(-1000);
  }
}

function saveState(options = {}) {
  if (!options.skipMerge) mergeLatestSharedStateBeforeSave();
  refreshFileStaffLinks();
  saveTabSession();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sharedStateForStorage(state)));
  localStorage.setItem(SYNC_EVENT_KEY, String(Date.now()));
  if (options.fullRemote && !options.skipRemote) saveStateToApi();
  if (syncChannel) syncChannel.postMessage({ type: "state-updated", at: Date.now() });
}

function saveViewState() {
  saveTabSession();
}

function apiToken() {
  return sessionStorage.getItem(API_TOKEN_KEY) || "";
}

function setApiToken(token) {
  if (token) sessionStorage.setItem(API_TOKEN_KEY, token);
  else sessionStorage.removeItem(API_TOKEN_KEY);
}

function setApiSession(session) {
  setApiToken(session?.access_token || "");
  if (session?.refresh_token) sessionStorage.setItem(API_REFRESH_TOKEN_KEY, session.refresh_token);
  else sessionStorage.removeItem(API_REFRESH_TOKEN_KEY);
}

function isSupabaseMode() {
  return sessionStorage.getItem(API_MODE_KEY) === "supabase" && Boolean(apiToken());
}

function allowLocalLoginFallback() {
  const host = location.hostname;
  return location.protocol === "file:" || host === "localhost" || host === "127.0.0.1";
}

async function apiJson(path, options = {}) {
  return backendApiJson(path, options);
}

async function backendApiJson(path, options = {}) {
  const { skipAuthRefresh = false, ...requestOptions } = options;
  const headers = {
    "Content-Type": "application/json",
    ...(requestOptions.headers || {}),
  };
  const token = apiToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(path, {
    ...requestOptions,
    headers,
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 && path !== "/api/auth/login" && path !== "/api/auth/refresh" && !skipAuthRefresh) {
    const refreshed = await refreshApiSession();
    if (refreshed) return backendApiJson(path, { ...options, skipAuthRefresh: true });
  }
  if (!response.ok) throw new Error(payload.error || "Server request failed.");
  return payload;
}

async function refreshApiSession() {
  const refreshToken = sessionStorage.getItem(API_REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;
  try {
    const payload = await backendApiJson("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      skipAuthRefresh: true,
    });
    if (!payload.session?.access_token) return false;
    setApiSession(payload.session);
    sessionStorage.setItem(API_MODE_KEY, "supabase");
    return true;
  } catch (error) {
    console.warn("Session refresh failed", error);
    setApiSession(null);
    sessionStorage.removeItem(API_MODE_KEY);
    return false;
  }
}

async function saveStateToApi() {
  if (!isSupabaseMode()) return;
  const shared = sharedStateForStorage(state);
  const snapshot = JSON.stringify(shared);
  if (snapshot === lastRemoteSaveSnapshot) return;
  clearTimeout(remoteSaveTimer);
  remoteSaveTimer = setTimeout(async () => {
    try {
      await apiJson("/api/state", {
        method: "PUT",
        body: JSON.stringify({ state: shared }),
      });
      lastRemoteSaveSnapshot = snapshot;
    } catch (error) {
      console.warn("Central database save failed", error);
    }
  }, 700);
}

async function saveFileToApi(file) {
  if (!isSupabaseMode() || !file?.id) return;
  try {
    return await apiJson(`/api/files/${encodeURIComponent(file.id)}`, {
      method: "PUT",
      body: JSON.stringify({ file }),
    });
  } catch (error) {
    console.warn("Central file save failed", error);
    throw error;
  }
}

async function deleteFileFromApi(fileId) {
  if (!isSupabaseMode() || !fileId) return;
  return apiJson(`/api/files/${encodeURIComponent(fileId)}`, { method: "DELETE" });
}

async function syncFileRecordToApi(file) {
  const result = await saveFileToApi(file);
  if (result?.file) {
    const existingIndex = (state.files || []).findIndex((item) => item.id === result.file.id);
    state.files = existingIndex >= 0
      ? state.files.map((item) => (item.id === result.file.id ? { ...item, ...result.file } : item))
      : [result.file, ...(state.files || [])];
  } else if (result?.files) {
    state.files = result.files;
  }
  if (result?.fileNotifications) state.fileNotifications = result.fileNotifications;
  saveState({ skipMerge: true, skipRemote: true });
  return result;
}

async function syncFileDeleteToApi(fileId) {
  const result = await deleteFileFromApi(fileId);
  if (result?.files) state.files = result.files;
  saveState({ skipMerge: true, skipRemote: true });
  return result;
}

async function saveExpenseToApi(expense) {
  const result = await apiJson("/api/finance/expenses", {
    method: "POST",
    body: JSON.stringify({ expense }),
  });
  if (result?.expenses) state.expenses = result.expenses;
  saveState({ skipMerge: true, skipRemote: true });
  return result;
}

async function deleteExpenseFromApi(id) {
  const result = await apiJson(`/api/finance/expenses/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (result?.expenses) state.expenses = result.expenses;
  saveState({ skipMerge: true, skipRemote: true });
  return result;
}

async function saveCashCollectionToApi(collection) {
  const result = await apiJson("/api/finance/collections", {
    method: "POST",
    body: JSON.stringify({ collection }),
  });
  if (result?.otherCashCollections) state.otherCashCollections = result.otherCashCollections;
  if (result?.otherCashCollectionSources) state.otherCashCollectionSources = result.otherCashCollectionSources;
  saveState({ skipMerge: true, skipRemote: true });
  return result;
}

async function deleteCashCollectionFromApi(id) {
  const result = await apiJson(`/api/finance/collections/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (result?.otherCashCollections) state.otherCashCollections = result.otherCashCollections;
  saveState({ skipMerge: true, skipRemote: true });
  return result;
}

async function saveOpeningBalanceToApi(openingBalance) {
  const result = await apiJson("/api/finance/opening-balances", {
    method: "POST",
    body: JSON.stringify({ openingBalance }),
  });
  if (result?.openingBalances) state.openingBalances = result.openingBalances;
  saveState({ skipMerge: true, skipRemote: true });
  return result;
}

async function deleteOpeningBalanceFromApi(id) {
  const result = await apiJson(`/api/finance/opening-balances/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (result?.openingBalances) state.openingBalances = result.openingBalances;
  saveState({ skipMerge: true, skipRemote: true });
  return result;
}

async function saveVisitorsToApi(visitors) {
  const result = await apiJson("/api/visitors", {
    method: "POST",
    body: JSON.stringify({ visitors }),
  });
  if (result?.visitors) state.visitors = result.visitors;
  saveState({ skipMerge: true, skipRemote: true });
  return result;
}

async function deleteVisitorFromApi(id) {
  const result = await apiJson(`/api/visitors/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (result?.visitors) state.visitors = result.visitors;
  saveState({ skipMerge: true, skipRemote: true });
  return result;
}

async function loadStateFromApi() {
  if (!apiToken()) return false;
  try {
    const payload = await apiJson("/api/state");
    if (!payload.state) return false;
    lastCentralVersion = payload.updatedAt || lastCentralVersion;
    applyCentralState(payload.state, { targetPage: activePage || "dashboard", rerender: true });
    sessionStorage.setItem(API_MODE_KEY, "supabase");
    return true;
  } catch (error) {
    console.warn("Central database load failed", error);
    return false;
  }
}

async function refreshCentralState(options = {}) {
  if (!state.session?.loggedIn || !isSupabaseMode()) return false;
  if (!options.force && Date.now() - lastCentralRefreshAt < 12000) return false;
  if (!options.force && document.hidden) return false;
  if (document.querySelector("#fileDrawer")?.classList.contains("open")) return false;
  lastCentralRefreshAt = Date.now();
  try {
    const payload = await apiJson("/api/state");
    if (!payload.state) return false;
    lastCentralVersion = payload.updatedAt || lastCentralVersion;
    const chatOpen = options.preserveDraft && document.querySelector("#teamChatPanel")?.classList.contains("open");
    applyCentralState(payload.state, { rerender: !chatOpen });
    if (chatOpen) {
      refreshOpenChatFromState();
    }
    return true;
  } catch (error) {
    console.warn("Central refresh failed", error);
    return false;
  }
}

async function checkCentralStateVersion() {
  if (!state.session?.loggedIn || !isSupabaseMode()) return false;
  if (document.hidden) return false;
  if (document.querySelector("#fileDrawer")?.classList.contains("open")) return false;
  if (Date.now() - lastCentralVersionCheckAt < 5000) return false;
  lastCentralVersionCheckAt = Date.now();
  try {
    const payload = await apiJson("/api/state/version");
    if (!payload.updatedAt) return false;
    if (!lastCentralVersion) {
      lastCentralVersion = payload.updatedAt;
      return false;
    }
    if (payload.updatedAt !== lastCentralVersion) {
      return refreshCentralState({ force: true });
    }
    return false;
  } catch (error) {
    console.warn("Central version check failed", error);
    return false;
  }
}

function applyCentralState(incomingState, options = {}) {
  const currentSession = {
    session: state.session,
    currentUser: state.currentUser,
    currentRole: state.currentRole,
    filters: state.filters,
    readNotifications: state.readNotifications,
    readChatMessages: state.readChatMessages,
  };
  state = {
    ...normalizeState(incomingState),
    ...currentSession,
    filters: currentSession.filters,
    readNotifications: currentSession.readNotifications,
    readChatMessages: currentSession.readChatMessages,
  };
  if (options.targetPage) activePage = options.targetPage;
  saveState({ skipMerge: true, skipRemote: true });
  if (!options.rerender) return;
  if (document.querySelector(".app-shell")) renderAll();
  else mount();
}

function saveAccessState() {
  restoreEssentialTeamUsers(state);
  state.revokedAccess = mergeRevokedAccess([], state.revokedAccess || []);
  state.users = mergeUsers([], state.users || [], state.revokedAccess);
  state.invites = mergeInvitesByEmail(state.invites || []).filter((invite) => !isRevokedAccess(invite, state.revokedAccess));
  saveState({ skipMerge: true });
}

function mergeLatestSharedStateBeforeSave() {
  if (isSupabaseMode()) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const latest = normalizeState(JSON.parse(raw));
    state.deletedFileIds = [...new Set([...(latest.deletedFileIds || []), ...(state.deletedFileIds || [])])];
    state.deletedVisitorIds = [...new Set([...(latest.deletedVisitorIds || []), ...(state.deletedVisitorIds || [])])];
    const deleted = new Set(state.deletedFileIds || []);
    const deletedVisitors = new Set(state.deletedVisitorIds || []);
    state.files = mergeFilesByLatestChange(
      (latest.files || []).filter((file) => !deleted.has(file.id)),
      (state.files || []).filter((file) => !deleted.has(file.id)),
    );
    state.visitors = mergeVisitorsByLatestChange(
      (latest.visitors || []).filter((visitor) => !deletedVisitors.has(visitor.id)),
      (state.visitors || []).filter((visitor) => !deletedVisitors.has(visitor.id)),
    );
    state.chatMessages = mergeById(latest.chatMessages || [], state.chatMessages || []).slice(-300);
    state.staffDetails = mergeStaffDetailsByLatestChange(latest.staffDetails || [], state.staffDetails || []);
    state.fileNotifications = mergeById(latest.fileNotifications || [], state.fileNotifications || []).slice(-500);
    state.auditLog = mergeById(latest.auditLog || [], state.auditLog || []).slice(-1000);
    state.revokedAccess = mergeRevokedAccess(latest.revokedAccess || [], state.revokedAccess || []);
    state.users = mergeUsers(latest.users || [], state.users || [], state.revokedAccess);
    restoreEssentialTeamUsers(state);
    state.invites = mergeInvitesByEmail([...(latest.invites || []), ...(state.invites || [])]).filter((invite) => !isRevokedAccess(invite, state.revokedAccess));
    state.services = sortList([...(latest.services || []), ...(state.services || [])]);
    state.careOfList = sortList([...(latest.careOfList || []), ...(state.careOfList || [])]);
    state.company = { ...(latest.company || {}), ...(state.company || {}) };
  } catch {
    // If stored data cannot be read, continue with the current tab state.
  }
}

function mergeById(existingRows, currentRows) {
  const map = new Map();
  existingRows.forEach((row) => map.set(row.id || crypto.randomUUID(), row));
  currentRows.forEach((row) => map.set(row.id || crypto.randomUUID(), row));
  return [...map.values()];
}

function mergeInvitesByEmail(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    const key = normalizeEmail(row.email) || row.id || crypto.randomUUID();
    map.set(key, { ...(map.get(key) || {}), ...row, email: normalizeEmail(row.email) });
  });
  return [...map.values()];
}

function mergeRevokedAccess(existingRows, currentRows) {
  const map = new Map();
  [...existingRows, ...currentRows].forEach((row) => {
    const key = String(row.email || row.id || row || crypto.randomUUID()).toLowerCase();
    map.set(key, typeof row === "string" ? { email: row } : row);
  });
  return [...map.values()].filter((row) => !accessRestoreEmails.has(String(row.email || row || "").toLowerCase()));
}

function isRevokedAccess(item, revokedRows = state.revokedAccess || []) {
  const email = String(item.email || "").toLowerCase();
  const name = normalizePersonName(item.name || item);
  const id = String(item.id || "").toLowerCase();
  if (essentialTeamUserEmails.has(email) || essentialTeamUserNames.has(name)) return false;
  return revokedRows.some((row) =>
    String(row.email || row || "").toLowerCase() === email ||
    (id && String(row.id || "").toLowerCase() === id)
  );
}

function restoreEssentialTeamUsers(appState = state) {
  const essentials = staff.filter((user) =>
    essentialTeamUserEmails.has(normalizeEmail(user.email)) ||
    essentialTeamUserNames.has(normalizePersonName(user.name))
  );
  appState.users = appState.users || [];
  appState.revokedAccess = (appState.revokedAccess || []).filter((item) =>
    !essentialTeamUserEmails.has(normalizeEmail(item.email || item)) &&
    !essentialTeamUserNames.has(normalizePersonName(item.name || item))
  );
  essentials.forEach((masterUser) => {
    const existing = appState.users.find((user) =>
      normalizeEmail(user.email) === normalizeEmail(masterUser.email) ||
      sameStaffName(user.name, masterUser.name)
    );
    if (existing) {
      existing.name = masterUser.name;
      existing.email = masterUser.email;
      existing.role = masterUser.role;
      existing.password = masterUser.password || existing.password;
      existing.id = existing.id || masterUser.id;
      existing.source = existing.source || "team-login";
    } else {
      appState.users.push({ ...masterUser });
    }
  });
  appState.users = sortByName(appState.users.map((user) => ({ ...user, name: properCaseName(user.name) })));
  return appState;
}

function restoreMasterTeamUsers(appState = state) {
  appState.users = appState.users || [];
  staff.forEach((masterUser) => {
    const existing = appState.users.find((user) =>
      normalizeEmail(user.email) === normalizeEmail(masterUser.email) ||
      sameStaffName(user.name, masterUser.name)
    );
    if (existing) {
      existing.name = masterUser.name;
      existing.email = masterUser.email;
      existing.role = masterUser.role;
      existing.password = masterUser.password || existing.password;
      existing.id = existing.id || masterUser.id;
      existing.source = existing.source || "team-login";
    } else {
      appState.users.push({ ...masterUser });
    }
  });
  restoreEssentialTeamUsers(appState);
  return appState;
}

function mergeUsers(existingUsers, currentUsers, revokedRows = []) {
  const map = new Map();
  [...existingUsers, ...currentUsers].forEach((user) => {
    const key = String(user.email || user.id || user.name || crypto.randomUUID()).toLowerCase();
    map.set(key, { ...(map.get(key) || {}), ...user });
  });
  return sortByName([...map.values()].filter((user) => !isRemovedStaff(user.name) && !isRevokedAccess(user, revokedRows)));
}

function fileChangeTime(file) {
  return Number(file.updatedAt || 0) || Date.parse(file.lastUpdatedDate || "") || 0;
}

function mergeFilesByLatestChange(existingFiles, currentFiles) {
  const map = new Map();
  existingFiles.forEach((file) => map.set(file.id, file));
  currentFiles.forEach((file) => {
    const old = map.get(file.id);
    if (!old || fileChangeTime(file) >= fileChangeTime(old)) map.set(file.id, file);
  });
  return [...map.values()].sort((a, b) => fileChangeTime(b) - fileChangeTime(a));
}

function visitorChangeTime(visitor) {
  return Number(visitor.updatedAt || visitor.createdAt || 0) || Date.parse(visitor.date || "") || 0;
}

function mergeVisitorsByLatestChange(existingVisitors, currentVisitors) {
  const map = new Map();
  existingVisitors.forEach((visitor) => map.set(visitor.id, visitor));
  currentVisitors.forEach((visitor) => {
    const old = map.get(visitor.id);
    if (!old || visitorChangeTime(visitor) >= visitorChangeTime(old)) map.set(visitor.id, visitor);
  });
  return [...map.values()].sort((a, b) => visitorSortTime(b) - visitorSortTime(a));
}

function staffDetailChangeTime(row = {}) {
  return Number(row.updatedAt || row.createdAt || 0) || Date.parse(row.updated_at || row.created_at || row.dateOfJoining || "") || 0;
}

function normalizeStaffDetails(rows = [], users = state.users || []) {
  const seen = new Map();
  rows.forEach((row) => {
    if (!row) return;
    const linkedUser = row.linkedUserId ? users.find((user) => sameStaffName(user.id, row.linkedUserId) || sameStaffName(user.authUserId, row.linkedUserId)) : null;
    const normalized = {
      id: row.id || `staff-${crypto.randomUUID()}`,
      linkedUserId: row.linkedUserId || row.linked_user_id || "",
      staffCode: String(row.staffCode || row.staff_code || row.employeeId || row.employee_id || "").trim(),
      staffName: properCaseName(row.staffName || row.staff_name || row.name || linkedUser?.name || ""),
      dateOfJoining: normalizeImportDate(row.dateOfJoining || row.date_of_joining || row.doj) || "",
      dateOfBirth: normalizeImportDate(row.dateOfBirth || row.date_of_birth || row.dob) || "",
      email: normalizeEmail(row.email || linkedUser?.email || ""),
      mobile: String(row.mobile || row.mobileNumber || row.mobile_number || "").trim(),
      position: String(row.position || row.role || linkedUser?.role || "").trim(),
      department: String(row.department || "").trim(),
      reportingManagerId: row.reportingManagerId || row.reporting_manager_id || "",
      branch: String(row.branch || row.office || "").trim(),
      employmentType: row.employmentType || row.employment_type || "",
      employmentStatus: row.employmentStatus || row.employment_status || "Active",
      gender: row.gender || "",
      qualifications: row.qualifications || row.qualification || "",
      address: row.address || "",
      emergencyContactName: row.emergencyContactName || row.emergency_contact_name || "",
      emergencyContactNumber: row.emergencyContactNumber || row.emergency_contact_number || "",
      profilePhotoUrl: row.profilePhotoUrl || row.profile_photo_url || "",
      remarks: row.remarks || "",
      createdByUserId: row.createdByUserId || row.created_by_user_id || "",
      createdByUserName: row.createdByUserName || row.created_by_user_name || "",
      createdAt: Number(row.createdAt || 0) || Date.parse(row.created_at || "") || Date.now(),
      updatedByUserName: row.updatedByUserName || row.updated_by_user_name || "",
      updatedAt: Number(row.updatedAt || 0) || Date.parse(row.updated_at || "") || Date.now(),
      deactivatedAt: row.deactivatedAt || row.deactivated_at || "",
    };
    if (!normalized.staffName) return;
    const key = normalized.id || normalized.linkedUserId || normalized.email || normalized.staffName.toLowerCase();
    const old = seen.get(key);
    if (!old || staffDetailChangeTime(normalized) >= staffDetailChangeTime(old)) seen.set(key, normalized);
  });
  return [...seen.values()].sort((a, b) => staffDetailChangeTime(b) - staffDetailChangeTime(a));
}

function mergeStaffDetailsByLatestChange(existingRows, currentRows) {
  return normalizeStaffDetails([...(existingRows || []), ...(currentRows || [])], state.users || []);
}

function canUseStaffDetails() {
  return ["Admin", "Manager", "Staff Manager", "Staff"].includes(state.currentRole);
}

function canManageStaffDetails() {
  return state.currentRole === "Admin" || rolePerm().roles;
}

function staffDetailsVisibleRows() {
  const rows = normalizeStaffDetails(state.staffDetails || []);
  if (["Admin", "Manager", "Staff Manager"].includes(state.currentRole)) return rows;
  const user = loggedInUser();
  return rows.filter((row) => row.linkedUserId === user?.id || normalizeEmail(row.email) === normalizeEmail(user?.email) || sameStaffName(row.staffName, user?.name));
}

function activeStaffDetails() {
  return staffDetailsVisibleRows().filter((row) => !["Inactive", "Resigned", "Terminated"].includes(row.employmentStatus));
}

function staffDateParts(dateString) {
  const normalized = normalizeImportDate(dateString);
  if (!normalized) return null;
  const [year, month, day] = normalized.split("-").map(Number);
  return { year, month, day };
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function staffEventDateForYear(dateString, year) {
  const parts = staffDateParts(dateString);
  if (!parts) return "";
  const month = parts.month;
  let day = parts.day;
  if (month === 2 && day === 29 && !isLeapYear(year)) day = 28;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function currentIndiaYearMonth() {
  const [year, month] = indiaTodayDate().split("-").map(Number);
  return { year, month };
}

function staffBirthdaysThisMonth() {
  const today = indiaTodayDate();
  const { year, month } = currentIndiaYearMonth();
  return activeStaffDetails()
    .map((row) => ({ ...row, eventDate: staffEventDateForYear(row.dateOfBirth, year) }))
    .filter((row) => row.eventDate && Number(row.eventDate.slice(5, 7)) === month)
    .sort((a, b) => staffCelebrationSort(a.eventDate, b.eventDate, today));
}

function staffAnniversariesThisMonth() {
  const today = indiaTodayDate();
  const { year, month } = currentIndiaYearMonth();
  return activeStaffDetails()
    .map((row) => {
      const eventDate = staffEventDateForYear(row.dateOfJoining, year);
      return { ...row, eventDate, completedYears: staffCompletedYears(row.dateOfJoining, eventDate) };
    })
    .filter((row) => row.eventDate && Number(row.eventDate.slice(5, 7)) === month && row.dateOfJoining <= today && row.completedYears >= 1)
    .sort((a, b) => staffCelebrationSort(a.eventDate, b.eventDate, today));
}

function staffCelebrationSort(a, b, today = indiaTodayDate()) {
  const aPast = a < today ? 1 : 0;
  const bPast = b < today ? 1 : 0;
  if (aPast !== bPast) return aPast - bPast;
  return a.localeCompare(b);
}

function staffCompletedYears(doj, eventDate = indiaTodayDate()) {
  const join = staffDateParts(doj);
  const event = staffDateParts(eventDate);
  if (!join || !event) return 0;
  let years = event.year - join.year;
  const anniversary = staffEventDateForYear(doj, event.year);
  if (eventDate < anniversary) years -= 1;
  return Math.max(years, 0);
}

function staffShortDate(dateString) {
  const normalized = normalizeImportDate(dateString);
  if (!normalized) return "";
  return new Date(`${normalized}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" });
}

function sharedStateForStorage(appState) {
  const {
    session,
    currentUser,
    currentRole,
    filters,
    readNotifications,
    readChatMessages,
    ...shared
  } = appState;
  return sanitizeSharedState(shared);
}

function sanitizeSharedState(shared) {
  return {
    ...shared,
    users: (shared.users || []).map(({ password, ...user }) => user),
    invites: (shared.invites || []).map(({ password, ...invite }) => invite),
  };
}

function backupPayload() {
  const shared = sharedStateForStorage(state);
  return {
    app: "CA File Tracker",
    version: STORAGE_KEY,
    exportedAt: new Date().toISOString(),
    exportedBy: state.currentUser || "",
    backupSummary: backupSummary(shared),
    includedKeys: Object.keys(shared).sort(),
    state: shared,
  };
}

function backupSummary(appState) {
  return {
    files: Array.isArray(appState.files) ? appState.files.length : 0,
    users: Array.isArray(appState.users) ? appState.users.length : 0,
    services: Array.isArray(appState.services) ? appState.services.length : 0,
    careOfList: Array.isArray(appState.careOfList) ? appState.careOfList.length : 0,
    visitors: Array.isArray(appState.visitors) ? appState.visitors.length : 0,
    expenses: Array.isArray(appState.expenses) ? appState.expenses.length : 0,
    otherCashCollections: Array.isArray(appState.otherCashCollections) ? appState.otherCashCollections.length : 0,
    openingBalances: Array.isArray(appState.openingBalances) ? appState.openingBalances.length : 0,
    chatMessages: Array.isArray(appState.chatMessages) ? appState.chatMessages.length : 0,
    fileNotifications: Array.isArray(appState.fileNotifications) ? appState.fileNotifications.length : 0,
    auditLog: Array.isArray(appState.auditLog) ? appState.auditLog.length : 0,
    billedFiles: Array.isArray(appState.files) ? appState.files.filter((file) => file.billed).length : 0,
    completedFiles: Array.isArray(appState.files) ? appState.files.filter((file) => file.filed || file.stages?.Completed).length : 0,
  };
}

function downloadJson(name, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${name}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function restoreSharedData(incomingState, message = "Data restored", options = {}) {
  const currentSession = {
    session: state.session,
    currentUser: state.currentUser,
    currentRole: state.currentRole,
    filters: state.filters,
    readNotifications: state.readNotifications,
    readChatMessages: state.readChatMessages,
  };
  state = {
    ...normalizeState(incomingState),
    ...currentSession,
    filters: currentSession.filters,
    readNotifications: currentSession.readNotifications,
    readChatMessages: currentSession.readChatMessages,
  };
  saveState({ skipMerge: true, skipRemote: Boolean(options.skipRemote), fullRemote: Boolean(options.fullRemote) });
  toast(message);
  mount();
  activePage = options.targetPage || "users";
  renderAll();
}

async function saveBackupToFolder(reason = "manual") {
  if (location.protocol === "file:") throw new Error("Folder backup needs the local server.");
  const payload = { ...backupPayload(), reason };
  const response = await fetch("/api/backup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Backup folder save failed.");
  return result;
}

async function downloadFullBackup() {
  if (!canUseBackupPage()) return toast("Only Admin and Manager can create full backups.");
  const payload = backupPayload();
  const fileName = `ca-file-tracker-backup-${todayDate()}`;
  try {
    const result = await saveBackupToFolder("manual");
    downloadJson(fileName, payload);
    toast(`Backup saved in Backups folder and downloaded: ${result.filename}`);
  } catch (error) {
    downloadJson(fileName, payload);
    toast("Backup downloaded. To save directly in the Backups folder, open the app through the local server.");
  }
}

function istDateTimeParts(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date).reduce((map, part) => {
    map[part.type] = part.value;
    return map;
  }, {});
}

function startAutoBackupScheduler() {
  const runCheck = async () => {
    const parts = istDateTimeParts();
    const istDate = `${parts.year}-${parts.month}-${parts.day}`;
    if (parts.hour !== "23" || parts.minute !== "59") return;
    if (localStorage.getItem(AUTO_BACKUP_DONE_KEY) === istDate) return;
    try {
      await saveBackupToFolder("auto-2359-ist");
      localStorage.setItem(AUTO_BACKUP_DONE_KEY, istDate);
      toast("Daily auto backup saved in Backups folder.");
    } catch {
      // Browser-only mode cannot write into the app folder automatically.
    }
  };
  runCheck();
  setInterval(runCheck, 30000);
}

function handleBackupRestore(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (state.currentRole !== "Admin") return toast("Only Admin can restore backups.");
  if (!confirm("Restore this backup? Current site data in this browser will be replaced.")) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const payload = JSON.parse(String(reader.result || "{}"));
      const incomingState = payload.state || payload;
      if (apiToken() && sessionStorage.getItem(API_MODE_KEY) === "supabase") {
        const result = await apiJson("/api/state/restore", {
          method: "POST",
          body: JSON.stringify({ state: incomingState }),
        });
        restoreSharedData(result.state || incomingState, "Central backup restored", { targetPage: "dashboard", skipRemote: true });
        return;
      }
      restoreSharedData(incomingState, "Backup restored", { targetPage: "dashboard", fullRemote: true });
    } catch (error) {
      toast(error.message || "Backup restore failed. Please choose a valid JSON backup.");
    }
  };
  reader.readAsText(file);
}

async function syncDataToSite() {
  if (state.currentRole !== "Admin") return toast("Only Admin can sync data to the site.");
  const button = document.querySelector("#syncSiteData");
  if (button) button.disabled = true;
  try {
    const result = await apiJson("/api/site-data", {
      method: "POST",
      body: JSON.stringify(backupPayload()),
    });
    toast(`Site data synced (${result.files || 0} file records)`);
  } catch (error) {
    toast(error.message || "Site sync is available only when hosted with the Node server.");
  } finally {
    if (button) button.disabled = false;
  }
}

async function pullDataFromSite() {
  if (state.currentRole !== "Admin") return toast("Only Admin can pull site data.");
  if (!confirm("Pull data from the site? Current browser data will be replaced.")) return;
  const button = document.querySelector("#pullSiteData");
  if (button) button.disabled = true;
  try {
    const payload = await apiJson("/api/site-data");
    restoreSharedData(payload.state || payload, "Site data pulled", { targetPage: "dashboard", skipRemote: true });
  } catch (error) {
    toast(error.message || "Unable to pull site data.");
  } finally {
    if (button) button.disabled = false;
  }
}

async function autoRecoverAdminDataIfEmpty() {
  if ((state.files || []).length) return;
  if (!allowLocalLoginFallback()) return;
  if (location.protocol === "file:") return;
  try {
    const response = await fetch("/api/site-data", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      autoLoadPreparedDataIfEmpty();
      return;
    }
    const incomingState = payload.state || payload;
    if (!(incomingState.files || []).length) {
      autoLoadPreparedDataIfEmpty();
      return;
    }
    restoreSharedData(incomingState, "Site data loaded");
    toast(`Site data loaded (${state.files.length} files)`);
  } catch {
    autoLoadPreparedDataIfEmpty();
  }
}

function autoLoadPreparedDataIfEmpty() {
  if ((state.files || []).length) return false;
  if (!allowLocalLoginFallback()) return false;
  if (!window.PREPARED_IMPORT_CSV) return false;
  try {
    finishImport(parseImportRows(window.PREPARED_IMPORT_CSV), { forceFreshImport: true });
    toast(`Prepared file data loaded (${state.files.length} files)`);
    return true;
  } catch {
    // Keep login usable; Admin can still restore a backup manually.
    return false;
  }
}

function saveTabSession() {
  sessionStorage.setItem(TAB_SESSION_KEY, JSON.stringify({
    session: state.session || { loggedIn: false },
    currentUser: state.currentUser || "",
    currentRole: state.currentRole || "",
    activePage,
    filters: state.filters || {},
    readNotifications: state.readNotifications || [],
    readChatMessages: state.readChatMessages || [],
  }));
}

function tabSession() {
  try {
    return JSON.parse(sessionStorage.getItem(TAB_SESSION_KEY) || "{}");
  } catch {
    return {};
  }
}

function applyTabSession(appState) {
  const local = tabSession();
  if (local.session) appState.session = local.session;
  if (local.currentUser) appState.currentUser = local.currentUser;
  if (local.currentRole) appState.currentRole = local.currentRole;
  if (local.filters) appState.filters = { ...(appState.filters || {}), ...local.filters };
  if (local.readNotifications) appState.readNotifications = local.readNotifications;
  if (local.readChatMessages) appState.readChatMessages = local.readChatMessages;
  return appState;
}

function restoreActivePage() {
  const local = tabSession();
  const allowedPages = ["dashboard", "files", "staff", "staffDetails", "users", "invites", "visitors", "dailyReport", "expenses", "reports", "verification", "backup"];
  if (allowedPages.includes(local.activePage)) activePage = local.activePage;
}

function syncSharedState(raw, rerender = false) {
  if (isSupabaseMode()) return;
  if (!raw) return;
  const previous = sharedSnapshot(state);
  const currentSession = {
    session: state.session,
    currentUser: state.currentUser,
    currentRole: state.currentRole,
    filters: state.filters,
    readNotifications: state.readNotifications,
    readChatMessages: state.readChatMessages,
  };
  const incoming = normalizeState(JSON.parse(raw));
  state = {
    ...incoming,
    ...currentSession,
    filters: currentSession.filters || incoming.filters,
    readNotifications: currentSession.readNotifications || incoming.readNotifications,
    readChatMessages: currentSession.readChatMessages || incoming.readChatMessages,
  };
  saveTabSession();
  const changed = previous !== sharedSnapshot(state);
  if (rerender && changed && state.session?.loggedIn) {
    if (document.querySelector("#teamChatPanel")?.classList.contains("open")) {
      openTeamChat();
    } else {
      renderAll();
    }
  }
}

function sharedSnapshot(appState) {
  return JSON.stringify({
    files: appState.files || [],
    users: appState.users || [],
    invites: appState.invites || [],
    revokedAccess: appState.revokedAccess || [],
    chatMessages: appState.chatMessages || [],
    fileNotifications: appState.fileNotifications || [],
    services: appState.services || [],
    careOfList: appState.careOfList || [],
    deletedFileIds: appState.deletedFileIds || [],
    company: appState.company || {},
    dailyQuotes: appState.dailyQuotes || [],
    dailyQuoteSettings: appState.dailyQuoteSettings || {},
    fileDataResetVersion: appState.fileDataResetVersion || "",
    masterListResetVersion: appState.masterListResetVersion || "",
  });
}

function ensureLoginUser(users, account) {
  const existing = users.find((user) => user.email.toLowerCase() === account.email.toLowerCase());
  if (existing) {
    existing.name = account.name;
    existing.role = account.role;
    existing.password = account.password;
  } else {
    users.push(account);
  }
}

function ensureInviteRecord(invites, user) {
  if (!user || user.email.toLowerCase() === "casadique@gmail.com") return;
  const exists = invites.some((invite) => invite.email.toLowerCase() === user.email.toLowerCase());
  if (!exists) {
    invites.push({
      id: crypto.randomUUID(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: "Accepted",
      sentAt: todayDate(),
    });
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeRole(role) {
  const clean = String(role || "Staff").trim();
  if (clean === "Viewer") return "Guest";
  return ["Admin", "Manager", "Staff Manager", "Staff", "Guest"].includes(clean) ? clean : "Staff";
}

function loginIdentifierMatchesUser(identifier, user) {
  const rawIdentifier = String(identifier || "").trim();
  const cleanEmail = normalizeEmail(rawIdentifier);
  const cleanName = normalizePersonName(rawIdentifier);
  return Boolean(user && (
    (cleanEmail && normalizeEmail(user.email) === cleanEmail) ||
    (cleanName && normalizePersonName(user.name) === cleanName) ||
    (cleanName && sameStaffName(user.name, rawIdentifier))
  ));
}

function upsertInviteForUser(user, password = user?.password || "") {
  if (!user || normalizeEmail(user.email) === "casadique@gmail.com") return;
  const email = normalizeEmail(user.email);
  const existing = state.invites.find((invite) => normalizeEmail(invite.email) === email);
  const inviteData = {
    id: existing?.id || crypto.randomUUID(),
    name: user.name,
    email,
    role: normalizeRole(user.role),
    password: password || user.password || existing?.password || "",
    status: "Accepted",
    source: "team-login",
    sentAt: existing?.sentAt || todayDate(),
  };
  if (existing) Object.assign(existing, inviteData);
  else state.invites.unshift(inviteData);
}

function activeUserList() {
  const invitedEmails = new Set((state.invites || [])
    .filter((invite) => !isRevokedAccess(invite))
    .map((invite) => normalizeEmail(invite.email)));
  return (state.users || [])
    .filter((user) => normalizeEmail(user.email) !== "casadique@gmail.com")
    .filter((user) => invitedEmails.has(normalizeEmail(user.email)) || user.source === "team-login")
    .filter((user) => !isRevokedAccess(user))
    .filter((user, index, list) => list.findIndex((item) => normalizeEmail(item.email) === normalizeEmail(user.email)) === index);
}

function chatRecipientUsers() {
  const uniqueUsers = new Map();
  (state.users || [])
    .filter((user) => user.id !== state.session?.userId)
    .filter((user) => !isRevokedAccess(user))
    .filter((user) => !isRemovedStaff(user.name))
    .forEach((user) => {
      const key = String(user.id || user.authUserId || normalizeEmail(user.email) || user.name || "").trim().toLowerCase();
      if (key && !uniqueUsers.has(key)) uniqueUsers.set(key, user);
    });
  return [...uniqueUsers.values()]
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}

function accessPasswordForUser(user) {
  const email = normalizeEmail(user?.email);
  const invite = (state.invites || []).find((item) => normalizeEmail(item.email) === email);
  return String(user?.password || invite?.password || "");
}

function findUserByStaffIdentity(value, users = state.users) {
  const clean = String(value || "").trim().toLowerCase();
  if (!clean || clean === "not assigned") return null;
  return users.find((user) =>
    String(user.id || "").toLowerCase() === clean ||
    String(user.authUserId || "").toLowerCase() === clean ||
    String(user.email || "").toLowerCase() === clean ||
    String(user.name || "").toLowerCase() === clean ||
    sameStaffName(user.name, value)
  ) || null;
}

function refreshFileStaffLinks(appState = state) {
  const users = appState.users || [];
  appState.files = (appState.files || []).map((file) => {
    const assignedUser = findUserByStaffIdentity(file.assignedStaff, users)
      || findUserByStaffIdentity(file.assignedStaffEmail, users)
      || findUserByStaffIdentity(file.assignedStaffId, users);
    const reAssignedUser = findUserByStaffIdentity(file.reAssignedStaff, users)
      || findUserByStaffIdentity(file.reAssignedStaffEmail, users)
      || findUserByStaffIdentity(file.reAssignedStaffId, users);
    return {
      ...file,
      assignedStaff: assignedUser?.name || properCaseName(file.assignedStaff) || "Not Assigned",
      assignedStaffId: assignedUser?.id || "",
      assignedStaffEmail: assignedUser?.email || "",
      reAssignedStaff: reAssignedUser?.name || properCaseName(file.reAssignedStaff) || "",
      reAssignedStaffId: reAssignedUser?.id || "",
      reAssignedStaffEmail: reAssignedUser?.email || "",
    };
  });
  return appState;
}

function canonicalStaffName(value, fallback = "", users = state.users) {
  if (!hasAssignedStaffValue(value)) return fallback;
  const user = findUserByStaffIdentity(value, users);
  return user?.name || properCaseName(value) || fallback;
}

function teamMemberPickerField() {
  return `
    <div class="field">
      <label>Select Existing Staff</label>
      <select id="inviteExistingUser">
        <option value="">Enter new staff/user</option>
        ${state.users
          .filter((user) => user.email.toLowerCase() !== "casadique@gmail.com")
          .map((user) => `<option value="${user.id}">${escapeHtml(user.name)} - ${escapeHtml(user.role)}</option>`)
          .join("")}
      </select>
    </div>`;
}

function bindTeamMemberPicker() {
  const picker = document.querySelector("#inviteExistingUser");
  if (!picker) return;
  picker.onchange = () => {
    const selected = state.users.find((user) => user.id === picker.value);
    if (!selected) return;
    document.querySelector("[name='inviteName']").value = selected.name;
    document.querySelector("[name='inviteEmail']").value = selected.email;
    document.querySelector("[name='inviteRole']").value = selected.role;
  };
}

function createOrUpdateTeamLogin({ name, email, role, password }) {
  syncSharedState(localStorage.getItem(STORAGE_KEY), false);
  const cleanName = String(name || "").trim();
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || "");
  const cleanRole = normalizeRole(role);
  if (!cleanName || !cleanEmail || !cleanPassword) return { user: null, updated: false, error: "Please enter name, email and password." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { user: null, updated: false, error: "Please enter a valid email ID." };
  accessRestoreEmails.add(cleanEmail);
  state.revokedAccess = (state.revokedAccess || []).filter((item) =>
    normalizeEmail(item.email || item || "") !== cleanEmail &&
    String(item.name || "").trim().toLowerCase() !== cleanName.toLowerCase()
  );
  const existingByEmail = state.users.find((user) => normalizeEmail(user.email) === cleanEmail);
  const existingByName = state.users.find((user) => String(user.name || "").trim().toLowerCase() === cleanName.toLowerCase());
  const user = existingByEmail || existingByName;
  if (user) {
    state.revokedAccess = (state.revokedAccess || []).filter((item) => String(item.id || "").toLowerCase() !== String(user.id || "").toLowerCase());
    const oldName = user.name;
    const oldEmail = user.email;
    user.name = cleanName;
    user.email = cleanEmail;
    user.role = cleanRole;
    user.password = cleanPassword;
    user.source = "team-login";
    state.files = state.files.map((file) => {
      const assignedStaff = file.assignedStaff.toLowerCase() === oldName.toLowerCase() || normalizeEmail(file.assignedStaffEmail) === normalizeEmail(oldEmail) ? cleanName : file.assignedStaff;
      const reAssignedStaff = (file.reAssignedStaff || "").toLowerCase() === oldName.toLowerCase() || normalizeEmail(file.reAssignedStaffEmail) === normalizeEmail(oldEmail) ? cleanName : file.reAssignedStaff;
      return { ...file, assignedStaff, reAssignedStaff, updatedAt: Date.now() };
    });
    state.invites = state.invites.filter((invite) => normalizeEmail(invite.email) !== normalizeEmail(oldEmail) || normalizeEmail(oldEmail) === cleanEmail);
    upsertInviteForUser(user, cleanPassword);
    return { user, updated: true };
  }
  const created = { id: crypto.randomUUID(), name: cleanName, email: cleanEmail, role: cleanRole, password: cleanPassword, source: "team-login" };
  state.users.push(created);
  upsertInviteForUser(created, cleanPassword);
  return { user: created, updated: false };
}

function authenticateUser(identifier, password) {
  const rawIdentifier = String(identifier || "").trim();
  const cleanEmail = normalizeEmail(rawIdentifier);
  const cleanName = normalizePersonName(rawIdentifier);
  const cleanPassword = String(password || "").trim();
  syncSharedState(localStorage.getItem(STORAGE_KEY), false);
  restoreMasterTeamUsers(state);
  const matchesLoginId = (u) => loginIdentifierMatchesUser(rawIdentifier, u);
  let user = state.users.find((u) => matchesLoginId(u) && !isRevokedAccess(u));
  const userPassword = String(user?.password || "").trim();
  if (user && userPassword === cleanPassword) return user;
  const invite = state.invites.find((item) => (
    (cleanEmail && normalizeEmail(item.email) === cleanEmail) ||
    (cleanName && normalizePersonName(item.name) === cleanName) ||
    (cleanName && sameStaffName(item.name, rawIdentifier))
  ) && String(item.password || "").trim() === cleanPassword && !isRevokedAccess(item));
  if (invite) {
    const result = createOrUpdateTeamLogin({
      name: invite.name,
      email: invite.email,
      role: invite.role || "Staff",
      password: cleanPassword,
    });
    if (result.error) return null;
    saveAccessState();
    return result.user;
  }
  const masterUser = staff.find((u) => matchesLoginId(u) && String(u.password || "").trim() === cleanPassword);
  if (masterUser) {
    const result = createOrUpdateTeamLogin({
      name: masterUser.name,
      email: masterUser.email,
      role: masterUser.role,
      password: masterUser.password,
    });
    if (result.error) return null;
    saveAccessState();
    return result.user;
  }
  try {
    const latest = normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    user = latest.users.find((u) => matchesLoginId(u) && !isRevokedAccess(u, latest.revokedAccess || []));
    const latestInvite = (latest.invites || []).find((item) => (
      (cleanEmail && normalizeEmail(item.email) === cleanEmail) ||
      (cleanName && normalizePersonName(item.name) === cleanName) ||
      (cleanName && sameStaffName(item.name, rawIdentifier))
    ) && !isRevokedAccess(item, latest.revokedAccess || []));
    const latestPassword = String(user?.password || latestInvite?.password || "").trim();
    if (!user && latestInvite && String(latestInvite.password || "").trim() === cleanPassword) {
      const result = createOrUpdateTeamLogin({
        name: latestInvite.name,
        email: latestInvite.email,
        role: latestInvite.role || "Staff",
        password: cleanPassword,
      });
      if (result.error) return null;
      saveAccessState();
      return result.user;
    }
    if (user && latestPassword === cleanPassword) {
      user.password = cleanPassword;
      upsertInviteForUser(user, cleanPassword);
    } else {
      return null;
    }
    const existing = state.users.find((u) => normalizeEmail(u.email) === normalizeEmail(user.email));
    if (existing) Object.assign(existing, user);
    else state.users.push(user);
    return user;
  } catch {
    return null;
  }
  return null;
}

function normalizeStages(file) {
  const old = file.stages || {};
  const hasAssigned = hasAssignedStaffValue(file.assignedStaff) || hasAssignedStaffValue(file.assignedStaffEmail) || hasAssignedStaffValue(file.assignedStaffId);
  return {
    Received: Boolean(old.Received || old["File Received"] || true),
    Allotted: Boolean(old.Allotted || old["Work in Progress"] || hasAssigned),
    "Work Done": Boolean(old["Work Done"] || old["Report Prepared"]),
    "On Hold": Boolean(old["On Hold"]),
    "Client Pending": Boolean(old["Client Pending"]),
    WIP: Boolean(old.WIP),
    "Approval Pending": Boolean(old["Approval Pending"] || old.Shared),
    "Correction Required": Boolean(old["Correction Required"]),
    Approved: Boolean(old.Approved),
    Completed: Boolean(old.Completed || old.Filed),
    Billed: Boolean(old.Billed || old["Billed / Completed"] || file.billed),
  };
}

function rolePerm() {
  return permissions[state.currentRole] || permissions.Staff;
}

function canUseBackupPage() {
  return ["Admin", "Manager"].includes(state.currentRole);
}

function canUseVerificationPage() {
  return ["Admin", "Manager"].includes(state.currentRole);
}

function isStaffLogin() {
  return state.currentRole === "Staff" || state.currentRole === "Staff Manager";
}

function loggedInUser() {
  return state.users.find((user) => user.id === state.session?.userId)
    || state.users.find((user) => user.authUserId === state.session?.authUserId)
    || state.users.find((user) => user.email === state.session?.userEmail)
    || state.users.find((user) => user.name === state.currentUser)
    || sessionUserFallback();
}

function sessionUserFallback() {
  const name = String(state.currentUser || "").trim();
  const email = String(state.session?.userEmail || "").trim();
  const id = String(state.session?.userId || "").trim();
  if (!name && !email && !id) return null;
  return {
    id,
    authUserId: String(state.session?.authUserId || "").trim(),
    email,
    name: name || email || id,
    role: state.currentRole || "Staff",
  };
}

function sameStaffName(a, b) {
  const left = staffNameVariants(a);
  const right = staffNameVariants(b);
  return [...left].some((value) => right.has(value));
}

function staffNameVariants(value) {
  const clean = normalizePersonName(value);
  if (!clean || clean === "not assigned") return new Set();
  const tokens = clean.split(" ").filter(Boolean);
  const variants = new Set([clean]);
  if (tokens[0]) variants.add(tokens[0]);
  const known = staffAliasMap()[clean] || [];
  known.forEach((alias) => variants.add(normalizePersonName(alias)));
  return variants;
}

function normalizePersonName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function staffAliasMap() {
  return {
    "abhinandana k madhu": ["Abhinandana", "Abhainandana", "Abdhinandana", "Abhinandhana"],
    "abhainandana": ["Abhinandana"],
    "abdhinandana": ["Abhinandana"],
    "abhinandana": ["Abhinandana K Madhu", "Abhainandana", "Abdhinandana", "Abhinandhana"],
    "abhinandhana": ["Abhinandana"],
    "althaf m k": ["Althaf"],
    "althaf": ["Althaf M K"],
    "anusree kv": ["Anusree"],
    "anusree": ["Anusree KV"],
    "naveen vv": ["Naveen"],
    "naveen": ["Naveen VV"],
    "rabiyath ck": ["Rabiyath"],
    "rabiyath": ["Rabiyath CK"],
    "rasha mp": ["Rasha"],
    "rasha": ["Rasha MP"],
    "rizwana shirin k a": ["Rizwana"],
    "rizwana": ["Rizwana Shirin K A"],
    "shada pp": ["Shada"],
    "shada": ["Shada PP"],
    "shurafa sameer": ["Shurafa"],
    "shurafa": ["Shurafa Sameer"],
    "sidharth v k": ["Sidharth"],
    "sidharth": ["Sidharth V K"],
    "chindu raveendran": ["Chindu"],
    "chindu": ["Chindu Raveendran"],
    "ca sadique": ["CA", "Sadique"],
    "ca": ["CA Sadique"],
    "sadique": ["CA Sadique"],
    "najmunnisa": ["Najma"],
    "najma": ["Najmunnisa"],
  };
}

function hasAssignedStaffValue(value) {
  const clean = String(value || "").trim().toLowerCase();
  return Boolean(clean && clean !== "not assigned");
}

function sameUserIdentity(user, ...values) {
  if (!user) return false;
  const userValues = [user.id, user.authUserId, user.email, user.name, state.currentUser, state.session?.userId, state.session?.authUserId, state.session?.userEmail]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  return values.some((value) => userValues.includes(String(value || "").trim().toLowerCase()));
}

function chatSenderIsCurrentUser(message, user = loggedInUser()) {
  return sameUserIdentity(user, message.userId, message.userEmail, message.user);
}

function currentChatReaderKey(user = loggedInUser()) {
  return String(user?.id || user?.email || state.session?.userId || state.session?.userEmail || state.currentUser || "guest").trim().toLowerCase();
}

function chatReadKey(messageId, user = loggedInUser()) {
  return `${currentChatReaderKey(user)}::${messageId}`;
}

function isChatMessageRead(message, user = loggedInUser()) {
  return (state.readChatMessages || []).includes(chatReadKey(message.id, user));
}

function markChatMessagesRead(messageIds, user = loggedInUser()) {
  const keys = (messageIds || []).filter(Boolean).map((id) => chatReadKey(id, user));
  state.readChatMessages = [...new Set([...(state.readChatMessages || []), ...keys])];
}

function markChatMessageRead(messageId, user = loggedInUser()) {
  markChatMessagesRead([messageId], user);
}

function fileBelongsToUser(file, user) {
  return currentFileBelongsToUser(file, user);
}

function currentFileBelongsToUser(file, user) {
  if (!user) return false;
  const assignee = currentFileAssignee(file);
  return staffNameBelongsToUser(assignee.name, user)
    || exactStaffIdentity(assignee.email, user.email)
    || exactStaffIdentity(assignee.id, user.id)
    || exactStaffIdentity(assignee.id, user.authUserId);
}

function currentFileAssignee(file = {}) {
  if (hasAssignedStaffValue(file.reAssignedStaff) || file.reAssignedStaffId || file.reAssignedStaffEmail) {
    return {
      name: file.reAssignedStaff || "",
      id: file.reAssignedStaffId || "",
      email: file.reAssignedStaffEmail || "",
      date: file.reAssignedDate || file.reassigned_at || "",
    };
  }
  return {
    name: file.assignedStaff || "",
    id: file.assignedStaffId || "",
    email: file.assignedStaffEmail || "",
    date: file.workAllotmentDate || file.assigned_at || "",
  };
}

function originalAllottedTo(file = {}) {
  return file.originallyAllottedTo || file.originalAssignedStaff || file.original_assigned_to || file.assignedStaff || "Not Assigned";
}

function assignmentHistory(file = {}) {
  const history = Array.isArray(file.assignmentHistory) ? file.assignmentHistory : [];
  return [...history].sort((a, b) => (Date.parse(b.assignedAt || b.assigned_at || "") || 0) - (Date.parse(a.assignedAt || a.assigned_at || "") || 0));
}

function isReassignedFile(file = {}) {
  return hasAssignedStaffValue(file.reAssignedStaff) || assignmentHistory(file).some((row) => String(row.actionType || row.action_type || "").toLowerCase().includes("reassignment"));
}

function reassignmentVisibleToUser(file, user) {
  if (!user || !isReassignedFile(file)) return false;
  const history = assignmentHistory(file);
  return history.some((row) =>
    staffNameBelongsToUser(row.assignedFrom || row.assigned_from, user)
    || exactStaffIdentity(row.assignedFromId || row.assigned_from_id, user.id)
    || exactStaffIdentity(row.assignedFromEmail || row.assigned_from_email, user.email)
    || staffNameBelongsToUser(row.assignedTo || row.assigned_to, user)
    || exactStaffIdentity(row.assignedToId || row.assigned_to_id, user.id)
    || exactStaffIdentity(row.assignedToEmail || row.assigned_to_email, user.email)
  ) || staffNameBelongsToUser(file.previousAllottedTo || file.reassigned_from || "", user);
}

function staffNameBelongsToUser(staffName, user) {
  if (!hasAssignedStaffValue(staffName) || !user) return false;
  if (sameStaffName(staffName, user.name)) return true;
  if (exactStaffIdentity(staffName, user.email) || exactStaffIdentity(staffName, user.id) || exactStaffIdentity(staffName, user.authUserId)) return true;
  const canonicalFileStaff = canonicalStaffName(staffName);
  const canonicalUserStaff = canonicalStaffName(user.name);
  return Boolean(canonicalFileStaff && canonicalUserStaff && sameStaffName(canonicalFileStaff, canonicalUserStaff));
}

function exactStaffIdentity(left, right) {
  const a = String(left || "").trim().toLowerCase();
  const b = String(right || "").trim().toLowerCase();
  return Boolean(a && b && a === b);
}

function visibleFiles() {
  const perm = rolePerm();
  const user = loggedInUser();
  if (["Admin", "Manager"].includes(state.currentRole)) return state.files || [];
  if (state.currentRole === "Staff") return staffOwnedFiles(user);
  return state.files.filter((file) => perm.allFiles || fileBelongsToUser(file, user));
}

function staffOwnedFiles(user = loggedInUser()) {
  return (state.files || []).filter((file) => currentFileBelongsToUser(file, user) || reassignmentVisibleToUser(file, user));
}

function filteredFiles() {
  const f = state.filters;
  return visibleFiles().filter((file) => {
    const haystack = `${file.name} ${file.pan} ${file.serviceType} ${file.careOf || ""} ${file.fy || ""} ${file.mode || ""} ${file.assignedStaff} ${file.reAssignedStaff || ""} ${file.reassignedFrom || ""} ${file.reassignedBy || ""} ${file.remarks}`.toLowerCase();
    if (f.listView === "active" && isCheckedCompleted(file)) return false;
    if (f.listView === "completed" && !isCheckedCompleted(file)) return false;
    if (f.listView === "notChecked" && !isNotCheckedFile(file)) return false;
    if (f.listView === "correctionRequired" && !hasOpenCorrection(file)) return false;
    if (f.listView === "completed" && f.checkingStatus && checkingStatusOf(file).label !== f.checkingStatus) return false;
    if (f.listView === "billed" && !isBilledFile(file)) return false;
    if (f.listView === "nonBilled" && !isNonBilledFile(file)) return false;
    if (f.listView === "feePending" && !isFeePendingFile(file)) return false;
    if (f.listView === "feeReceived" && !isFeeReceivedFile(file)) return false;
    if (f.listView === "reAssigned" && !isReassignedFile(file)) return false;
    if (isStaffLogin() && f.listView === "reAssigned" && !reassignmentVisibleToUser(file, loggedInUser())) return false;
    if (isStaffLogin() && f.listView !== "reAssigned" && !currentFileBelongsToUser(file, loggedInUser())) return false;
    if (f.search && !haystack.includes(f.search.toLowerCase())) return false;
    if (f.client && !file.name.toLowerCase().includes(f.client.toLowerCase())) return false;
    if (f.pan && !file.pan.toLowerCase().includes(f.pan.toLowerCase())) return false;
    if (f.careOfFilter && !String(file.careOf || "").toLowerCase().includes(f.careOfFilter.toLowerCase())) return false;
    if (f.staff && !fileBelongsToUser(file, findUserByStaffIdentity(f.staff))) return false;
    if (f.service && file.serviceType !== f.service) return false;
    if (f.workflow && stages[stageIndex(file)] !== f.workflow) return false;
    if (f.due && file.dueDate !== f.due) return false;
    if (f.priority && file.priority !== f.priority) return false;
    if (f.status && statusOf(file).label !== f.status) return false;
    if (f.billing === "Billed" && !isBilledFile(file)) return false;
    if (f.billing === "Unbilled" && !isNonBilledFile(file)) return false;
    if (f.overdue === "Yes" && !isOverdue(file)) return false;
    if (f.pendingApproval === "Yes" && !pendingApproval(file)) return false;
    const fileFilterDate = usesCompletionSort(f.listView, f.dashboardKind)
      ? fileActualCompletionDate(file)
      : (file.fileReceivedDate || file.workAllotmentDate || file.lastUpdatedDate || file.dueDate || "");
    if (f.fileFrom && fileFilterDate < f.fileFrom) return false;
    if (f.fileTo && fileFilterDate > f.fileTo) return false;
    if (f.dashboardKind === "pending" && isCheckedCompleted(file)) return false;
    if (f.dashboardKind === "shared" && !file.shared) return false;
    if (f.dashboardKind === "reportsPrepared" && !file.reportPrepared) return false;
    if (f.dashboardKind === "completed" && !isCheckedCompleted(file)) return false;
    if (f.dashboardKind === "correctionRequired" && !file.stages?.["Correction Required"]) return false;
    if (f.dashboardKind === "reAllotted" && !(file.reAssignedStaff && file.reAssignedStaff !== "Not Assigned")) return false;
    return true;
  });
}

function todayDate() {
  return dateInput(new Date());
}

function indiaTodayDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function dateInput(date) {
  return date.toISOString().slice(0, 10);
}

function displayDate(dateString) {
  if (!dateString) return "";
  const raw = String(dateString).trim();
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  const isoDateTime = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?/);
  if (isoDateTime) {
    return `${isoDateTime[3].padStart(2, "0")}-${isoDateTime[2].padStart(2, "0")}-${isoDateTime[1]}`;
  }
  const localMatch = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (localMatch) {
    const first = Number(localMatch[1]);
    const second = Number(localMatch[2]);
    const dayValue = first > 12 ? first : second;
    const monthValue = first > 12 ? second : first;
    const day = String(dayValue).padStart(2, "0");
    const month = String(monthValue).padStart(2, "0");
    const year = localMatch[3].length === 2 ? `20${localMatch[3]}` : localMatch[3];
    return `${day}-${month}-${year}`;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
}

function daysUntil(dateString) {
  const today = new Date(todayDate());
  const target = new Date(dateString);
  return Math.ceil((target - today) / MS_DAY);
}

function isOverdue(file) {
  return !file.filed && daysUntil(file.dueDate) < 0;
}

function pendingApproval(file) {
  return file.shared && !file.approved;
}

function reportNotFiled(file) {
  return file.workDone && !file.filed;
}

function completedNotBilled(file) {
  return isNonBilledFile(file);
}

function isActiveFileRecord(file) {
  return Boolean(file && !isCheckedCompleted(file));
}

function isBilledFile(file) {
  return Boolean(file?.billed);
}

function isNonBilledFile(file) {
  return Boolean(file?.billingType === "Non-Billable" && !file?.billed);
}

function isFeePendingFile(file) {
  return Boolean(isBilledFile(file) && !file?.feeReceived);
}

function isFeeReceivedFile(file) {
  return Boolean(isBilledFile(file) && file?.feeReceived);
}

function isNotCheckedFile(file) {
  return checkingStatusOf(file).label === "Not Checked";
}

function isCheckedFile(file) {
  return checkingStatusOf(file).label === "Checked";
}

function canManageChecking() {
  return ["Admin", "Manager"].includes(state.currentRole) || isAuthorisedCheckingStaff();
}

function canEditCheckedDate() {
  return ["Admin", "Manager"].includes(state.currentRole);
}

function isAuthorisedCheckingStaff(user = loggedInUser()) {
  return ["Staff", "Staff Manager"].includes(state.currentRole) && checkingStaffNames.has(normalizePersonName(user?.name || state.currentUser));
}

function isSpecialFileCreator(user = loggedInUser()) {
  return ["Staff", "Staff Manager"].includes(state.currentRole) && fileCreatorStaffNames.has(normalizePersonName(user?.name || state.currentUser));
}

function canViewNotCheckedFiles(user = loggedInUser()) {
  return ["Admin", "Manager"].includes(state.currentRole)
    || (["Staff", "Staff Manager"].includes(state.currentRole) && notCheckedStaffManagerNames.has(normalizePersonName(user?.name || state.currentUser)));
}

function fileCreatedByCurrentUser(file = {}) {
  const user = loggedInUser();
  if (!user) return false;
  return sameStaffName(file.createdBy, user.name)
    || exactStaffIdentity(file.createdByEmail, user.email)
    || exactStaffIdentity(file.createdById, user.id);
}

function canCreateFile() {
  return Boolean(rolePerm().assign || isSpecialFileCreator());
}

function canAssignFile(file = {}) {
  return Boolean(rolePerm().assign || (isSpecialFileCreator() && (!file?.id || fileCreatedByCurrentUser(file))));
}

function canEditFileRecord(file = null) {
  if (!file) return canCreateFile();
  if (["Admin", "Manager"].includes(state.currentRole)) return true;
  if (isAuthorisedCheckingStaff() && isCheckedCompleted(file)) return true;
  if (isSpecialFileCreator() && fileCreatedByCurrentUser(file)) return true;
  return fileBelongsToUser(file, loggedInUser());
}

function validCheckingRemark(value) {
  return /[a-z0-9]{2,}/i.test(String(value || "").trim());
}

function workDoneByUser(file = {}, user = loggedInUser()) {
  if (!file || !user) return false;
  return sameStaffName(file.completedBy, user.name)
    || exactStaffIdentity(file.completedById, user.id)
    || exactStaffIdentity(file.completedByEmail, user.email)
    || sameStaffName(file.workDoneBy, user.name)
    || staffNameBelongsToUser(file.assignedStaff, user);
}

function canCheckFile(file = {}) {
  if (!canManageChecking()) return false;
  if (["Admin", "Manager"].includes(state.currentRole)) return true;
  return !workDoneByUser(file);
}

function staffAttemptedCheckingChange(existingFile, formData) {
  const hasCheckedBy = formData.has("checkedBy");
  const hasCheckedDate = formData.has("checkedDate");
  const hasCheckingRemarks = formData.has("checkingRemarks");
  if (!existingFile) {
    return Boolean(
      String(formData.get("checkedBy") || "").trim() ||
      normalizeImportDate(formData.get("checkedDate")) ||
      String(formData.get("checkingRemarks") || "").trim()
    );
  }
  const submittedCheckedBy = String(formData.get("checkedBy") || "").trim();
  const submittedCheckedDate = normalizeImportDate(formData.get("checkedDate"));
  const submittedCheckingRemarks = String(formData.get("checkingRemarks") || "").trim();
  return Boolean(
    (hasCheckedBy && submittedCheckedBy !== String(existingFile.checkedBy || "").trim()) ||
    (hasCheckedDate && submittedCheckedDate !== normalizeImportDate(existingFile.checkedDate)) ||
    (hasCheckingRemarks && submittedCheckingRemarks !== String(existingFile.checkingRemarks || "").trim())
  );
}

function checkingDetailsChanged(before, after) {
  return String(before?.checkedBy || "") !== String(after?.checkedBy || "")
    || normalizeImportDate(before?.checkedDate) !== normalizeImportDate(after?.checkedDate)
    || String(before?.checkingRemarks || "") !== String(after?.checkingRemarks || "");
}

function checkingStatusOf(file) {
  if (file?.stages?.["Correction Required"]) return { label: "Returned for Correction", className: "overdue" };
  if (!isCheckedCompleted(file)) return { label: "", className: "" };
  if (String(file?.checkedBy || "").trim() && normalizeImportDate(file?.checkedDate)) return { label: "Checked", className: "filed" };
  return { label: "Not Checked", className: "approval" };
}

function isCheckedCompleted(file) {
  return Boolean((file?.filed || file?.stages?.Completed) && !hasOpenCorrection(file));
}

function hasOpenCorrection(file = {}) {
  const status = String(file.correctionStatus || file.correction_status || "").trim().toLowerCase();
  return Boolean(file?.stages?.["Correction Required"])
    || ["correction required", "correction in progress", "resubmitted for checking", "returned again", "returned for correction"].includes(status);
}

function stageIndex(file) {
  let index = 0;
  stages.forEach((stage, i) => {
    if (file.stages?.[stage]) index = i;
  });
  return index;
}

function statusOf(file) {
  if (file.stages?.["Correction Required"]) return { label: "Correction Required", className: "overdue" };
  if (file.feeReceived) return { label: "Received", className: "filed" };
  if (isCheckedCompleted(file)) return { label: "Completed", className: "filed" };
  if (file.billed) return { label: "Billed", className: "billed" };
  if (isOverdue(file)) return { label: "Overdue", className: "overdue" };
  if (file.approved) return { label: "Approved", className: "filed" };
  if (pendingApproval(file)) return { label: "Approval Pending", className: "approval" };
  if (file.stages?.["Client Pending"]) return { label: "Client Pending", className: "approval" };
  if (file.stages?.["On Hold"]) return { label: "On Hold", className: "pending" };
  if (file.workDone) return { label: "Work Done", className: "report" };
  if (file.stages?.WIP) return { label: "WIP", className: "progress" };
  if (file.stages?.Allotted || hasAssignedStaffValue(file.assignedStaff)) return { label: "Allotted", className: "progress" };
  return { label: "Received", className: "pending" };
}

function stats(files = visibleFiles()) {
  return {
    total: files.length,
    pending: files.filter((f) => !isCheckedCompleted(f)).length,
    notStarted: files.filter((f) => stageIndex(f) === 0).length,
    workInProgress: files.filter((f) => f.stages?.WIP && !isCheckedCompleted(f)).length,
    overdue: files.filter(isOverdue).length,
    sharedNotApproved: files.filter(pendingApproval).length,
    correctionRequired: files.filter((f) => f.stages?.["Correction Required"]).length,
    reAllotted: files.filter((f) => f.reAssignedStaff && f.reAssignedStaff !== "Not Assigned").length,
    reportsPrepared: files.filter((f) => f.reportPrepared).length,
    completed: files.filter(isCheckedCompleted).length,
    notChecked: files.filter(isNotCheckedFile).length,
    billed: files.filter(isBilledFile).length,
    unbilled: files.filter(isNonBilledFile).length,
    feePending: files.filter(isFeePendingFile).length,
  };
}

function staffStats(name) {
  const selectedUser = findUserByStaffIdentity(name);
  const files = visibleFiles().filter((f) => !name || fileBelongsToUser(f, selectedUser));
  return {
    total: files.length,
    notStarted: files.filter((f) => stageIndex(f) === 0).length,
    inProgress: files.filter((f) => stageIndex(f) > 0 && !isCheckedCompleted(f)).length,
    pending: files.filter((f) => !isCheckedCompleted(f)).length,
    completed: files.filter(isCheckedCompleted).length,
    overdue: files.filter(isOverdue).length,
    approvals: files.filter(pendingApproval).length,
    billed: files.filter(isBilledFile).length,
    unbilled: files.filter(isNonBilledFile).length,
  };
}

function allNotificationItems() {
  const files = visibleFiles();
  const items = [];
  const user = loggedInUser();
  visibleFileNotifications(user).forEach((notice) => {
    items.push({
      id: `file-change-${notice.id}`,
      type: notice.changeType || "File Update",
      category: notificationCategory(notice.changeType || "File Update"),
      tone: notice.tone || "progress",
      title: notice.fileName || "File Update",
      text: `${notice.changeText || "File updated"} by ${notice.changedBy || "Team"}.`,
      fileId: notice.fileId || "",
      actor: notice.changedBy || "Team",
      date: notice.date || "",
      time: notice.time || "",
      createdAt: notice.createdAt || Date.parse(notice.created_at || "") || 0,
    });
  });
  unreadChatMessages().forEach((message) => {
    items.push({
      id: `chat-${message.id}`,
      type: message.targetType === "personal" ? "Personal Chat" : "Group Chat",
      category: "chat",
      tone: "progress",
      title: message.user || "Team Member",
      text: message.text || (message.attachments?.length ? `Attachment shared: ${message.attachments[0].name}` : ""),
      chatId: message.id,
      actor: message.user || "Team Member",
      date: message.date || "",
      time: message.time || "",
      createdAt: chatMessageTime(message),
    });
  });
  if (["Admin", "Manager"].includes(state.currentRole)) {
    const { year } = currentIndiaYearMonth();
    staffBirthdaysThisMonth().forEach((row) => {
      items.push({
        id: `staff-birthday-${row.id}-${year}`,
        type: "Upcoming Birthday",
        category: "system",
        tone: "approval",
        title: row.staffName,
        text: `${row.staffName}'s birthday is on ${staffShortDate(row.eventDate)}.`,
        actor: "Staff Details",
        date: row.eventDate,
        createdAt: Date.parse(`${row.eventDate}T00:00:00+05:30`) || Date.now(),
      });
    });
    staffAnniversariesThisMonth().forEach((row) => {
      items.push({
        id: `staff-anniversary-${row.id}-${year}`,
        type: "Work Anniversary",
        category: "system",
        tone: "progress",
        title: row.staffName,
        text: `${row.staffName} completes ${row.completedYears} ${row.completedYears === 1 ? "year" : "years"} on ${staffShortDate(row.eventDate)}.`,
        actor: "Staff Details",
        date: row.eventDate,
        createdAt: Date.parse(`${row.eventDate}T00:00:00+05:30`) || Date.now(),
      });
    });
  }
  files.forEach((file) => {
    const days = daysUntil(file.dueDate);
    if ((sameStaffName(file.assignedStaff, state.currentUser) || sameStaffName(file.assignedStaff, user?.name) || sameStaffName(file.assignedStaffEmail, user?.email) || sameStaffName(file.assignedStaffId, user?.id)) && file.assignedStaff !== "Not Assigned") {
      items.push({ id: `${file.id}-assigned-${file.assignedStaff}`, type: "Assigned file", category: "assignments", tone: "progress", title: file.name, text: `This file is assigned to you. Due date: ${fmt(file.dueDate)}.`, fileId: file.id, actor: file.assignedStaff || "", date: file.dueDate, createdAt: Date.parse(file.updatedAt || file.lastUpdatedDate || file.dueDate || "") || 0 });
    }
    if ((sameStaffName(file.reAssignedStaff, state.currentUser) || sameStaffName(file.reAssignedStaff, user?.name) || sameStaffName(file.reAssignedStaffEmail, user?.email) || sameStaffName(file.reAssignedStaffId, user?.id)) && file.reAssignedDate) {
      items.push({ id: `${file.id}-reassigned-${file.reAssignedDate}`, type: "Re-assigned file", category: "assignments", tone: "approval", title: file.name, text: `This file was re-assigned to you on ${fmt(file.reAssignedDate)}.`, fileId: file.id, actor: file.reAssignedStaff || "", date: file.reAssignedDate, createdAt: Date.parse(file.reAssignedDate || "") || 0 });
    }
    if (isOverdue(file)) items.push({ id: `${file.id}-overdue`, type: "Overdue", category: "files", tone: "overdue", title: file.name, text: `${Math.abs(days)} day(s) overdue. Assigned to ${file.assignedStaff}.`, fileId: file.id, actor: file.assignedStaff || "", date: file.dueDate, createdAt: Date.parse(file.dueDate || "") || 0 });
    else if (!file.filed && days <= 3) items.push({ id: `${file.id}-due`, type: "Nearing due", category: "files", tone: "pending", title: file.name, text: `Due in ${days} day(s). Priority: ${file.priority}.`, fileId: file.id, date: file.dueDate, createdAt: Date.parse(file.dueDate || "") || 0 });
    if (pendingApproval(file)) items.push({ id: `${file.id}-approval`, type: "Approval pending", category: "files", tone: "approval", title: file.name, text: "Shared with client/partner but not approved yet.", fileId: file.id, createdAt: Date.parse(file.updatedAt || file.lastUpdatedDate || "") || 0 });
    if (reportNotFiled(file)) items.push({ id: `${file.id}-workdone`, type: "Work done pending", category: "files", tone: "report", title: file.name, text: "Work is done, completion is still pending.", fileId: file.id, createdAt: Date.parse(file.updatedAt || file.lastUpdatedDate || "") || 0 });
    if (completedNotBilled(file)) items.push({ id: `${file.id}-billing`, type: "Billing pending", category: "billing", tone: "filed", title: file.name, text: "Filing completed, billing still pending.", fileId: file.id, createdAt: Date.parse(file.updatedAt || file.lastUpdatedDate || "") || 0 });
  });
  return mergeById([], items)
    .map((item) => ({ ...item, isRead: (state.readNotifications || []).includes(item.id) }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function notifications() {
  return allNotificationItems().filter((item) => !item.isRead);
}

function notificationCategory(type = "") {
  const text = String(type).toLowerCase();
  if (text.includes("bill") || text.includes("fee") || text.includes("payment")) return "billing";
  if (text.includes("correction") || text.includes("return")) return "corrections";
  if (text.includes("allot") || text.includes("assign")) return "assignments";
  if (text.includes("system")) return "system";
  return "files";
}

function visibleFileNotifications(user = loggedInUser()) {
  if (!user) return [];
  return (state.fileNotifications || [])
    .filter((notice) => ["Admin", "Manager", "Staff Manager"].includes(state.currentRole)
      || sameUserIdentity(user, notice.targetUserId, notice.targetUserEmail, notice.targetUserName)
      || sameStaffName(notice.targetUserName, state.currentUser))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function canSeeChatMessage(message, user = loggedInUser()) {
  if (!message) return false;
  if ((message.targetType || "group") === "personal") {
    return sameUserIdentity(user, message.userId, message.userEmail, message.user)
      || sameUserIdentity(user, message.targetUserId, message.targetUserEmail, message.targetUserName);
  }
  const groupId = message.groupId || message.group_id || "team";
  if (groupId === "team") return true;
  if (["Admin", "Manager", "Staff Manager"].includes(state.currentRole)) return true;
  const group = (state.chatGroups || []).find((item) => item.id === groupId);
  return Boolean(group?.memberIds?.includes(user?.id) || sameUserIdentity(user, message.userId, message.userEmail, message.user));
}

function visibleChatMessages() {
  const user = loggedInUser();
  return (state.chatMessages || []).filter((message) => canSeeChatMessage(message, user));
}

function isChatWithUser(message, otherUser, currentUser = loggedInUser()) {
  if (!otherUser || (message.targetType || "group") !== "personal") return false;
  const sentByCurrentToOther = sameUserIdentity(currentUser, message.userId, message.userEmail, message.user)
    && sameUserIdentity(otherUser, message.targetUserId, message.targetUserEmail, message.targetUserName);
  const sentByOtherToCurrent = sameUserIdentity(otherUser, message.userId, message.userEmail, message.user)
    && sameUserIdentity(currentUser, message.targetUserId, message.targetUserEmail, message.targetUserName);
  return sentByCurrentToOther || sentByOtherToCurrent;
}

function chatConversationMessages(targetType = "all", recipientId = "") {
  const currentUser = loggedInUser();
  if (targetType === "personal") {
    const otherUser = state.users.find((user) => user.id === recipientId) || state.users.find((user) => user.id !== state.session?.userId);
    return visibleChatMessages().filter((message) => isChatWithUser(message, otherUser, currentUser));
  }
  if (targetType === "all") return visibleChatMessages();
  return visibleChatMessages().filter((message) => {
    if ((message.targetType || "group") !== "group") return false;
    const groupId = message.groupId || message.group_id || "team";
    return (recipientId || "team") === groupId;
  });
}

function unreadChatMessages() {
  const user = loggedInUser();
  return visibleChatMessages().filter((message) =>
    !chatSenderIsCurrentUser(message, user) &&
    !isChatMessageRead(message, user)
  );
}

function chatButtonLabel() {
  const unread = unreadChatMessages().length;
  return `Team Chat${unread ? ` ${unread}` : ""}`;
}

function unreadChatCount() {
  return unreadChatMessages().length;
}

function actionBadge(count) {
  const total = Number(count) || 0;
  if (total <= 0) return "";
  return `<span class="top-action-badge">${total > 99 ? "99+" : total}</span>`;
}

function quoteIndexForDate(dateString, length) {
  if (!length) return 0;
  const key = String(dateString || indiaTodayDate()).replace(/\D/g, "");
  const value = Number(key || 0);
  return Math.abs(value) % length;
}

function quoteDateValue(quote = {}) {
  return normalizeImportDate(quote.date || quote.quoteDate || quote.quote_date || quote.displayDate || "");
}

function quoteTextValue(quote = {}) {
  return String(quote.text || quote.quote || quote.message || "").trim();
}

function quoteAuthorValue(quote = {}) {
  return String(quote.author || quote.by || quote.source || "").trim();
}

function dailyQuoteForDate(dateString = indiaTodayDate()) {
  if (state.dailyQuoteSettings?.enabled === false) return null;
  const configuredQuotes = (state.dailyQuotes || [])
    .filter((quote) => quote && quote.enabled !== false && quote.active !== false && quoteTextValue(quote));
  const selectedForDate = configuredQuotes.find((quote) => quoteDateValue(quote) === dateString);
  if (selectedForDate) return selectedForDate;
  const pool = configuredQuotes.length ? configuredQuotes : defaultDailyQuotes;
  if (!pool.length) return null;
  let index = quoteIndexForDate(dateString, pool.length);
  if (pool.length > 1) {
    const [year, month, day] = dateString.split("-").map(Number);
    const previousDate = new Date(Date.UTC(year, month - 1, day) - MS_DAY).toISOString().slice(0, 10);
    const previousIndex = quoteIndexForDate(previousDate, pool.length);
    if (index === previousIndex) index = (index + 1) % pool.length;
  }
  return pool[index];
}

function renderDailyQuoteBanner() {
  if (activePage !== "dashboard") return "";
  if (sessionStorage.getItem(DAILY_QUOTE_MINIMIZED_KEY) === "Yes") return "";
  const quote = dailyQuoteForDate();
  const text = quoteTextValue(quote);
  if (!text) return "";
  const author = quoteAuthorValue(quote);
  return `
    <div class="daily-quote-banner" role="note" aria-label="Thought for the day">
      <span class="daily-quote-icon" aria-hidden="true">&#128161;</span>
      <div class="daily-quote-copy">
        <span class="daily-quote-title">Thought for the Day:</span>
        <span class="daily-quote-text">"${escapeHtml(text)}"</span>
        ${author ? `<span class="daily-quote-author">&mdash; ${escapeHtml(author)}</span>` : ""}
      </div>
      <button class="daily-quote-minimize" id="dailyQuoteMinimize" type="button" title="Hide quote for this session" aria-label="Hide quote">Hide</button>
    </div>
  `;
}

function topActionIconButton(id, type, icon, label, count = 0) {
  return `
    <button class="top-icon-action top-icon-${type}" id="${id}" type="button" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">
      ${navIcon(icon)}
      ${actionBadge(count)}
    </button>
  `;
}

function updateTopActionBadges() {
  const chatButton = document.querySelector("#chatButton");
  if (chatButton) {
    chatButton.innerHTML = `${navIcon("chat")}${actionBadge(unreadChatCount())}`;
  }
  const notifyButton = document.querySelector("#notifyButton");
  if (notifyButton) {
    notifyButton.innerHTML = `${navIcon("bell")}${actionBadge(notifications().length)}`;
  }
}

function repairCurrentSessionRole() {
  const masterUser = staff.find((item) =>
    normalizeEmail(item.email) === normalizeEmail(state.session?.userEmail) ||
    sameStaffName(item.name, state.currentUser)
  );
  if (!masterUser) return;
  state.currentUser = masterUser.name;
  state.currentRole = masterUser.role;
  const existing = state.users.find((user) => normalizeEmail(user.email) === normalizeEmail(masterUser.email) || sameStaffName(user.name, masterUser.name));
  if (existing) {
    existing.name = masterUser.name;
    existing.role = masterUser.role;
    existing.email = masterUser.email;
  }
}

function mount() {
  document.body.className = `theme-${state.theme}`;
  if (!state.session?.loggedIn) {
    renderLogin();
    return;
  }
  repairCurrentSessionRole();
  document.querySelector("#app").innerHTML = `
    <div class="app-shell ${isSidebarCollapsed() ? "sidebar-collapsed" : ""}">
      <aside class="sidebar ${isSidebarCollapsed() ? "collapsed" : ""}" id="sidebar">
        <div class="brand">
          <div class="brand-mark ca-logo-mark" aria-hidden="true"><img src="assets/ca-india-logo.png" alt=""></div>
          <div class="brand-text-only">
            <h1><span>CA</span> <em>File Tracker</em></h1>
            <p class="brand-byline">Muhammad &amp; Associates</p>
            <p class="brand-subline">Chartered Accountants</p>
          </div>
          <button class="sidebar-collapse-button" id="sidebarCollapseButton" type="button" title="Collapse navigation">${navIcon("chevron")}</button>
        </div>
        <nav class="nav" id="nav"></nav>
        <div class="current-user-card">
          <div class="profile-avatar">${escapeHtml(userInitials(state.currentUser))}</div>
          <div class="profile-copy">
            <span>Profile</span>
            <strong>${escapeHtml(state.currentUser)}</strong>
            <p class="small-muted">${escapeHtml(state.currentRole)}</p>
          </div>
          <button class="sidebar-logout-button" id="sidebarLogoutButton" type="button" title="Logout">${navIcon("logout")}</button>
        </div>
      </aside>
      <main class="content">
        <header class="topbar">
          <div class="topbar-title-block">
            <button class="icon-button mobile-menu" id="mobileMenu">Menu</button>
            <button class="mini-button hidden" id="topBackButton">Back</button>
            <h2 id="pageTitle">Dashboard</h2>
            <p id="pageSubtitle"></p>
          </div>
          <div class="daily-quote-slot" id="dailyQuoteSlot">${renderDailyQuoteBanner()}</div>
          <div class="top-actions">
            ${topActionIconButton("chatButton", "chat", "chat", "Team Chat", unreadChatCount())}
            ${topActionIconButton("notifyButton", "notify", "bell", "Notifications", notifications().length)}
            ${rolePerm().assign ? `<button class="top-action-button top-action-sample" id="sampleImportButton">Download</button><button class="top-action-button top-action-import" id="importFileButton">Import</button><input class="hidden" type="file" id="importFileInput" accept=".csv,.tsv,.xls,.html,.htm,.xlsx">` : ""}
            ${canCreateFile() ? `<button class="top-action-button top-action-add" id="addFileButton"> Add File</button>` : ""}
            <button class="top-action-button top-action-profile" id="topProfileButton" title="Profile"><span class="topbar-profile-avatar">${escapeHtml(userInitials(state.currentUser))}</span><span class="topbar-profile-name">${escapeHtml(state.currentUser || "Profile")}</span></button>
          </div>
        </header>
        <section class="page" id="dashboard"></section>
        <section class="page" id="files"></section>
        <section class="page" id="staff"></section>
        <section class="page" id="staffDetails"></section>
        <section class="page" id="users"></section>
        <section class="page" id="invites"></section>
        <section class="page" id="visitors"></section>
        <section class="page" id="dailyReport"></section>
        <section class="page" id="expenses"></section>
        <section class="page" id="reports"></section>
        <section class="page" id="verification"></section>
        <section class="page" id="backup"></section>
      </main>
    </div>
    <div class="backdrop" id="backdrop"></div>
    <aside class="drawer" id="fileDrawer"></aside>
    <aside class="notification-panel" id="notificationPanel"></aside>
    <aside class="notification-panel team-chat-panel" id="teamChatPanel"></aside>
    <div class="toast" id="toast"></div>
  `;
  bindShell();
  renderNav();
  renderAll();
}

function renderLogin() {
  document.querySelector("#app").innerHTML = `
    <div class="login-page">
      <div class="login-shell">
        <section class="login-brand-panel">
          <div class="login-brand-lockup">
            <div class="brand-mark brand-mark-logo"><img src="assets/ca-india-logo.png" alt="CA India logo" /></div>
            <div>
              <strong>CA File Tracker</strong>
              <span>Muhammad & Associates</span>
              <small>Chartered Accountants</small>
            </div>
          </div>
          <div class="login-brand-copy">
            <span class="login-eyebrow">Secure Workspace</span>
            <h1>Track filings, teams and collections from one place.</h1>
            <p>Centralised file allotment, status updates, reports, notifications and office cash movement for your team.</p>
          </div>
          <div class="login-feature-grid">
            <span>Live file status</span>
            <span>Staff dashboards</span>
            <span>Central database</span>
          </div>
        </section>
        <section class="login-card">
          <div class="login-card-head">
            <div class="brand-mark brand-mark-logo"><img src="assets/ca-india-logo.png" alt="CA India logo" /></div>
            <div>
              <span class="login-eyebrow">Welcome back</span>
              <h1>Sign in</h1>
            </div>
          </div>
          <p class="login-subtitle">Use your approved office login to continue.</p>
          <div class="field">
            <label>User Name / Email</label>
            <input id="loginEmail" type="text" value="casadique@gmail.com" autocomplete="username" placeholder="Enter email or username" />
          </div>
          <div class="field">
            <label>Password</label>
            <div class="password-wrap"><input id="loginPassword" type="password" autocomplete="current-password" placeholder="Enter password" /><button type="button" data-toggle-password="loginPassword">View</button></div>
          </div>
          <div class="login-action-stack">
            <button class="primary-button" id="loginButton">Login</button>
            <p class="login-credit">An app by CA Sadique</p>
          </div>
        </section>
      </div>
    </div>
    <div class="toast" id="toast"></div>
  `;
  document.querySelector("#loginButton").onclick = handleLogin;
  bindPasswordToggles();
  document.querySelector("#loginPassword").onkeydown = (e) => {
    if (e.key === "Enter") handleLogin();
  };
}

function recoverySessionFromUrl() {
  const hash = new URLSearchParams(String(location.hash || "").replace(/^#/, ""));
  const search = new URLSearchParams(location.search);
  const accessToken = hash.get("access_token") || search.get("access_token") || "";
  const refreshToken = hash.get("refresh_token") || search.get("refresh_token") || "";
  const type = hash.get("type") || search.get("type") || "";
  return accessToken && (!type || type === "recovery") ? { accessToken, refreshToken } : null;
}

function clearRecoveryUrl() {
  if (location.hash || location.search) {
    history.replaceState({}, document.title, location.pathname);
  }
}

function renderPasswordRecovery(recoverySession) {
  document.querySelector("#app").innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="brand-mark">CF</div>
        <h1>Set New Password</h1>
        <p class="login-subtitle">Enter a new password for this login.</p>
        <div class="field">
          <label>New Password</label>
          <div class="password-wrap"><input id="recoveryPassword" type="password" autocomplete="new-password" /><button type="button" data-toggle-password="recoveryPassword">View</button></div>
        </div>
        <div class="field">
          <label>Confirm Password</label>
          <div class="password-wrap"><input id="recoveryPasswordConfirm" type="password" autocomplete="new-password" /><button type="button" data-toggle-password="recoveryPasswordConfirm">View</button></div>
        </div>
        <button class="primary-button" id="recoveryPasswordButton">Update Password</button>
      </div>
    </div>
    <div class="toast" id="toast"></div>
  `;
  bindPasswordToggles();
  const submit = () => handlePasswordRecovery(recoverySession);
  document.querySelector("#recoveryPasswordButton").onclick = submit;
  document.querySelector("#recoveryPasswordConfirm").onkeydown = (e) => {
    if (e.key === "Enter") submit();
  };
}

async function handlePasswordRecovery(recoverySession) {
  const password = document.querySelector("#recoveryPassword").value;
  const confirm = document.querySelector("#recoveryPasswordConfirm").value;
  if (!password || password.length < 8) return toast("Password must be at least 8 characters.");
  if (password !== confirm) return toast("Passwords do not match.");
  try {
    if (!window.supabase?.createClient) throw new Error("Password recovery service is still loading. Please try again.");
    const config = await backendApiJson("/api/auth/public-config", { skipAuthRefresh: true });
    const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: sessionError } = await client.auth.setSession({
      access_token: recoverySession.accessToken,
      refresh_token: recoverySession.refreshToken,
    });
    if (sessionError) throw sessionError;
    const { error: updateError } = await client.auth.updateUser({ password });
    if (updateError) throw updateError;
    clearRecoveryUrl();
    renderLogin();
    toast("Password updated. Please login.");
  } catch (error) {
    toast(error.message || "Password recovery link expired. Send recovery email again.");
  }
}

async function handleLogin() {
  const email = document.querySelector("#loginEmail").value.trim();
  const password = document.querySelector("#loginPassword").value;
  let user = null;
  try {
    const login = await apiJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setApiSession(login.session);
    sessionStorage.setItem(API_MODE_KEY, "supabase");
    const me = login.profile ? { user: login.user, profile: login.profile } : await apiJson("/api/auth/me");
    user = {
      id: me.profile?.id || me.user?.id,
      email: me.profile?.email || me.user?.email,
      name: me.profile?.name || me.user?.email,
      role: me.profile?.role || "Staff",
      authUserId: me.user?.id,
      source: "supabase-auth",
    };
  } catch (error) {
    setApiToken("");
    sessionStorage.removeItem(API_REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(API_MODE_KEY);
    if (!allowLocalLoginFallback()) {
      console.warn("Hosted Supabase login failed", error);
      return toast(error.message || "Unable to login. Please check Supabase user access.");
    } else {
      user = authenticateUser(email, password);
    }
  }
  if (!user) return toast("Invalid user name or password.");
  const masterUser = user.source === "supabase-auth" ? null : staff.find((item) => normalizeEmail(item.email) === normalizeEmail(user.email));
  if (masterUser) {
    user.name = masterUser.name;
    user.role = masterUser.role;
  }
  state.session = { loggedIn: true, userId: user.id, authUserId: user.authUserId || "", userEmail: user.email };
  state.currentUser = user.name;
  state.currentRole = user.role;
  resetFilters();
  activePage = "dashboard";
  saveTabSession();
  if (user.source === "supabase-auth") {
    state.files = [];
    state.fileNotifications = [];
  }
  saveState({ skipMerge: true, skipRemote: true });
  if (!(await loadStateFromApi())) {
    mount();
    autoRecoverAdminDataIfEmpty();
  }
}

function bindShell() {
  const addFileButton = document.querySelector("#addFileButton");
  if (addFileButton) addFileButton.onclick = () => openFileDrawer();
  const sampleImportButton = document.querySelector("#sampleImportButton");
  if (sampleImportButton) sampleImportButton.onclick = downloadImportTemplate;
  const importFileButton = document.querySelector("#importFileButton");
  const importFileInput = document.querySelector("#importFileInput");
  if (importFileButton && importFileInput) {
    importFileButton.onclick = () => {
      importFileInput.click();
    };
    importFileInput.onchange = handleImportFile;
  }
  const runLogout = () => {
    state.session = { loggedIn: false };
    setApiToken("");
    sessionStorage.removeItem(API_REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(API_MODE_KEY);
    resetFilters();
    activePage = "dashboard";
    saveState();
    saveTabSession();
    mount();
  };
  const logoutButton = document.querySelector("#logoutButton");
  if (logoutButton) logoutButton.onclick = runLogout;
  const sidebarLogoutButton = document.querySelector("#sidebarLogoutButton");
  if (sidebarLogoutButton) sidebarLogoutButton.onclick = runLogout;
  const topProfileButton = document.querySelector("#topProfileButton");
  if (topProfileButton) {
    topProfileButton.onclick = () => {
      closeOverlays();
      if (state.currentRole !== "Admin") resetFilters();
      activePage = state.currentRole === "Admin" ? "users" : "dashboard";
      toast(`${state.currentUser || "Profile"} - ${state.currentRole || "User"}`);
      saveState();
      saveTabSession();
      renderAll();
    };
  }
  const sidebarCollapseButton = document.querySelector("#sidebarCollapseButton");
  if (sidebarCollapseButton) {
    sidebarCollapseButton.onclick = () => {
      localStorage.setItem(`${STORAGE_KEY}-sidebar-collapsed`, isSidebarCollapsed() ? "" : "Yes");
      mount();
    };
  }
  document.querySelector("#notifyButton").onclick = () => openNotifications();
  document.querySelector("#chatButton").onclick = () => openTeamChat();
  document.querySelector("#mobileMenu").onclick = () => {
    document.querySelector("#sidebar").classList.add("open");
    document.querySelector("#backdrop").classList.add("show");
  };
  document.querySelector("#backdrop").onclick = closeOverlays;
  document.onkeydown = (event) => {
    if (event.key === "Escape") closeOverlays();
  };
}

function isSidebarCollapsed() {
  return localStorage.getItem(`${STORAGE_KEY}-sidebar-collapsed`) === "Yes";
}

function resetSidebarLayoutForOperationsTheme() {
  const themeVersionKey = `${STORAGE_KEY}-sidebar-theme-version`;
  const currentVersion = "filing-index-operations-20260730";
  if (localStorage.getItem(themeVersionKey) === currentVersion) return;
  localStorage.removeItem(`${STORAGE_KEY}-sidebar-collapsed`);
  localStorage.setItem(themeVersionKey, currentVersion);
}

function userInitials(name) {
  return String(name || "User").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "U";
}

function renderNav() {
  const fileViews = {
    "active-files": "active",
    "completed-files": "completed",
    "not-checked-files": "notChecked",
    "correction-required-files": "correctionRequired",
    "re-assigned-files": "reAssigned",
    "non-billed-files": "nonBilled",
    "billed-files": "billed",
    "fee-pending": "feePending",
    "fee-received": "feeReceived",
  };
  const counts = navBadgeCounts();
  const groups = navGroupDefinitions()
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.adminOnly || state.currentRole === "Admin") }))
    .filter((group) => group.items.length);
  document.querySelector("#nav").innerHTML = groups.map((group) => {
    const activeInGroup = group.items.some((item) => navItemActive(item.id, fileViews));
    const collapsed = group.collapsible && navGroupCollapsed(group.key) && !activeInGroup;
    return `
      <div class="nav-group ${collapsed ? "collapsed" : ""}" data-nav-group="${group.key}">
        <button class="nav-section-title" type="button" data-nav-group-toggle="${group.key}" ${group.collapsible ? "" : "disabled"}>
          <span>${escapeHtml(group.label)}</span>
          ${group.collapsible ? `<strong>${navIcon("chevron")}</strong>` : ""}
        </button>
        <div class="nav-group-items">
          ${group.items.map((item) => navItemButton(item, fileViews, counts)).join("")}
        </div>
      </div>
    `;
  }).join("");
  document.querySelectorAll("[data-nav-group-toggle]").forEach((btn) => {
    btn.onclick = () => {
      const key = btn.dataset.navGroupToggle;
      localStorage.setItem(`${STORAGE_KEY}-nav-group-${key}`, navGroupCollapsed(key) ? "" : "collapsed");
      renderNav();
    };
  });
  document.querySelectorAll("#nav button[data-page]").forEach((btn) => {
    btn.onclick = () => {
      const page = btn.dataset.page;
      if (fileViews[page]) {
        activePage = "files";
        resetFilters();
        state.filters.listView = fileViews[page];
        saveState();
      } else if (page === "my-task") {
        activePage = "files";
        resetFilters();
        state.filters.listView = "active";
        state.filters.dashboardKind = "myTask";
        saveState();
      } else {
        if (page === "files") {
          resetFilters();
          saveState();
        }
        activePage = page;
        saveTabSession();
      }
      closeOverlays();
      mount();
    };
  });
}
function renderAll() {
  if (activePage === "invites") activePage = "users";
  if (activePage === "users" && state.currentRole !== "Admin") activePage = "dashboard";
  if (activePage === "backup" && !canUseBackupPage()) activePage = "dashboard";
  if (activePage === "verification" && !canUseVerificationPage()) activePage = "dashboard";
  if (activePage === "expenses" && !canUseExpenseModule()) activePage = "dashboard";
  if (activePage === "staffDetails" && !canUseStaffDetails()) activePage = "dashboard";
  if (isStaffLogin() && !["dashboard", "files", "staffDetails"].includes(activePage)) activePage = "dashboard";
  if (isStaffLogin() && activePage === "files" && state.filters.listView && !["active", "completed", "notChecked", "correctionRequired", "reAssigned", "nonBilled", "billed", "feePending", "feeReceived"].includes(state.filters.listView) && !state.filters.fromDashboard) {
    state.filters.listView = "active";
  }
  saveTabSession();
  renderNav();
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelector(`#${activePage}`).classList.add("active");
  document.querySelector(".content")?.classList.toggle("dashboard-mode", activePage === "dashboard");
  document.querySelector(".topbar")?.classList.toggle("dashboard-topbar", activePage === "dashboard");
  const titles = {
    dashboard: ["Dashboard", ""],
    files: ["File List", ""],
    staff: ["Staff Performance", ""],
    staffDetails: ["Staff Details", "Manage employee information, birthdays and work anniversaries"],
    users: ["User Management", ""],
    invites: ["Team Invitation", ""],
    visitors: ["Visitors", "Visitor register and office meeting log"],
    dailyReport: ["Daily Report", "Completed files and visitor summary by date"],
    expenses: ["Transactions", "Collections, expenses and cash balance"],
    reports: ["Reports & Export", ""],
    verification: ["Verification", "Confirm staff allotments, status updates and login visibility"],
    backup: ["Backup", "Download a full safety copy of tracker data"],
  };
  if (activePage === "files" && state.filters.listView === "active") titles.files[0] = "Active Files";
  if (activePage === "files" && state.filters.listView === "completed") titles.files[0] = "Completed Files";
  if (activePage === "files" && state.filters.listView === "notChecked") titles.files[0] = "Not Checked Files";
  if (activePage === "files" && state.filters.listView === "reAssigned") titles.files[0] = "Re Assigned Files";
  if (activePage === "files" && state.filters.listView === "nonBilled") titles.files[0] = "Non-Billed Files";
  if (activePage === "files" && state.filters.listView === "billed") titles.files[0] = "Billed Files";
  if (activePage === "files" && state.filters.listView === "feePending") titles.files[0] = "Fee Pending";
  if (activePage === "files" && state.filters.listView === "feeReceived") titles.files[0] = "Fee Received";
  document.querySelector("#pageTitle").textContent = titles[activePage][0];
  const subtitle = document.querySelector("#pageSubtitle");
  subtitle.textContent = titles[activePage][1];
  subtitle.classList.toggle("hidden", !titles[activePage][1]);
  const quoteSlot = document.querySelector("#dailyQuoteSlot");
  if (quoteSlot) {
    const quoteHtml = renderDailyQuoteBanner();
    quoteSlot.innerHTML = quoteHtml;
    quoteSlot.classList.toggle("hidden", !quoteHtml.trim());
    const quoteMinimize = quoteSlot.querySelector("#dailyQuoteMinimize");
    if (quoteMinimize) {
      quoteMinimize.onclick = () => {
        sessionStorage.setItem(DAILY_QUOTE_MINIMIZED_KEY, "Yes");
        quoteSlot.innerHTML = "";
        quoteSlot.classList.add("hidden");
      };
    }
  }
  const topBackButton = document.querySelector("#topBackButton");
  if (topBackButton) {
    topBackButton.classList.toggle("hidden", !(activePage === "files" && state.filters.fromDashboard));
    topBackButton.onclick = () => {
      resetFilters();
      saveState();
      activePage = "dashboard";
      renderAll();
    };
  }
  renderActivePage();
  enforceDateYearCap();
}

function renderActivePage() {
  const renderers = {
    dashboard: renderDashboard,
    files: renderFilesPage,
    staff: renderStaffPage,
    staffDetails: renderStaffDetailsPage,
    users: renderUsersPage,
    visitors: renderVisitorsPage,
    dailyReport: renderDailyReportPage,
    expenses: renderExpensesPage,
    reports: renderReportsPage,
    verification: renderVerificationPage,
    backup: renderBackupPage,
  };
  try {
    (renderers[activePage] || renderDashboard)();
  } catch (error) {
    console.error("Page render failed", error);
    const target = document.querySelector(`#${activePage}`) || document.querySelector("#dashboard");
    if (target) {
      target.innerHTML = `
        <div class="permission-note render-error-note">
          <strong>Unable to load this page.</strong>
          <span>Please refresh once. If it repeats, check the browser console and deployment logs.</span>
        </div>
      `;
    }
  }
}

function enforceDateYearCap() {
  document.querySelectorAll('input[type="date"]').forEach((input) => {
    input.max = "9999-12-31";
  });
}

function renderDashboard() {
  if (isStaffLogin()) {
    const myFiles = visibleFiles().filter((file) => currentFileBelongsToUser(file, loggedInUser()));
    const s = stats(myFiles);
    document.querySelector("#dashboard").innerHTML = `
      ${renderModernStaffDashboardShell(s, myFiles)}
      <div class="dashboard-layout dashboard-single staff-modern-performance-wrap">
        ${renderStaffDashboardPerformance(myFiles)}
      </div>
    `;
    bindDashboardLinks();
    bindFileActions();
    bindStaffDashboardPerformance();
    return;
  }
  const files = visibleFiles();
  const s = stats(files);
  const dataNotice = !s.total ? `
    <div class="permission-note">
      No file data is loaded in this browser. Use Admin login > User Management > Restore Backup, or Pull Data from Site if site sync was previously saved.
    </div>
  ` : "";
  document.querySelector("#dashboard").innerHTML = `
    ${dataNotice}
    ${renderModernDashboardShell(s)}
    <section class="panel dashboard-staff-summary-panel">
      <button class="staff-summary-toggle" id="staffSummaryToggle" type="button">
        <span>Staff-Wise File Summary</span>
        <strong>${dashboardStaffSummaryRows().length} Staff</strong>
      </button>
      <div class="staff-summary-body ${state.filters.dashboardStaffSummaryOpen === "Yes" ? "" : "hidden"}" id="staffSummaryBody">
        <div class="filters colourful-filters dashboard-staff-filters">
          ${dashboardStaffFilter("dashboardStaffName", "Staff Name", ["", ...state.users.map((u) => u.name)])}
          ${dashboardStaffInput("dashboardStaffFrom", "From Date", "date")}
          ${dashboardStaffInput("dashboardStaffTo", "To Date", "date")}
          ${dashboardStaffFilter("dashboardStaffStatus", "File Status", ["", "Pending", "Not Started", "Work in Progress", "On Hold", "Client Pending", "Completed", "Not Checked", "Billed", "Non-Billed", "Overdue"])}
          ${dashboardStaffFilter("dashboardStaffService", "Service Type", ["", ...state.services])}
        </div>
        <div class="action-row dashboard-staff-actions">
          <button class="secondary-button" id="clearDashboardStaffFilters">Clear Filters</button>
          <button class="secondary-button" id="dashboardStaffExcel" ${rolePerm().export ? "" : "disabled"}>Export Excel</button>
          <button class="secondary-button" id="dashboardStaffPdf" ${rolePerm().export ? "" : "disabled"}>Export PDF</button>
        </div>
        ${renderDashboardStaffSummaryTable(dashboardStaffSummaryRows())}
      </div>
    </section>
  `;
  bindDashboardLinks();
  bindModernDashboard();
  bindDashboardStaffSummary();
}

function renderModernStaffDashboardShell(s, files = []) {
  const today = indiaTodayDate();
  const userName = loggedInUser()?.name || state.currentUser || "Staff";
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `
    <section class="modern-dashboard staff-modern-dashboard">
      <div class="dashboard-topbar-card">
        <div class="dashboard-greeting">
          <span class="dashboard-eyebrow">My Workspace</span>
          <h2>${greeting}, ${escapeHtml(userName)}</h2>
          <p>Your allotted files, corrections and pending work for today.</p>
          <span class="dashboard-maker-tag">An App by CA Sadique</span>
        </div>
        <div class="dashboard-compact-filterbar">
          <span class="dashboard-date-pill">${displayDate(today)}</span>
          <span class="dashboard-filter-pill dashboard-today-label" aria-label="Today">Today</span>
        </div>
      </div>
      <div class="dashboard-kpi-grid staff-dashboard-kpi-grid">
        ${dashboardKpiCard("Total Assigned", s.total, "Files assigned to me", "active", "folder", "all", staffTrendValues(files, "total"))}
        ${dashboardKpiCard("Not Started", s.notStarted, "Receipt only", "billed", "file", "notStarted", staffTrendValues(files, "notStarted"))}
        ${dashboardKpiCard("WIP", s.workInProgress, "Work underway", "wip", "task", "wip", staffTrendValues(files, "wip"))}
        ${dashboardKpiCard("Work Done", s.reportsPrepared, "Work marked done", "receivedfee", "check", "workDone", staffTrendValues(files, "workDone"))}
        ${dashboardKpiCard("Approval Pending", s.sharedNotApproved, "Shared not approved", "feepending", "report", "approval", staffTrendValues(files, "approval"), true)}
        ${dashboardKpiCard("Correction Required", s.correctionRequired, "Needs correction", "collectiontoday", "pending", "correction", staffTrendValues(files, "correction"), true)}
        ${dashboardKpiCard("Completed", s.completed, "Completed by me", "completed", "check", "completed", staffTrendValues(files, "completed"))}
        ${dashboardKpiCard("Overdue", s.overdue, "Need attention", "overdue", "pending", "overdue", staffTrendValues(files, "overdue"), true)}
      </div>
    </section>
  `;
}

function staffTrendValues(files = [], kind = "total") {
  const today = Date.parse(indiaTodayDate());
  const days = Array.from({ length: 7 }, (_, index) => new Date(today - (6 - index) * 86400000).toISOString().slice(0, 10));
  return days.map((date) => files.filter((file) => staffTrendMatches(file, kind, date)).length);
}

function staffTrendMatches(file = {}, kind = "total", date = "") {
  const received = normalizeImportDate(file.fileReceivedDate || file.receivedDate || "");
  const updated = normalizeImportDate(file.lastUpdatedDate || file.updatedAt || file.updated_at || "");
  if (kind === "completed") return isCheckedCompleted(file) && normalizeImportDate(workCompletedDate(file)) <= date;
  if (kind === "active") return !isCheckedCompleted(file) && (received <= date || updated <= date);
  if (kind === "notStarted") return stageIndex(file) === 0 && (received <= date || updated <= date);
  if (kind === "wip") return Boolean(file.stages?.WIP) && !isCheckedCompleted(file) && (received <= date || updated <= date);
  if (kind === "workDone") return Boolean(file.stages?.["Work Done"] || file.reportPrepared || file.workDone) && (received <= date || updated <= date);
  if (kind === "overdue") return isOverdue(file) && (received <= date || updated <= date);
  if (kind === "approval") return Boolean(file.shared && !file.approved) && (received <= date || updated <= date);
  if (kind === "correction") return hasOpenCorrection(file) && (received <= date || updated <= date);
  if (kind === "reallotted") return Boolean(file.reAssignedStaff) && normalizeImportDate(file.reAssignedDate || file.workAllotmentDate || "") <= date;
  if (kind === "notChecked") return isNotCheckedFile(file) && (received <= date || updated <= date);
  if (kind === "billed") return isBilledFile(file) && normalizeImportDate(file.billedDate || file.lastUpdatedDate || "") <= date;
  return received <= date || updated <= date;
}

function renderStaffDashboardPerformance(files) {
  const filtered = filterStaffPerformanceFiles(files);
  const completed = filtered.filter(isCheckedCompleted).sort(sortStaffPerformanceFiles);
  const workInProgress = filtered.filter((file) => !isCheckedCompleted(file) && stageIndex(file) > 0).sort(sortStaffPerformanceFiles);
  const notStarted = filtered.filter((file) => !isCheckedCompleted(file) && stageIndex(file) === 0).sort(sortStaffPerformanceFiles);
  return `
    <section class="panel staff-performance-panel">
      <div class="staff-performance-head">
        <div>
          <h3>My Performance</h3>
          <p>${filtered.length} File(s) shown for the selected period</p>
        </div>
        <div class="staff-performance-total">${files.length} Total</div>
      </div>
      <div class="filters colourful-filters staff-performance-controls">
        ${staffPerformanceDateInput("staffPerformanceFrom", "From Date")}
        ${staffPerformanceDateInput("staffPerformanceTo", "To Date")}
        <div class="field">
          <label>Action</label>
          <button class="secondary-button" id="staffPerformanceShow">Show</button>
        </div>
        <div class="field">
          <label>Clear</label>
          <button class="secondary-button" id="staffPerformanceClear">All Files</button>
        </div>
      </div>
      ${renderStaffPerformanceSection("Completed Files", completed, "No completed files found.")}
      ${renderStaffPerformanceSection("Work in Progress Files", workInProgress, "No work in progress files found.")}
      ${renderStaffPerformanceSection("Not Started Files", notStarted, "No not started files found.")}
    </section>
  `;
}

function staffPerformanceDateInput(key, label) {
  return `<div class="field"><label>${label}</label><input type="date" id="${key}" value="${escapeHtml(state.filters[key] || "")}"></div>`;
}

function filterStaffPerformanceFiles(files) {
  const from = state.filters.staffPerformanceFrom || "";
  const to = state.filters.staffPerformanceTo || "";
  if (!from && !to) return [...files];
  return files.filter((file) => {
    const date = staffPerformanceDate(file);
    if (!date) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  });
}

function navGroupDefinitions() {
  if (isStaffLogin()) {
    const notCheckedItem = canViewNotCheckedFiles() ? [navItem("not-checked-files", "pending", "Not Checked Files", "notChecked")] : [];
    return [
      { key: "main", label: "Main", collapsible: false, items: [
        navItem("dashboard", "dashboard", "Dashboard"),
        navItem("my-task", "task", "My Task", "myTask"),
      ] },
      { key: "files", label: "File Management", collapsible: true, items: [
        navItem("active-files", "folder", "Active Files", "active"),
        ...notCheckedItem,
        navItem("correction-required-files", "pending", "Correction Required", "correctionRequired"),
        navItem("re-assigned-files", "users", "Re Assigned Files", "reAssigned"),
        navItem("completed-files", "check", "Completed Files", "completed"),
      ] },
      { key: "billing", label: "Billing Status", collapsible: true, items: [
        navItem("billed-files", "invoice", "Billed Files", "billed"),
        navItem("fee-pending", "rupee", "Fee Pending Files", "feePending"),
        navItem("fee-received", "rupee", "Fee Received", "feeReceived"),
        navItem("non-billed-files", "receipt", "Non Billed Files", "nonBilled"),
      ] },
    ];
  }
  return [
    { key: "main", label: "Main", collapsible: false, items: [
      navItem("dashboard", "dashboard", "Dashboard"),
      navItem("files", "file", "File List"),
    ] },
    { key: "files", label: "File Management", collapsible: true, items: [
      navItem("active-files", "folder", "Active Files", "active"),
      navItem("not-checked-files", "pending", "Not Checked Files", "notChecked"),
      navItem("correction-required-files", "pending", "Correction Required", "correctionRequired"),
      navItem("re-assigned-files", "users", "Re Assigned Files", "reAssigned"),
      navItem("completed-files", "check", "Completed Files", "completed"),
    ] },
    { key: "billing", label: "Billing Status", collapsible: true, items: [
      navItem("non-billed-files", "receipt", "Non-Billed Files", "nonBilled"),
      navItem("billed-files", "invoice", "Billed Files", "billed"),
      navItem("fee-pending", "rupee", "Fee Pending", "feePending"),
      navItem("fee-received", "rupee", "Fee Received", "feeReceived"),
    ] },
    { key: "reports", label: "Reports & Operations", collapsible: true, items: [
      navItem("dailyReport", "report", "Daily Report M&A"),
      navItem("visitors", "users", "Visitors"),
      navItem("staff", "chart", "Staff Performance"),
      ...(canUseVerificationPage() ? [navItem("verification", "check", "Verification")] : []),
    ] },
    { key: "admin", label: "Administration", collapsible: true, items: [
      navItem("expenses", "expense", "Transactions"),
      navItem("staffDetails", "idcard", "Staff Details"),
      ...(canUseBackupPage() ? [navItem("backup", "backup", "Backup")] : []),
      navItem("users", "lock", "User Management", "", true),
    ] },
  ];
}

function navItem(id, icon, label, countKey = "", adminOnly = false) {
  return { id, icon, label, countKey, adminOnly };
}

function navItemButton(item, fileViews, counts) {
  const active = navItemActive(item.id, fileViews);
  const count = counts[item.countKey] || 0;
  return `<button data-page="${item.id}" class="nav-item ${active ? "active" : ""}" title="${escapeHtml(item.label)}">
    <span class="nav-icon">${navIcon(item.icon)}</span>
    <span class="nav-label">${escapeHtml(item.label)}</span>
    ${count ? `<span class="nav-badge nav-badge-${item.countKey}">${count}</span>` : ""}
  </button>`;
}

function navItemActive(id, fileViews) {
  const specialActive = fileViews[id] && activePage === "files" && state.filters.listView === fileViews[id] && !(id === "active-files" && state.filters.dashboardKind === "myTask");
  const normalActive = activePage === id && !fileViews[id] && (id !== "files" || !state.filters.listView);
  const myTaskActive = id === "my-task" && activePage === "files" && state.filters.listView === "active" && state.filters.dashboardKind === "myTask" && isStaffLogin();
  return Boolean(normalActive || specialActive || myTaskActive);
}

function navBadgeCounts() {
  const files = visibleFiles();
  const currentFiles = isStaffLogin() ? files.filter((file) => currentFileBelongsToUser(file, loggedInUser())) : files;
  return {
    myTask: currentFiles.filter((file) => !isCheckedCompleted(file)).length,
    active: currentFiles.filter((file) => !isCheckedCompleted(file)).length,
    notChecked: currentFiles.filter(isNotCheckedFile).length,
    correctionRequired: currentFiles.filter(hasOpenCorrection).length,
    reAssigned: files.filter((file) => isReassignedFile(file) && (!isStaffLogin() || reassignmentVisibleToUser(file, loggedInUser()))).length,
    completed: currentFiles.filter(isCheckedCompleted).length,
    nonBilled: currentFiles.filter(isNonBilledFile).length,
    billed: currentFiles.filter(isBilledFile).length,
    feePending: currentFiles.filter(isFeePendingFile).length,
    feeReceived: currentFiles.filter(isFeeReceivedFile).length,
  };
}

function navGroupCollapsed(key) {
  return localStorage.getItem(`${STORAGE_KEY}-nav-group-${key}`) === "collapsed";
}

function navIcon(name) {
  const icons = {
    dashboard: '<svg viewBox="0 0 24 24"><path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Z"/></svg>',
    task: '<svg viewBox="0 0 24 24"><path d="M7 4h10l2 2v14H5V6l2-2Zm1 5h8V7H8v2Zm0 4h8v-2H8v2Zm0 4h5v-2H8v2Z"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6V3Zm7 1.8V8h3.2L13 4.8ZM8 12h8v-2H8v2Zm0 4h8v-2H8v2Z"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M3 6h7l2 2h9v10.5A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5V6Zm2 4v8.5c0 .28.22.5.5.5h13a.5.5 0 0 0 .5-.5V10H5Z"/></svg>',
    pending: '<svg viewBox="0 0 24 24"><path d="M12 2 2 20h20L12 2Zm1 14h-2v2h2v-2Zm0-7h-2v5h2V9Z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.4-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7Z"/></svg>',
    receipt: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21V3Zm3 5h6V6H9v2Zm0 4h6v-2H9v2Zm0 4h4v-2H9v2Z"/></svg>',
    invoice: '<svg viewBox="0 0 24 24"><path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-1.4V3Zm4 5h6V6H9v2Zm0 4h6v-2H9v2Zm0 4h4v-2H9v2Z"/></svg>',
    rupee: '<svg viewBox="0 0 24 24"><path d="M7 4h11v2h-4.2c.5.5.9 1.2 1 2H18v2h-3.3c-.4 2.3-2.3 3.8-5.1 4l5.5 6h-3L6.4 13.7V12h2.8c1.7 0 2.8-.7 3.2-2H7V8h5.2C11.8 6.8 10.7 6 9 6H7V4Z"/></svg>',
    expense: '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4V5Zm2 2v10h12V7H6Zm2 2h5v2H8V9Zm0 4h8v2H8v-2Zm8-4h1v2h-1V9Z"/></svg>',
    idcard: '<svg viewBox="0 0 24 24"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 4v10h16V8H4Zm3 2h5v6H7v-6Zm7 1h4v2h-4v-2Zm0 4h3v1.5h-3V15Z"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><path d="M20 7h-2.2A3 3 0 0 0 12 5.8 3 3 0 0 0 6.2 7H4v5h1v9h14v-9h1V7Zm-7-1a1 1 0 1 1 1 1h-1V6Zm-3 0v1H9a1 1 0 1 1 1-1Zm-4 5V9h5v2H6Zm1 8v-6h4v6H7Zm6 0v-6h4v6h-4Zm5-8h-5V9h5v2Z"/></svg>',
    award: '<svg viewBox="0 0 24 24"><path d="M12 2a6 6 0 0 1 3.6 10.8L17 22l-5-2-5 2 1.4-9.2A6 6 0 0 1 12 2Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-1 10.9-.7 4.2 1.7-.7 1.7.7-.7-4.2a6.5 6.5 0 0 1-2 0Z"/></svg>',
    report: '<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5V3Zm3 14h8v-2H8v2Zm0-4h8v-2H8v2Zm0-4h5V7H8v2Z"/></svg>',
    users: '<svg viewBox="0 0 24 24"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.3 0-6 1.7-6 3.8V20h12v-3.2C15 14.7 12.3 13 9 13Zm8.5-1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm.5 1.2c-.9 0-1.7.1-2.4.4 1.1.8 1.9 1.9 1.9 3.2V20H22v-3c0-2.1-1.8-3.8-4-3.8Z"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 19h16v2H4V3h2v16Zm4-2h3V9H8v8Zm5 0h3V5h-3v12Zm5 0h3v-6h-3v6Z"/></svg>',
    database: '<svg viewBox="0 0 24 24"><path d="M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Zm-8 5c1.5 1.3 4.4 2 8 2s6.5-.7 8-2v4c0 1.7-3.6 3-8 3s-8-1.3-8-3V8Zm0 6c1.5 1.3 4.4 2 8 2s6.5-.7 8-2v4c0 1.7-3.6 3-8 3s-8-1.3-8-3v-4Z"/></svg>',
    filterOff: '<svg viewBox="0 0 24 24"><path d="M3.3 2 2 3.3l7.2 7.2V20l3.1-1.8L20.7 22l1.3-1.3L3.3 2ZM4 5h1.2l2 2H7.4L11 11.2v3.3L9 15.7V12L4 5Zm5.8 2-2-2H20l-6 7v1.2l-2-2V11l3.4-4H9.8Z"/></svg>',
    spreadsheet: '<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5V3Zm2 2v4h4V5H7Zm6 0v4h4V5h-4ZM7 11v3h4v-3H7Zm6 0v3h4v-3h-4ZM7 16v3h4v-3H7Zm6 0v3h4v-3h-4Z"/></svg>',
    pdf: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6V3Zm7 1.8V8h3.2L13 4.8ZM8 12h2.4c1.4 0 2.3.8 2.3 2.1s-.9 2.1-2.3 2.1h-.8V18H8v-6Zm1.6 2.8h.7c.5 0 .8-.3.8-.7s-.3-.7-.8-.7h-.7v1.4Zm3.9-2.8h2c1.6 0 2.7 1.2 2.7 3s-1.1 3-2.7 3h-2v-6Zm1.6 4.6h.3c.7 0 1.2-.5 1.2-1.6s-.5-1.6-1.2-1.6h-.3v3.2Z"/></svg>',
    print: '<svg viewBox="0 0 24 24"><path d="M7 3h10v5H7V3Zm-2 7h14a3 3 0 0 1 3 3v5h-4v3H6v-3H2v-5a3 3 0 0 1 3-3Zm3 7v2h8v-5H8v3Zm10-3h2v-1a1 1 0 0 0-1-1h-1v2ZM5 12a1 1 0 0 0-1 1v1h2v-2H5Z"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2h9A3.5 3.5 0 0 1 20 5.5v6A3.5 3.5 0 0 1 16.5 15H10l-5 4v-4.3A3.5 3.5 0 0 1 4 12.2V5.5Zm4 2.2v1.8h8V7.7H8Zm0 4h5.5V10H8v1.7Z"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M12 22a2.8 2.8 0 0 0 2.7-2h-5.4A2.8 2.8 0 0 0 12 22Zm7-6-1.7-2.1V9a5.4 5.4 0 0 0-4.3-5.3V2h-2v1.7A5.4 5.4 0 0 0 6.7 9v4.9L5 16v2h14v-2Z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><path d="M10.5 4a6.5 6.5 0 0 1 5.1 10.5l4 4-1.4 1.4-4-4A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="m10.8 5.4 1.4 1.4L9 10h10v2H9l3.2 3.2-1.4 1.4L5.2 11l5.6-5.6Z"/></svg>',
    backup: '<svg viewBox="0 0 24 24"><path d="M12 3a7 7 0 0 1 7 7v1h2l-3 4-3-4h2v-1a5 5 0 0 0-8.9-3.1L6.7 5.5A7 7 0 0 1 12 3ZM6 13v1a5 5 0 0 0 8.9 3.1l1.4 1.4A7 7 0 0 1 5 14v-1H3l3-4 3 4H6Z"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0 1 10 0v2h2v11H5V10h2Zm2 0h6V8a3 3 0 0 0-6 0v2Zm4 7.7V14h-2v3.7h2Z"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24"><path d="M9 4h6l1 2h4v14H4V6h4l1-2Zm1.2 2h3.6l-.3-.6h-3l-.3.6ZM6 10v8h12v-8H6Z"/></svg>',
    logout: '<svg viewBox="0 0 24 24"><path d="M5 3h8v2H7v14h6v2H5V3Zm11.6 5.4L20.2 12l-3.6 3.6-1.4-1.4 1.2-1.2H10v-2h6.4l-1.2-1.2 1.4-1.4Z"/></svg>',
    chevron: '<svg viewBox="0 0 24 24"><path d="m8 9 4 4 4-4 1.4 1.4L12 15.8l-5.4-5.4L8 9Z"/></svg>',
  };
  return icons[name] || icons.file;
}

function staffPerformanceDate(file) {
  return normalizeImportDate(
    isCheckedCompleted(file)
      ? workCompletedDate(file)
      : (file.workAllotmentDate || file.fileReceivedDate || file.dueDate || file.lastUpdatedDate)
  );
}

function sortStaffPerformanceFiles(a, b) {
  return fileSerialSortValue(a) - fileSerialSortValue(b);
}

function renderStaffPerformanceSection(title, files, emptyText) {
  return `
    <div class="staff-performance-section">
      <div class="staff-performance-section-title">
        <h4>${title}</h4>
        <span>${files.length}</span>
      </div>
      ${files.length ? renderStaffFileTable(files, "") : empty(emptyText)}
    </div>
  `;
}

function bindStaffDashboardPerformance() {
  const fromInput = document.querySelector("#staffPerformanceFrom");
  const toInput = document.querySelector("#staffPerformanceTo");
  const apply = () => {
    state.filters.staffPerformanceFrom = fromInput?.value || "";
    state.filters.staffPerformanceTo = toInput?.value || "";
    saveState();
    renderDashboard();
  };
  const showButton = document.querySelector("#staffPerformanceShow");
  if (showButton) showButton.onclick = apply;
  [fromInput, toInput].forEach((input) => {
    if (!input) return;
    input.onkeydown = (event) => {
      if (event.key === "Enter") apply();
    };
  });
  const clearButton = document.querySelector("#staffPerformanceClear");
  if (clearButton) {
    clearButton.onclick = () => {
      state.filters.staffPerformanceFrom = "";
      state.filters.staffPerformanceTo = "";
      saveState();
      renderDashboard();
    };
  }
}

function metric(label, value, note, className, filterKey = "") {
  return `<button class="metric-card ${className}" data-dashboard-filter="${filterKey}"><span>${label}</span><strong>${value}</strong><p>${note}</p></button>`;
}

function renderModernDashboardShell(s) {
  const files = visibleFiles();
  const financials = dashboardFinancials();
  const today = indiaTodayDate();
  const userName = loggedInUser()?.name || state.currentUser || "CA Sadique";
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `
    <section class="modern-dashboard">
      <div class="dashboard-topbar-card">
        <div class="dashboard-greeting">
          <span class="dashboard-eyebrow">Office Overview</span>
          <h2>${greeting}, ${escapeHtml(userName)}</h2>
          <p>Here's what's happening in your office today.</p>
          <span class="dashboard-maker-tag">An App by CA Sadique</span>
        </div>
        <div class="dashboard-compact-filterbar">
          <span class="dashboard-date-pill">${displayDate(today)}</span>
          <span class="dashboard-filter-pill dashboard-today-label" aria-label="Today">Today</span>
        </div>
      </div>
      <div class="dashboard-kpi-grid">
        ${dashboardKpiCard("Total Active Files", s.total, "All visible records", "active", "folder", "all", dashboardTrendValues("total"))}
        ${dashboardKpiCard("Files Received", dashboardFilesReceivedToday(files), "Received today", "received", "file", "all", dashboardTrendValues("received"))}
        ${dashboardKpiCard("Work in Progress", s.workInProgress, "Currently under work", "wip", "task", "wip", dashboardTrendValues("wip"))}
        ${dashboardKpiCard("Completed Files", s.completed, "Marked completed", "completed", "check", "completed", dashboardTrendValues("completed"))}
        ${dashboardKpiCard("Overdue Files", s.overdue, "Needs immediate follow-up", "overdue", "pending", "overdue", dashboardTrendValues("overdue"), true)}
        ${dashboardKpiCard("Not Checked", s.notChecked, "Awaiting checking", "notchecked", "report", "notChecked", dashboardTrendValues("notChecked"), true)}
        ${dashboardKpiCard("Total Billed", financials.totalBilled, "Billable amount", "billed", "invoice", "billed", dashboardTrendValues("billed"), false, true)}
        ${dashboardKpiCard("Fee Received", financials.feeReceived, "Collected fees", "receivedfee", "rupee", "billed", dashboardTrendValues("feeReceived"), false, true)}
        ${dashboardKpiCard("Fee Pending", financials.feePending, "Receivable amount", "feepending", "receipt", "feePending", dashboardTrendValues("feePending"), true, true)}
        ${dashboardKpiCard("Collections Today", financials.collectionsToday, "Today's collections", "collectiontoday", "expense", "collections", dashboardTrendValues("collections"), false, true)}
        ${dashboardKpiCard("Expenses Today", financials.expensesToday, "Today's expenses", "expensetoday", "receipt", "expenses", dashboardTrendValues("expenses"), true, true)}
        ${dashboardKpiCard("Cash Balance", financials.cashBalance, "Closing cash position", "cash", "rupee", "balance", dashboardTrendValues("cash"), financials.cashBalance < 0, true)}
      </div>
      <div class="dashboard-chart-grid">
        ${renderFilesByStatusCard(files)}
        ${renderReceivedCompletedTrendCard(files)}
        ${renderFeeCollectionOverviewCard(financials)}
      </div>
      <div class="dashboard-lower-grid">
        ${renderRecentActivitiesCard()}
        ${renderUpcomingDueDatesCard(files)}
        ${renderStaffCelebrationsCard()}
      </div>
    </section>
  `;
}

function dashboardKpiCard(title, value, note, tone, icon, filterKey, trendValues = [], adverse = false, currency = false) {
  const numeric = Number(value || 0);
  const trend = trendValues.length > 1 ? trendValues[trendValues.length - 1] - trendValues[0] : 0;
  const trendClass = adverse ? (trend <= 0 ? "positive" : "negative") : (trend >= 0 ? "positive" : "negative");
  const trendSymbol = trend >= 0 ? "up" : "down";
  return `<button class="dashboard-kpi-card kpi-${tone}" data-dashboard-filter="${filterKey}">
    <div class="dashboard-kpi-top">
      <span class="dashboard-kpi-icon">${navIcon(icon)}</span>
      <span class="dashboard-kpi-title">${escapeHtml(title)}</span>
    </div>
    <strong class="${numeric < 0 ? "negative-amount" : ""}">${currency ? rupee(numeric) : numeric.toLocaleString("en-IN")}</strong>
    <div class="dashboard-kpi-meta">
      <span class="kpi-trend ${trendClass}">${trendSymbol === "up" ? "&uarr;" : "&darr;"} ${Math.abs(trend).toLocaleString("en-IN")}</span>
      <small>${escapeHtml(note)}</small>
    </div>
    ${miniTrendSvg(trendValues, tone)}
  </button>`;
}

function dashboardFinancials() {
  const files = visibleFiles();
  const today = indiaTodayDate();
  const totalBilled = files.filter(isBilledFile).reduce((sum, file) => sum + dashboardFileAmount(file, "billed"), 0);
  const feeReceived = files.filter((file) => file.feeReceived).reduce((sum, file) => sum + dashboardFileAmount(file, "received"), 0);
  const feePending = Math.max(totalBilled - feeReceived, 0);
  const collectionsToday = (state.otherCashCollections || []).filter((item) => item.date === today).reduce((sum, item) => sum + Number(item.amount || 0), 0)
    + files.filter((file) => file.feeReceived && (file.feeReceivedDate || file.lastUpdatedDate) === today).reduce((sum, file) => sum + dashboardFileAmount(file, "received"), 0);
  const expensesToday = (state.expenses || []).filter((item) => item.date === today).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return { totalBilled, feeReceived, feePending, collectionsToday, expensesToday, cashBalance: cashBalanceForRange().closing };
}

function dashboardFileAmount(file, kind = "billed") {
  const received = Number(file.amount_received || file.amountReceived || file.feeReceivedAmount || 0);
  const billed = Number(file.feeAmount || file.billAmount || file.amount || file.billedAmount || received || 0);
  return kind === "received" ? received : billed;
}

function dashboardFilesReceivedToday(files = visibleFiles()) {
  const today = indiaTodayDate();
  return files.filter((file) => (file.fileReceivedDate || file.createdAt || "").slice(0, 10) === today).length;
}

function dashboardTrendValues(kind) {
  const today = new Date(`${indiaTodayDate()}T00:00:00+05:30`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const iso = dateInput(date);
    const files = visibleFiles();
    if (kind === "received") return files.filter((file) => file.fileReceivedDate === iso).length;
    if (kind === "completed") return files.filter((file) => workCompletedDate(file) === iso || file.lastUpdatedDate === iso && isCheckedCompleted(file)).length;
    if (kind === "wip") return files.filter((file) => file.stages?.WIP && !isCheckedCompleted(file) && (file.workStartedDate || file.lastUpdatedDate || "") <= iso).length;
    if (kind === "overdue") return files.filter((file) => file.dueDate && file.dueDate < iso && !isCheckedCompleted(file)).length;
    if (kind === "notChecked") return files.filter(isNotCheckedFile).length;
    if (kind === "billed") return files.filter((file) => file.billedDate === iso).length;
    if (kind === "feeReceived") return files.filter((file) => file.feeReceivedDate === iso).length;
    if (kind === "feePending") return files.filter(isFeePendingFile).length;
    if (kind === "collections") return (state.otherCashCollections || []).filter((item) => item.date === iso).length;
    if (kind === "expenses") return (state.expenses || []).filter((item) => item.date === iso).length;
    if (kind === "cash") return cashBalanceForRange("", iso).closing;
    return files.length;
  });
}

function miniTrendSvg(values = [], tone = "active") {
  const nums = values.length ? values.map((value) => Number(value || 0)) : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...nums, 1);
  const min = Math.min(...nums, 0);
  const span = Math.max(max - min, 1);
  const points = nums.map((value, index) => `${index * 18},${32 - ((value - min) / span) * 24}`).join(" ");
  return `<svg class="dashboard-mini-trend trend-${tone}" viewBox="0 0 108 36" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}" /></svg>`;
}

function renderFilesByStatusCard(files) {
  const rows = dashboardStatusRows(files);
  const total = Math.max(files.length, 1);
  return `<section class="dashboard-data-card files-status-card">
    <div class="dashboard-card-head"><div><h3>Files by Status</h3><p>${files.length} total file(s)</p></div><button class="mini-button" data-dashboard-filter="all">View All</button></div>
    <div class="dashboard-donut-wrap">
      ${statusDonutSvg(rows, files.length)}
      <div class="status-legend">${rows.map((row) => `<div><span style="background:${row.color}"></span><strong>${row.label}</strong><em>${row.count}</em><small>${Math.round((row.count / total) * 100)}%</small></div>`).join("")}</div>
    </div>
  </section>`;
}

function dashboardStatusRows(files = visibleFiles()) {
  return [
    { label: "Received", count: files.filter((file) => stageIndex(file) === 0 && !isCheckedCompleted(file)).length, color: "#2563eb" },
    { label: "Work in Progress", count: files.filter((file) => stageIndex(file) > 0 && !isCheckedCompleted(file)).length, color: "#f59e0b" },
    { label: "Completed", count: files.filter(isCheckedCompleted).length, color: "#3b82f6" },
    { label: "Not Checked", count: files.filter(isNotCheckedFile).length, color: "#06b6d4" },
    { label: "Returned", count: files.filter((file) => file.stages?.["Correction Required"]).length, color: "#ef4444" },
  ];
}

function statusDonutSvg(rows, total) {
  const circumference = 100;
  let offset = 25;
  const circles = rows.map((row) => {
    const length = total ? (row.count / total) * circumference : 0;
    const circle = `<circle r="15.915" cx="18" cy="18" fill="transparent" stroke="${row.color}" stroke-width="5" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${offset}" />`;
    offset -= length;
    return circle;
  }).join("");
  return `<div class="dashboard-donut"><svg viewBox="0 0 36 36">${circles}</svg><strong>${total}</strong><span>Total</span></div>`;
}

function renderReceivedCompletedTrendCard(files) {
  const rows = dashboardLastSevenDates().map((date) => ({
    date,
    received: files.filter((file) => file.fileReceivedDate === date).length,
    completed: files.filter((file) => workCompletedDate(file) === date || (file.lastUpdatedDate === date && isCheckedCompleted(file))).length,
  }));
  return `<section class="dashboard-data-card">
    <div class="dashboard-card-head"><div><h3>Files Received vs Completed</h3><p>Last 7 days</p></div><select class="dashboard-period-select"><option>7 Days</option></select></div>
    ${lineTrendSvg(rows)}
  </section>`;
}

function dashboardLastSevenDates() {
  const today = new Date(`${indiaTodayDate()}T00:00:00+05:30`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return dateInput(date);
  });
}

function lineTrendSvg(rows) {
  const max = Math.max(...rows.flatMap((row) => [row.received, row.completed]), 1);
  const toPoints = (key) => rows.map((row, index) => `${24 + index * 39},${142 - (row[key] / max) * 96}`).join(" ");
  return `<svg class="dashboard-line-chart" viewBox="0 0 280 170" role="img" aria-label="Files received and completed trend">
    <g class="grid-lines"><line x1="20" y1="46" x2="266" y2="46"/><line x1="20" y1="94" x2="266" y2="94"/><line x1="20" y1="142" x2="266" y2="142"/></g>
    <polyline class="line-received" points="${toPoints("received")}"></polyline>
    <polyline class="line-completed" points="${toPoints("completed")}"></polyline>
    ${rows.map((row, index) => `<text x="${24 + index * 39}" y="162">${row.date.slice(8)}</text>`).join("")}
  </svg>
  <div class="chart-legend-inline"><span class="blue-dot"></span>Received <span class="cyan-dot"></span>Completed</div>`;
}

function renderFeeCollectionOverviewCard(financials) {
  const percent = financials.totalBilled ? Math.min(100, Math.round((financials.feeReceived / financials.totalBilled) * 100)) : 0;
  return `<section class="dashboard-data-card fee-overview-card">
    <div class="dashboard-card-head"><div><h3>Fee Collection Overview</h3><p>Collection progress</p></div></div>
    <div class="fee-gauge" style="--fee-percent:${percent}">
      <div class="fee-gauge-arc"></div>
      <strong>${percent}%</strong>
      <span>Collected</span>
    </div>
    <div class="fee-breakdown">
      <div><span>Total Billed</span><strong>${rupee(financials.totalBilled)}</strong></div>
      <div><span>Total Received</span><strong>${rupee(financials.feeReceived)}</strong></div>
      <div><span>Pending Amount</span><strong>${rupee(financials.feePending)}</strong></div>
    </div>
  </section>`;
}

function renderRecentActivitiesCard() {
  const rows = dashboardRecentActivities().slice(0, 8);
  return `<section class="dashboard-data-card dashboard-list-card">
    <div class="dashboard-card-head"><div><h3>Recent Activities</h3><p>Newest first</p></div><button class="mini-button" id="dashboardViewActivities">View All</button></div>
    <div class="dashboard-list-scroll">${rows.length ? rows.map((row) => `<div class="dashboard-activity-row"><span class="activity-dot ${row.tone}">${navIcon(row.icon)}</span><div><strong>${escapeHtml(row.title)}</strong><p>${escapeHtml(row.text)}</p></div><time>${escapeHtml(row.time)}</time></div>`).join("") : dashboardEmptyState("No recent activity")}</div>
  </section>`;
}

function dashboardRecentActivities() {
  const auditRows = (state.auditLog || []).map((item) => ({
    title: item.action || "Activity",
    text: `${item.user || state.currentUser || "Team"}${item.role ? ` - ${item.role}` : ""}`,
    time: item.at ? new Date(item.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "",
    sort: Date.parse(item.at || "") || 0,
    tone: "blue",
    icon: "report",
  }));
  const chatRows = unreadChatMessages().slice(0, 5).map((item) => ({
    title: "Chat notification",
    text: `${item.user || "Team"}: ${item.text || "Attachment shared"}`,
    time: item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "",
    sort: Date.parse(item.createdAt || "") || 0,
    tone: "purple",
    icon: "users",
  }));
  return [...auditRows, ...chatRows].sort((a, b) => b.sort - a.sort);
}

function renderUpcomingDueDatesCard(files) {
  const rows = files
    .filter((file) => !isCheckedCompleted(file) && file.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8);
  return `<section class="dashboard-data-card dashboard-list-card">
    <div class="dashboard-card-head"><div><h3>Upcoming Due Dates</h3><p>Open files and tasks</p></div><button class="mini-button" data-dashboard-filter="overdue">View All</button></div>
    <div class="dashboard-list-scroll">${rows.length ? rows.map((file) => `<div class="dashboard-due-row ${isOverdue(file) ? "is-overdue" : ""}"><div class="due-date-badge"><strong>${String(displayDate(file.dueDate)).slice(0, 2)}</strong><span>${String(displayDate(file.dueDate)).slice(3, 6)}</span></div><div><strong>${escapeHtml(file.name)}</strong><p>${escapeHtml(file.client || file.pan || file.serviceType || "")}</p></div><span class="priority-badge priority-${String(file.priority || "Normal").toLowerCase()}">${escapeHtml(file.priority || "Normal")}</span></div>`).join("") : dashboardEmptyState("No upcoming due dates")}</div>
  </section>`;
}

function renderVisitorsTodayCard(visitors) {
  return `<section class="dashboard-data-card dashboard-list-card">
    <div class="dashboard-card-head"><div><h3>Visitors Today</h3><p>${visitors.length} visitor(s)</p></div><button class="mini-button" data-page="visitors">View All</button></div>
    ${visitorHourlyTrendSvg(visitors)}
    <div class="dashboard-list-scroll">${visitors.length ? visitors.slice(0, 7).map((visitor) => `<div class="dashboard-visitor-row"><span>${escapeHtml((visitor.visitorName || "V").slice(0, 1).toUpperCase())}</span><div><strong>${escapeHtml(visitor.visitorName || "")}</strong><p>${escapeHtml(visitor.visitTime || "")} - Met ${escapeHtml(visitor.metWhom || "")}</p></div></div>`).join("") : dashboardEmptyState("No visitors today")}</div>
  </section>`;
}

function renderStaffCelebrationsCard() {
  const birthdays = staffBirthdaysThisMonth();
  const anniversaries = staffAnniversariesThisMonth();
  return `<section class="dashboard-data-card dashboard-list-card staff-celebration-card">
    <div class="dashboard-card-head">
      <div><h3>Staff Celebrations This Month</h3><p>Birthdays and work anniversaries</p></div>
      <button class="mini-button" data-staff-details-filter="all">View All</button>
    </div>
    <div class="staff-celebration-grid">
      ${renderCelebrationSection("Birthdays This Month", birthdays, "gift", "birthday")}
      ${renderCelebrationSection("Work Anniversaries This Month", anniversaries, "award", "anniversary")}
    </div>
  </section>`;
}

function renderCelebrationSection(title, rows, icon, type) {
  const emptyText = type === "birthday" ? "No staff birthdays this month." : "No work anniversaries this month.";
  return `<div class="celebration-section celebration-${type}">
    <div class="celebration-section-head">
      <span>${navIcon(icon)}</span>
      <strong>${escapeHtml(title)}</strong>
      <button class="mini-button" data-staff-details-filter="${type}">View All</button>
    </div>
    <div class="celebration-list">
      ${rows.length ? rows.slice(0, 5).map((row) => {
        const celebrated = row.eventDate < indiaTodayDate();
        const detail = type === "birthday"
          ? `${staffShortDate(row.eventDate)}${celebrated ? " · Celebrated" : ""}`
          : `${staffShortDate(row.eventDate)} · ${row.completedYears} ${row.completedYears === 1 ? "Year" : "Years"}${celebrated ? " · Celebrated" : ""}`;
        return `<div class="celebration-row">
          <span class="celebration-avatar">${escapeHtml(userInitials(row.staffName))}</span>
          <div><strong>${escapeHtml(row.staffName)}</strong><p>${escapeHtml(detail)}</p></div>
        </div>`;
      }).join("") : dashboardEmptyState(emptyText)}
    </div>
  </div>`;
}

function dashboardVisitorsToday() {
  const today = indiaTodayDate();
  return (state.visitors || []).filter((visitor) => visitor.date === today).sort(visitorNewestFirst);
}

function visitorHourlyTrendSvg(visitors) {
  const buckets = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((hour) => visitors.filter((visitor) => Number(String(visitor.visitTime || "").slice(0, 2)) === hour).length);
  const max = Math.max(...buckets, 1);
  return `<div class="visitor-bars">${buckets.map((count, index) => `<span title="${9 + index}:00" style="height:${Math.max(6, (count / max) * 36)}px"></span>`).join("")}</div>`;
}

function dashboardEmptyState(text) {
  return `<div class="dashboard-empty-state">${escapeHtml(text)}</div>`;
}

function bindModernDashboard() {
  document.querySelectorAll(".modern-dashboard [data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      activePage = button.dataset.page;
      saveState();
      renderAll();
    });
  });
  document.querySelectorAll("[data-staff-details-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.staffDetailsFilter || "";
      activePage = "staffDetails";
      state.filters.staffBirthdayMonth = filter === "birthday" ? String(currentIndiaYearMonth().month).padStart(2, "0") : "";
      state.filters.staffJoiningMonth = filter === "anniversary" ? String(currentIndiaYearMonth().month).padStart(2, "0") : "";
      saveViewState();
      renderAll();
    });
  });
}

function dashboardStatusCards() {
  const files = visibleFiles();
  const count = (predicate) => files.filter(predicate).length;
  return [
    { key: "all", label: "Total Files", count: files.length, icon: "TF", tone: "tone-blue" },
    { key: "notStarted", label: "Not Started", count: count((f) => stageIndex(f) === 0), icon: "NS", tone: "tone-slate" },
    { key: "wip", label: "Work in Progress", count: count((f) => f.stages?.WIP && !isCheckedCompleted(f)), icon: "WP", tone: "tone-blue" },
    { key: "onHold", label: "On Hold", count: count((f) => f.stages?.["On Hold"]), icon: "OH", tone: "tone-amber" },
    { key: "clientPending", label: "Client Pending", count: count((f) => f.stages?.["Client Pending"]), icon: "CP", tone: "tone-amber" },
    { key: "awaitingApproval", label: "Awaiting Approval", count: count(pendingApproval), icon: "AA", tone: "tone-amber" },
    { key: "completed", label: "Completed", count: count(isCheckedCompleted), icon: "CP", tone: "tone-green" },
    { key: "notChecked", label: "Not Checked", count: count(isNotCheckedFile), icon: "NC", tone: "tone-amber" },
    { key: "correction", label: "Correction Required", count: count((f) => f.stages?.["Correction Required"]), icon: "CR", tone: "tone-red" },
    { key: "billed", label: "Billed", count: count(isBilledFile), icon: "BL", tone: "tone-cyan" },
    { key: "unbilled", label: "Non-Billed", count: count(isNonBilledFile), icon: "NB", tone: "tone-pink" },
    { key: "feePending", label: "Fee Pending", count: count(isFeePendingFile), icon: "FP", tone: "tone-red" },
    { key: "overdue", label: "Overdue", count: count(isOverdue), icon: "OD", tone: "tone-red" },
  ];
}

function dashboardStaffInput(id, label, type = "text") {
  return `<div class="field"><label>${label}</label><input id="${id}" type="${type}" value="${escapeHtml(state.filters[id] || "")}"></div>`;
}

function dashboardStaffFilter(id, label, options) {
  return `<div class="field"><label>${label}</label><select id="${id}">${options.map((item) => `<option value="${escapeHtml(item)}" ${state.filters[id] === item ? "selected" : ""}>${item || "All"}</option>`).join("")}</select></div>`;
}

function dashboardStaffSummaryRows() {
  const selectedStaff = state.filters.dashboardStaffName || "";
  const fromDate = state.filters.dashboardStaffFrom || "";
  const toDate = state.filters.dashboardStaffTo || "";
  const selectedStatus = state.filters.dashboardStaffStatus || "";
  const selectedService = state.filters.dashboardStaffService || "";
  return state.users
    .filter((user) => !selectedStaff || user.name === selectedStaff)
    .map((user) => {
      const rows = visibleFiles().filter((file) => {
        if (!fileBelongsToUser(file, user) && !sameStaffName(file.assignedStaff, user.name)) return false;
        if (selectedService && file.serviceType !== selectedService) return false;
        const fileDate = file.workAllotmentDate || file.fileReceivedDate || file.lastUpdatedDate || file.dueDate || "";
        if (fromDate && fileDate < fromDate) return false;
        if (toDate && fileDate > toDate) return false;
        if (selectedStatus && !dashboardFileMatchesStatus(file, selectedStatus)) return false;
        return true;
      });
      return {
        "Staff Name": user.name,
        "Total Assigned": rows.length,
        Pending: rows.filter((f) => !isCheckedCompleted(f)).length,
        "Not Started": rows.filter((f) => stageIndex(f) === 0).length,
        WIP: rows.filter((f) => stageIndex(f) > 0 && !isCheckedCompleted(f)).length,
        Completed: rows.filter(isCheckedCompleted).length,
        Overdue: rows.filter(isOverdue).length,
      };
    })
    .filter((row) => row["Total Assigned"] > 0 || selectedStaff);
}

function dashboardFileMatchesStatus(file, status) {
  if (status === "Pending") return !isCheckedCompleted(file);
  if (status === "Not Started") return stageIndex(file) === 0;
  if (status === "Work in Progress") return stageIndex(file) > 0 && !isCheckedCompleted(file);
  if (status === "On Hold") return Boolean(file.stages?.["On Hold"]);
  if (status === "Client Pending") return Boolean(file.stages?.["Client Pending"]);
  if (status === "Completed") return isCheckedCompleted(file);
  if (status === "Not Checked") return isNotCheckedFile(file);
  if (status === "Billed") return isBilledFile(file);
  if (status === "Non-Billed") return isNonBilledFile(file);
  if (status === "Overdue") return isOverdue(file);
  return true;
}

function renderDashboardStaffSummaryTable(rows) {
  if (!rows.length) return empty("No staff-wise records match these filters.");
  const headers = Object.keys(rows[0]);
  return `
    <div class="table-wrap file-table-wrap dashboard-staff-table">
      <table class="file-table file-table-compact">
        <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => `<tr>${headers.map((header) => {
            if (header === "Staff Name") return `<td>${escapeHtml(row[header])}</td>`;
            return `<td><button class="staff-summary-count ${dashboardStaffCountTone(header)}" data-summary-staff="${escapeHtml(row["Staff Name"])}" data-summary-kind="${dashboardStaffKind(header)}">${row[header]}</button></td>`;
          }).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function dashboardStaffKind(header) {
  return {
    "Total Assigned": "all",
    Pending: "pending",
    "Not Started": "notStarted",
    WIP: "wip",
    Completed: "completed",
    Overdue: "overdue",
  }[header] || "all";
}

function dashboardStaffCountTone(header) {
  return {
    "Total Assigned": "tone-blue",
    Pending: "tone-amber",
    "Not Started": "tone-slate",
    WIP: "tone-purple",
    Completed: "tone-green",
    Overdue: "tone-red",
  }[header] || "tone-blue";
}

function bindDashboardStaffSummary() {
  const toggle = document.querySelector("#staffSummaryToggle");
  const body = document.querySelector("#staffSummaryBody");
  if (toggle && body) toggle.onclick = () => {
    body.classList.toggle("hidden");
    state.filters.dashboardStaffSummaryOpen = body.classList.contains("hidden") ? "" : "Yes";
    saveState();
  };
  ["dashboardStaffName", "dashboardStaffFrom", "dashboardStaffTo", "dashboardStaffStatus", "dashboardStaffService"].forEach((id) => {
    const input = document.querySelector(`#${id}`);
    if (!input) return;
    input.onchange = () => {
      state.filters[id] = input.value;
      saveState();
      renderDashboard();
    };
  });
  const clear = document.querySelector("#clearDashboardStaffFilters");
  if (clear) clear.onclick = () => {
    ["dashboardStaffName", "dashboardStaffFrom", "dashboardStaffTo", "dashboardStaffStatus", "dashboardStaffService"].forEach((key) => (state.filters[key] = ""));
    saveState();
    renderDashboard();
  };
  const excel = document.querySelector("#dashboardStaffExcel");
  if (excel) excel.onclick = () => exportExcel("staff-wise-file-summary", dashboardStaffSummaryRows());
  const pdf = document.querySelector("#dashboardStaffPdf");
  if (pdf) pdf.onclick = () => exportPdf("staff-wise-file-summary", dashboardStaffSummaryRows());
  document.querySelectorAll("[data-summary-staff]").forEach((button) => {
    button.onclick = () => openStaffSummaryFiles(button.dataset.summaryStaff, button.dataset.summaryKind);
  });
}

function openStaffSummaryFiles(staffName, kind) {
  resetFilters();
  state.filters.staff = staffName;
  if (kind === "pending") state.filters.dashboardKind = "pending";
  if (kind === "notStarted") state.filters.workflow = "Received";
  if (kind === "wip") state.filters.workflow = "WIP";
  if (kind === "completed") state.filters.dashboardKind = "completed";
  if (kind === "overdue") state.filters.overdue = "Yes";
  state.filters.fromDashboard = "Yes";
  saveState();
  activePage = "files";
  renderAll();
}

function bar(label, value, max, kind = "") {
  const width = Math.round((value / max) * 100);
  return `<button class="bar-row bar-link" data-staff-filter="${escapeHtml(label)}" data-staff-kind="${kind}"><span>${label}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><strong>${value}</strong></button>`;
}

function bindDashboardLinks() {
  document.querySelectorAll("[data-dashboard-filter]").forEach((card) => {
    card.onclick = () => openFilesFromDashboard(card.dataset.dashboardFilter);
  });
  document.querySelectorAll("[data-staff-filter]").forEach((row) => {
    row.onclick = () => {
      resetFilters();
      state.filters.staff = row.dataset.staffFilter;
      if (row.dataset.staffKind === "pending") state.filters.dashboardKind = "pending";
      if (row.dataset.staffKind === "completed") state.filters.dashboardKind = "completed";
      if (row.dataset.staffKind === "not-started") state.filters.workflow = "Received";
      state.filters.fromDashboard = "Yes";
      saveState();
      activePage = "files";
      renderAll();
    };
  });
}

function openFilesFromDashboard(kind) {
  if (isStaffLogin()) return openStaffFilesFromDashboard(kind);
  if (["collections", "expenses", "balance"].includes(kind)) {
    resetFilters();
    activePage = "expenses";
    if (kind === "collections") state.filters.expenseTab = "collections";
    if (kind === "expenses") state.filters.expenseTab = "expenses";
    if (kind === "balance") state.filters.expenseTab = "balance";
    saveState();
    renderAll();
    return;
  }
  resetFilters();
  if (kind === "active") state.filters.listView = "active";
  if (kind === "all") state.filters.listView = "";
  if (kind === "notStarted") state.filters.workflow = "Received";
  if (kind === "wip") state.filters.workflow = "WIP";
  if (kind === "onHold") state.filters.workflow = "On Hold";
  if (kind === "clientPending") state.filters.workflow = "Client Pending";
  if (kind === "workDone") state.filters.workflow = "Work Done";
  if (kind === "shared") state.filters.dashboardKind = "shared";
  if (kind === "reportPrepared") state.filters.dashboardKind = "reportsPrepared";
  if (kind === "awaitingApproval") state.filters.pendingApproval = "Yes";
  if (kind === "approved") state.filters.workflow = "Approved";
  if (kind === "filed") state.filters.status = "Completed";
  if (kind === "feePending") state.filters.listView = "feePending";
  if (kind === "pending") state.filters.dashboardKind = "pending";
  if (kind === "overdue") state.filters.overdue = "Yes";
  if (kind === "approval") state.filters.pendingApproval = "Yes";
  if (kind === "correction") state.filters.dashboardKind = "correctionRequired";
  if (kind === "reallotted") state.filters.dashboardKind = "reAllotted";
  if (kind === "report") state.filters.dashboardKind = "reportsPrepared";
  if (kind === "completed") state.filters.dashboardKind = "completed";
  if (kind === "notChecked") state.filters.listView = "notChecked";
  if (kind === "billed") state.filters.listView = "billed";
  if (kind === "unbilled") state.filters.listView = "nonBilled";
  state.filters.fromDashboard = "Yes";
  saveState();
  activePage = "files";
  renderAll();
}

function resetFilters() {
  Object.keys(state.filters).forEach((key) => (state.filters[key] = ""));
}

function resetFiltersKeepingCurrentFileModule() {
  const keep = {
    listView: state.filters.listView || "",
    dashboardKind: state.filters.dashboardKind || "",
    fromDashboard: state.filters.fromDashboard || "",
    receivedSort: state.filters.receivedSort || "Newest First",
  };
  resetFilters();
  Object.assign(state.filters, keep);
}

function renderFilesPage() {
  if (isStaffLogin()) return renderStaffFilesPage();
  if (!state.filters.receivedSort) state.filters.receivedSort = "Newest First";
  const files = sortFilesForDisplay(filteredFiles());
  document.querySelector("#files").innerHTML = `
    <div class="panel">
      <div class="filter-hero">
        <div>
          <h3>Search & Filter Files</h3>
        </div>
        <span id="fileCount">${files.length} File(s) Shown</span>
      </div>
      <div class="filters colourful-filters">
        ${inputFilter("search", "Global Search", "Search name, PAN, staff, remarks")}
        ${inputFilter("client", "Client Name", "Client")}
        ${comboFilter("careOfFilter", "C/o", careOfDropdownOptions(), "Search or select C/o")}
        ${selectFilter("service", "Service Type", ["", ...serviceDropdownOptions()])}
        ${selectFilter("workflow", "Workflow", ["", ...stages])}
        ${selectFilter("status", "Status", ["", "Received", "Allotted", "WIP", "Work Done", "On Hold", "Client Pending", "Approval Pending", "Correction Required", "Approved", "Completed", "Billed", "Overdue"])}
        ${selectFilter("staff", "Staff", ["", ...assignableStaffNames()])}
        ${inputFilter("due", "Due Date", "", "date")}
        ${selectFilter("receivedSort", "Sort by Received Date", ["Oldest First", "Newest First"])}
        ${selectFilter("priority", "Priority", ["", "Low", "Medium", "High", "Urgent"])}
        ${selectFilter("billing", "Billing", ["", "Billed", "Unbilled"])}
        ${state.filters.listView === "completed" ? selectFilter("checkingStatus", "Checking Status", ["", "Not Checked", "Checked", "Returned for Correction"]) : ""}
        ${inputFilter("pan", "PAN / Regn Number", "PAN or Regn")}
        ${selectFilter("overdue", "Overdue Files", ["", "Yes"])}
        ${selectFilter("pendingApproval", "Approval Pending", ["", "Yes"])}
        ${isStaffLogin() ? inputFilter("fileFrom", "From", "", "date") : ""}
        ${isStaffLogin() ? inputFilter("fileTo", "To", "", "date") : ""}
      </div>
      <div class="action-row" style="margin-bottom:14px">
        <button class="secondary-button file-action-button file-action-clear" id="clearFilters">${navIcon("filterOff")}Clear Filters</button>
        ${isStaffLogin() ? `<button class="secondary-button" id="clearStaffDates">Clear Dates</button>` : ""}
        ${rolePerm().export ? `<button class="secondary-button file-action-button file-action-excel" id="exportFiltered">${navIcon("spreadsheet")}Export Filtered Excel</button>` : ""}
        ${rolePerm().export ? `<button class="secondary-button file-action-button pdf-export-button file-action-pdf" id="exportFilteredPdf">${navIcon("pdf")}Export to PDF</button>` : ""}
      </div>
      <div id="fileResults">${renderFileTable(files)}</div>
    </div>
  `;
  bindFilters();
  document.querySelector("#clearFilters").onclick = () => {
    resetFiltersKeepingCurrentFileModule();
    saveState();
    renderAll();
  };
  const clearStaffDates = document.querySelector("#clearStaffDates");
  if (clearStaffDates) {
    clearStaffDates.onclick = () => {
      state.filters.fileFrom = "";
      state.filters.fileTo = "";
      saveState();
      renderAll();
    };
  }
  const exportFiltered = document.querySelector("#exportFiltered");
  if (exportFiltered) exportFiltered.onclick = () => exportExcel("filtered-files", sortFilesForDisplay(filteredFiles()));
  const exportFilteredPdf = document.querySelector("#exportFilteredPdf");
  if (exportFilteredPdf) exportFilteredPdf.onclick = () => exportFilteredFilesPdf(sortFilesForDisplay(filteredFiles()), exportFilteredPdf);
  bindFileActions();
}

function renderStaffFilesPage() {
  const listView = state.filters.listView || "";
  const files = staffPageFiles(listView);
  const showDateFilter = ["completed", "notChecked"].includes(listView);
  const showActiveStaffFilters = ["", "active"].includes(listView);
  document.querySelector("#files").innerHTML = `
    <div class="panel">
      <div class="filter-hero">
        <div>
          <h3>${staffFilePageTitle(listView)}</h3>
        </div>
        <span id="fileCount">${files.length} File(s) Shown</span>
      </div>
      ${showDateFilter ? `
        <div class="filters colourful-filters staff-date-filter">
          ${inputFilter("fileFrom", "From Date", "", "date")}
          ${inputFilter("fileTo", "To Date", "", "date")}
          <div class="field">
            <label>Action</label>
            <button class="secondary-button" id="clearStaffDates">Clear Dates</button>
          </div>
        </div>
      ` : ""}
      ${showActiveStaffFilters ? `
        <div class="filters colourful-filters staff-date-filter">
          ${inputFilter("staffFileName", "File Name", "Search file name")}
          ${inputFilter("staffCareOf", "C/o", "Search C/o")}
          ${inputFilter("staffAllottedDate", "Allotted Date", "", "date")}
          ${inputFilter("staffDueDate", "Due Date", "", "date")}
          ${selectFilter("staffPriority", "Priority", ["", "Low", "Medium", "High", "Urgent"])}
        </div>
      ` : ""}
      <div class="action-row" style="margin-bottom:14px">
        ${showActiveStaffFilters ? `<button class="secondary-button staff-report-action staff-report-clear" id="clearStaffActiveFilters">Clear Filters</button>` : ""}
        <button class="secondary-button staff-report-action staff-report-excel" id="staffExportExcel">${navIcon("spreadsheet")}Export to Excel</button>
        <button class="secondary-button staff-report-action staff-report-pdf" id="staffExportPdf">${navIcon("pdf")}Export to PDF</button>
        <button class="secondary-button staff-report-action staff-report-print" id="staffPrintReport">${navIcon("print")}Print</button>
      </div>
      <div id="fileResults">${listView === "correctionRequired" ? renderCorrectionRequiredTable(files) : (listView === "notChecked" ? renderNotCheckedFileTable(files) : renderStaffFileTable(files, listView))}</div>
    </div>
  `;
  if (showDateFilter) {
    bindStaffDateFilters();
    const clearStaffDates = document.querySelector("#clearStaffDates");
    if (clearStaffDates) {
      clearStaffDates.onclick = () => {
        state.filters.fileFrom = "";
        state.filters.fileTo = "";
        saveState();
        renderAll();
      };
    }
  }
  if (showActiveStaffFilters) bindStaffActiveFilters();
  const clearStaffActiveFilters = document.querySelector("#clearStaffActiveFilters");
  if (clearStaffActiveFilters) {
    clearStaffActiveFilters.onclick = () => {
      ["staffFileName", "staffCareOf", "staffAllottedDate", "staffDueDate", "staffPriority"].forEach((key) => (state.filters[key] = ""));
      saveState();
      renderStaffFilesPage();
    };
  }
  document.querySelector("#staffExportExcel").onclick = () => exportStaffPageExcel(listView, files);
  document.querySelector("#staffExportPdf").onclick = () => exportStaffPagePdf(listView, files);
  document.querySelector("#staffPrintReport").onclick = () => printStaffPageReport(listView, files);
  bindFileActions();
}

function staffFilePageTitle(listView) {
  if (state.filters.overdue === "Yes") return "Overdue Files";
  if (state.filters.pendingApproval === "Yes") return "Approval Pending Files";
  if (listView === "correctionRequired" || state.filters.dashboardKind === "correctionRequired") return "Correction Required Files";
  if (state.filters.dashboardKind === "reAllotted") return "Re-Allotted Files";
  const titleMap = {
    "": "File List",
    active: "Active Files",
    completed: "Completed Files",
    notChecked: "Not Checked Files",
    nonBilled: "Non-Billed Files",
    billed: "Billed Files",
    feePending: "Fee Pending Files",
    feeReceived: "Fee Received Files",
    reAssigned: "Re Assigned Files",
  };
  return titleMap[listView] || "My Files";
}

function bindStaffDateFilters() {
  document.querySelectorAll("[data-filter='fileFrom'], [data-filter='fileTo']").forEach((el) => {
    el.oninput = (event) => {
      state.filters[event.target.dataset.filter] = event.target.value;
      saveViewState();
      renderStaffFilesPage();
    };
    el.onchange = el.oninput;
  });
}

function bindStaffActiveFilters() {
  document.querySelectorAll("[data-filter='staffFileName'], [data-filter='staffCareOf'], [data-filter='staffAllottedDate'], [data-filter='staffDueDate'], [data-filter='staffPriority']").forEach((el) => {
    el.oninput = (event) => {
      state.filters[event.target.dataset.filter] = event.target.value;
      saveViewState();
      renderStaffFilesPage();
    };
    el.onchange = el.oninput;
  });
}

function staffPageFiles(listView) {
  if (listView === "notChecked" && !canViewNotCheckedFiles()) return [];
  const ownFiles = listView === "notChecked" && canManageChecking() ? (state.files || []) : visibleFiles();
  const rows = ownFiles.filter((file) => {
    if (state.filters.overdue === "Yes" && !isOverdue(file)) return false;
    if (state.filters.pendingApproval === "Yes" && !pendingApproval(file)) return false;
    if (state.filters.workflow && !file.stages?.[state.filters.workflow]) return false;
    if (state.filters.dashboardKind === "correctionRequired" && !hasOpenCorrection(file)) return false;
    if (state.filters.dashboardKind === "reAllotted" && !(file.reAssignedStaff && file.reAssignedStaff !== "Not Assigned")) return false;
    if (listView === "active") return !isCheckedCompleted(file);
    if (listView === "completed") {
      if (!isCheckedCompleted(file)) return false;
      const completedDate = fileActualCompletionDate(file);
      if (state.filters.fileFrom && completedDate < state.filters.fileFrom) return false;
      if (state.filters.fileTo && completedDate > state.filters.fileTo) return false;
      return true;
    }
    if (listView === "correctionRequired") return hasOpenCorrection(file);
    if (listView === "notChecked") {
      if (!isNotCheckedFile(file)) return false;
      const completedDate = fileActualCompletionDate(file);
      if (state.filters.fileFrom && completedDate < state.filters.fileFrom) return false;
      if (state.filters.fileTo && completedDate > state.filters.fileTo) return false;
      return true;
    }
    if (listView === "billed") return isBilledFile(file);
    if (listView === "nonBilled") return isNonBilledFile(file);
    if (listView === "feePending") return isFeePendingFile(file);
    if (listView === "feeReceived") return isFeeReceivedFile(file);
    if (listView === "reAssigned") return isReassignedFile(file) && (!isStaffLogin() || reassignmentVisibleToUser(file, loggedInUser()));
    return true;
  });
  const filteredRows = ["", "active"].includes(listView) ? filterStaffActiveRows(rows) : rows;
  return sortStaffPageFiles(filteredRows, listView);
}

function sortStaffPageFiles(files, listView = "") {
  if (listView === "correctionRequired" || state.filters.dashboardKind === "correctionRequired") return sortFilesByCorrectionNewestFirst(files);
  if (listView === "completed" || usesCompletionSort(listView, state.filters.dashboardKind)) return sortFilesByCompletionNewestFirst(files);
  if (listView === "active" && state.filters.dashboardKind === "myTask") return sortFilesByAssignmentNewestFirst(files);
  return sortFilesNewestFirst(files);
}

function filterStaffActiveRows(rows) {
  const f = state.filters;
  return rows.filter((file) => {
    if (f.staffFileName && !String(file.name || "").toLowerCase().includes(f.staffFileName.toLowerCase())) return false;
    if (f.staffCareOf && !String(file.careOf || "").toLowerCase().includes(f.staffCareOf.toLowerCase())) return false;
    if (f.staffAllottedDate && normalizeImportDate(file.workAllotmentDate || file.fileReceivedDate) !== f.staffAllottedDate) return false;
    if (f.staffDueDate && normalizeImportDate(file.dueDate) !== f.staffDueDate) return false;
    if (f.staffPriority && file.priority !== f.staffPriority) return false;
    return true;
  });
}

function fileSerialSortValue(file) {
  return Number(file.importSerialNumber || 0) || (Number(file.excelRowNumber || 0) > 1 ? Number(file.excelRowNumber) - 1 : Number.MAX_SAFE_INTEGER);
}

function fileDateSortValue(dateString) {
  return Date.parse(normalizeImportDate(dateString) || "") || 0;
}

function fileCreatedSortTime(file = {}) {
  return Number(file.createdAt || 0)
    || Date.parse(file.createdAt || file.created_at || "")
    || Number(file.updatedAt || 0)
    || Date.parse(file.updated_at || file.lastUpdatedDate || "")
    || 0;
}

function fileUpdatedSortTime(file = {}) {
  return Number(file.updatedAt || 0)
    || Date.parse(file.updated_at || file.lastUpdatedDate || "")
    || fileCreatedSortTime(file);
}

function fileActualCompletionDate(file = {}) {
  return normalizeImportDate(file.completionDate || file.completedDate || file.workCompletedDate || file.work_completed_date || file.completed_at || file.completedAt || "") || "";
}

function fileCompletionSortTime(file = {}) {
  return Date.parse(fileActualCompletionDate(file) || "") || 0;
}

function sortFilesNewestFirst(files = []) {
  return [...files].sort((a, b) => {
    const received = fileDateSortValue(b.fileReceivedDate || b.receivedDate || b.file_received_date || b.received_on)
      - fileDateSortValue(a.fileReceivedDate || a.receivedDate || a.file_received_date || a.received_on);
    if (received) return received;
    const created = fileCreatedSortTime(b) - fileCreatedSortTime(a);
    if (created) return created;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
}

function sortFilesOldestReceivedFirst(files = []) {
  return [...files].sort((a, b) => {
    const left = fileDateSortValue(a.fileReceivedDate || a.receivedDate || a.file_received_date || a.received_on);
    const right = fileDateSortValue(b.fileReceivedDate || b.receivedDate || b.file_received_date || b.received_on);
    if (left && right && left !== right) return left - right;
    if (left && !right) return -1;
    if (!left && right) return 1;
    const created = fileCreatedSortTime(a) - fileCreatedSortTime(b);
    if (created) return created;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}

function sortFilesByCompletionNewestFirst(files = []) {
  return [...files].sort((a, b) => {
    const left = fileCompletionSortTime(a);
    const right = fileCompletionSortTime(b);
    if (right && left && right !== left) return right - left;
    if (right && !left) return 1;
    if (!right && left) return -1;
    const created = fileCreatedSortTime(b) - fileCreatedSortTime(a);
    if (created) return created;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
}

function sortFilesByAssignmentNewestFirst(files = []) {
  return [...files].sort((a, b) => {
    const left = fileAssignmentSortTime(a);
    const right = fileAssignmentSortTime(b);
    if (right && left && right !== left) return right - left;
    if (right && !left) return 1;
    if (!right && left) return -1;
    const received = fileDateSortValue(b.fileReceivedDate || b.receivedDate || b.file_received_date || b.received_on)
      - fileDateSortValue(a.fileReceivedDate || a.receivedDate || a.file_received_date || a.received_on);
    if (received) return received;
    const created = fileCreatedSortTime(b) - fileCreatedSortTime(a);
    if (created) return created;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
}

function fileAssignmentSortTime(file = {}) {
  return fileDateSortValue(file.task_activity_at || file.taskActivityAt || file.managerUpdatedAt || file.manager_updated_at || file.assigned_at || file.assignedAt || file.workAllotmentDate || file.work_allotment_date || file.reAssignedDate || file.re_assigned_date)
    || fileCreatedSortTime(file);
}

function sortFilesByCorrectionNewestFirst(files = []) {
  return [...files].sort((a, b) => {
    const left = latestCorrectionSortTime(a);
    const right = latestCorrectionSortTime(b);
    if (right && left && right !== left) return right - left;
    if (right && !left) return 1;
    if (!right && left) return -1;
    const updated = fileUpdatedSortTime(b) - fileUpdatedSortTime(a);
    if (updated) return updated;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
}

function latestCorrectionSortTime(file = {}) {
  const latest = latestCorrectionForFile(file);
  return Date.parse(latest?.returnedAt || latest?.returned_at || latest?.createdAt || latest?.created_at || file.returnedAt || file.returned_at || file.returnedDate || "") || 0;
}

function usesCompletionSort(listView = state.filters.listView, dashboardKind = state.filters.dashboardKind) {
  return ["completed", "notChecked", "billed", "nonBilled", "feePending", "feeReceived"].includes(listView)
    || ["completed", "reportsPrepared", "shared"].includes(dashboardKind);
}

function sortChatMessages(messages = []) {
  return [...messages].sort((a, b) => chatMessageTime(a) - chatMessageTime(b));
}

function chatMessageTime(message = {}) {
  return Number(message.createdAt || 0) || Date.parse(message.created_at || `${message.date || ""} ${message.time || ""}`) || 0;
}

function mergeChatMessages(existingRows = [], incomingRows = []) {
  const rows = [];
  const keyOf = (message = {}) => message.id || message.client_message_id || message.clientMessageId || crypto.randomUUID();
  const clientKeyOf = (message = {}) => message.client_message_id || message.clientMessageId || "";
  const upsert = (message) => {
    const clientKey = clientKeyOf(message);
    const index = rows.findIndex((row) =>
      (clientKey && clientKeyOf(row) === clientKey)
      || (message.id && row.id === message.id)
    );
    if (index >= 0) rows[index] = { ...rows[index], ...message, id: String(message.id || "").startsWith("local-") ? rows[index].id : (message.id || rows[index].id) };
    else rows.push({ ...message, id: message.id || keyOf(message) });
  };
  [...existingRows, ...incomingRows].forEach((message) => {
    if (!message) return;
    upsert(message);
  });
  return sortChatMessages(rows).slice(-1000);
}

function formatChatDateTime(message = {}) {
  const time = chatMessageTime(message);
  if (!time) return `${fmt(message.date)} ${String(message.time || "").toUpperCase()}`.trim();
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(time)).reduce((map, part) => {
    map[part.type] = part.value;
    return map;
  }, {});
  return `${parts.day}-${parts.month}-${parts.year} ${parts.hour}:${parts.minute} ${String(parts.dayPeriod || "").toUpperCase()}`;
}

function sortCorrectionHistory(rows = []) {
  return [...rows].sort((a, b) => correctionTime(b) - correctionTime(a));
}

function correctionTime(row = {}) {
  return Date.parse(row.returnedAt || row.returned_at || row.createdAt || row.created_at || row.returnedDate || "") || 0;
}

function financeNewestFirst(a = {}, b = {}) {
  const left = Date.parse(a.updated_at || a.updatedAt || a.created_at || a.createdAt || a.date || "") || 0;
  const right = Date.parse(b.updated_at || b.updatedAt || b.created_at || b.createdAt || b.date || "") || 0;
  if (right !== left) return right - left;
  return String(b.id || "").localeCompare(String(a.id || ""));
}

function sortFilesForDisplay(files) {
  if (state.filters.receivedSort === "Oldest First") return sortFilesOldestReceivedFirst(files);
  if (state.filters.receivedSort === "Newest First") return sortFilesNewestFirst(files);
  if (usesCompletionSort()) return sortFilesByCompletionNewestFirst(files);
  if (["", "active"].includes(state.filters.listView || "") && ["Admin", "Manager"].includes(state.currentRole)) {
    return sortFilesNewestFirst(files);
  }
  return sortFilesNewestFirst(files);
}

function workCompletedDate(file) {
  return file.completionDate || file.completedDate || file.lastUpdatedDate || file.workAllotmentDate || file.fileReceivedDate || "";
}

function fileFy(file = {}) {
  return String(file.fy || file.financialYear || file.financial_year || "").trim();
}

function fileRegistrationNumber(file = {}) {
  return String(file.pan || file.registrationNumber || file.registration_number || file.regnNo || file.regNo || file.crNo || file.cr_no || "").trim();
}

function staffCompletedClientCell(file = {}) {
  const regn = fileRegistrationNumber(file) || "Regn No. Not Available";
  const fy = fileFy(file);
  const meta = fy ? `${regn} (FY ${fy})` : regn;
  return `<span class="client-name">${escapeHtml(file.name || "")}</span><span class="subtext">${escapeHtml(meta)}</span>`;
}

function staffReportRow(file, listView = "") {
  const startedDate = file.workStartedDate || (file.stages?.WIP || file.stages?.["Work Done"] || file.stages?.Completed ? file.workAllotmentDate || file.fileReceivedDate : "");
  if (listView === "reAssigned") {
    return {
      "Client Name": file.name,
      Service: file.serviceType,
      "Originally Allotted To": originalAllottedTo(file),
      "Reassigned From": file.reassignedFrom || file.reassigned_from || file.previousAllottedTo || "-",
      "Re Allotted To": currentFileAssignee(file).name || "-",
      "Re Allot Date": displayDate(file.reAssignedDate || file.reassigned_at),
      "Reassigned By": file.reassignedBy || file.reassigned_by || "-",
      Status: statusOf(file).label,
    };
  }
  if (listView === "feeReceived") {
    return {
      "Client Name": file.name,
      Service: file.serviceType,
      FY: file.fy || "NA",
      "Invoice Number": file.invoiceNumber || file.invoiceNo || "-",
      "Bill Amount": money(dashboardFileAmount(file, "billed")),
      "Amount Received": money(file.feeReceivedAmount || file.amountReceived || dashboardFileAmount(file, "received")),
      "Fee Received Date": displayDate(file.feeReceivedDate || file.receivedOn),
      "Received By": file.feeReceivedBy || file.collectionStaff || "-",
      Mode: file.paymentMode || file.receiptMode || "-",
    };
  }
  if (listView === "active") {
    return {
      Client: file.name,
      Service: file.serviceType,
      "Received on": displayDate(file.fileReceivedDate),
      "Work Allotted": displayDate(file.workAllotmentDate || file.fileReceivedDate),
      "C/o": file.careOf || "Direct",
      Priority: file.priority || "",
      Status: statusOf(file).label,
      "Checking Status": checkingStatusOf(file).label || "-",
      "Due Date": displayDate(file.dueDate),
    };
  }
  return {
    "Client Name": file.name,
    Service: file.serviceType,
    "C/o": file.careOf || "Direct",
    "Received on": displayDate(file.fileReceivedDate),
    "Work Allotted": displayDate(file.workAllotmentDate || file.fileReceivedDate),
    "Work Started": displayDate(startedDate),
    "Completed Date": displayDate(workCompletedDate(file)),
    "Checking Status": checkingStatusOf(file).label || "-",
  };
}

function renderStaffFileTable(files, listView = "") {
  if (listView === "reAssigned") return renderReAssignedFileTable(files);
  if (listView === "feeReceived") return renderFeeReceivedFileTable(files);
  if (!files.length) return empty("No files found.");
  const rows = files.map((file) => staffReportRow(file, listView));
  const headers = Object.keys(rows[0] || {});
  const showEditAction = ["active", "completed", "notChecked"].includes(listView);
  return `
    <div class="table-wrap file-table-wrap">
      <table class="file-table file-table-compact">
        <thead><tr><th>SN</th>${headers.map((h) => `<th>${h}</th>`).join("")}${showEditAction ? "<th>Actions</th>" : ""}</tr></thead>
        <tbody>
          ${files.map((file, index) => {
            const row = staffReportRow(file, listView);
            return `<tr>
              <td>${fileSerialNumber(file, index)}</td>
              ${headers.map((h) => {
                if (h === "Checking Status") return `<td>${renderCheckingStatusBadge(file)}</td>`;
                if (listView === "completed" && h === "Client Name") return `<td>${staffCompletedClientCell(file)}</td>`;
                return `<td>${escapeHtml(row[h] || "")}</td>`;
              }).join("")}
              ${showEditAction ? `<td><div class="action-row"><button class="mini-button" data-edit="${file.id}">Edit</button></div></td>` : ""}
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderCheckingStatusBadge(file) {
  const checking = checkingStatusOf(file);
  if (!checking.label) return "-";
  return `<span class="badge ${checking.className}">${checking.label}</span>`;
}

function inputFilter(key, label, placeholder, type = "text") {
  return `<div class="field"><label>${label}</label><input type="${type}" data-filter="${key}" value="${state.filters[key]}" placeholder="${placeholder}"></div>`;
}

function comboFilter(key, label, options, placeholder = "") {
  const listId = `${key}Options`;
  return `
    <div class="field">
      <label>${label}</label>
      <input data-filter="${key}" list="${listId}" value="${escapeHtml(state.filters[key] || "")}" placeholder="${escapeHtml(placeholder)}">
      <datalist id="${listId}">
        ${options.map((option) => `<option value="${escapeHtml(option)}"></option>`).join("")}
      </datalist>
    </div>`;
}

function selectFilter(key, label, options) {
  return `<div class="field"><label>${label}</label><select data-filter="${key}">${options.map((o) => `<option value="${o}" ${state.filters[key] === o ? "selected" : ""}>${o || "All"}</option>`).join("")}</select></div>`;
}

function bindFilters() {
  document.querySelectorAll("[data-filter]").forEach((el) => {
    const update = (e) => {
      state.filters[e.target.dataset.filter] = e.target.value;
      saveViewState();
      clearTimeout(filterTimer);
      filterTimer = setTimeout(refreshFileResults, 120);
    };
    el.oninput = update;
    el.onchange = update;
  });
}

function refreshFileResults() {
  const files = sortFilesForDisplay(filteredFiles());
  const count = document.querySelector("#fileCount");
  const results = document.querySelector("#fileResults");
  if (count) count.textContent = `${files.length} File(s) Shown`;
  if (results) {
    results.innerHTML = renderFileTable(files);
    bindFileActions();
  }
}

async function exportActiveFilesExcel(files = filteredFiles()) {
  if (!rolePerm().export) return toast("This role cannot export data.");
  const rows = files.map(activeFileExportRow);
  await downloadXlsxRows(`active-files-${todayDate()}`, rows);
  toast("Active Files Excel downloaded");
}

async function exportStaffPageExcel(listView, files) {
  const rows = files.map((file) => staffReportRow(file, listView));
  if (!rows.length) return toast("No data to export.");
  await downloadXlsxRows(staffExportName(listView), rows, staffExportHeaderLines(listView));
  toast("Excel file downloaded");
}

async function exportStaffPagePdf(listView, files) {
  const rows = files.map((file) => staffReportRow(file, listView));
  if (!rows.length) return toast("No data to export.");
  await downloadPdfRows(staffExportName(listView), rows, staffExportHeaderLines(listView));
  toast("PDF file downloaded");
}

function printStaffPageReport(listView, files) {
  const rows = files.map((file) => staffReportRow(file, listView));
  if (!rows.length) return toast("No data to print.");
  printReport(staffExportName(listView), rows, staffExportHeaderLines(listView));
  toast("Print report opened");
}

function staffExportHeaderLines(listView) {
  return [
    "Muhammad & Associates,",
    "Chartered Accountants,",
    `Name: ${state.currentUser || loggedInUser()?.name || "Staff"},`,
    staffExportTitle(listView),
  ];
}

function staffExportTitle(listView) {
  if (listView === "completed" && state.filters.fileFrom && state.filters.fileTo) {
    return `Completed Files ${displayDate(state.filters.fileFrom)} to ${displayDate(state.filters.fileTo)}`;
  }
  const titles = {
    "": "File List",
    active: "Active Files",
    completed: "Completed Files",
    notChecked: "Not Checked Files",
    billed: "Billed Files",
    nonBilled: "Non-Billed Files",
    feePending: "Fee Pending Files",
    feeReceived: "Fee Received Files",
    reAssigned: "Re Assigned Files",
  };
  return titles[listView] || "Staff Files";
}

function staffExportName(listView) {
  if (listView === "completed" && state.filters.fileFrom && state.filters.fileTo) {
    return `completed-files-${state.filters.fileFrom}-to-${state.filters.fileTo}`;
  }
  const names = {
    "": "file-list",
    active: "active-files",
    completed: "completed-files",
    notChecked: "not-checked-files",
    billed: "billed-files",
    nonBilled: "non-billable-files",
    feePending: "fee-pending-files",
    feeReceived: "fee-received-files",
    reAssigned: "re-assigned-files",
  };
  return names[listView] || "staff-files";
}

function activeFileExportRow(file) {
  const status = statusOf(file);
  return {
    Client: file.name,
    "PAN / Regn Number": file.pan || "",
    Service: file.serviceType,
    "Received on": displayDate(file.fileReceivedDate),
    "Work Allotted": displayDate(file.workAllotmentDate || file.fileReceivedDate),
    "C/o": file.careOf || "Direct",
    FY: file.fy || "NA",
    Priority: file.priority || "",
    "Final Status": status.label,
    "Assigned Staff": file.assignedStaff || "Not Assigned",
    Due: displayDate(file.dueDate),
    "Last Updated Date": displayDate(file.lastUpdatedDate),
  };
}

function renderFileTable(files) {
  if (!files.length) return empty("No files match these filters.");
  if (state.filters.listView === "reAssigned") return renderReAssignedFileTable(files);
  if (state.filters.listView === "feeReceived") return renderFeeReceivedFileTable(files);
  if (state.filters.listView === "notChecked") return renderNotCheckedFileTable(files);
  const compactClass = " file-table-compact";
  const isCompletedView = ["completed", "notChecked"].includes(state.filters.listView);
  const dateColumnLabel = isCompletedView ? "Completed Date" : "Due";
  const assignedColumnLabel = isCompletedView ? "Done By" : "Assigned Staff";
  const managerCheckingColumns = canManageChecking() && isCompletedView;
  const headerRow = isCompletedView
    ? `<th>SN</th><th>Client Name</th><th>FY</th><th>Service Type</th><th>${dateColumnLabel}</th><th>${assignedColumnLabel}</th>${managerCheckingColumns ? "<th>Checking Status</th><th>Checked By</th><th>Checked Date</th>" : ""}<th>Actions</th>`
    : `<th>SN</th><th>Client</th><th>Service</th><th>Received on</th><th>Work Allotted</th><th>C/o</th><th>Priority</th><th>Final Status</th><th>${assignedColumnLabel}</th><th>${dateColumnLabel}</th><th>Actions</th>`;
  return `
    <div class="table-wrap file-table-wrap">
      <table class="file-table${compactClass}">
        <thead><tr>
          ${headerRow}
        </tr></thead>
        <tbody>
          ${files.map((file, index) => {
            const status = statusOf(file);
            const checking = isCompletedView ? checkingStatusOf(file) : { label: "", className: "" };
            const dateValue = isCompletedView ? workCompletedDate(file) : file.dueDate;
            const receiptInfo = receiptSummary(file);
            const completedCells = `
              <td>${fileSerialNumber(file, index)}</td>
              <td><span class="client-name">${escapeHtml(file.name || "")}</span><span class="subtext">${escapeHtml(fileRegistrationNumber(file) || "")}</span></td>
              <td>${escapeHtml(fileFy(file) || "-")}</td>
              <td>${escapeHtml(file.serviceType || "")}</td>
              <td class="completed-doc-cell">${fmt(dateValue)}</td>
              <td class="completed-staff-cell">${escapeHtml(file.completedBy || file.workDoneBy || file.assignedStaff || "Not Assigned")}${receiptInfo}</td>
              ${managerCheckingColumns ? `<td>${renderCheckingStatusBadge(file)}</td><td>${escapeHtml(file.checkedBy || "-")}</td><td>${file.checkedDate ? fmt(file.checkedDate) : "-"}</td>` : ""}
              <td><div class="action-row">${fileRowActions(file)}</div></td>`;
            const activeCells = `
              <td>${fileSerialNumber(file, index)}</td>
              <td><span class="client-name">${escapeHtml(file.name || "")}${isReassignedFile(file) ? ` <span class="reassigned-inline-label">(Re Assigned)</span>` : ""}</span><span class="subtext">${escapeHtml(file.pan || "")}</span></td>
              <td>${file.serviceType}</td>
              <td>${fmt(file.fileReceivedDate)}</td>
              <td>${fmt(file.workAllotmentDate || file.fileReceivedDate)}</td>
              <td>${escapeHtml(file.careOf || "Direct")}</td>
              <td><span class="badge priority-${String(file.priority || "Medium").toLowerCase()}">${file.priority || "Medium"}</span></td>
              <td><span class="badge ${status.className}">${status.label}</span>${checking.label ? `<span class="subtext"><span class="badge ${checking.className}">${checking.label}</span></span>` : ""}${receiptInfo}</td>
              <td>${file.assignedStaff}</td>
              <td class="${isOverdue(file) ? "due-date-cell overdue-due-date" : "due-date-cell"}">${fmt(dateValue)}</td>
              <td><div class="action-row">${fileRowActions(file)}</div></td>`;
            return `<tr class="file-row file-row-${status.className}">${isCompletedView ? completedCells : activeCells}</tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderNotCheckedFileTable(files) {
  const rows = sortFilesByCompletionNewestFirst(files);
  const managerCheckingColumns = canManageChecking();
  return `
    <div class="table-wrap file-table-wrap">
      <table class="file-table file-table-compact">
        <thead><tr>
          <th>SN</th><th>Name</th><th>Type of Service</th><th>File Inward Date</th><th>Work Completion Date ↓</th><th>Done By</th><th>Checking Status</th>${managerCheckingColumns ? "<th>Checked By</th><th>Checked Date</th>" : ""}<th>Actions</th>
        </tr></thead>
        <tbody>
          ${rows.map((file, index) => {
            const checking = checkingStatusOf(file);
            const correction = latestCorrectionForFile(file);
            const correctionReason = correction?.correctionReason || correction?.correction_reason || file.correctionRemarks || "";
            const correctionMeta = correctionReason ? `<span class="subtext correction-reason-line">Correction Reason: ${escapeHtml(correctionReason)}</span><span class="subtext">Returned By: ${escapeHtml(correction?.returnedBy || correction?.returned_by_name || file.returnedBy || "-")} | Returned On: ${escapeHtml(fmt(correction?.returnedAt || correction?.returned_at || file.returnedDate) || "-")}</span>` : "";
            return `<tr class="file-row file-row-${checking.className || "approval"}">
              <td>${index + 1}</td>
              <td><span class="client-name">${escapeHtml(file.name)}</span><span class="subtext">${escapeHtml(file.pan || "")}</span>${correctionMeta}</td>
              <td>${escapeHtml(file.serviceType || "")}</td>
              <td>${fmt(file.fileReceivedDate)}</td>
              <td>${fmt(workCompletedDate(file))}</td>
              <td>${escapeHtml(file.completedBy || file.workDoneBy || file.assignedStaff || "Not Assigned")}</td>
              <td><span class="badge ${checking.className || "approval"}">${checking.label}</span></td>
              ${managerCheckingColumns ? `<td>${escapeHtml(file.checkedBy || "-")}</td><td>${file.checkedDate ? fmt(file.checkedDate) : "-"}</td>` : ""}
              <td><div class="action-row">${notCheckedFileActions(file)}</div></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderReAssignedFileTable(files) {
  const rows = sortFilesByAssignmentNewestFirst(files);
  return `
    <div class="table-wrap file-table-wrap">
      <table class="file-table file-table-compact">
        <thead><tr><th>SN</th><th>Client Name</th><th>Service</th><th>Received On</th><th>C/o</th><th>Status</th><th>First Allotted</th><th>Reassigned From</th><th>Re Allotted To</th><th>Re Allot Date</th><th>Reassigned By</th><th>Actions</th></tr></thead>
        <tbody>
          ${rows.map((file, index) => {
            const history = assignmentHistory(file)[0] || {};
            const reassignedFrom = history.assignedFrom || history.assigned_from || file.reassignedFrom || file.reassigned_from || file.previousAllottedTo || originalAllottedTo(file);
            const reassignedBy = history.assignedBy || history.assigned_by || file.reassignedBy || file.reassigned_by || "-";
            const reallotDate = normalizeImportDate(file.reAssignedDate || file.reassignedAt || file.reassigned_at || history.assignedAt || history.assigned_at || "");
            return `<tr>
              <td>${index + 1}</td>
              <td><span class="client-name">${escapeHtml(file.name || "")}</span><span class="subtext">${escapeHtml(file.pan || "")}</span></td>
              <td>${escapeHtml(file.serviceType || "")}</td>
              <td>${fmt(file.fileReceivedDate)}</td>
              <td>${escapeHtml(file.careOf || "Direct")}</td>
              <td><span class="badge ${statusOf(file).className}">${escapeHtml(statusOf(file).label)}</span></td>
              <td>${escapeHtml(originalAllottedTo(file))}</td>
              <td>${escapeHtml(reassignedFrom || "-")}</td>
              <td>${escapeHtml(file.reAssignedStaff || currentFileAssignee(file).name || "-")}</td>
              <td>${fmt(reallotDate)}</td>
              <td>${escapeHtml(reassignedBy)}</td>
              <td><div class="action-row"><button class="mini-button" data-edit="${file.id}">View File</button></div></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderFeeReceivedFileTable(files) {
  const rows = sortFilesByCompletionNewestFirst(files);
  return `
    <div class="table-wrap file-table-wrap">
      <table class="file-table file-table-compact">
        <thead><tr><th>SN</th><th>Client Name</th><th>Service</th><th>FY</th><th>Bill Amount</th><th>Amount Received</th><th>Fee Received Date</th><th>Received By</th></tr></thead>
        <tbody>
          ${rows.map((file, index) => `<tr>
            <td>${index + 1}</td>
            <td><span class="client-name">${escapeHtml(file.name || "")}</span><span class="subtext">${escapeHtml(file.pan || "")}${file.careOf ? ` | C/o: ${escapeHtml(file.careOf)}` : ""}</span></td>
            <td>${escapeHtml(file.serviceType || "")}</td>
            <td>${escapeHtml(fileFy(file) || "-")}</td>
            <td class="amount-cell">${rupee(dashboardFileAmount(file, "billed"))}</td>
            <td class="amount-cell">${rupee(dashboardFileAmount(file, "received"))}</td>
            <td>${fmt(file.feeReceivedDate || file.receivedOn || file.received_on)}</td>
            <td>${escapeHtml(file.receivedByUserName || file.received_by_user_name || file.feeReceivedBy || "-")}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function fileSerialNumber(file, fallbackIndex = 0) {
  return fallbackIndex + 1;
}

function fileRowActions(file) {
  const actions = [`<button class="mini-button" data-edit="${file.id}">Edit</button>`];
  const canManageBilling = rolePerm().assign;
  if (canManageBilling && state.filters.listView === "completed" && isCheckedCompleted(file) && !isNonBilledFile(file)) {
    actions.push(`<button class="mini-button ${file.billingType === "Non-Billable" ? "success" : ""}" data-non-billable="${file.id}">Non-Billable</button>`);
    if (!file.billed) actions.push(`<button class="mini-button success" data-mark-billed="${file.id}">Billed</button>`);
  }
  if (canManageBilling && state.filters.listView === "nonBilled" && isNonBilledFile(file)) {
    if (file.billingType === "Non-Billable") {
      actions.push(`<button class="mini-button success" data-billable="${file.id}">Mark Billable</button>`);
    } else {
      actions.push(`<button class="mini-button success" data-mark-billed="${file.id}">Billed</button>`);
    }
  }
  if (canManageBilling && state.filters.listView === "billed" && isBilledFile(file)) {
    actions.push(`<button class="mini-button" data-fee-non-billable="${file.id}">Non-Billable</button>`);
    if (file.billed && !file.feeReceived) actions.push(`<button class="mini-button success" data-mark-received="${file.id}">Mark Received</button>`);
  }
  if (canManageBilling && ["billed", "feeReceived"].includes(state.filters.listView) && file.billed && file.feeReceived) {
    actions.push(`<button class="mini-button" data-mark-not-received="${file.id}">Not Received</button>`);
  }
  if (canManageBilling && state.filters.listView === "feePending" && isFeePendingFile(file)) {
    actions.push(`<button class="mini-button" data-fee-non-billable="${file.id}">Non-Billable</button>`);
    actions.push(`<button class="mini-button success" data-mark-received="${file.id}">Mark Received</button>`);
  }
  if (file.feeReceived && ["billed", "feeReceived"].includes(state.filters.listView)) {
    actions.push(`<span class="badge filed">Received</span>`);
  }
  if (rolePerm().delete) actions.push(`<button class="mini-button danger" data-delete="${file.id}">Delete</button>`);
  return actions.join("");
}

function notCheckedFileActions(file) {
  const actions = [`<button class="mini-button" data-edit="${file.id}">${canManageChecking() ? "View" : "Edit"}</button>`];
  if (canManageChecking()) {
    if (canCheckFile(file)) {
      actions.push(`<button class="mini-button success" data-check-file="${file.id}">Check File</button>`);
    } else {
      actions.push(`<span class="subtext own-check-blocked">You cannot check a file completed by yourself. This file must be checked by another authorised user.</span>`);
    }
    actions.push(`<button class="mini-button danger" data-return-correction="${file.id}">Return for Correction</button>`);
  }
  return actions.join("");
}

function bindFileActions() {
  document.querySelectorAll("[data-edit]").forEach((btn) => (btn.onclick = () => openFileDrawer(btn.dataset.edit)));
  document.querySelectorAll("[data-check-file]").forEach((btn) => {
    btn.onclick = () => checkCompletedFile(btn.dataset.checkFile);
  });
  document.querySelectorAll("[data-return-correction]").forEach((btn) => {
    btn.onclick = () => returnFileForCorrection(btn.dataset.returnCorrection);
  });
  document.querySelectorAll("[data-billable]").forEach((btn) => {
    btn.onclick = () => updateFileBilling(btn.dataset.billable, { billingType: "Billable", billed: false, billedDate: "", feeReceived: false, feeReceivedDate: "" }, "File marked as billable", "billed");
  });
  document.querySelectorAll("[data-non-billable]").forEach((btn) => {
    btn.onclick = () => updateFileBilling(btn.dataset.nonBillable, { billingType: "Non-Billable", billed: false, billedDate: "", feeReceived: false, feeReceivedDate: "" }, "File marked as non-billable");
  });
  document.querySelectorAll("[data-fee-non-billable]").forEach((btn) => {
    btn.onclick = () => updateFileBilling(btn.dataset.feeNonBillable, { billingType: "Non-Billable", billed: false, billedDate: "", feeReceived: false, feeReceivedDate: "" }, "File marked as Non Billable.");
  });
  document.querySelectorAll("[data-mark-billed]").forEach((btn) => {
    btn.onclick = () => {
      const file = state.files.find((item) => item.id === btn.dataset.markBilled);
      updateFileBilling(btn.dataset.markBilled, { billingType: "Billable", billed: true, billedDate: normalizeImportDate(workCompletedDate(file)) || todayDate(), feeReceived: false, feeReceivedDate: "" }, "File marked as billed");
    };
  });
  document.querySelectorAll("[data-mark-received]").forEach((btn) => {
    btn.onclick = () => openMarkReceivedModal(btn.dataset.markReceived);
  });
  document.querySelectorAll("[data-mark-not-received]").forEach((btn) => {
    btn.onclick = () => updateFileBilling(btn.dataset.markNotReceived, { feeReceived: false, feeReceivedDate: "" }, "Fee marked as not received", "feePending");
  });
  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = () => {
      const file = state.files.find((f) => f.id === btn.dataset.delete);
      if (!rolePerm().delete) return toast("This role cannot delete records.");
      if (!file) return toast("File record not found.");
      if (confirm(`Delete file record for ${file.name}? This cannot be undone.`)) {
        state.deletedFileIds = [...new Set([...(state.deletedFileIds || []), file.id])];
        state.files = state.files.filter((f) => f.id !== file.id);
        saveState({ skipMerge: true });
        if (isSupabaseMode()) {
          syncFileDeleteToApi(file.id)
            .then(() => {
              toast("File record deleted and synced");
              renderAll();
            })
            .catch(() => toast("File deleted locally, but central sync failed. Please retry."));
          return;
        }
        toast("File record deleted permanently");
        renderAll();
      }
    };
  });
}

async function checkCompletedFile(fileId) {
  if (!canManageChecking()) return toast("Only authorised checkers can check completed files.");
  const index = state.files.findIndex((file) => file.id === fileId);
  if (index < 0) return toast("File record not found.");
  const file = { ...state.files[index] };
  if (!isNotCheckedFile(file)) return toast("This file is not pending checking.");
  if (!canCheckFile(file)) {
    addAuditLog("Attempt made to check own work", {
      fileId,
      fileName: file.name,
      attemptedBy: state.currentUser,
      workDoneBy: file.completedBy || file.assignedStaff || "",
    });
    saveState();
    return toast("You cannot check a file completed by yourself. This file must be checked by another authorised user.");
  }
  const checkedBy = state.currentUser || loggedInUser()?.name || "";
  const checkedDate = canEditCheckedDate()
    ? normalizeImportDate(prompt("Date of Checking (dd-mm-yyyy)", displayDate(todayDate())) || todayDate())
    : todayDate();
  if (!checkedDate) return toast("Date of Checking is required.");
  const completionDate = normalizeImportDate(workCompletedDate(file));
  if (completionDate && checkedDate < completionDate) return toast("Date of Checking cannot be earlier than Work Completion Date.");
  const checkingRemarks = prompt("Checking Remarks", file.checkingRemarks || "")?.trim() || "";
  if (!validCheckingRemark(checkingRemarks)) return toast("Please enter a valid Checking Remark containing at least two characters before marking this file as Checked.");
  const updated = {
    ...file,
    checkedBy,
    checkedDate,
    checkingRemarks,
    lastUpdatedDate: todayDate(),
    updatedAt: Date.now(),
    taskActivityAt: new Date().toISOString(),
    task_activity_at: new Date().toISOString(),
  };
  state.files[index] = updated;
  queueFileCheckedNotification(updated, file);
  addAuditLog("File marked Checked", {
    fileId,
    fileName: file.name,
    previousCheckingStatus: checkingStatusOf(file).label,
    newCheckingStatus: "Checked",
    checkedBy,
    checkedDate,
    checkingRemarks,
  });
  saveState();
  try {
    await syncFileRecordToApi(updated);
  } catch {
    return toast("Checked locally, but central sync failed. Please retry.");
  }
  toast("File marked as checked and synced");
  renderAll();
}

function openStaffFilesFromDashboard(kind) {
  resetFilters();
  if (kind === "active") state.filters.listView = "active";
  if (kind === "all") state.filters.listView = "";
  if (kind === "completed") state.filters.listView = "completed";
  if (kind === "notChecked") state.filters.listView = "notChecked";
  if (kind === "billed") state.filters.listView = "billed";
  if (kind === "unbilled") state.filters.listView = "nonBilled";
  if (kind === "onHold") state.filters.workflow = "On Hold";
  if (kind === "clientPending") state.filters.workflow = "Client Pending";
  if (kind === "overdue") state.filters.overdue = "Yes";
  if (kind === "approval") state.filters.pendingApproval = "Yes";
  if (kind === "correction") state.filters.dashboardKind = "correctionRequired";
  if (kind === "reallotted") state.filters.dashboardKind = "reAllotted";
  state.filters.fromDashboard = "Yes";
  saveState();
  activePage = "files";
  renderAll();
}

async function returnFileForCorrection(fileId) {
  if (!canManageChecking()) return toast("Only authorised checkers can return files for correction.");
  const index = state.files.findIndex((file) => file.id === fileId);
  if (index < 0) return toast("File record not found.");
  const file = { ...state.files[index] };
  if (!isCheckedCompleted(file)) return toast("Only completed files can be returned for correction.");
  const correctionRemarks = prompt("Correction remarks")?.trim();
  if (!correctionRemarks) return toast("Correction remarks are required.");
  if (isSupabaseMode()) {
    try {
      const result = await apiJson(`/api/files/${encodeURIComponent(fileId)}/return-correction`, {
        method: "POST",
        body: JSON.stringify({ correctionReason: correctionRemarks }),
      });
      if (result.files) state.files = result.files;
      if (result.correctionHistory) state.correctionHistory = result.correctionHistory;
      if (result.fileNotifications) state.fileNotifications = result.fileNotifications;
      saveState({ skipMerge: true, skipRemote: true });
      toast("File returned for correction and synced");
      renderAll();
      return;
    } catch (error) {
      console.error("Failed correction update", { fileId, message: error.message });
      return toast(`Correction sync failed: ${error.message || "Please retry."}`);
    }
  }
  const returnedDate = todayDate();
  const returnedTo = findUserByStaffIdentity(file.assignedStaffId)
    || findUserByStaffIdentity(file.assignedStaffEmail)
    || findUserByStaffIdentity(file.assignedStaff)
    || {};
  const correction = {
    id: crypto.randomUUID(),
    fileId,
    file_id: fileId,
    correctionReason: correctionRemarks,
    correction_reason: correctionRemarks,
    returnedBy: state.currentUser || "",
    returnedById: state.session?.userId || "",
    returnedByEmail: state.session?.userEmail || "",
    returnedTo: returnedTo.name || file.assignedStaff || "",
    returnedToId: returnedTo.id || file.assignedStaffId || "",
    returnedToEmail: returnedTo.email || file.assignedStaffEmail || "",
    returnedAt: new Date().toISOString(),
    returnedDate,
    status: "Returned for Correction",
    response: "",
  };
  const stagesObj = { ...normalizeStages(file), ...(file.stages || {}) };
  stagesObj["Correction Required"] = true;
  stagesObj.Completed = false;
  stagesObj.Billed = Boolean(file.billed);
  const updated = {
    ...file,
    stages: stagesObj,
    filed: false,
    checkedBy: "",
    checkedDate: "",
    checkingRemarks: "",
    correctionRemarks,
    returnedBy: correction.returnedBy,
    returnedById: correction.returnedById,
    returnedByEmail: correction.returnedByEmail,
    returnedTo: correction.returnedTo,
    returnedToId: correction.returnedToId,
    returnedToEmail: correction.returnedToEmail,
    returnedDate,
    correctionStatus: correction.status,
    correctionHistory: [...(file.correctionHistory || []), correction],
    lastUpdatedDate: returnedDate,
    updatedAt: Date.now(),
    taskActivityAt: correction.returnedAt,
    task_activity_at: correction.returnedAt,
  };
  state.files[index] = updated;
  state.correctionHistory = [...(state.correctionHistory || []), correction];
  queueFileChangeNotification(updated, `Returned for correction: ${correctionRemarks}`, "Returned for Correction");
  addAuditLog("File returned for correction", {
    fileId,
    fileName: file.name,
    previousStatus: statusOf(file).label,
    newStatus: "Correction Required",
    correctionRemarks,
    returnedBy: updated.returnedBy,
    returnedDate,
  });
  saveState();
  try {
    await syncFileRecordToApi(updated);
  } catch {
    return toast("Correction saved locally, but central sync failed. Please retry.");
  }
  toast("File returned for correction and synced");
  renderAll();
}

function renderCorrectionRequiredTable(files) {
  const rows = sortFilesByCorrectionNewestFirst(files);
  const compactStaffCorrectionView = !["Admin", "Manager"].includes(state.currentRole);
  if (!rows.length) return empty("No correction-required files found.");
  return `
    <div class="table-wrap file-table-wrap">
      <table class="file-table file-table-compact correction-required-table">
        <thead><tr>
          <th>SN</th><th>Client Name</th><th>CR No.</th><th>Service Type</th>${compactStaffCorrectionView ? "" : "<th>File Received Date</th><th>Assigned Staff</th>"}<th>Completed Date</th><th>Returned On</th><th>Required By</th><th>Correction Reason</th><th>Status</th><th>Priority</th>${compactStaffCorrectionView ? "" : "<th>Expected Date</th><th>Aging</th><th>Last Updated</th>"}<th>Actions</th>
        </tr></thead>
        <tbody>
          ${rows.map((file, index) => {
            const correction = latestCorrectionForFile(file) || {};
            const returnedOn = correction.returnedAt || correction.returned_at || file.returnedAt || file.returned_at || file.returnedDate || "";
            const reason = correction.correctionReason || correction.correction_reason || file.correctionRemarks || "";
            const requiredBy = correction.returnedBy || correction.returned_by_name || file.returnedBy || "-";
            const expected = correction.expectedCorrectionDate || correction.expected_correction_date || file.expectedCorrectionDate || "";
            const status = file.correctionStatus || correction.status || "Correction Required";
            return `<tr class="file-row file-row-overdue">
              <td>${index + 1}</td>
              <td><span class="client-name">${escapeHtml(file.name || "")}</span><span class="subtext">${escapeHtml(file.pan || "")}</span></td>
              <td>${escapeHtml(file.crNo || file.cr_no || file.pan || "-")}</td>
              <td>${escapeHtml(file.serviceType || "")}</td>
              ${compactStaffCorrectionView ? "" : `<td>${fmt(file.fileReceivedDate)}</td><td>${escapeHtml(file.assignedStaff || file.returnedTo || "Not Assigned")}</td>`}
              <td>${fmt(workCompletedDate(file))}</td>
              <td>${escapeHtml(fmt(returnedOn) || "-")}</td>
              <td>${escapeHtml(requiredBy)}</td>
              <td class="correction-reason-cell">${escapeHtml(reason || "-")}</td>
              <td><span class="badge overdue">${escapeHtml(status)}</span></td>
              <td><span class="badge priority-${String(file.priority || "Medium").toLowerCase()}">${escapeHtml(file.priority || "Medium")}</span></td>
              ${compactStaffCorrectionView ? "" : `<td>${fmt(expected)}</td><td>${returnedOn ? agingText(returnedOn) : "-"}</td><td>${fmt(file.lastUpdatedDate || file.updated_at || file.updatedAt)}</td>`}
              <td><div class="action-row"><button class="mini-button" data-edit="${file.id}">View File</button></div></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function openMarkReceivedModal(fileId) {
  const file = state.files.find((item) => item.id === fileId);
  if (!file) return toast("File record not found.");
  if (!rolePerm().assign) return toast("This role cannot update billing.");
  closeMarkReceivedModal();
  const amountValue = Number(file.amount_received || file.amountReceived || file.feeAmount || file.billAmount || file.amount || 0) || "";
  const modal = document.createElement("div");
  modal.id = "markReceivedModal";
  modal.className = "simple-modal open";
  modal.innerHTML = `
    <div class="simple-modal-card">
      <div class="drawer-head">
        <div>
          <h3>Mark Fee Received</h3>
          <p class="small-muted">${escapeHtml(file.name || "File")} | ${escapeHtml(file.serviceType || "")}</p>
        </div>
        <button class="icon-button" id="closeReceivedModal">X</button>
      </div>
      <div class="drawer-body">
        <div class="two-col">
          ${checkingDetailField("Billing Status", file.billed ? "Billed" : "Not Billed")}
          ${checkingDetailField("Billed Date", file.billedDate ? displayDate(file.billedDate) : "-")}
        </div>
        <div class="two-col">
          ${formField("receivedAmount", "Amount Received", amountValue, "number", false)}
          ${formField("receivedOn", "Received On", file.received_on || file.receivedOn || file.feeReceivedDate || todayDate(), "date", false)}
        </div>
      </div>
      <div class="drawer-actions">
        <button class="secondary-button" id="cancelReceivedModal">Cancel</button>
        <button class="primary-button" id="saveReceivedModal">Save Receipt</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.querySelector("#backdrop")?.classList.add("show");
  document.querySelector("#closeReceivedModal").onclick = closeMarkReceivedModal;
  document.querySelector("#cancelReceivedModal").onclick = closeMarkReceivedModal;
  document.querySelector("#saveReceivedModal").onclick = () => saveReceivedFromModal(fileId);
}

function closeMarkReceivedModal() {
  document.querySelector("#markReceivedModal")?.remove();
  if (!document.querySelector(".drawer.open") && !document.querySelector(".notification-panel.open")) {
    document.querySelector("#backdrop")?.classList.remove("show");
  }
}

async function saveReceivedFromModal(fileId) {
  const amount = Number(document.querySelector("[name='receivedAmount']")?.value || 0);
  const receivedOn = normalizeImportDate(document.querySelector("[name='receivedOn']")?.value || "");
  if (!amount) return toast("Please enter amount received.");
  if (!receivedOn) return toast("Received On date is required.");
  const button = document.querySelector("#saveReceivedModal");
  if (button) button.disabled = true;
  const user = loggedInUser() || {};
  const receivedAt = new Date().toISOString();
  const file = state.files.find((item) => item.id === fileId) || {};
  const billedAmount = dashboardFileAmount(file, "billed");
  const balanceAmount = Math.max(Number(billedAmount || 0) - amount, 0);
  const ok = await updateFileBilling(fileId, {
    billed: true,
    feeReceived: true,
    feeReceivedDate: receivedOn,
    feeReceivedAmount: amount,
    amount_received: amount,
    amountReceived: amount,
    balanceAmount,
    balance_amount: balanceAmount,
    received_on: receivedOn,
    receivedOn,
    received_by_user_id: user.id || state.session?.userId || "",
    received_by_user_name: user.name || state.currentUser || "",
    receivedByUserId: user.id || state.session?.userId || "",
    receivedByUserName: user.name || state.currentUser || "",
    received_at: receivedAt,
    receivedAt,
    feeReceivedBy: user.name || state.currentUser || "",
    payment_status: balanceAmount > 0 ? "Partly Received" : "Fee Received",
    paymentStatus: balanceAmount > 0 ? "Partly Received" : "Fee Received",
  }, "Fee receipt saved");
  if (button) button.disabled = false;
  if (ok) closeMarkReceivedModal();
}

async function updateFileBilling(fileId, updates, message, nextListView = "") {
  if (!rolePerm().assign) return toast("This role cannot update billing.");
  const index = state.files.findIndex((file) => file.id === fileId);
  if (index < 0) return toast("File record not found.");
  const file = { ...state.files[index] };
  const stagesObj = { ...normalizeStages(file), ...(file.stages || {}) };
  if (Object.prototype.hasOwnProperty.call(updates, "billed")) stagesObj.Billed = Boolean(updates.billed);
  const updated = {
    ...file,
    ...updates,
    stages: stagesObj,
    lastUpdatedDate: todayDate(),
    updatedAt: Date.now(),
  };
  state.files[index] = updated;
  queueFileChangeNotification(updated, billingChangeText(file, updated), updates.billed ? "Billed" : updates.feeReceived ? "Fee Received" : "Billing Update");
  saveState();
  try {
    await syncFileRecordToApi(updated);
  } catch {
    toast("Billing saved locally, but central sync failed. Please retry.");
    return false;
  }
  if (nextListView) state.filters.listView = nextListView;
  toast(`${message} and synced`);
  renderAll();
  return true;
}

function billingChangeText(before, after) {
  if (before.billingType !== after.billingType) return `Billing type changed to ${after.billingType || "Not Set"}`;
  if (!before.billed && after.billed) return "File marked as Billed";
  if ((before.billedDate || "") !== (after.billedDate || "")) return `Billed date changed to ${fmt(after.billedDate) || "blank"}`;
  if (!before.feeReceived && after.feeReceived) return "Fee marked as Received";
  return "Billing details updated";
}

function receiptSummary(file = {}) {
  if (!file.feeReceived) return "";
  const amount = Number(file.amount_received || file.amountReceived || file.feeReceivedAmount || 0);
  const receivedOn = file.received_on || file.receivedOn || file.feeReceivedDate || "";
  return `<span class="subtext receipt-summary">Received${amount ? `: ${money(amount)}` : ""}${receivedOn ? ` on ${displayDate(receivedOn)}` : ""}</span>`;
}

function queueFileChangeNotification(file, changeText, changeType = "File Update") {
  if (!["Admin", "Manager", "Staff Manager"].includes(state.currentRole)) return;
  const targetUser = findUserByStaffIdentity(file.assignedStaff)
    || findUserByStaffIdentity(file.assignedStaffEmail)
    || findUserByStaffIdentity(file.assignedStaffId);
  if (!targetUser || targetUser.name === "Not Assigned") return;
  const now = new Date();
  state.fileNotifications = [
    ...(state.fileNotifications || []),
    {
      id: crypto.randomUUID(),
      fileId: file.id,
      fileName: file.name,
      changeType,
      changeText,
      changedBy: state.currentUser,
      changedByRole: state.currentRole,
      targetUserId: targetUser.id || file.assignedStaffId || "",
      targetUserEmail: targetUser.email || file.assignedStaffEmail || "",
      targetUserName: targetUser.name || file.assignedStaff || "",
      date: todayDate(),
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      createdAt: now.getTime(),
      tone: changeType === "File Allotted" ? "approval" : "progress",
    },
  ].slice(-500);
}

function queueReassignmentNotifications(file, reassignedFrom = "") {
  if (!["Admin", "Manager", "Staff Manager"].includes(state.currentRole)) return;
  const fromUser = findUserByStaffIdentity(reassignedFrom);
  const toUser = findUserByStaffIdentity(file.reAssignedStaff)
    || findUserByStaffIdentity(file.reAssignedStaffEmail)
    || findUserByStaffIdentity(file.reAssignedStaffId);
  const recipients = [
    toUser && {
      user: toUser,
      text: `File Reassigned: ${file.name || "File"} - ${file.serviceType || "Service"}${file.fy ? ` - ${file.fy}` : ""} has been reassigned to you by ${state.currentUser || "Team"}.`,
      tone: "approval",
    },
    fromUser && {
      user: fromUser,
      text: `File Reassigned: ${file.name || "File"} - ${file.serviceType || "Service"}${file.fy ? ` - ${file.fy}` : ""} has been reassigned from you to ${file.reAssignedStaff || "new staff"} by ${state.currentUser || "Team"}.`,
      tone: "pending",
    },
  ].filter(Boolean);
  if (!recipients.length) return;
  const now = new Date();
  const existingKeys = new Set((state.fileNotifications || []).map((notice) => notice.dedupeKey).filter(Boolean));
  const notices = recipients.map(({ user, text, tone }) => {
    const dedupeKey = `${file.id}|file_reassigned|${file.reAssignedDate || todayDate()}|${user.id || user.email || user.name}`;
    if (existingKeys.has(dedupeKey)) return null;
    existingKeys.add(dedupeKey);
    return {
      id: crypto.randomUUID(),
      dedupeKey,
      fileId: file.id,
      fileName: file.name,
      changeType: "file_reassigned",
      changeText: text,
      changedBy: state.currentUser,
      changedByRole: state.currentRole,
      targetUserId: user.id || "",
      targetUserEmail: user.email || "",
      targetUserName: user.name || "",
      date: todayDate(),
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      createdAt: now.getTime(),
      tone,
    };
  }).filter(Boolean);
  if (notices.length) state.fileNotifications = [...(state.fileNotifications || []), ...notices].slice(-500);
}

function checkedNotificationRecipients(file = {}) {
  const identities = [
    file.completedById,
    file.completedByEmail,
    file.completedBy,
    file.workDoneById,
    file.workDoneByEmail,
    file.workDoneBy,
    file.doneById,
    file.doneByEmail,
    file.doneBy,
    file.assignedStaffId,
    file.assignedStaffEmail,
    file.assignedStaff,
  ];
  const map = new Map();
  identities.forEach((identity) => {
    const user = findUserByStaffIdentity(identity);
    if (!user || user.name === "Not Assigned") return;
    const key = String(user.id || user.email || user.name || "").toLowerCase();
    if (key) map.set(key, user);
  });
  return [...map.values()];
}

function fileCheckedNotificationText(file = {}, checkedBy = "", checkedDate = "") {
  const fy = fileFy(file);
  const fyText = fy ? `, FY ${fy}` : "";
  return `${file.name || "File"} (${file.serviceType || "Service"}${fyText}) checked by ${checkedBy || state.currentUser || "Team"} on ${fmt(checkedDate || todayDate())}.`;
}

function queueFileCheckedNotification(file, beforeFile = {}) {
  if (!["Admin", "Manager", "Staff Manager"].includes(state.currentRole) && !isAuthorisedCheckingStaff()) return;
  if (checkingStatusOf(beforeFile).label === "Checked" || checkingStatusOf(file).label !== "Checked") return;
  const recipients = checkedNotificationRecipients(file);
  if (!recipients.length) return;
  const now = new Date();
  const checkedBy = file.checkedBy || state.currentUser || "";
  const checkedDate = normalizeImportDate(file.checkedDate || todayDate()) || todayDate();
  const existingKeys = new Set((state.fileNotifications || []).map((notice) => notice.dedupeKey).filter(Boolean));
  const notices = recipients.map((targetUser) => {
    const dedupeKey = `${file.id}|File Checked|${checkedDate}|${normalizePersonName(checkedBy)}|${targetUser.id || targetUser.email || targetUser.name}`;
    if (existingKeys.has(dedupeKey)) return null;
    existingKeys.add(dedupeKey);
    return {
      id: crypto.randomUUID(),
      dedupeKey,
      fileId: file.id,
      fileName: file.name,
      changeType: "File Checked",
      changeText: fileCheckedNotificationText(file, checkedBy, checkedDate),
      changedBy: checkedBy,
      changedByRole: state.currentRole,
      targetUserId: targetUser.id || "",
      targetUserEmail: targetUser.email || "",
      targetUserName: targetUser.name || "",
      date: todayDate(),
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      createdAt: now.getTime(),
      tone: "filed",
    };
  }).filter(Boolean);
  if (notices.length) state.fileNotifications = [...(state.fileNotifications || []), ...notices].slice(-500);
}

function queueCheckingRequiredNotifications(file) {
  const now = new Date();
  const existingKey = `${file.id}|awaiting-check|${file.completionDate || ""}`;
  const existing = new Set((state.fileNotifications || []).map((notice) => notice.dedupeKey).filter(Boolean));
  if (existing.has(existingKey)) return;
  const recipients = (state.users || []).filter((user) => ["Admin", "Manager"].includes(user.role));
  const notices = recipients.map((user) => ({
    id: crypto.randomUUID(),
    dedupeKey: existingKey,
    fileId: file.id,
    fileName: file.name,
    changeType: "Awaiting Checking",
    changeText: `${file.serviceType} completed by ${file.assignedStaff || "Staff"} on ${fmt(file.completionDate)}`,
    changedBy: state.currentUser,
    changedByRole: state.currentRole,
    targetUserId: user.id || "",
    targetUserEmail: user.email || "",
    targetUserName: user.name || "",
    date: todayDate(),
    time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    createdAt: now.getTime(),
    tone: "approval",
  }));
  state.fileNotifications = [...(state.fileNotifications || []), ...notices].slice(-500);
}

function describeFileChanges(before, after) {
  if (!before) return hasAssignedStaffValue(currentFileAssignee(after).name) ? "New file allotted" : "New file created";
  const changes = [];
  const beforeAssignee = currentFileAssignee(before);
  const afterAssignee = currentFileAssignee(after);
  if (!sameStaffName(beforeAssignee.name, afterAssignee.name)) {
    changes.push(`${hasAssignedStaffValue(after.reAssignedStaff) ? "Re assigned" : "Assigned staff changed"} from ${beforeAssignee.name || "Not Assigned"} to ${afterAssignee.name || "Not Assigned"}`);
  }
  if (before.serviceType !== after.serviceType) changes.push(`Service changed to ${after.serviceType}`);
  if (before.dueDate !== after.dueDate) changes.push(`Due date changed to ${fmt(after.dueDate)}`);
  if (before.priority !== after.priority) changes.push(`Priority changed to ${after.priority}`);
  if (statusOf(before).label !== statusOf(after).label) changes.push(`Status changed to ${statusOf(after).label}`);
  if (before.checkedBy !== after.checkedBy || before.checkedDate !== after.checkedDate) changes.push("Checking details updated");
  if (before.remarks !== after.remarks) changes.push("Remarks updated");
  return changes.join("; ");
}

function fileChangeType(before, after) {
  if (!before && hasAssignedStaffValue(currentFileAssignee(after).name)) return "File Allotted";
  if (before && !sameStaffName(currentFileAssignee(before).name, currentFileAssignee(after).name)) return hasAssignedStaffValue(after.reAssignedStaff) ? "File Reassigned" : "File Re-Allotted";
  return "File Update";
}

function canBumpTaskActivity() {
  return ["Admin", "Manager", "Staff Manager"].includes(state.currentRole);
}

function fileTaskActivityAt(file = {}) {
  return file.taskActivityAt || file.task_activity_at || file.reAssignedDate || file.re_assigned_date || file.reassigned_at || file.assigned_at || file.assignedAt || file.workAllotmentDate || file.work_allotment_date || "";
}

function shouldBumpTaskActivity(before, after, assignedChanged = false) {
  if (!before) return hasAssignedStaffValue(currentFileAssignee(after).name);
  if (assignedChanged) return true;
  if (!canBumpTaskActivity()) return false;
  if (currentWorkflowStage(before) !== currentWorkflowStage(after)) return true;
  if (checkingStatusOf(before).label !== checkingStatusOf(after).label) return true;
  return false;
}

function pipeline(file) {
  const idx = stageIndex(file);
  return `<div class="pipeline" title="${stages[idx]}">${stages.map((_, i) => `<span class="pipe-step ${i <= idx ? "done" : ""}"></span>`).join("")}</div><span class="subtext">${stages[idx]}</span>`;
}

function dueText(file) {
  if (file.filed) return "Completed";
  if (!file.dueDate) return "";
  const days = daysUntil(file.dueDate);
  if (!Number.isFinite(days)) return "";
  if (days < 0) return `${Math.abs(days)} day(s) overdue`;
  if (days === 0) return "Due today";
  return `${days} day(s) left`;
}

function fmt(dateString) {
  return displayDate(dateString);
}

function openFileDrawer(id) {
  editingId = id || null;
  const file = id ? structuredClone(state.files.find((f) => f.id === id)) : blankFile();
  if (id ? !canEditFileRecord(file) : !canCreateFile()) return toast("You do not have permission to edit this file.");
  const canAssignThisFile = canAssignFile(id ? file : null);
  const drawer = document.querySelector("#fileDrawer");
  drawer.innerHTML = `
    <div class="drawer-head">
      <div><h3>${id ? "Edit File Record" : "Add New File"}</h3><p class="small-muted">Last updated changes automatically on save.</p></div>
      <button class="icon-button" id="closeDrawer">X</button>
    </div>
    <form id="fileForm" class="drawer-body">
      <div class="two-col">
        ${formField("name", "Name", file.name)}
        ${formField("pan", "PAN / Regn Number", file.pan)}
        ${serviceField(file.serviceType)}
        ${careOfField(file.careOf || "Direct")}
        ${fyField(file.fy || "NA")}
        ${selectField("mode", "Mode", modes, file.mode || "Whatsapp")}
        ${formField("fileReceivedDate", "File Received Date", file.fileReceivedDate, "date")}
        ${workflowStatusField(file)}
        ${staffAssignField("assignedStaff", "Assigned Staff", file.assignedStaff || "Not Assigned", !canAssignThisFile)}
        ${formField("workAllotmentDate", "Allotted On", file.workAllotmentDate || "", "date", false)}
        ${formField("dueDate", "Due Date", file.dueDate, "date")}
        ${selectField("priority", "Priority", ["Low", "Medium", "High", "Urgent"], file.priority)}
        ${staffAssignField("reAssignedStaff", "Re Assigned", file.reAssignedStaff || "", !canAssignThisFile, true)}
        ${formField("reAssignedDate", "Re Assigned Date", file.reAssignedDate || "", "date", false)}
      </div>
      <div class="two-col">
        ${formField("completionDate", "Completed Date", file.completionDate || "", "date", false)}
      </div>
      <div class="two-col">
        ${canManageChecking() ? (canEditCheckedDate() ? staffAssignField("checkedBy", "Checked By", file.checkedBy || "", false, true, false) : checkingDetailField("Checked By", file.checkedBy || state.currentUser || "-")) : checkingDetailField("Checking Status", checkingStatusOf(file).label || "-")}
        ${canManageChecking() ? (canEditCheckedDate() ? formField("checkedDate", "Checked Date", file.checkedDate || "", "date", false) : checkingDetailField("Checked Date", file.checkedDate ? displayDate(file.checkedDate) : "-")) : checkingDetailField("Checked Date", file.checkedDate ? displayDate(file.checkedDate) : "-")}
      </div>
      ${canManageChecking() ? `
        <div class="field">
          <label>Checking Remarks</label>
          <textarea name="checkingRemarks">${escapeHtml(file.checkingRemarks || "")}</textarea>
        </div>
      ` : `
        <div class="two-col">
          ${checkingDetailField("Checked By", file.checkedBy || "-")}
          ${checkingDetailField("Checking Remarks", file.checkingRemarks || "-")}
        </div>
      `}
      ${correctionInfoPanel(file)}
      <div class="field">
        <label>Remarks</label>
        <textarea name="remarks">${escapeHtml(file.remarks || "")}</textarea>
      </div>
      <div class="field">
        <label>Attachments</label>
        <input type="file" id="attachmentsInput" multiple />
        <div class="card-list" id="attachmentPreview">
          ${(file.attachments || []).map((a) => `<div class="attachment-card"><strong>${a.name}</strong><p>Uploaded ${fmt(a.uploadDate)} by ${a.uploadedBy}</p></div>`).join("") || empty("No attachments added.")}
        </div>
      </div>
      <input type="hidden" name="id" value="${file.id}">
    </form>
    <div class="drawer-actions">
      <button class="secondary-button" id="cancelFile">Cancel</button>
      <button class="primary-button" id="saveFile">Save Record</button>
    </div>
  `;
  drawer.dataset.attachments = JSON.stringify(file.attachments || []);
  drawer.classList.add("open");
  document.querySelector("#backdrop").classList.add("show");
  document.querySelector("#closeDrawer").onclick = closeOverlays;
  document.querySelector("#cancelFile").onclick = closeOverlays;
  document.querySelector("#saveFile").onclick = saveFileFromDrawer;
  document.querySelector("#serviceSelect").onchange = (e) => {
    const input = document.querySelector("#newServiceInput");
    input.classList.toggle("hidden", e.target.value !== "__new");
    if (e.target.value === "__new") input.focus();
  };
  document.querySelector("#careOfSelect").onchange = (e) => {
    const input = document.querySelector("#newCareOfInput");
    input.classList.toggle("hidden", e.target.value !== "__new_care_of");
    if (e.target.value === "__new_care_of") input.focus();
  };
  document.querySelector("#fySelect").onchange = (e) => {
    const input = document.querySelector("#newFyInput");
    input.classList.toggle("hidden", e.target.value !== "__new_fy");
    if (e.target.value === "__new_fy") input.focus();
  };
  bindStaffPicker("assignedStaff");
  bindStaffPicker("reAssignedStaff");
  bindStaffPicker("checkedBy");
  const checkedDateInput = document.querySelector("[name='checkedDate']");
  if (checkedDateInput && !canEditCheckedDate()) checkedDateInput.disabled = true;
  bindAllotmentDateDefaults();
  document.querySelector("#attachmentsInput").onchange = (e) => {
    const existing = JSON.parse(drawer.dataset.attachments || "[]");
    const added = [...e.target.files].map((uploaded) => ({
      id: crypto.randomUUID(),
      name: uploaded.name,
      uploadDate: todayDate(),
      uploadedBy: state.currentUser,
    }));
    drawer.dataset.attachments = JSON.stringify([...existing, ...added]);
    document.querySelector("#attachmentPreview").innerHTML = [...existing, ...added].map((a) => `<div class="attachment-card"><strong>${a.name}</strong><p>Uploaded ${fmt(a.uploadDate)} by ${a.uploadedBy}</p></div>`).join("");
  };
  bindCompletionDateDefault();
}

function bindAllotmentDateDefaults() {
  const receivedInput = document.querySelector("[name='fileReceivedDate']");
  const allotmentInput = document.querySelector("[name='workAllotmentDate']");
  if (!receivedInput || !allotmentInput) return;
  let allotmentManuallyChanged = false;
  allotmentInput.oninput = () => {
    allotmentManuallyChanged = true;
  };
  receivedInput.onchange = () => {
    if (!allotmentManuallyChanged || !allotmentInput.value) {
      allotmentInput.value = receivedInput.value || todayDate();
    }
  };
}

function bindCompletionDateDefault() {
  const workflowSelect = document.querySelector("[name='workflowStatus']");
  const completedDateInput = document.querySelector("[name='completionDate']");
  if (!workflowSelect || !completedDateInput) return;
  const syncCompletedDate = () => {
    if (workflowSelect.value === "Completed" && !completedDateInput.value) completedDateInput.value = todayDate();
  };
  workflowSelect.addEventListener("change", syncCompletedDate);
  syncCompletedDate();
}

function blankFile() {
  const stageObj = Object.fromEntries(stages.map((stage, i) => [stage, i === 0]));
  return {
    id: crypto.randomUUID(),
    name: "",
    pan: "",
    serviceType: serviceDropdownOptions()[0] || "Other Services",
    careOf: "Direct",
    fy: "NA",
    mode: "Whatsapp",
    fileReceivedDate: todayDate(),
    assignedStaff: "Not Assigned",
    workAllotmentDate: todayDate(),
    workStartedDate: "",
    reAssignedStaff: "",
    reAssignedDate: "",
    dueDate: todayDate(),
    priority: "Medium",
    remarks: "",
    attachments: [],
    billingType: "",
    billedDate: "",
    feeReceived: false,
    feeReceivedDate: "",
    completionDate: "",
    checkedBy: "",
    checkedDate: "",
    checkingRemarks: "",
    correctionRemarks: "",
    returnedBy: "",
    returnedDate: "",
    updatedAt: Date.now(),
    stages: stageObj,
  };
}

function formField(name, label, value, type = "text", required = true) {
  if (type === "password") {
    return `<div class="field"><label>${label}</label><div class="password-wrap"><input name="${name}" id="${name}" type="password" value="${escapeHtml(value || "")}" ${required ? "required" : ""}><button type="button" data-toggle-password="${name}">View</button></div></div>`;
  }
  return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${escapeHtml(value || "")}" ${required ? "required" : ""}></div>`;
}

function checkingDetailField(label, value) {
  return `<div class="field readonly-field"><label>${label}</label><div class="readonly-value">${escapeHtml(value || "-")}</div></div>`;
}

function correctionInfoPanel(file = {}) {
  const latest = latestCorrectionForFile(file);
  if (!file.stages?.["Correction Required"] && !latest) return "";
  const reason = latest?.correctionReason || latest?.correction_reason || file.correctionRemarks || "";
  const returnedBy = latest?.returnedBy || latest?.returned_by_name || file.returnedBy || "";
  const returnedOn = latest?.returnedAt || latest?.returned_at || file.returnedDate || "";
  const history = correctionHistoryForFile(file);
  return `
    <div class="correction-panel">
      <span class="badge overdue">Returned for Correction</span>
      <div class="two-col">
        ${checkingDetailField("Correction Reason", reason || "-")}
        ${checkingDetailField("Returned By", returnedBy || "-")}
        ${checkingDetailField("Returned On", returnedOn ? fmt(returnedOn) : "-")}
        ${checkingDetailField("Correction Status", latest?.status || file.correctionStatus || "Returned for Correction")}
      </div>
      ${history.length > 1 ? `<div class="correction-history"><strong>Correction History</strong>${history.map((item) => `<p>${fmt(item.returnedAt || item.returned_at || item.returnedDate)} - ${escapeHtml(item.returnedBy || item.returned_by_name || "")}: ${escapeHtml(item.correctionReason || item.correction_reason || "")}</p>`).join("")}</div>` : ""}
    </div>
  `;
}

function correctionHistoryForFile(file = {}) {
  return sortCorrectionHistory([
    ...(state.correctionHistory || []).filter((row) => row.fileId === file.id || row.file_id === file.id),
    ...(file.correctionHistory || []),
  ]).filter((row, index, rows) => rows.findIndex((item) => (item.id || "") === (row.id || "")) === index);
}

function latestCorrectionForFile(file = {}) {
  return correctionHistoryForFile(file)[0] || null;
}

function markLatestCorrectionResubmitted(file = {}) {
  const history = correctionHistoryForFile(file);
  if (!history.length) return file.correctionHistory || [];
  const latestId = history[0].id;
  const now = new Date().toISOString();
  const updated = history.map((item) => (item.id === latestId ? {
    ...item,
    status: "Resubmitted for Checking",
    response: item.response || "Correction completed and resubmitted for checking.",
    resubmitted_at: now,
    resubmittedAt: now,
    updated_at: now,
    updatedAt: now,
  } : item));
  state.correctionHistory = (state.correctionHistory || []).map((item) => (item.id === latestId ? updated.find((row) => row.id === latestId) : item));
  return updated;
}

function selectField(name, label, options, value, disabled = false) {
  return `<div class="field"><label>${label}</label><select name="${name}" ${disabled ? "disabled" : ""}>${options.map((o) => `<option ${o === value ? "selected" : ""}>${o}</option>`).join("")}</select></div>`;
}

function serviceDropdownOptions() {
  return dedupeByNormalizedText(state.services || []);
}

function careOfDropdownOptions(currentValue = "") {
  return dedupeByNormalizedText([currentValue, ...(state.careOfList || [])].filter(Boolean));
}

function assignableStaffNames(currentValue = "") {
  const names = (state.users || [])
    .filter((user) => !isRevokedAccess(user))
    .filter((user) => !isRemovedStaff(user.name))
    .map((user) => user.name);
  return dedupeByNormalizedText([currentValue, ...names].filter((name) => name && String(name).trim().toLowerCase() !== "not assigned"));
}

function serviceField(value) {
  const options = sortList([value, ...serviceDropdownOptions()].filter(Boolean));
  return `
    <div class="field service-editor">
      <label>Service Type</label>
      <select id="serviceSelect" name="serviceType">
        ${options.map((s) => `<option value="${escapeHtml(s)}" ${s === value ? "selected" : ""}>${escapeHtml(s)}</option>`).join("")}
        <option value="__new">+ Add New Service</option>
      </select>
      <input id="newServiceInput" class="hidden" placeholder="Enter new service type">
    </div>`;
}

function careOfField(value) {
  const options = sortList([value, ...careOfDropdownOptions()].filter(Boolean));
  return `
    <div class="field">
      <label>C/o</label>
      <select id="careOfSelect" name="careOf">
        ${options.map((name) => `<option value="${escapeHtml(name)}" ${name === value ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
        <option value="__new_care_of">+ Add New C/o</option>
      </select>
      <input id="newCareOfInput" class="hidden" placeholder="Enter new C/o name">
    </div>`;
}

function fyField(value) {
  const options = sortList([value, ...defaultFyList].filter(Boolean));
  return `
    <div class="field">
      <label>FY</label>
      <select id="fySelect" name="fy">
        ${options.map((fy) => `<option value="${escapeHtml(fy)}" ${fy === value ? "selected" : ""}>${escapeHtml(fy)}</option>`).join("")}
        <option value="__new_fy">+ Add New</option>
      </select>
      <input id="newFyInput" class="hidden" placeholder="Enter FY">
    </div>`;
}

function staffAssignField(name, label, value, disabled = false, allowBlank = false, includeNotAssigned = true) {
  const options = [
    ...(allowBlank ? [""] : []),
    ...(includeNotAssigned ? ["Not Assigned"] : []),
    ...assignableStaffNames(value),
  ];
  const selectId = `${name}Select`;
  const inputId = `${name}NewInput`;
  return `
    <div class="field">
      <label>${label}</label>
      <select id="${selectId}" name="${name}" ${disabled ? "disabled" : ""}>
        ${options.map((staffName) => `<option value="${escapeHtml(staffName)}" ${staffName === value ? "selected" : ""}>${escapeHtml(staffName || "Select Staff")}</option>`).join("")}
        <option value="__new_staff">+ Add New Staff</option>
      </select>
      <input id="${inputId}" class="hidden" placeholder="Enter new staff name">
    </div>`;
}

function bindStaffPicker(name) {
  const select = document.querySelector(`#${name}Select`);
  if (!select) return;
  select.onchange = (e) => {
    const input = document.querySelector(`#${name}NewInput`);
    input.classList.toggle("hidden", e.target.value !== "__new_staff");
    if (e.target.value === "__new_staff") input.focus();
  };
}

function resolveAssignedStaff(selectedValue, inputId = "assignedStaffNewInput", fallback = "Not Assigned") {
  if (selectedValue !== "__new_staff") return selectedValue;
  const input = document.querySelector(`#${inputId}`);
  const name = input?.value.trim();
  if (!name) return fallback;
  const existing = state.users.find((user) => user.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing.name;
  state.users.push({
    id: crypto.randomUUID(),
    name,
    email: `${name.toLowerCase().replaceAll(" ", ".")}@mandaca.in`,
    role: "Staff",
    password: "Password@123",
  });
  state.users = sortByName(state.users);
  return name;
}

function visibleWorkflowStages(file) {
  return stages.filter((stage) => {
    if (stage === "Billed") return false;
    if (isStaffLogin() && !isSpecialFileCreator() && ["Received", "Allotted", "Billed"].includes(stage)) return false;
    return true;
  }).sort((a, b) => fileSerialSortValue(a) - fileSerialSortValue(b));
}

function currentWorkflowStage(file = {}) {
  const normalized = normalizeStages(file);
  const selected = stages.filter((stage) => stage !== "Billed" && normalized[stage]).pop();
  return selected || "Received";
}

function workflowStatusField(file = {}) {
  const current = currentWorkflowStage(file);
  const options = visibleWorkflowStages(file);
  const optionRows = [...new Set([current, ...options].filter((stage) => stage && stage !== "Billed"))];
  return `
    <div class="field">
      <label for="workflowStatus">STATUS / WORKFLOW</label>
      <select id="workflowStatus" name="workflowStatus" class="workflow-status-select">
        <option value="">Select Status / Workflow</option>
        ${optionRows.map((stage) => `<option value="${escapeHtml(stage)}" ${stage === current ? "selected" : ""} ${canEditStage(stage, file) || stage === current ? "" : "disabled"}>${escapeHtml(stage)}</option>`).join("")}
      </select>
    </div>`;
}

function canEditStage(stage, file = {}) {
  if (stage === "Billed") return false;
  if (!isStaffLogin()) return true;
  if (isAuthorisedCheckingStaff() && !fileCreatedByCurrentUser(file) && !fileBelongsToUser(file, loggedInUser())) return false;
  if (isSpecialFileCreator()) return ["Received", "Allotted", "WIP", "Work Done", "On Hold", "Client Pending", "Approval Pending", "Approved", "Completed", "Correction Required"].includes(stage);
  return ["WIP", "Work Done", "On Hold", "Client Pending", "Approval Pending", "Approved", "Completed", "Correction Required"].includes(stage);
}

function stagesFromWorkflowSelection(selectedStage, existingStages = {}) {
  const selectedIndex = stages.indexOf(selectedStage);
  const nextStages = Object.fromEntries(stages.map((stage, index) => [
    stage,
    selectedIndex >= 0 ? index <= selectedIndex : Boolean(existingStages[stage]),
  ]));
  if (selectedStage === "Approval Pending" && !nextStages.Approved) {
    nextStages.Completed = false;
    nextStages.Billed = false;
  }
  if (selectedStage === "Correction Required") {
    nextStages.Completed = false;
    nextStages.Billed = false;
  }
  if (!nextStages.Completed) nextStages.Billed = false;
  return nextStages;
}

async function saveFileFromDrawer() {
  const form = document.querySelector("#fileForm");
  if (!form.reportValidity()) return;
  const saveButton = document.querySelector("#saveFile");
  if (saveButton?.disabled) return;
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.dataset.originalText = saveButton.textContent || "Save Record";
    saveButton.textContent = "Saving...";
  }
  syncSharedState(localStorage.getItem(STORAGE_KEY), false);
  const existingFile = editingId ? state.files.find((file) => file.id === editingId) : null;
  const data = new FormData(form);
  const existingStages = normalizeStages(existingFile || {});
  const originalWorkflowStatus = existingFile ? currentWorkflowStage(existingFile) : "Received";
  const selectedWorkflowStatus = data.get("workflowStatus") || originalWorkflowStatus || "Received";
  const workflowStatusChanged = !existingFile || selectedWorkflowStatus !== originalWorkflowStatus;
  const stagesObj = workflowStatusChanged
    ? stagesFromWorkflowSelection(selectedWorkflowStatus, existingStages)
    : { ...existingStages };
  if (stagesObj["Approval Pending"] && !stagesObj.Approved) {
    stagesObj.Completed = false;
    stagesObj.Billed = false;
  }
  if (!stagesObj.Completed && !existingFile?.billed) stagesObj.Billed = false;
  if (isStaffLogin() && !canManageChecking() && staffAttemptedCheckingChange(existingFile, data)) {
    addAuditLog("Unauthorized checking edit attempt", {
      fileId: existingFile?.id || data.get("id") || "",
      fileName: existingFile?.name || data.get("name") || "",
      attemptedBy: state.currentUser,
      role: state.currentRole,
    });
    saveState();
    restoreSaveFileButton(saveButton);
    return toast("Staff cannot update Checked By, Checked Date or Checking Remarks.");
  }
  if (isStaffLogin() && !canManageChecking() && isCheckedFile(existingFile) && !stagesObj.Completed) {
    addAuditLog("Unauthorized checking removal attempt", {
      fileId: existingFile?.id || data.get("id") || "",
      fileName: existingFile?.name || data.get("name") || "",
      attemptedBy: state.currentUser,
      role: state.currentRole,
    });
    saveState();
    restoreSaveFileButton(saveButton);
    return toast("Staff cannot remove existing checking details.");
  }
  const selectedService = data.get("serviceType");
  const serviceType = selectedService === "__new" ? document.querySelector("#newServiceInput").value.trim() : selectedService.trim();
  if (!serviceType) {
    restoreSaveFileButton(saveButton);
    return toast("Please enter service type.");
  }
  if (!state.services.includes(serviceType)) state.services.push(serviceType);
  state.services = sortList(state.services);
  const selectedCareOf = data.get("careOf");
  const careOf = selectedCareOf === "__new_care_of" ? document.querySelector("#newCareOfInput").value.trim() : selectedCareOf.trim();
  if (!careOf) {
    restoreSaveFileButton(saveButton);
    return toast("Please enter C/o.");
  }
  if (!state.careOfList.includes(careOf)) state.careOfList.push(careOf);
  state.careOfList = sortList(state.careOfList);
  const selectedFy = data.get("fy");
  const fy = selectedFy === "__new_fy" ? document.querySelector("#newFyInput").value.trim() : String(selectedFy || "").trim();
  if (!fy) {
    restoreSaveFileButton(saveButton);
    return toast("Please enter FY.");
  }
  const canAssignThisFile = canAssignFile(existingFile || {});
  const reAssignedStaff = canonicalStaffName(canAssignThisFile ? resolveAssignedStaff(data.get("reAssignedStaff"), "reAssignedStaffNewInput", "") : (existingFile?.reAssignedStaff || ""), "");
  let reAssignedDate = canAssignThisFile ? data.get("reAssignedDate") : (existingFile?.reAssignedDate || "");
  if (reAssignedStaff && reAssignedStaff !== "Not Assigned" && !reAssignedDate) reAssignedDate = todayDate();
  const selectedAssignedStaff = canonicalStaffName(canAssignThisFile ? resolveAssignedStaff(data.get("assignedStaff"), "assignedStaffNewInput", "Not Assigned") : (existingFile?.assignedStaff || state.currentUser), "Not Assigned");
  const originalAssignedStaff = existingFile && isReassignedFile(existingFile)
    ? originalAllottedTo(existingFile)
    : selectedAssignedStaff;
  const currentAssignedStaff = canAssignThisFile
    ? (hasAssignedStaffValue(reAssignedStaff) ? reAssignedStaff : selectedAssignedStaff)
    : currentFileAssignee(existingFile || { assignedStaff: state.currentUser }).name;
  const assigned = originalAssignedStaff;
  if (hasAssignedStaffValue(currentAssignedStaff)) stagesObj.Allotted = true;
  else stagesObj.Allotted = false;
  let workAllotmentDate = canAssignThisFile ? data.get("workAllotmentDate") : (existingFile?.workAllotmentDate || "");
  if (!workAllotmentDate) workAllotmentDate = data.get("fileReceivedDate") || todayDate();
  const previousCurrentAssignee = existingFile ? currentFileAssignee(existingFile).name : "";
  const assignedChanged = existingFile ? !sameStaffName(previousCurrentAssignee, currentAssignedStaff) : hasAssignedStaffValue(currentAssignedStaff);
  const receivedMarked = stagesObj.Received && (!existingFile?.stages?.Received || !existingFile?.receivedBy);
  let workStartedDate = existingFile?.workStartedDate || "";
  if (stagesObj.WIP && !workStartedDate) workStartedDate = todayDate();
  if (!workStartedDate && (stagesObj["Work Done"] || stagesObj["Approval Pending"] || stagesObj.Approved || stagesObj.Completed)) {
    workStartedDate = todayDate();
  }
  const assignedUser = findUserByStaffIdentity(assigned) || {};
  const reAssignedUser = findUserByStaffIdentity(reAssignedStaff) || {};
  const wasCompleted = isCheckedCompleted(existingFile);
  const wasReturned = Boolean(existingFile?.stages?.["Correction Required"]);
  const justCompleted = stagesObj.Completed && (!wasCompleted || wasReturned);
  let completionDate = normalizeImportDate(data.get("completionDate")) || existingFile?.completionDate || "";
  if (stagesObj.Completed && !completionDate) completionDate = todayDate();
  if (justCompleted && !normalizeImportDate(data.get("completionDate"))) completionDate = todayDate();
  let checkedBy = canManageChecking() ? (canEditCheckedDate() ? resolveAssignedStaff(data.get("checkedBy"), "checkedByNewInput", "") : (existingFile?.checkedBy || state.currentUser || "")) : (existingFile?.checkedBy || "");
  let checkedDate = canManageChecking() ? (canEditCheckedDate() ? normalizeImportDate(data.get("checkedDate")) : (existingFile?.checkedDate || todayDate())) : (existingFile?.checkedDate || "");
  let checkingRemarks = canManageChecking() ? (data.get("checkingRemarks") || "").trim() : (existingFile?.checkingRemarks || "");
  if (justCompleted) {
    checkedBy = "";
    checkedDate = "";
    checkingRemarks = "";
    stagesObj["Correction Required"] = false;
  }
  if (!stagesObj.Completed) {
    checkedBy = "";
    checkedDate = "";
    checkingRemarks = "";
  }
  if (canManageChecking() && stagesObj.Completed && validCheckingRemark(checkingRemarks)) {
    if (!checkedBy) checkedBy = state.currentUser || loggedInUser()?.name || "";
    if (!checkedDate) checkedDate = todayDate();
  }
  if (canManageChecking() && stagesObj.Completed && (checkedBy || checkedDate || checkingRemarks) && !canCheckFile(existingFile || { stages: stagesObj, assignedStaff: assigned })) {
    addAuditLog("Attempt made to check own work", {
      fileId: existingFile?.id || data.get("id") || "",
      fileName: existingFile?.name || data.get("name") || "",
      attemptedBy: state.currentUser,
      workDoneBy: existingFile?.completedBy || existingFile?.assignedStaff || assigned || "",
    });
    saveState();
    restoreSaveFileButton(saveButton);
    return toast("You cannot check a file completed by yourself. This file must be checked by another authorised user.");
  }
  if (canManageChecking() && stagesObj.Completed && (checkedBy || checkedDate || checkingRemarks) && !validCheckingRemark(checkingRemarks)) {
    restoreSaveFileButton(saveButton);
    return toast("Please enter a valid Checking Remark containing at least two characters before marking this file as Checked.");
  }
  if (checkedDate && completionDate && checkedDate < completionDate) {
    restoreSaveFileButton(saveButton);
    return toast("Checked Date cannot be earlier than Work Completion Date.");
  }
  const record = {
    id: data.get("id"),
    name: data.get("name").trim(),
    pan: data.get("pan").trim(),
    serviceType,
    careOf,
    fy,
    mode: data.get("mode"),
    fileReceivedDate: data.get("fileReceivedDate"),
    workDone: stagesObj["Work Done"],
    shared: stagesObj["Approval Pending"],
    reportPrepared: stagesObj["Work Done"],
    approved: stagesObj.Approved,
    filed: stagesObj.Completed,
    billed: Boolean(existingFile?.billed || stagesObj.Billed),
    billedDate: (existingFile?.billed || stagesObj.Billed) ? (existingFile?.billedDate || "") : "",
    billingType: existingFile?.billingType || "",
    feeReceived: (existingFile?.billed || stagesObj.Billed) ? Boolean(existingFile?.feeReceived) : false,
    feeReceivedDate: (existingFile?.billed || stagesObj.Billed) ? (existingFile?.feeReceivedDate || "") : "",
    stages: stagesObj,
    assignedStaff: assigned,
    assignedStaffId: assignedUser.id || "",
    assignedStaffEmail: assignedUser.email || "",
    originallyAllottedTo: existingFile?.originallyAllottedTo || existingFile?.original_assigned_to || assigned,
    originalAssignedStaff: existingFile?.originalAssignedStaff || existingFile?.original_assigned_to || assigned,
    originalAllottedDate: existingFile?.originalAllottedDate || existingFile?.original_assigned_at || workAllotmentDate,
    currentAssignedStaff,
    current_assigned_to: currentAssignedStaff,
    workAllotmentDate,
    receivedBy: receivedMarked ? (state.currentUser || "") : (existingFile?.receivedBy || ""),
    receivedById: receivedMarked ? (state.session?.userId || "") : (existingFile?.receivedById || ""),
    receivedByEmail: receivedMarked ? (state.session?.userEmail || "") : (existingFile?.receivedByEmail || ""),
    allottedBy: (assignedChanged || (!existingFile && hasAssignedStaffValue(assigned))) ? (state.currentUser || "") : (existingFile?.allottedBy || ""),
    allottedById: (assignedChanged || (!existingFile && hasAssignedStaffValue(assigned))) ? (state.session?.userId || "") : (existingFile?.allottedById || ""),
    allottedByEmail: (assignedChanged || (!existingFile && hasAssignedStaffValue(assigned))) ? (state.session?.userEmail || "") : (existingFile?.allottedByEmail || ""),
    previousAllottedTo: assignedChanged ? (previousCurrentAssignee || "") : (existingFile?.previousAllottedTo || ""),
    workStartedDate,
    reAssignedStaff,
    reAssignedStaffId: reAssignedUser.id || "",
    reAssignedStaffEmail: reAssignedUser.email || "",
    reAssignedDate,
    reassignedFrom: assignedChanged && hasAssignedStaffValue(reAssignedStaff) ? (previousCurrentAssignee || assigned || "") : (existingFile?.reassignedFrom || existingFile?.reassigned_from || ""),
    reassigned_from: assignedChanged && hasAssignedStaffValue(reAssignedStaff) ? (previousCurrentAssignee || assigned || "") : (existingFile?.reassigned_from || existingFile?.reassignedFrom || ""),
    reassignedTo: hasAssignedStaffValue(reAssignedStaff) ? reAssignedStaff : (existingFile?.reassignedTo || existingFile?.reassigned_to || ""),
    reassigned_to: hasAssignedStaffValue(reAssignedStaff) ? reAssignedStaff : (existingFile?.reassigned_to || existingFile?.reassignedTo || ""),
    reassignedBy: assignedChanged && hasAssignedStaffValue(reAssignedStaff) ? (state.currentUser || "") : (existingFile?.reassignedBy || existingFile?.reassigned_by || ""),
    reassigned_by: assignedChanged && hasAssignedStaffValue(reAssignedStaff) ? (state.currentUser || "") : (existingFile?.reassigned_by || existingFile?.reassignedBy || ""),
    reassignedAt: hasAssignedStaffValue(reAssignedStaff) ? (reAssignedDate || todayDate()) : (existingFile?.reassignedAt || existingFile?.reassigned_at || ""),
    reassigned_at: hasAssignedStaffValue(reAssignedStaff) ? (reAssignedDate || todayDate()) : (existingFile?.reassigned_at || existingFile?.reassignedAt || ""),
    dueDate: data.get("dueDate"),
    priority: data.get("priority"),
    completionDate,
    workDoneBy: stagesObj["Work Done"] ? (existingFile?.workDoneBy || state.currentUser || "") : (existingFile?.workDoneBy || ""),
    workDoneById: stagesObj["Work Done"] ? (existingFile?.workDoneById || state.session?.userId || "") : (existingFile?.workDoneById || ""),
    workDoneByEmail: stagesObj["Work Done"] ? (existingFile?.workDoneByEmail || state.session?.userEmail || "") : (existingFile?.workDoneByEmail || ""),
    completedBy: stagesObj.Completed ? (justCompleted ? (state.currentUser || "") : (existingFile?.completedBy || state.currentUser || "")) : (existingFile?.completedBy || ""),
    completedById: stagesObj.Completed ? (justCompleted ? (state.session?.userId || "") : (existingFile?.completedById || state.session?.userId || "")) : (existingFile?.completedById || ""),
    completedByEmail: stagesObj.Completed ? (justCompleted ? (state.session?.userEmail || "") : (existingFile?.completedByEmail || state.session?.userEmail || "")) : (existingFile?.completedByEmail || ""),
    checkedBy,
    checkedDate,
    checkingRemarks,
    createdBy: existingFile?.createdBy || state.currentUser || "",
    createdById: existingFile?.createdById || state.session?.userId || "",
    createdByEmail: existingFile?.createdByEmail || state.session?.userEmail || "",
    createdAt: existingFile?.createdAt || new Date().toISOString(),
    editedBy: state.currentUser || "",
    editedAt: new Date().toISOString(),
    correctionRemarks: existingFile?.correctionRemarks || "",
    returnedBy: existingFile?.returnedBy || "",
    returnedById: existingFile?.returnedById || "",
    returnedByEmail: existingFile?.returnedByEmail || "",
    returnedTo: existingFile?.returnedTo || "",
    returnedToId: existingFile?.returnedToId || "",
    returnedToEmail: existingFile?.returnedToEmail || "",
    returnedDate: existingFile?.returnedDate || "",
    correctionStatus: justCompleted && wasReturned ? "Resubmitted for Checking" : (existingFile?.correctionStatus || ""),
    correctionHistory: justCompleted && wasReturned ? markLatestCorrectionResubmitted(existingFile) : (existingFile?.correctionHistory || []),
    remarks: data.get("remarks").trim(),
    attachments: JSON.parse(document.querySelector("#fileDrawer").dataset.attachments || "[]"),
    lastUpdatedDate: todayDate(),
    updatedAt: Date.now(),
  };
  const existingAssignmentHistory = assignmentHistory(existingFile || {});
  if (assignedChanged && hasAssignedStaffValue(reAssignedStaff)) {
    const reassignedAtIso = new Date().toISOString();
    const historyRow = {
      id: crypto.randomUUID(),
      fileId: record.id,
      file_id: record.id,
      actionType: "Reassignment",
      action_type: "Reassignment",
      assignedFrom: previousCurrentAssignee || assigned || "",
      assigned_from: previousCurrentAssignee || assigned || "",
      assignedTo: reAssignedStaff,
      assigned_to: reAssignedStaff,
      assignedToId: reAssignedUser.id || "",
      assigned_to_id: reAssignedUser.id || "",
      assignedToEmail: reAssignedUser.email || "",
      assigned_to_email: reAssignedUser.email || "",
      assignedBy: state.currentUser || "",
      assigned_by: state.currentUser || "",
      assignedById: state.session?.userId || "",
      assigned_by_id: state.session?.userId || "",
      assignedAt: reassignedAtIso,
      assigned_at: reassignedAtIso,
      remarks: data.get("remarks").trim(),
      dedupeKey: `${record.id}|${previousCurrentAssignee || assigned}|${reAssignedStaff}|${reAssignedDate || todayDate()}`,
    };
    const seen = new Set(existingAssignmentHistory.map((row) => row.dedupeKey).filter(Boolean));
    record.assignmentHistory = seen.has(historyRow.dedupeKey) ? existingAssignmentHistory : [historyRow, ...existingAssignmentHistory];
  } else {
    record.assignmentHistory = existingAssignmentHistory;
  }
  const taskActivityAt = shouldBumpTaskActivity(existingFile, record, assignedChanged)
    ? new Date().toISOString()
    : fileTaskActivityAt(existingFile || record);
  record.taskActivityAt = taskActivityAt;
  record.task_activity_at = taskActivityAt;
  const reviewOnlyChecker = isAuthorisedCheckingStaff()
    && existingFile
    && !fileCreatedByCurrentUser(existingFile)
    && !fileBelongsToUser(existingFile, loggedInUser());
  if (reviewOnlyChecker) {
    Object.assign(record, {
      name: existingFile.name,
      pan: existingFile.pan,
      serviceType: existingFile.serviceType,
      careOf: existingFile.careOf,
      fy: existingFile.fy || "NA",
      mode: existingFile.mode,
      fileReceivedDate: existingFile.fileReceivedDate,
      workDone: existingFile.workDone,
      shared: existingFile.shared,
      reportPrepared: existingFile.reportPrepared,
      approved: existingFile.approved,
      filed: existingFile.filed,
      billed: existingFile.billed,
      billedDate: existingFile.billedDate,
      billingType: existingFile.billingType,
      feeReceived: existingFile.feeReceived,
      feeReceivedDate: existingFile.feeReceivedDate,
      stages: existingFile.stages,
      assignedStaff: existingFile.assignedStaff,
      assignedStaffId: existingFile.assignedStaffId,
      assignedStaffEmail: existingFile.assignedStaffEmail,
      workAllotmentDate: existingFile.workAllotmentDate,
      workStartedDate: existingFile.workStartedDate,
      reAssignedStaff: existingFile.reAssignedStaff,
      reAssignedStaffId: existingFile.reAssignedStaffId,
      reAssignedStaffEmail: existingFile.reAssignedStaffEmail,
      reAssignedDate: existingFile.reAssignedDate,
      dueDate: existingFile.dueDate,
      priority: existingFile.priority,
      completionDate: existingFile.completionDate,
      workDoneBy: existingFile.workDoneBy,
      workDoneById: existingFile.workDoneById,
      workDoneByEmail: existingFile.workDoneByEmail,
      completedBy: existingFile.completedBy,
      completedById: existingFile.completedById,
      completedByEmail: existingFile.completedByEmail,
      correctionRemarks: existingFile.correctionRemarks,
      returnedBy: existingFile.returnedBy,
      returnedDate: existingFile.returnedDate,
      remarks: existingFile.remarks,
      attachments: existingFile.attachments || [],
    });
  }
  if (editingId) {
    state.files = state.files.map((file) => (file.id === editingId ? record : file));
  } else {
    state.files.unshift(record);
    addAuditLog("File created", {
      fileId: record.id,
      fileName: record.name,
      createdBy: record.createdBy,
      assignedStaff: record.assignedStaff,
      serviceType: record.serviceType,
    });
  }
  const becameChecked = existingFile && checkingStatusOf(existingFile).label !== "Checked" && checkingStatusOf(record).label === "Checked";
  if (becameChecked) queueFileCheckedNotification(record, existingFile);
  if (existingFile && assignedChanged && hasAssignedStaffValue(record.reAssignedStaff)) queueReassignmentNotifications(record, previousCurrentAssignee);
  const changeText = describeFileChanges(existingFile, record);
  if (changeText && !becameChecked && !(assignedChanged && hasAssignedStaffValue(record.reAssignedStaff))) queueFileChangeNotification(record, changeText, fileChangeType(existingFile, record));
  if (existingFile && changeText) {
    addAuditLog("File edited", {
      fileId: record.id,
      fileName: record.name,
      previousStatus: statusOf(existingFile).label,
      newStatus: statusOf(record).label,
      changeText,
    });
  }
  if (existingFile && statusOf(existingFile).label !== statusOf(record).label) {
    addAuditLog("Status changed", {
      fileId: record.id,
      fileName: record.name,
      previousValue: statusOf(existingFile).label,
      newValue: statusOf(record).label,
    });
  }
  if (record.receivedBy && (!existingFile || !existingFile.receivedBy || !existingFile.stages?.Received)) {
    addAuditLog("File marked as Received", {
      fileId: record.id,
      fileName: record.name,
      receivedBy: record.receivedBy,
      fileReceivedDate: record.fileReceivedDate,
    });
  }
  if (justCompleted) {
    queueCheckingRequiredNotifications(record);
    addAuditLog(existingFile?.stages?.["Correction Required"] ? "File resubmitted after correction" : "File marked Completed", {
      fileId: record.id,
      fileName: record.name,
      workCompletionDate: record.completionDate,
      doneBy: record.assignedStaff,
      checkingStatus: "Not Checked",
    });
  }
  if (existingFile && existingFile.completionDate !== record.completionDate) {
    addAuditLog("Completed Date changed", {
      fileId: record.id,
      fileName: record.name,
      previousValue: existingFile.completionDate || "",
      newValue: record.completionDate || "",
    });
  }
  if (existingFile && !sameStaffName(existingFile.assignedStaff, record.assignedStaff)) {
    addAuditLog("File allotted or reassigned", {
      fileId: record.id,
      fileName: record.name,
      previousValue: existingFile.assignedStaff || "Not Assigned",
      newValue: record.assignedStaff || "Not Assigned",
      allottedBy: record.allottedBy || "",
      allotmentDate: record.workAllotmentDate || "",
    });
  }
  if (canManageChecking() && existingFile && checkingDetailsChanged(existingFile, record)) {
    addAuditLog("Checking details updated", {
      fileId: record.id,
      fileName: record.name,
      previousCheckingStatus: checkingStatusOf(existingFile).label,
      newCheckingStatus: checkingStatusOf(record).label,
      previousCheckedBy: existingFile.checkedBy || "",
      newCheckedBy: record.checkedBy || "",
      previousCheckedDate: existingFile.checkedDate || "",
      newCheckedDate: record.checkedDate || "",
      previousCheckingRemarks: existingFile.checkingRemarks || "",
      newCheckingRemarks: record.checkingRemarks || "",
    });
  }
  saveState();
  try {
    await syncFileRecordToApi(record);
  } catch (error) {
    console.error("Central file update failed", error);
    restoreSaveFileButton(saveButton);
    return toast(`Central update failed: ${error.message || "Please retry."}`);
  }
  closeOverlays();
  toast("File record saved and synced");
  renderAll();
}

function restoreSaveFileButton(button) {
  if (!button) return;
  button.disabled = false;
  button.textContent = button.dataset.originalText || "Save Record";
}

function renderStaffPage() {
  const allowed = state.currentRole === "Admin" || state.currentRole === "Manager";
  const selected = document.querySelector("#staffSelect")?.value || "";
  const s = staffStats(selected);
  document.querySelector("#staff").innerHTML = `
    ${allowed ? "" : `<div class="permission-note">Staff performance is mainly intended for Admin and Manager roles. This preview still shows your accessible records.</div>`}
    <div class="panel staff-performance-console">
      <div class="field staff-selector">
        <label>Select Staff Member</label>
        <select id="staffSelect"><option value="">All Staff</option>${state.users.map((u) => `<option ${selected === u.name ? "selected" : ""}>${u.name}</option>`).join("")}</select>
      </div>
      <div class="action-row staff-performance-actions">
        <button class="secondary-button" id="staffExcel" ${rolePerm().export ? "" : "disabled"}>Export Staff Excel</button>
        <button class="secondary-button" id="staffPdf" ${rolePerm().export ? "" : "disabled"}>Export Staff Pdf</button>
      </div>
      <div class="grid metrics staff-performance-metrics">
        ${staffMetric("Total Assigned", s.total, "Files Assigned", "grad-blue", "total")}
        ${staffMetric("Not Started", s.notStarted, "Receipt Only", "grad-slate", "notStarted")}
        ${staffMetric("In Progress", s.inProgress, "Work Underway", "grad-blue", "inProgress")}
        ${staffMetric("Pending With Staff", s.pending, "Not Filed", "grad-red", "pending")}
        ${staffMetric("Completed", s.completed, "Filed records", "grad-green", "completed")}
        ${staffMetric("Overdue", s.overdue, "Past due date", "grad-red", "overdue")}
        ${staffMetric("Approval Pending", s.approvals, "Shared Not Approved", "grad-yellow", "approval")}
        ${staffMetric("Billed / Unbilled", `${s.billed}/${s.unbilled}`, "Billing status", "grad-darkgreen", "billing")}
      </div>
    </div>
    <div class="panel staff-performance-workload">
      <h3>Selected Staff Workload</h3>
      ${renderFileTable(visibleFiles().filter((f) => !selected || fileBelongsToUser(f, findUserByStaffIdentity(selected))))}
    </div>
  `;
  document.querySelector("#staffSelect").onchange = renderStaffPage;
  document.querySelector("#staffExcel").onclick = () => exportExcel("staff-performance", staffPerformanceRows(selected));
  document.querySelector("#staffPdf").onclick = () => exportPdf("staff-performance", staffPerformanceRows(selected));
  document.querySelectorAll("[data-staff-metric]").forEach((card) => {
    card.onclick = () => renderStaffFileReport(selected, card.dataset.staffMetric);
  });
  bindFileActions();
}

function staffMetric(label, value, note, className, kind) {
  return `<button class="metric-card ${className}" data-staff-metric="${kind}"><span>${label}</span><strong>${value}</strong><p>${note}</p></button>`;
}

function staffPerformanceRows(selected) {
  if (selected) return visibleFiles().filter((f) => fileBelongsToUser(f, findUserByStaffIdentity(selected))).map(flattenFile);
  return state.users.map((user) => ({ Staff: user.name, Role: user.role, ...staffStats(user.name) }));
}

function renderStaffFileReport(selected, kind) {
  let rows = visibleFiles().filter((f) => !selected || fileBelongsToUser(f, findUserByStaffIdentity(selected)));
  if (kind === "notStarted") rows = rows.filter((f) => stageIndex(f) === 0);
  if (kind === "inProgress") rows = rows.filter((f) => stageIndex(f) > 0 && !f.filed);
  if (kind === "pending") rows = rows.filter((f) => !f.filed);
  if (kind === "completed") rows = rows.filter((f) => f.filed);
  if (kind === "overdue") rows = rows.filter(isOverdue);
  if (kind === "approval") rows = rows.filter(pendingApproval);
  if (kind === "billing") rows = rows.filter(isNonBilledFile);
  exportExcel(`staff-${kind}-report`, rows);
}

function renderStaffManagerPermissionSummary() {
  const rows = [
    ["Nisha", "Yes", "Yes", "Yes", "Yes", "Yes", "Yes", "No", "No"],
    ["Rizwana", "As configured", "As configured", "As configured", "As configured", "Yes", "Yes", "No", "No"],
    ["Althaf", "As configured", "As configured", "As configured", "As configured", "Yes", "Yes", "No", "No"],
    ["Anusree", "Yes", "Yes", "Yes", "Yes", "No", "No", "No", "No"],
  ];
  const headers = ["Staff Manager", "Add File", "Edit Own File", "Mark Received", "Allot File", "View Not Checked", "Mark Eligible Checked", "Check Own Work", "Full Admin"];
  return `
    <div class="panel" style="margin-top:16px">
      <h3>Staff Manager Permissions</h3>
      <div class="table-wrap">
        <table class="file-table file-table-compact">
          <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </div>
      <p class="small-muted">Staff Managers do not receive Admin-only access, user deletion, backup/restore, or full system settings permissions.</p>
    </div>
  `;
}

function renderStaffDetailsPage() {
  const page = document.querySelector("#staffDetails");
  if (!page) return;
  if (!canUseStaffDetails()) {
    page.innerHTML = `<div class="permission-note">Staff Details is not available for this login.</div>`;
    return;
  }
  state.staffDetails = normalizeStaffDetails(state.staffDetails || []);
  const rows = filteredStaffDetails();
  const activeRows = activeStaffDetails();
  const birthdays = staffBirthdaysThisMonth();
  const anniversaries = staffAnniversariesThisMonth();
  const newJoiners = activeRows.filter((row) => staffDateParts(row.dateOfJoining)?.month === currentIndiaYearMonth().month && staffDateParts(row.dateOfJoining)?.year === currentIndiaYearMonth().year);
  page.innerHTML = `
    <div class="staff-details-shell">
      <section class="staff-details-hero">
        <div>
          <span class="dashboard-eyebrow">Employee Directory</span>
          <h3>Staff Details</h3>
          <p>Manage employee information, birthdays and work anniversaries.</p>
        </div>
        <div class="staff-details-actions">
          <button class="secondary-button" id="staffDetailsExcel" ${rolePerm().export ? "" : "disabled"}>Excel</button>
          <button class="secondary-button" id="staffDetailsPdf" ${rolePerm().export ? "" : "disabled"}>PDF</button>
          <button class="secondary-button" id="staffDetailsPrint">Print</button>
          ${canManageStaffDetails() ? `<button class="primary-button" id="showStaffForm">Add Staff</button>` : ""}
        </div>
      </section>
      <div class="staff-summary-grid">
        ${staffSummaryCard("Total Active Staff", activeRows.length, "Active employee records", "idcard")}
        ${staffSummaryCard("Birthdays This Month", birthdays.length, "DOB month matches today", "gift")}
        ${staffSummaryCard("Work Anniversaries This Month", anniversaries.length, "Completed service years", "award")}
        ${staffSummaryCard("New Joiners This Month", newJoiners.length, "Joined during this month", "users")}
      </div>
      ${renderStaffDetailsForm()}
      <section class="panel staff-details-panel">
        <div class="staff-details-filter-grid">
          ${staffFilterInput("staffSearch", "Search", "Search by staff name, email, employee ID or position")}
          ${staffFilterSelect("staffDepartment", "Department", uniqueStaffValues("department"))}
          ${staffFilterSelect("staffPosition", "Position", uniqueStaffValues("position"))}
          ${staffFilterSelect("staffStatus", "Status", ["Active", "On Leave", "Resigned", "Terminated", "Inactive"])}
          ${staffFilterSelect("staffBranch", "Branch", uniqueStaffValues("branch"))}
          ${staffFilterMonth("staffBirthdayMonth", "Birthday Month")}
          ${staffFilterMonth("staffJoiningMonth", "Joining Month")}
          <div class="field"><label>Sort By</label><select id="staffSort">${["Newest", "Staff Name", "DOJ", "DOB", "Position", "Department", "Status"].map((item) => `<option ${state.filters.staffSort === item ? "selected" : ""}>${item}</option>`).join("")}</select></div>
        </div>
        <div class="action-row staff-details-filter-actions">
          <button class="secondary-button" id="clearStaffFilters">Clear Filters</button>
          <strong>${rows.length} staff record(s)</strong>
        </div>
        ${renderStaffDetailsTable(rows)}
      </section>
      <section class="panel staff-profile-panel" id="staffProfilePanel">${renderStaffProfile()}</section>
    </div>
  `;
  bindStaffDetailsPage();
}

function staffSummaryCard(title, value, note, icon) {
  return `<div class="dashboard-kpi-card staff-summary-card"><div class="dashboard-kpi-top"><span class="dashboard-kpi-icon">${navIcon(icon)}</span><span class="dashboard-kpi-title">${escapeHtml(title)}</span></div><strong>${Number(value || 0).toLocaleString("en-IN")}</strong><div class="dashboard-kpi-meta"><small>${escapeHtml(note)}</small></div></div>`;
}

const staffPositionOptions = ["Assistant", "Manager"];
const staffEmploymentTypeOptions = ["Permanent", "Temporary", "Contract", "Part-Time", "Intern", "CA Article", "CMA Article"];
const staffGenderOptions = ["Male", "Female", "Transgender"];
const staffDepartmentOptions = ["Accounts & Audit", "Audit", "Taxation", "Accounts", "Admin", "Other Operations", "Sales", "Marketing", "Other"];

function renderStaffDetailsForm() {
  if (!canManageStaffDetails()) return "";
  const editing = state.staffDetails.find((row) => row.id === state.filters.staffEditingId) || null;
  const visible = state.filters.staffFormOpen === "Yes" || editing;
  const mode = state.filters.staffFormMode || (editing?.linkedUserId ? "existing" : "manual");
  const selectedUser = state.users.find((user) => user.id === (editing?.linkedUserId || state.filters.staffSelectedUserId)) || null;
  const userSearch = normalizeImportMatchText(state.filters.staffUserSearch || "");
  const selectableUsers = state.users.filter((user) => !userSearch || normalizeImportMatchText(`${user.name} ${user.email} ${user.id} ${user.role}`).includes(userSearch));
  const v = (key, fallback = "") => escapeHtml(editing?.[key] ?? fallback ?? "");
  const raw = (key, fallback = "") => String(editing?.[key] ?? fallback ?? "");
  return `<section class="panel staff-form-panel ${visible ? "" : "hidden"}">
    <div class="staff-form-head"><div><h3>${editing ? "Edit Staff" : "Add Staff"}</h3><p>${mode === "existing" ? "Link to an existing app user without creating a duplicate login." : "Create a manual staff record without login access."}</p></div><button class="icon-button" id="closeStaffForm" type="button">X</button></div>
    <div class="staff-entry-tabs">
      <button class="${mode === "existing" ? "active" : ""}" data-staff-form-mode="existing" type="button">Select from Existing Users</button>
      <button class="${mode === "manual" ? "active" : ""}" data-staff-form-mode="manual" type="button">Add Staff Manually</button>
    </div>
    <form id="staffDetailsForm" class="staff-details-form">
      <input type="hidden" name="id" value="${v("id")}">
      ${mode === "existing" ? `<div class="field staff-user-search"><label>Search Existing Users</label><input id="staffUserSearch" value="${escapeHtml(state.filters.staffUserSearch || "")}" placeholder="Search by name, email, user ID or role"></div><div class="field staff-user-picker"><label>Linked User</label><select name="linkedUserId" id="staffLinkedUser"><option value="">Select existing user</option>${selectableUsers.map((user) => `<option value="${escapeHtml(user.id)}" ${(selectedUser?.id || editing?.linkedUserId) === user.id ? "selected" : ""}>${escapeHtml(user.name)} - ${escapeHtml(user.email)} - ${escapeHtml(user.role)}</option>`).join("")}</select></div>` : `<input type="hidden" name="linkedUserId" value="${v("linkedUserId")}">`}
      ${staffFormField("staffName", "Staff Name", "text", v("staffName", selectedUser?.name || ""), true)}
      ${staffFormField("staffCode", "Employee ID", "text", v("staffCode"))}
      ${staffFormField("dateOfJoining", "DOJ", "date", v("dateOfJoining"), true)}
      ${staffFormField("dateOfBirth", "DOB", "date", v("dateOfBirth"))}
      ${staffFormField("email", "Email", "email", v("email", selectedUser?.email || ""))}
      ${staffFormField("mobile", "Mobile", "tel", v("mobile"))}
      ${staffSelectField("position", "Position", staffPositionOptions, raw("position", selectedUser?.role || ""), "Select Position", true)}
      ${staffDepartmentField(raw("department"))}
      <div class="field"><label>Reporting to</label><select name="reportingManagerId"><option value="">Select Manager</option>${state.users.filter((u) => ["Admin", "Manager", "Staff Manager"].includes(u.role)).map((u) => `<option value="${escapeHtml(u.id)}" ${editing?.reportingManagerId === u.id ? "selected" : ""}>${escapeHtml(u.name)}</option>`).join("")}</select></div>
      ${staffFormField("branch", "Branch or Office", "text", v("branch"))}
      ${staffSelectField("employmentType", "Employment Type", staffEmploymentTypeOptions, raw("employmentType"), "Select Employment Type")}
      <div class="field"><label>Status</label><select name="employmentStatus">${["Active", "On Leave", "Resigned", "Terminated", "Inactive"].map((item) => `<option ${((editing?.employmentStatus || "Active") === item) ? "selected" : ""}>${item}</option>`).join("")}</select></div>
      ${staffSelectField("gender", "Gender", staffGenderOptions, raw("gender"), "Select Gender")}
      ${staffFormField("emergencyContactName", "Emergency Contact Name", "text", v("emergencyContactName"))}
      ${staffFormField("emergencyContactNumber", "Emergency Contact Number", "tel", v("emergencyContactNumber"))}
      ${staffFormField("profilePhotoUrl", "Profile Photo URL", "url", v("profilePhotoUrl"))}
      <div class="field wide-field"><label>Qualifications</label><textarea name="qualifications" placeholder="Enter qualifications">${v("qualifications")}</textarea></div>
      <div class="field wide-field"><label>Address</label><textarea name="address">${v("address")}</textarea></div>
      <div class="field wide-field"><label>Remarks</label><textarea name="remarks">${v("remarks")}</textarea></div>
      <div class="staff-form-errors" id="staffFormErrors"></div>
      <div class="action-row staff-form-actions"><button class="primary-button" id="saveStaffDetails" type="submit">Save Staff</button><button class="secondary-button" id="cancelStaffDetails" type="button">Cancel</button></div>
    </form>
  </section>`;
}

function staffFormField(name, label, type, value, required = false) {
  return `<div class="field"><label>${escapeHtml(label)}${required ? " *" : ""}</label><input name="${name}" type="${type}" value="${value}" ${required ? "required" : ""}></div>`;
}

function staffSelectField(name, label, options, currentValue = "", placeholder = "Select", required = false) {
  const cleanValue = String(currentValue || "").trim();
  const optionValues = staffOptionsWithLegacy(options, cleanValue);
  return `<div class="field"><label>${escapeHtml(label)}${required ? " *" : ""}</label><select name="${escapeHtml(name)}" ${required ? "required" : ""}>
    <option value="">${escapeHtml(placeholder)}</option>
    ${optionValues.map((item) => `<option value="${escapeHtml(item)}" ${cleanValue === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
  </select></div>`;
}

function staffOptionsWithLegacy(options, currentValue = "") {
  const cleanValue = String(currentValue || "").trim();
  const values = [...options];
  if (cleanValue && !values.some((item) => item.toLowerCase() === cleanValue.toLowerCase())) values.unshift(cleanValue);
  return values;
}

function staffValueAllowed(value, options, legacyValue = "") {
  const cleanValue = String(value || "").trim();
  const cleanLegacy = String(legacyValue || "").trim();
  if (!cleanValue) return true;
  return options.includes(cleanValue) || cleanValue === cleanLegacy;
}

function staffDepartmentField(currentValue = "") {
  const cleanValue = String(currentValue || "").trim();
  const isStandard = staffDepartmentOptions.some((item) => item.toLowerCase() === cleanValue.toLowerCase());
  const selected = cleanValue && !isStandard ? "Other" : cleanValue;
  const otherValue = cleanValue && !isStandard ? cleanValue : "";
  return `<div class="field"><label>Department</label><select name="departmentChoice" id="staffDepartmentSelect">
    <option value="">Select Department</option>
    ${staffDepartmentOptions.map((item) => `<option value="${escapeHtml(item)}" ${selected === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
  </select></div>
  <div class="field staff-other-department ${selected === "Other" ? "" : "hidden"}" id="staffOtherDepartmentField"><label>Specify Department</label><input name="otherDepartment" type="text" value="${escapeHtml(otherValue)}" placeholder="Enter Department"></div>`;
}

function staffFilterInput(key, label, placeholder = "") {
  return `<div class="field"><label>${label}</label><input id="${key}" value="${escapeHtml(state.filters[key] || "")}" placeholder="${escapeHtml(placeholder)}"></div>`;
}

function staffFilterSelect(key, label, options) {
  return `<div class="field"><label>${label}</label><select id="${key}"><option value="">All</option>${options.filter(Boolean).map((item) => `<option value="${escapeHtml(item)}" ${state.filters[key] === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select></div>`;
}

function staffFilterMonth(key, label) {
  const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
  return `<div class="field"><label>${label}</label><select id="${key}"><option value="">All</option>${months.map((month) => `<option value="${month}" ${state.filters[key] === month ? "selected" : ""}>${new Date(`2026-${month}-01T00:00:00+05:30`).toLocaleString("en-IN", { month: "long" })}</option>`).join("")}</select></div>`;
}

function uniqueStaffValues(key) {
  return sortList([...new Set(staffDetailsVisibleRows().map((row) => row[key]).filter(Boolean))]);
}

function filteredStaffDetails() {
  let rows = staffDetailsVisibleRows();
  const search = normalizeImportMatchText(state.filters.staffSearch || "");
  rows = rows.filter((row) => {
    if (search && !normalizeImportMatchText(`${row.staffName} ${row.staffCode} ${row.email} ${row.mobile} ${row.position} ${row.department}`).includes(search)) return false;
    if (state.filters.staffDepartment && row.department !== state.filters.staffDepartment) return false;
    if (state.filters.staffPosition && row.position !== state.filters.staffPosition) return false;
    if (state.filters.staffStatus && row.employmentStatus !== state.filters.staffStatus) return false;
    if (state.filters.staffBranch && row.branch !== state.filters.staffBranch) return false;
    if (state.filters.staffBirthdayMonth && String(staffDateParts(row.dateOfBirth)?.month || "").padStart(2, "0") !== state.filters.staffBirthdayMonth) return false;
    if (state.filters.staffJoiningMonth && String(staffDateParts(row.dateOfJoining)?.month || "").padStart(2, "0") !== state.filters.staffJoiningMonth) return false;
    return true;
  });
  const sort = state.filters.staffSort || "Newest";
  if (sort === "Staff Name") rows.sort((a, b) => a.staffName.localeCompare(b.staffName));
  else if (sort === "DOJ") rows.sort((a, b) => String(a.dateOfJoining).localeCompare(String(b.dateOfJoining)));
  else if (sort === "DOB") rows.sort((a, b) => String(a.dateOfBirth).localeCompare(String(b.dateOfBirth)));
  else if (sort === "Position") rows.sort((a, b) => String(a.position).localeCompare(String(b.position)));
  else if (sort === "Department") rows.sort((a, b) => String(a.department).localeCompare(String(b.department)));
  else if (sort === "Status") rows.sort((a, b) => String(a.employmentStatus).localeCompare(String(b.employmentStatus)));
  else rows.sort((a, b) => staffDetailChangeTime(b) - staffDetailChangeTime(a));
  return rows;
}

function renderStaffDetailsTable(rows) {
  if (!rows.length) return empty("No staff records found.");
  const headers = ["SN", "Profile", "Staff Name", "Employee ID", "Position", "Department", "DOJ", "DOB", "Email", "Mobile", "Reporting to", "Status", "Actions"];
  return `<div class="table-wrap staff-details-table-wrap"><table class="file-table staff-details-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row, index) => `<tr>
    <td>${index + 1}</td>
    <td>${staffAvatar(row)}</td>
    <td><strong>${escapeHtml(row.staffName)}</strong></td>
    <td>${escapeHtml(row.staffCode || "")}</td>
    <td>${escapeHtml(row.position || "")}</td>
    <td>${escapeHtml(row.department || "")}</td>
    <td>${displayDate(row.dateOfJoining)}</td>
    <td>${canManageStaffDetails() ? displayDate(row.dateOfBirth) : staffShortDate(row.dateOfBirth)}</td>
    <td>${escapeHtml(row.email || "")}</td>
    <td>${escapeHtml(row.mobile || "")}</td>
    <td>${escapeHtml(staffManagerName(row.reportingManagerId))}</td>
    <td><span class="staff-status status-${String(row.employmentStatus || "Active").toLowerCase().replaceAll(" ", "-")}">${escapeHtml(row.employmentStatus || "Active")}</span></td>
    <td class="action-col"><button class="mini-button" data-view-staff="${row.id}">View</button>${canManageStaffDetails() ? `<button class="mini-button" data-edit-staff="${row.id}">Edit</button><button class="mini-button" data-toggle-staff="${row.id}">${["Inactive", "Resigned", "Terminated"].includes(row.employmentStatus) ? "Reactivate" : "Deactivate"}</button><button class="mini-button danger" data-delete-staff="${row.id}">Delete</button>` : ""}</td>
  </tr>`).join("")}</tbody></table></div>`;
}

function staffAvatar(row) {
  if (row.profilePhotoUrl) return `<span class="staff-avatar"><img src="${escapeHtml(row.profilePhotoUrl)}" alt=""></span>`;
  return `<span class="staff-avatar">${escapeHtml(userInitials(row.staffName))}</span>`;
}

function staffManagerName(id) {
  return state.users.find((user) => user.id === id)?.name || "";
}

function renderStaffProfile() {
  const row = staffDetailsVisibleRows().find((item) => item.id === state.filters.staffProfileId);
  if (!row) return `<div class="dashboard-empty-state">Select a staff record to view the employee profile.</div>`;
  const anniversaryDate = staffEventDateForYear(row.dateOfJoining, currentIndiaYearMonth().year);
  const years = staffCompletedYears(row.dateOfJoining, anniversaryDate);
  return `<div class="staff-profile">
    <div class="staff-profile-summary">${staffAvatar(row)}<div><h3>${escapeHtml(row.staffName)}</h3><p>${escapeHtml(row.position || "")}${row.department ? ` · ${escapeHtml(row.department)}` : ""}</p><span class="staff-status">${escapeHtml(row.employmentStatus || "Active")}</span></div></div>
    <div class="staff-profile-grid">
      ${staffProfileBlock("Employment Information", [["Employee ID", row.staffCode], ["DOJ", displayDate(row.dateOfJoining)], ["Years of Service", `${years} ${years === 1 ? "Year" : "Years"}`], ["Employment Type", row.employmentType], ["Reporting to", staffManagerName(row.reportingManagerId)], ["Branch", row.branch]])}
      ${staffProfileBlock("Qualifications", [["Qualifications", row.qualifications]])}
      ${staffProfileBlock("Contact Information", [["Email", row.email], ["Mobile", row.mobile], ["Address", row.address], ["Emergency Contact", [row.emergencyContactName, row.emergencyContactNumber].filter(Boolean).join(" - ")]])}
      ${staffProfileBlock("Important Dates", [["DOB", canManageStaffDetails() ? displayDate(row.dateOfBirth) : staffShortDate(row.dateOfBirth)], ["Next Birthday", staffShortDate(staffEventDateForYear(row.dateOfBirth, currentIndiaYearMonth().year))], ["Next Work Anniversary", staffShortDate(anniversaryDate)], ["Completed Years", `${years} ${years === 1 ? "Year" : "Years"}`]])}
      ${staffProfileBlock("Audit Information", [["Created By", row.createdByUserName], ["Created On", new Date(row.createdAt).toLocaleString("en-IN")], ["Last Updated By", row.updatedByUserName], ["Last Updated On", new Date(row.updatedAt).toLocaleString("en-IN")]])}
    </div>
  </div>`;
}

function staffProfileBlock(title, rows) {
  return `<section><h4>${escapeHtml(title)}</h4>${rows.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "-")}</strong></div>`).join("")}</section>`;
}

function bindStaffDetailsPage() {
  document.querySelector("#showStaffForm")?.addEventListener("click", () => {
    state.filters.staffFormOpen = "Yes";
    state.filters.staffEditingId = "";
    state.filters.staffFormMode = "existing";
    renderStaffDetailsPage();
  });
  document.querySelector("#closeStaffForm")?.addEventListener("click", closeStaffForm);
  document.querySelector("#cancelStaffDetails")?.addEventListener("click", closeStaffForm);
  document.querySelectorAll("[data-staff-form-mode]").forEach((btn) => btn.addEventListener("click", () => {
    state.filters.staffFormMode = btn.dataset.staffFormMode;
    state.filters.staffSelectedUserId = "";
    renderStaffDetailsPage();
  }));
  document.querySelector("#staffLinkedUser")?.addEventListener("change", (event) => {
    state.filters.staffSelectedUserId = event.target.value;
    renderStaffDetailsPage();
  });
  document.querySelector("#staffUserSearch")?.addEventListener("input", (event) => {
    state.filters.staffUserSearch = event.target.value;
    renderStaffDetailsPage();
    const input = document.querySelector("#staffUserSearch");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  });
  ["staffSearch", "staffDepartment", "staffPosition", "staffStatus", "staffBranch", "staffBirthdayMonth", "staffJoiningMonth", "staffSort"].forEach((id) => {
    document.querySelector(`#${id}`)?.addEventListener("input", (event) => {
      state.filters[id] = event.target.value;
      saveViewState();
      renderStaffDetailsPage();
    });
  });
  document.querySelector("#clearStaffFilters")?.addEventListener("click", () => {
    ["staffSearch", "staffDepartment", "staffPosition", "staffStatus", "staffBranch", "staffBirthdayMonth", "staffJoiningMonth", "staffSort"].forEach((key) => state.filters[key] = "");
    saveViewState();
    renderStaffDetailsPage();
  });
  document.querySelector("#staffDetailsForm")?.addEventListener("submit", saveStaffDetailsForm);
  document.querySelector("#staffDepartmentSelect")?.addEventListener("change", (event) => {
    document.querySelector("#staffOtherDepartmentField")?.classList.toggle("hidden", event.target.value !== "Other");
  });
  document.querySelectorAll("[data-view-staff]").forEach((btn) => btn.addEventListener("click", () => {
    state.filters.staffProfileId = btn.dataset.viewStaff;
    saveViewState();
    renderStaffDetailsPage();
  }));
  document.querySelectorAll("[data-edit-staff]").forEach((btn) => btn.addEventListener("click", () => {
    state.filters.staffEditingId = btn.dataset.editStaff;
    state.filters.staffFormOpen = "Yes";
    renderStaffDetailsPage();
  }));
  document.querySelectorAll("[data-toggle-staff]").forEach((btn) => btn.addEventListener("click", () => toggleStaffStatus(btn.dataset.toggleStaff)));
  document.querySelectorAll("[data-delete-staff]").forEach((btn) => btn.addEventListener("click", () => deleteStaffDetail(btn.dataset.deleteStaff)));
  document.querySelector("#staffDetailsExcel")?.addEventListener("click", exportStaffDetailsExcel);
  document.querySelector("#staffDetailsPdf")?.addEventListener("click", exportStaffDetailsPdf);
  document.querySelector("#staffDetailsPrint")?.addEventListener("click", printStaffDetailsReport);
}

function closeStaffForm() {
  state.filters.staffFormOpen = "";
  state.filters.staffEditingId = "";
  state.filters.staffSelectedUserId = "";
  saveViewState();
  renderStaffDetailsPage();
}

function saveStaffDetailsForm(event) {
  event.preventDefault();
  if (!canManageStaffDetails()) return toast("Only Admin can update staff details.");
  const button = document.querySelector("#saveStaffDetails");
  if (button) button.disabled = true;
  const form = event.currentTarget;
  const data = new FormData(form);
  const id = data.get("id") || `staff-${crypto.randomUUID()}`;
  const linkedUserId = data.get("linkedUserId") || "";
  const email = normalizeEmail(data.get("email"));
  const staffCode = String(data.get("staffCode") || "").trim();
  const editingId = data.get("id") || "";
  const errors = [];
  const name = String(data.get("staffName") || "").trim();
  const doj = normalizeImportDate(data.get("dateOfJoining"));
  const dob = normalizeImportDate(data.get("dateOfBirth"));
  const position = String(data.get("position") || "").trim();
  const departmentChoice = String(data.get("departmentChoice") || "").trim();
  const otherDepartment = String(data.get("otherDepartment") || "").trim();
  const department = departmentChoice === "Other" ? (otherDepartment || "Other") : departmentChoice;
  const employmentType = String(data.get("employmentType") || "").trim();
  const gender = String(data.get("gender") || "").trim();
  const old = state.staffDetails.find((row) => row.id === editingId) || {};
  if (!name) errors.push("Staff Name is required.");
  if (!doj) errors.push("DOJ is required.");
  if (!position) errors.push("Position is required.");
  if (!staffValueAllowed(position, staffPositionOptions, old.position)) errors.push("Select a valid Position.");
  if (!staffValueAllowed(employmentType, staffEmploymentTypeOptions, old.employmentType)) errors.push("Select a valid Employment Type.");
  if (!staffValueAllowed(gender, staffGenderOptions, old.gender)) errors.push("Select a valid Gender.");
  if (departmentChoice && !staffDepartmentOptions.includes(departmentChoice)) errors.push("Select a valid Department.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Please enter a valid Email.");
  if (data.get("mobile") && !/^[0-9+\-\s()]{6,20}$/.test(String(data.get("mobile")))) errors.push("Please enter a valid Mobile number.");
  if (dob && dob > indiaTodayDate()) errors.push("DOB cannot be a future date.");
  if (doj && doj > indiaTodayDate()) errors.push("DOJ cannot be a future date.");
  if (email && state.staffDetails.some((row) => row.id !== editingId && normalizeEmail(row.email) === email && !["Inactive", "Resigned", "Terminated"].includes(row.employmentStatus))) errors.push("Email is already used by another active staff record.");
  if (linkedUserId && state.staffDetails.some((row) => row.id !== editingId && row.linkedUserId === linkedUserId && !["Inactive", "Resigned", "Terminated"].includes(row.employmentStatus))) errors.push("This user is already linked to an active staff record.");
  if (staffCode && state.staffDetails.some((row) => row.id !== editingId && String(row.staffCode || "").toLowerCase() === staffCode.toLowerCase())) errors.push("Employee ID must be unique.");
  if (errors.length) {
    document.querySelector("#staffFormErrors").innerHTML = errors.map((error) => `<p>${escapeHtml(error)}</p>`).join("");
    if (button) button.disabled = false;
    return;
  }
  const record = {
    ...old,
    id,
    linkedUserId,
    staffCode,
    staffName: properCaseName(name),
    dateOfJoining: doj,
    dateOfBirth: dob,
    email,
    mobile: String(data.get("mobile") || "").trim(),
    position,
    department,
    reportingManagerId: data.get("reportingManagerId") || "",
    branch: String(data.get("branch") || "").trim(),
    employmentType,
    employmentStatus: data.get("employmentStatus") || "Active",
    gender,
    qualifications: String(data.get("qualifications") || "").trim(),
    address: String(data.get("address") || "").trim(),
    emergencyContactName: String(data.get("emergencyContactName") || "").trim(),
    emergencyContactNumber: String(data.get("emergencyContactNumber") || "").trim(),
    profilePhotoUrl: String(data.get("profilePhotoUrl") || "").trim(),
    remarks: String(data.get("remarks") || "").trim(),
    createdByUserId: old.createdByUserId || state.session?.userId || "",
    createdByUserName: old.createdByUserName || state.currentUser || "",
    createdAt: old.createdAt || Date.now(),
    updatedByUserName: state.currentUser || "",
    updatedAt: Date.now(),
    deactivatedAt: ["Inactive", "Resigned", "Terminated"].includes(data.get("employmentStatus")) ? (old.deactivatedAt || new Date().toISOString()) : "",
  };
  state.staffDetails = editingId
    ? state.staffDetails.map((row) => row.id === editingId ? record : row)
    : [record, ...(state.staffDetails || [])];
  addAuditLog(editingId ? "Staff details updated" : "Staff details added", { staffId: record.id, staffName: record.staffName });
  state.filters.staffProfileId = record.id;
  state.filters.staffFormOpen = "";
  state.filters.staffEditingId = "";
  saveState({ fullRemote: true });
  toast("Staff details saved");
  renderStaffDetailsPage();
}

function toggleStaffStatus(id) {
  if (!canManageStaffDetails()) return toast("Only Admin can update staff status.");
  state.staffDetails = state.staffDetails.map((row) => row.id === id ? {
    ...row,
    employmentStatus: ["Inactive", "Resigned", "Terminated"].includes(row.employmentStatus) ? "Active" : "Inactive",
    deactivatedAt: ["Inactive", "Resigned", "Terminated"].includes(row.employmentStatus) ? "" : new Date().toISOString(),
    updatedByUserName: state.currentUser || "",
    updatedAt: Date.now(),
  } : row);
  addAuditLog("Staff status updated", { staffId: id });
  saveState({ fullRemote: true });
  renderStaffDetailsPage();
}

function deleteStaffDetail(id) {
  if (!canManageStaffDetails()) return toast("Only Admin can delete staff details.");
  if (!confirm("Delete this staff record? This will not delete the user login.")) return;
  state.staffDetails = (state.staffDetails || []).filter((row) => row.id !== id);
  addAuditLog("Staff details deleted", { staffId: id });
  saveState({ fullRemote: true });
  renderStaffDetailsPage();
}

function staffDetailsReportRows(rows = filteredStaffDetails()) {
  return rows.map((row, index) => ({
    SN: index + 1,
    "Staff Name": row.staffName,
    "Employee ID": row.staffCode,
    DOJ: displayDate(row.dateOfJoining),
    DOB: canManageStaffDetails() ? displayDate(row.dateOfBirth) : staffShortDate(row.dateOfBirth),
    Position: row.position,
    Department: row.department,
    Email: row.email,
    Mobile: row.mobile,
    "Reporting to": staffManagerName(row.reportingManagerId),
    Qualifications: row.qualifications,
    Status: row.employmentStatus,
  }));
}

function exportStaffDetailsExcel() { exportExcel("staff-details-register", staffDetailsReportRows()); }
async function exportStaffDetailsPdf() { await downloadPdfRows("staff-details-register", staffDetailsReportRows(), ["Muhammad & Associates,", "Chartered Accountants,", "Staff Details Register"]); }
function printStaffDetailsReport() {
  printStructuredReport({ title: "Staff Details Register", sections: [{ title: "Staff Details", rows: staffDetailsReportRows() }], format: "print" });
}

function renderUsersPage() {
  const canManage = rolePerm().users;
  const roles = [
    ["Admin", "Full access to files, users, invitations, reports and exports.", "Can add, edit, delete, assign, export and manage roles."],
    ["Manager", "Full access to files, users, reports and exports.", "Can add, edit, delete, assign, export etc."],
    ["Staff Manager", "Enhanced staff access based on configured rights.", "Can add/edit own files where authorised, view/check eligible Not Checked Files, and view checking details. No Admin-only controls."],
    ["Staff", "Work update access for assigned files.", "Can update status, remarks and attachments. Cannot delete or manage roles."],
  ];
  document.querySelector("#users").innerHTML = `
    ${canManage ? "" : `<div class="permission-note">Your current role can view users only. Admin/Manager can update access types.</div>`}
    <div class="panel">
      <h3>Company Details</h3>
      <div class="filters">
        <div class="field">
          <label>Company Name</label>
          <input id="companyName" placeholder="Enter company name" value="${escapeHtml(state.company?.name || "")}" ${canManage ? "" : "disabled"}>
        </div>
        <div class="field wide-field">
          <label>Address</label>
          <textarea id="companyAddress" placeholder="Enter office address" ${canManage ? "" : "disabled"}>${escapeHtml(state.company?.address || "")}</textarea>
        </div>
        <div class="field">
          <label>Action</label>
          <button class="primary-button" id="saveCompanyDetails" ${canManage ? "" : "disabled"}>Save Details</button>
        </div>
      </div>
      <p class="small-muted">Company name and address will appear below CA File Tracker in the left panel.</p>
    </div>
    <div class="grid report-grid">
      ${roles.map(([role, access, restriction]) => `
        <div class="user-card">
          <strong>${role}</strong>
          <p>${access}</p>
          <p>${restriction}</p>
        </div>
      `).join("")}
    </div>
    ${renderStaffManagerPermissionSummary()}
    <div class="panel" style="margin-top:16px">
      <h3>Create User Login</h3>
      <div class="filters">
        <div class="field">
          <label>Name</label>
          <input id="newUserName" placeholder="Team member name" ${canManage ? "" : "disabled"}>
        </div>
        <div class="field">
          <label>Email ID / User Name</label>
          <input id="newUserEmail" type="email" placeholder="name@example.com" ${canManage ? "" : "disabled"}>
        </div>
        <div class="field">
          <label>Password</label>
          <div class="password-wrap"><input id="newUserPassword" type="password" placeholder="Set password" ${canManage ? "" : "disabled"}><button type="button" data-toggle-password="newUserPassword">View</button></div>
        </div>
        <div class="field">
          <label>Access Type</label>
          <select id="newUserRole" ${canManage && rolePerm().roles ? "" : "disabled"}>${roles.map(([role]) => `<option>${role}</option>`).join("")}</select>
        </div>
        <div class="field">
          <label>Action</label>
          <button class="primary-button" id="createUser" ${canManage && rolePerm().roles ? "" : "disabled"}>Create User</button>
        </div>
      </div>
      <p class="small-muted">Use these credentials on the login screen. This local version does not send email.</p>
    </div>
    <div class="panel" style="margin-top:16px">
      <h3>Update Existing User</h3>
      <div class="filters">
        <div class="field">
          <label>User</label>
          <select id="accessUser">${state.users.map((user) => `<option value="${user.id}">${user.name} - ${user.email}</option>`).join("")}</select>
        </div>
        <div class="field">
          <label>Email ID</label>
          <input id="accessEmail" type="email" ${canManage ? "" : "disabled"}>
        </div>
        <div class="field">
          <label>New Password</label>
          <div class="password-wrap"><input id="accessPassword" type="password" placeholder="Leave blank to keep old password" ${canManage ? "" : "disabled"}><button type="button" data-toggle-password="accessPassword">View</button></div>
        </div>
        <div class="field">
          <label>Access Type</label>
          <select id="accessRole" ${canManage && rolePerm().roles ? "" : "disabled"}>${roles.map(([role]) => `<option>${role}</option>`).join("")}</select>
        </div>
        <div class="field">
          <label>Action</label>
          <button class="primary-button" id="updateAccess" ${canManage && rolePerm().roles ? "" : "disabled"}>Update User</button>
        </div>
      </div>
    </div>
    ${renderUserManagementInviteSection()}
  `;
  const accessUser = document.querySelector("#accessUser");
  const accessRole = document.querySelector("#accessRole");
  const accessEmail = document.querySelector("#accessEmail");
  bindPasswordToggles();
  document.querySelector("#saveCompanyDetails").onclick = () => {
    state.company = {
      name: document.querySelector("#companyName").value.trim(),
      address: document.querySelector("#companyAddress").value.trim(),
    };
    saveState();
    toast("Company details saved");
    mount();
    activePage = "users";
    showPage("users");
  };
  const setAccessForm = () => {
    const selected = state.users.find((u) => u.id === accessUser.value);
    accessRole.value = selected?.role || "Staff";
    accessEmail.value = selected?.email || "";
    document.querySelector("#accessPassword").value = "";
  };
  setAccessForm();
  accessUser.onchange = setAccessForm;
  document.querySelector("#createUser").onclick = async () => {
    const name = document.querySelector("#newUserName").value.trim();
    const email = document.querySelector("#newUserEmail").value.trim().toLowerCase();
    const password = document.querySelector("#newUserPassword").value;
    const role = document.querySelector("#newUserRole").value;
    if (!name || !email || !password) return toast("Please enter name, email and password.");
    if (apiToken() && sessionStorage.getItem(API_MODE_KEY) === "supabase") {
      try {
        await apiJson("/api/users", {
          method: "POST",
          body: JSON.stringify({ name, email, password, role }),
        });
        await loadStateFromApi();
        toast("Supabase user login created");
        renderUsersPage();
        return;
      } catch (error) {
        return toast(error.message || "Unable to create Supabase user.");
      }
    }
    const result = createOrUpdateTeamLogin({ name, email, role, password });
    if (result.error) return toast(result.error);
    saveAccessState();
    const canLogin = authenticateUser(email, password);
    toast(canLogin ? "User login created" : "User saved, but login check failed. Please update the password once.");
    renderUsersPage();
  };
  document.querySelector("#updateAccess").onclick = async () => {
    const user = state.users.find((u) => u.id === accessUser.value);
    const oldEmail = user.email;
    const oldRole = user.role;
    const email = normalizeEmail(accessEmail.value);
    const password = document.querySelector("#accessPassword").value;
    if (!email) return toast("Please enter email ID.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast("Please enter a valid email ID.");
    if (state.users.some((u) => u.id !== user.id && normalizeEmail(u.email) === email)) return toast("Email already exists.");
    if (apiToken() && sessionStorage.getItem(API_MODE_KEY) === "supabase") {
      const authUserId = user.authUserId || user.auth_user_id || "";
      if (!authUserId) return toast("This user is not linked to Supabase Auth. Recreate the login first.");
      try {
        await apiJson(`/api/users/${encodeURIComponent(authUserId)}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: user.name,
            email,
            role: normalizeRole(accessRole.value),
            ...(password ? { password } : {}),
          }),
        });
        await loadStateFromApi();
        toast(password ? "Supabase password updated" : "Supabase user updated");
        renderUsersPage();
        return;
      } catch (error) {
        return toast(error.message || "Unable to update Supabase user.");
      }
    }
    accessRestoreEmails.add(email);
    user.email = email;
    user.role = normalizeRole(accessRole.value);
    if (password) user.password = password;
    state.revokedAccess = (state.revokedAccess || []).filter((item) => normalizeEmail(item.email || item || "") !== email);
    state.invites = state.invites.filter((invite) => normalizeEmail(invite.email) !== normalizeEmail(oldEmail) || normalizeEmail(oldEmail) === email);
    upsertInviteForUser(user, user.password);
    if (oldRole !== user.role) {
      addAuditLog("User role changed", {
        userId: user.id,
        userName: user.name,
        previousValue: oldRole,
        newValue: user.role,
      });
    }
    saveAccessState();
    toast("User login updated");
    renderUsersPage();
  };
  bindUserManagementInviteSection();
}

function renderUserManagementInviteSection() {
  const canInvite = rolePerm().invite;
  const invitedUsers = activeUserList();
  return `
    ${canInvite ? "" : `<div class="permission-note">Only Admin and Manager can create team login access.</div>`}
    <div class="panel" style="margin-top:16px">
      <h3>Create Team Login / Invitation</h3>
      <p class="small-muted">This local version does not send email. Create a username and password here for your team member.</p>
      <div class="three-col">
        ${teamMemberPickerField()}
        ${formField("inviteName", "Name", "")}
        ${formField("inviteEmail", "Email Address", "", "email")}
        ${selectField("inviteRole", "Role Selection", ["Admin", "Manager", "Staff", "Guest"], "Staff")}
        ${formField("invitePassword", "Login Password", "", "password")}
      </div>
      <div class="action-row" style="margin-top:14px">
        <button class="primary-button" id="sendInvite" ${canInvite ? "" : "disabled"}>Create Login</button>
      </div>
    </div>
    <div class="panel" style="margin-top:16px">
      <h3>User Access Status</h3>
      <div class="user-access-grid">
        ${invitedUsers.map((user) => `
          <div class="user-access-card">
            <div class="user-access-row"><span>Name</span><strong>${escapeHtml(user.name)}</strong></div>
            <div class="user-access-row"><span>Email</span><strong>${escapeHtml(user.email)}</strong></div>
            <div class="user-access-row"><span>Role</span><strong>${escapeHtml(user.role)}</strong></div>
            <div class="user-access-row"><span>Password</span><strong>Managed by Supabase Auth</strong></div>
            <div class="user-access-actions">
              <span class="badge filed">Active</span>
              <button class="mini-button danger" data-kick-user="${user.id}" ${state.currentRole === "Admin" && user.id !== state.session.userId ? "" : "disabled"}>Kick Out</button>
            </div>
          </div>
        `).join("") || empty("No invited users yet.")}
      </div>
    </div>
  `;
}

function bindUserManagementInviteSection() {
  const sendInvite = document.querySelector("#sendInvite");
  if (sendInvite) {
    sendInvite.onclick = () => {
      const name = document.querySelector("[name='inviteName']").value.trim();
      const email = document.querySelector("[name='inviteEmail']").value.trim().toLowerCase();
      const role = document.querySelector("[name='inviteRole']").value;
      const password = document.querySelector("[name='invitePassword']").value;
      if (!name || !email || !password) return toast("Please enter name, email and password.");
      const result = createOrUpdateTeamLogin({ name, email, role, password });
      if (result.error) return toast(result.error);
      saveAccessState();
      const canLogin = authenticateUser(email, password);
      toast(canLogin ? (result.updated ? "Team login updated and linked to staff list" : "Local login created") : "Login saved, but please re-enter the password once.");
      renderUsersPage();
    };
  }
  document.querySelectorAll("[data-kick-user]").forEach((btn) => {
    btn.onclick = () => {
      if (state.currentRole !== "Admin") return toast("Only Admin can remove access.");
      const user = state.users.find((u) => u.id === btn.dataset.kickUser);
      if (!user) return;
      if (!confirm(`Kick out access for ${user.name}?`)) return;
      state.revokedAccess = [...(state.revokedAccess || []), { id: user.id, email: user.email, name: user.name, revokedAt: Date.now() }];
      state.users = state.users.filter((u) => u.id !== user.id);
      state.files = state.files.map((file) => {
        const removeAssigned = sameStaffName(file.assignedStaff, user.name) || sameStaffName(file.assignedStaffEmail, user.email) || sameStaffName(file.assignedStaffId, user.id);
        const removeReAssigned = sameStaffName(file.reAssignedStaff, user.name) || sameStaffName(file.reAssignedStaffEmail, user.email) || sameStaffName(file.reAssignedStaffId, user.id);
        return {
          ...file,
          assignedStaff: removeAssigned ? "Not Assigned" : file.assignedStaff,
          assignedStaffId: removeAssigned ? "" : file.assignedStaffId,
          assignedStaffEmail: removeAssigned ? "" : file.assignedStaffEmail,
          reAssignedStaff: removeReAssigned ? "" : file.reAssignedStaff,
          reAssignedStaffId: removeReAssigned ? "" : file.reAssignedStaffId,
          reAssignedStaffEmail: removeReAssigned ? "" : file.reAssignedStaffEmail,
          updatedAt: Date.now(),
        };
      });
      state.invites = state.invites.filter((invite) => invite.email.toLowerCase() !== user.email.toLowerCase());
      saveState();
      toast("User access removed");
      renderUsersPage();
    };
  });
  bindTeamMemberPicker();
  bindPasswordToggles();
}

function renderVerificationPage() {
  const target = document.querySelector("#verification");
  if (!target) return;
  if (!canUseVerificationPage()) {
    target.innerHTML = `<div class="permission-note">Only Admin and Manager can view verification.</div>`;
    return;
  }

  const team = verificationTeamRows();
  const unmatched = verificationUnmatchedAssignments();
  const totalAssigned = team.reduce((sum, row) => sum + row.assigned, 0);
  const activeAssigned = team.reduce((sum, row) => sum + row.active, 0);
  const staleCount = team.reduce((sum, row) => sum + row.stale, 0);
  const notReady = team.filter((row) => row.loginStatus !== "Ready").length;

  target.innerHTML = `
    <div class="grid metrics">
      ${metric("Team Members", team.length, "Managers and staff in verification", "grad-blue")}
      ${metric("Visible Login Files", totalAssigned, "Files matched to user logins", "grad-green")}
      ${metric("Active Assigned", activeAssigned, "Open files in staff logins", "grad-yellow")}
      ${metric("Attention Items", staleCount + unmatched.length + notReady, "Stale, unmatched or login issues", "grad-red")}
    </div>
    <div class="panel" style="margin-top:16px">
      <h3>Login & Allotment Verification</h3>
      <p class="small-muted">Counts use the same staff matching rules as the login pages. If a staff row shows assigned files here, those files should appear in that staff login. Current browser mode: ${isSupabaseMode() ? "Supabase central database" : "Local browser data"}.</p>
      <div class="table-wrap">
        <table class="file-table file-table-compact">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Role</th>
              <th>Email</th>
              <th>Login</th>
              <th>Visible Files</th>
              <th>Active</th>
              <th>Completed</th>
              <th>Not Checked</th>
              <th>Overdue</th>
              <th>Stale</th>
              <th>Last Update</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${team.map((row) => `
              <tr>
                <td><strong>${escapeHtml(row.name)}</strong></td>
                <td>${escapeHtml(row.role)}</td>
                <td>${escapeHtml(row.email)}</td>
                <td><span class="badge ${row.loginStatus === "Ready" ? "filed" : "overdue"}">${escapeHtml(row.loginStatus)}</span></td>
                <td>${row.assigned}</td>
                <td>${row.active}</td>
                <td>${row.completed}</td>
                <td>${row.notChecked}</td>
                <td>${row.overdue}</td>
                <td>${row.stale}</td>
                <td>${escapeHtml(row.lastUpdate)}</td>
                <td><button class="mini-button" data-verify-staff="${escapeHtml(row.id)}">View Files</button></td>
              </tr>
            `).join("") || `<tr><td colspan="12">${empty("No users found for verification.")}</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
    <div class="panel" style="margin-top:16px">
      <h3>Assignment Warnings</h3>
      ${unmatched.length ? `
        <div class="table-wrap">
          <table class="file-table file-table-compact">
            <thead><tr><th>File</th><th>PAN</th><th>Service</th><th>Assigned To</th><th>Last Update</th><th>Action</th></tr></thead>
            <tbody>
              ${unmatched.slice(0, 100).map((file) => `
                <tr>
                  <td>${escapeHtml(file.name)}</td>
                  <td>${escapeHtml(file.pan)}</td>
                  <td>${escapeHtml(file.serviceType)}</td>
                  <td>${escapeHtml(file.assignedStaff || file.assignedStaffEmail || file.assignedStaffId || "Not Assigned")}</td>
                  <td>${escapeHtml(verificationFileDate(file))}</td>
                  <td><button class="mini-button" data-edit="${escapeHtml(file.id)}">Open</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : empty("No unmatched assigned staff found.")}
      ${unmatched.length > 100 ? `<p class="small-muted">Showing first 100 unmatched records.</p>` : ""}
    </div>
  `;

  document.querySelectorAll("[data-verify-staff]").forEach((btn) => {
    btn.onclick = () => {
      const row = team.find((item) => item.id === btn.dataset.verifyStaff);
      if (!row) return;
      resetFilters();
      state.filters.staff = row.name;
      activePage = "files";
      saveState();
      mount();
    };
  });
  document.querySelectorAll("[data-edit]").forEach((btn) => (btn.onclick = () => openFileDrawer(btn.dataset.edit)));
}

function verificationTeamRows() {
  return sortByName((state.users || [])
    .filter((user) => ["Manager", "Staff Manager", "Staff"].includes(user.role))
    .map((user) => {
      const files = (state.files || []).filter((file) => fileBelongsToUser(file, user));
      const active = files.filter((file) => !isCheckedCompleted(file));
      const lastUpdatedAt = Math.max(0, ...files.map(verificationFileTimestamp));
      const stale = active.filter((file) => verificationFileAgeDays(file) > 7).length;
      return {
        id: user.id || user.authUserId || user.email || user.name,
        name: user.name || user.email || "Unknown",
        role: user.role || "Staff",
        email: user.email || "",
        loginStatus: user.isActive === false ? "Inactive" : (user.authUserId || user.auth_user_id ? "Ready" : "No Auth ID"),
        assigned: files.length,
        active: active.length,
        completed: files.filter(isCheckedCompleted).length,
        notChecked: files.filter(isNotCheckedFile).length,
        overdue: files.filter(isOverdue).length,
        stale,
        lastUpdate: lastUpdatedAt ? verificationDateTime(lastUpdatedAt) : "-",
      };
    }));
}

function verificationUnmatchedAssignments() {
  return (state.files || []).filter((file) => {
    if (!hasAssignedStaffValue(file.assignedStaff) && !hasAssignedStaffValue(file.assignedStaffEmail) && !hasAssignedStaffValue(file.assignedStaffId)) return false;
    return !findUserByStaffIdentity(file.assignedStaff)
      && !findUserByStaffIdentity(file.assignedStaffEmail)
      && !findUserByStaffIdentity(file.assignedStaffId);
  });
}

function verificationFileTimestamp(file) {
  return Number(file.updatedAt || 0)
    || Date.parse(file.lastUpdatedDate || "")
    || Date.parse(file.lastUpdated || "")
    || Date.parse(file.workStartedDate || "")
    || Date.parse(file.workAllotmentDate || "")
    || Date.parse(file.fileReceivedDate || "")
    || 0;
}

function verificationFileAgeDays(file) {
  const timestamp = verificationFileTimestamp(file);
  if (!timestamp) return 0;
  return Math.floor((Date.now() - timestamp) / MS_DAY);
}

function verificationFileDate(file) {
  const timestamp = verificationFileTimestamp(file);
  return timestamp ? verificationDateTime(timestamp) : "-";
}

function verificationDateTime(timestamp) {
  return new Date(timestamp).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderBackupPage() {
  const container = document.querySelector("#backup");
  if (!container) return;
  const canBackup = canUseBackupPage();
  const adminOnly = state.currentRole === "Admin";
  container.innerHTML = `
    ${canBackup ? "" : `<div class="permission-note">Only Admin and Manager can create backups.</div>`}
    <div class="panel">
      <h3>Backup</h3>
      <div class="admin-data-actions">
        <button class="secondary-button" id="downloadBackup" ${canBackup ? "" : "disabled"}>Download Backup</button>
        <button class="secondary-button" id="restoreBackup" ${adminOnly ? "" : "disabled"}>Restore Backup</button>
        <input class="hidden" type="file" id="restoreBackupInput" accept=".json,application/json">
        <button class="primary-button" id="syncSiteData" ${adminOnly ? "" : "disabled"}>Sync Data to Site</button>
        <button class="secondary-button" id="pullSiteData" ${adminOnly ? "" : "disabled"}>Pull Data from Site</button>
      </div>
      <p class="small-muted">Backup saves all files, users, statuses, visitors, expenses, collections, chats, audit log and settings. Managers can download backups. Restore and site sync remain Admin-only.</p>
    </div>
    <div class="grid metrics dashboard-main-metrics" style="margin-top:16px">
      ${metric("Current Files", (state.files || []).length, "Included in backup", "grad-blue")}
      ${metric("Users", (state.users || []).length, "Team logins included", "grad-purple")}
      ${metric("Visitors", (state.visitors || []).length, "Visitor records included", "grad-green")}
      ${metric("Expenses", (state.expenses || []).length, "Expense records included", "grad-yellow")}
    </div>
  `;
  document.querySelector("#downloadBackup").onclick = downloadFullBackup;
  document.querySelector("#restoreBackup").onclick = () => {
    if (!adminOnly) return toast("Only Admin can restore backups.");
    document.querySelector("#restoreBackupInput").click();
  };
  document.querySelector("#restoreBackupInput").onchange = handleBackupRestore;
  document.querySelector("#syncSiteData").onclick = syncDataToSite;
  document.querySelector("#pullSiteData").onclick = pullDataFromSite;
}

function renderInvitesPage() {
  const canInvite = rolePerm().invite;
  const visibleInvites = (state.invites || []).filter((invite) => !isRevokedAccess(invite));
  document.querySelector("#invites").innerHTML = `
    ${canInvite ? "" : `<div class="permission-note">Only Admin and Manager can send team invitations.</div>`}
    <div class="panel">
      <h3>Invite / Create Team Login</h3>
      <p class="small-muted">This local version cannot send real email. Use this page to record an invitation and create a login password for the team member.</p>
      <div class="three-col">
        ${teamMemberPickerField()}
        ${formField("inviteName", "Name", "")}
        ${formField("inviteEmail", "Email Address", "", "email")}
        ${selectField("inviteRole", "Role Selection", ["Admin", "Manager", "Staff", "Guest"], "Staff")}
        ${formField("invitePassword", "Login Password", "", "password")}
      </div>
      <div class="action-row" style="margin-top:14px">
        <button class="primary-button" id="sendInvite" ${canInvite ? "" : "disabled"}>Create Login</button>
      </div>
    </div>
    <div class="panel" style="margin-top:16px">
      <h3>Invitation status</h3>
      <div class="card-list">
        ${visibleInvites.map((invite) => `<div class="invite-card"><strong>${invite.name}</strong><p>${invite.email} | ${invite.role} | Sent ${fmt(invite.sentAt)}</p><span class="badge ${invite.status === "Accepted" ? "filed" : "approval"}">${invite.status}</span></div>`).join("") || empty("No invitations sent yet.")}
      </div>
    </div>
  `;
  document.querySelector("#sendInvite").onclick = () => {
    const name = document.querySelector("[name='inviteName']").value.trim();
    const email = document.querySelector("[name='inviteEmail']").value.trim().toLowerCase();
    const role = document.querySelector("[name='inviteRole']").value;
    const password = document.querySelector("[name='invitePassword']").value;
    if (!name || !email || !password) return toast("Please enter name, email and password.");
    const result = createOrUpdateTeamLogin({ name, email, role, password });
    if (result.error) return toast(result.error);
    saveAccessState();
    const canLogin = authenticateUser(email, password);
    toast(canLogin ? "Local login created" : "Login saved, but please re-enter the password once.");
    renderInvitesPage();
  };
  bindTeamMemberPicker();
  bindPasswordToggles();
}

function renderInvitesAccessPage() {
  const canInvite = rolePerm().invite;
  const invitedUsers = activeUserList();
  document.querySelector("#invites").innerHTML = `
    ${canInvite ? "" : `<div class="permission-note">Only Admin and Manager can create team login access.</div>`}
    <div class="panel">
      <h3>Create Team Login</h3>
      <p class="small-muted">This local version does not send email. Create a username and password here for your team member.</p>
      <div class="three-col">
        ${teamMemberPickerField()}
        ${formField("inviteName", "Name", "")}
        ${formField("inviteEmail", "Email Address", "", "email")}
        ${selectField("inviteRole", "Role Selection", ["Admin", "Manager", "Staff", "Guest"], "Staff")}
        ${formField("invitePassword", "Login Password", "", "password")}
      </div>
      <div class="action-row" style="margin-top:14px">
        <button class="primary-button" id="sendInvite" ${canInvite ? "" : "disabled"}>Create Login</button>
      </div>
    </div>
    <div class="panel" style="margin-top:16px">
      <h3>User Access Status</h3>
      <div class="card-list">
        ${invitedUsers.map((user) => `
          <div class="invite-card">
            <strong>${escapeHtml(user.name)}</strong>
            <p>${escapeHtml(user.email)} - ${escapeHtml(user.role)} access</p>
            <p>Password: <strong>Managed by Supabase Auth</strong></p>
            <div class="action-row" style="margin-top:10px">
              <span class="badge filed">Active</span>
              <button class="mini-button danger" data-kick-user="${user.id}" ${state.currentRole === "Admin" && user.id !== state.session.userId ? "" : "disabled"}>Kick Out Access</button>
            </div>
          </div>
        `).join("") || empty("No invited users yet.")}
      </div>
    </div>
  `;
  document.querySelector("#sendInvite").onclick = () => {
    const name = document.querySelector("[name='inviteName']").value.trim();
    const email = document.querySelector("[name='inviteEmail']").value.trim().toLowerCase();
    const role = document.querySelector("[name='inviteRole']").value;
    const password = document.querySelector("[name='invitePassword']").value;
    if (!name || !email || !password) return toast("Please enter name, email and password.");
    const result = createOrUpdateTeamLogin({ name, email, role, password });
    if (result.error) return toast(result.error);
    saveAccessState();
    const canLogin = authenticateUser(email, password);
    toast(canLogin ? (result.updated ? "Team login updated and linked to staff list" : "Local login created") : "Login saved, but please re-enter the password once.");
    renderInvitesAccessPage();
  };
  document.querySelectorAll("[data-kick-user]").forEach((btn) => {
    btn.onclick = () => {
      if (state.currentRole !== "Admin") return toast("Only Admin can remove access.");
      const user = state.users.find((u) => u.id === btn.dataset.kickUser);
      if (!user) return;
      if (!confirm(`Kick out access for ${user.name}?`)) return;
      state.revokedAccess = [...(state.revokedAccess || []), { id: user.id, email: user.email, name: user.name, revokedAt: Date.now() }];
      state.users = state.users.filter((u) => u.id !== user.id);
      state.files = state.files.map((file) => {
        const removeAssigned = sameStaffName(file.assignedStaff, user.name) || sameStaffName(file.assignedStaffEmail, user.email) || sameStaffName(file.assignedStaffId, user.id);
        const removeReAssigned = sameStaffName(file.reAssignedStaff, user.name) || sameStaffName(file.reAssignedStaffEmail, user.email) || sameStaffName(file.reAssignedStaffId, user.id);
        return {
          ...file,
          assignedStaff: removeAssigned ? "Not Assigned" : file.assignedStaff,
          assignedStaffId: removeAssigned ? "" : file.assignedStaffId,
          assignedStaffEmail: removeAssigned ? "" : file.assignedStaffEmail,
          reAssignedStaff: removeReAssigned ? "" : file.reAssignedStaff,
          reAssignedStaffId: removeReAssigned ? "" : file.reAssignedStaffId,
          reAssignedStaffEmail: removeReAssigned ? "" : file.reAssignedStaffEmail,
          updatedAt: Date.now(),
        };
      });
      state.invites = state.invites.filter((invite) => invite.email.toLowerCase() !== user.email.toLowerCase());
      saveState();
      toast("User access removed");
      renderInvitesAccessPage();
    };
  });
  bindTeamMemberPicker();
  bindPasswordToggles();
}

function bindPasswordToggles() {
  document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
    btn.onclick = () => {
      const input = document.getElementById(btn.dataset.togglePassword);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      btn.textContent = input.type === "password" ? "View" : "Hide";
    };
  });
}

function downloadImportTemplate() {
  const rows = [
    {
      Name: "ABC Traders",
      "PAN / Regn Number": "ABCDE1234F",
      "Service Type": "GST Return",
      "C/o": "Direct",
      Mode: "Whatsapp",
      "File Received Date": todayDate(),
      "Assigned Staff": "Not Assigned",
      "Work Allotment Date": "",
      "Re Assigned": "",
      "Re Assigned Date": "",
      "Due Date": todayDate(),
      Priority: "Medium",
      Status: "Received",
      "Completed Date": "",
      "Checked By": "",
      "Checked Date": "",
      Billed: "",
      "Fee Received": "",
      Remarks: "Paste your existing file details here",
    },
    {
      Name: "XYZ Pvt Ltd",
      "PAN / Regn Number": "U12345KL2024PTC000001",
      "Service Type": "Statutory Audit",
      "C/o": "Taxmate",
      Mode: "Email",
      "File Received Date": todayDate(),
      "Assigned Staff": "Nisha",
      "Work Allotment Date": todayDate(),
      "Re Assigned": "",
      "Re Assigned Date": "",
      "Due Date": todayDate(),
      Priority: "High",
      Status: "WIP",
      "Completed Date": "",
      "Checked By": "",
      "Checked Date": "",
      Billed: "",
      "Fee Received": "",
      Remarks: "",
    },
  ];
  downloadExcelTable("ca-file-tracker-import-template", rows);
  toast("Sample Excel template downloaded");
}

function downloadExcelTable(name, rows, title = "") {
  const blockedExportHeaders = new Set(["id", "name", "pan", "serviceType", "careOf", "mode", "fileReceivedDate", "workDone", "shared", "reportPrepared", "approved", "filed", "billed", "stages", "assignedStaff", "workAllotmentDate", "workStartedDate", "dueDate", "priority", "lastUpdatedDate", "updatedAt", "assignedStaffId", "assignedStaffEmail", "reAssignedStaff", "reAssignedStaffId", "reAssignedStaffEmail"]);
  rows = rows.map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => !blockedExportHeaders.has(String(key).trim()))));
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const headingLines = reportHeadingLines(title);
  const wideColumns = ["Name", "PAN / Regn Number", "Service Type", "Remarks", "Attachments"];
  const dateColumns = ["File Received Date", "Work Allotment Date", "Re Assigned Date", "Due Date", "Last Updated Date"];
  const narrowColumns = ["C/o", "Mode", "Priority", "Status"];
  const columnWidth = (header) => {
    if (wideColumns.includes(header)) return 180;
    if (dateColumns.includes(header)) return 115;
    if (narrowColumns.includes(header)) return 95;
    return 140;
  };
  const table = `
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Calibri, Arial, sans-serif;
          color: #111827;
        }
        table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
        }
        th {
          background: #1f4e78;
          color: #ffffff;
          font-weight: 700;
          text-align: center;
          vertical-align: middle;
          border: 1px solid #163a5c;
          padding: 8px 10px;
          mso-style-parent: style0;
        }
        td {
          border: 1px solid #9ca3af;
          padding: 7px 9px;
          vertical-align: top;
          text-align: left;
          mso-number-format: "\\@";
        }
        tr:nth-child(even) td {
          background: #f8fafc;
        }
        .center {
          text-align: center;
          vertical-align: middle;
        }
        .wrap {
          white-space: normal;
          mso-data-placement: same-cell;
        }
        .report-heading td {
          border: 0;
          background: #ffffff !important;
          color: #0f172a;
          font-weight: 700;
          font-size: 15px;
          padding: 4px 2px;
        }
        .report-heading.meta td {
          color: #334155;
          font-size: 12px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
    <table>
      <colgroup>${headers.map((h) => `<col style="width:${columnWidth(h)}px">`).join("")}</colgroup>
      ${headingLines.length ? `<tbody>${headingLines.map((line, index) => `<tr class="report-heading ${index === headingLines.length - 2 ? "" : "meta"}"><td colspan="${Math.max(headers.length, 1)}">${escapeHtml(line)}</td></tr>`).join("")}<tr class="report-heading meta"><td colspan="${Math.max(headers.length, 1)}">&nbsp;</td></tr></tbody>` : ""}
      <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${headers.map((h) => {
        const value = escapeHtml(row[h] ?? "");
        const className = narrowColumns.includes(h) || dateColumns.includes(h) ? "center" : "wrap";
        return `<td class="${className}">${value}</td>`;
      }).join("")}</tr>`).join("")}</tbody>
    </table>
    </body></html>`;
  const blob = new Blob([table], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${name}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function downloadXlsxRows(name, rows, title = "") {
  await loadSheetJs();
  const headers = Object.keys(rows[0] || {});
  const headingLines = reportHeadingLines(title);
  const worksheet = headingLines.length
    ? XLSX.utils.aoa_to_sheet([...headingLines.map((line) => [line]), [], headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))])
    : XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = headers.map((header) => ({ wch: Math.max(14, Math.min(34, header.length + 8)) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${name}.xlsx`);
}

async function downloadXlsxSheets(name, sheets) {
  await loadSheetJs();
  const workbook = XLSX.utils.book_new();
  sheets.forEach((sheet) => {
    const rows = sheet.rows?.length ? sheet.rows : [{}];
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const headers = Object.keys(rows[0] || {});
    worksheet["!cols"] = headers.map((header) => ({ wch: Math.max(6, Math.min(36, header.length + 8)) }));
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  });
  XLSX.writeFile(workbook, `${name}.xlsx`);
}

async function downloadPdfRows(name, rows, title = "") {
  await downloadPdfSections(name, [{ title: "", rows }], title);
}

async function downloadPdfSections(name, sections, title = "") {
  await loadPdfTools();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const headingLines = reportHeadingLines(title);
  let y = 36;
  if (headingLines.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(headingLines[0], 40, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const hasMetaLine = headingLines.length > 3;
    const reportTitleIndex = hasMetaLine ? headingLines.length - 2 : headingLines.length - 1;
    headingLines.slice(1, reportTitleIndex).forEach((line) => {
      doc.text(line, 40, y);
      y += 14;
    });
    if (headingLines.length > 1) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(headingLines[reportTitleIndex], 40, y + 4);
      y += 22;
    }
    if (hasMetaLine) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(headingLines[headingLines.length - 1], 40, y);
      y += 16;
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(titleCaseReportName(name), 40, y);
    y += 24;
  }
  sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0 && y > 470) {
      doc.addPage();
      y = 36;
    }
    if (section.title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(section.title, 40, y);
      y += 10;
    }
    const rows = section.rows || [];
    const headers = Object.keys(rows[0] || {});
    doc.autoTable({
      startY: y + 6,
      head: headers.length ? [headers] : [["No Records"]],
      body: rows.length ? rows.map((row) => headers.map((header) => String(row[header] ?? ""))) : [["No records found."]],
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      margin: { left: 40, right: 40 },
    });
    y = doc.lastAutoTable.finalY + 18;
    if (section.total) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(section.total, 40, y);
      y += 16;
    }
  });
  doc.save(`${name}.pdf`);
}

function openHtmlReportTab(html, name = "report") {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank");
  if (!opened) {
    URL.revokeObjectURL(url);
    toast("Please allow popups to open the report in a new tab.");
    return false;
  }
  try {
    opened.opener = null;
  } catch {
    // Some browsers block access to opener; the report tab still opened correctly.
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}

function downloadPdfReport(name, rows, title = "") {
  openHtmlReportTab(reportTableHtml(name, rows, title), name);
}

function printReport(name, rows, title = "") {
  const html = reportTableHtml(name, rows, title);
  printHtmlReport(html, name);
}

function printHtmlReport(html, name = "report") {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return toast("Please allow popups to print the report.");
  const doc = printWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 300);
}

function reportTableHtml(name, rows, title = "") {
  const headers = Object.keys(rows[0] || {});
  const headingLines = reportHeadingLines(title);
  const reportTitle = headingLines[headingLines.length - 1] || titleCaseReportName(name);
  return `
    <html>
      <head>
        <title>${escapeHtml(reportTitle)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          .report-heading { margin: 0 0 16px; }
          .report-heading h1 { margin: 0; color: #0f172a; font-size: 22px; }
          .report-heading p { margin: 3px 0; color: #334155; font-size: 13px; }
          .report-heading h2 { margin: 10px 0 0; color: #1e3a8a; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #1e3a8a; color: #fff; padding: 8px; border: 1px solid #1e3a8a; text-align: left; }
          td { padding: 7px; border: 1px solid #d1d5db; }
          tr:nth-child(even) td { background: #f8fafc; }
      @page { size: A4 landscape; margin: 10mm; }
      @media print { body { padding: 12px; } button { display: none; } }
        </style>
      </head>
      <body>
        ${renderReportHeadingHtml(headingLines.length ? headingLines : [reportTitle])}
        <table>
          <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(row[h] || "")}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </body>
    </html>
  `;
}

function reportHeadingLines(title) {
  if (Array.isArray(title)) return title.filter((line) => String(line || "").trim());
  return String(title || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function renderReportHeadingHtml(lines) {
  if (lines.length >= 4) {
    return `
      <div class="report-heading">
        <h1>${escapeHtml(lines[0])}</h1>
        <p>${escapeHtml(lines[1])}</p>
        <p>${escapeHtml(lines[2])}</p>
        <h2>${escapeHtml(lines[3])}</h2>
      </div>
    `;
  }
  return `<div class="report-heading"><h2>${escapeHtml(lines[0] || "Report")}</h2></div>`;
}

function titleCaseReportName(name) {
  return String(name || "Report")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function handleImportFile(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  const lowerName = file.name.toLowerCase();
  if ((lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) && window.PREPARED_IMPORT_CSV && isPreparedTrackerWorkbookName(lowerName)) {
    importPreparedCsvFile();
    return;
  }
  if (lowerName.endsWith(".xls") || lowerName.endsWith(".html") || lowerName.endsWith(".htm")) {
    readMaybeHtmlImportFile(file);
    return;
  }
  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    importWorkbookFile(file);
    return;
  }
  readImportTextFile(file);
}

function isPreparedTrackerWorkbookName(lowerName) {
  const clean = String(lowerName || "").replace(/[^a-z0-9]+/g, " ");
  return clean.includes("ca file tracker") && clean.includes("15 07 2026");
}

function readImportTextFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const rows = parseImportRows(String(reader.result || ""));
      finishImport(rows);
    } catch (error) {
      toast("Import failed. Please check the Excel/CSV column format.");
    }
  };
  reader.readAsText(file);
}

function readMaybeHtmlImportFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || "");
    if (isExcelHtmlFramesetWithoutSheetRows(text)) {
      toast("This Excel web file only points to another sheet. Please upload ca-file-tracker-import-template (8)_files/sheet001.htm instead.");
      return;
    }
    if (/<table[\s>]/i.test(text) || /\.html?$/i.test(file.name)) {
      try {
        finishImport(parseImportRows(text));
      } catch {
        toast("Import failed. Please check the Excel/HTML table format.");
      }
      return;
    }
    importWorkbookFile(file);
  };
  reader.onerror = () => toast("Import failed. Please try selecting the file again.");
  reader.readAsText(file);
}

function isExcelHtmlFramesetWithoutSheetRows(text) {
  const hasFrameset = /<frameset\b/i.test(text) || /name=["']frSheet["']/i.test(text);
  if (!hasFrameset) return false;
  const rows = parseImportRows(text);
  return !isTrackerFileImportRows(rows);
}

async function importPreparedCsvFile() {
  try {
    if (window.PREPARED_IMPORT_CSV) {
      finishImport(parseImportRows(window.PREPARED_IMPORT_CSV), { forceFreshImport: true });
      return;
    }
    const response = await fetch("CA%20File%20tracker%2015.07.2026%20import.csv", { cache: "no-store" });
    if (!response.ok) throw new Error("Prepared CSV file not found.");
    const text = await response.text();
    const rows = parseImportRows(text);
    finishImport(rows, { forceFreshImport: true });
  } catch (error) {
    toast("Prepared CSV could not load. Please open the app through the local server, then try again.");
  }
}

function importWorkbookFile(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const arrayBuffer = reader.result;
      let rows = [];
      try {
        await loadSheetJs();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array", cellDates: true });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        trimWorksheetToUsedImportRange(firstSheet);
        rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false, defval: "", dateNF: "yyyy-mm-dd" });
      } catch {
        try {
          rows = await readWorkbookRowsFromServer(arrayBuffer);
        } catch {
          rows = await readWorkbookRowsOffline(arrayBuffer);
        }
      }
      finishImport(rows);
    } catch (error) {
      toast("Excel upload failed. Please check that the file is a valid .xlsx workbook.");
    }
  };
  reader.onerror = () => toast("Excel upload failed. Please try selecting the file again.");
  reader.readAsArrayBuffer(file);
}

async function readWorkbookRowsFromServer(arrayBuffer) {
  if (location.protocol === "file:") throw new Error("Local server is not available");
  const response = await fetch("/api/import-xlsx", {
    method: "POST",
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    body: arrayBuffer,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(payload.rows)) throw new Error(payload.error || "Server Excel import failed");
  return payload.rows;
}

async function readWorkbookRowsOffline(arrayBuffer) {
  const entries = await unzipWorkbookEntries(arrayBuffer);
  const strings = parseSharedStrings(entries.get("xl/sharedStrings.xml") || "");
  const styles = parseWorkbookStyles(entries.get("xl/styles.xml") || "");
  const sheetPath = firstWorksheetPath(entries);
  const sheetXml = entries.get(sheetPath);
  if (!sheetXml) throw new Error("Worksheet not found");
  return parseWorksheetRows(sheetXml, strings, styles);
}

function firstWorksheetPath(entries) {
  if (entries.has("xl/worksheets/sheet1.xml")) return "xl/worksheets/sheet1.xml";
  return [...entries.keys()].find((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name)) || "";
}

async function unzipWorkbookEntries(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  let eocd = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 70000); offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error("Workbook zip footer not found");
  const entryCount = view.getUint16(eocd + 10, true);
  let centralOffset = view.getUint32(eocd + 16, true);
  const entries = new Map();
  for (let i = 0; i < entryCount; i += 1) {
    if (view.getUint32(centralOffset, true) !== 0x02014b50) break;
    const method = view.getUint16(centralOffset + 10, true);
    const compressedSize = view.getUint32(centralOffset + 20, true);
    const fileNameLength = view.getUint16(centralOffset + 28, true);
    const extraLength = view.getUint16(centralOffset + 30, true);
    const commentLength = view.getUint16(centralOffset + 32, true);
    const localOffset = view.getUint32(centralOffset + 42, true);
    const name = new TextDecoder().decode(bytes.slice(centralOffset + 46, centralOffset + 46 + fileNameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    if (name.endsWith(".xml") || name.endsWith(".rels")) {
      const content = method === 0 ? compressed : await inflateDeflateRaw(compressed);
      entries.set(name, new TextDecoder().decode(content));
    }
    centralOffset += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

async function inflateDeflateRaw(bytes) {
  if (!("DecompressionStream" in window)) throw new Error("Offline Excel decompression is not supported in this browser");
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function parseXml(xml) {
  return new DOMParser().parseFromString(xml, "application/xml");
}

function parseSharedStrings(xml) {
  if (!xml) return [];
  const doc = parseXml(xml);
  return [...doc.querySelectorAll("si")].map((item) => [...item.querySelectorAll("t")].map((node) => node.textContent || "").join(""));
}

function parseWorkbookStyles(xml) {
  if (!xml) return new Set();
  const doc = parseXml(xml);
  const customFormats = {};
  doc.querySelectorAll("numFmts numFmt").forEach((fmt) => {
    customFormats[fmt.getAttribute("numFmtId")] = fmt.getAttribute("formatCode") || "";
  });
  const dateNumFmtIds = new Set(["14", "15", "16", "17", "22", "27", "30", "36", "50", "57"]);
  const dateStyles = new Set();
  doc.querySelectorAll("cellXfs xf").forEach((xf, index) => {
    const id = xf.getAttribute("numFmtId") || "";
    const code = String(customFormats[id] || "").toLowerCase();
    if (dateNumFmtIds.has(id) || /[ymdhs]/.test(code)) dateStyles.add(String(index));
  });
  return dateStyles;
}

function parseWorksheetRows(xml, sharedStrings, dateStyles) {
  const doc = parseXml(xml);
  const rows = [];
  doc.querySelectorAll("sheetData row").forEach((rowNode) => {
    const values = [];
    rowNode.querySelectorAll("c").forEach((cell) => {
      const ref = cell.getAttribute("r") || "";
      const colIndex = excelColumnIndex(ref.replace(/\d+/g, ""));
      values[colIndex] = worksheetCellValue(cell, sharedStrings, dateStyles);
    });
    if (values.some((value) => String(value ?? "").trim())) rows.push(values.map((value) => value ?? ""));
  });
  return rows;
}

function worksheetCellValue(cell, sharedStrings, dateStyles) {
  const type = cell.getAttribute("t") || "";
  const style = cell.getAttribute("s") || "";
  if (type === "s") return sharedStrings[Number(cell.querySelector("v")?.textContent || 0)] || "";
  if (type === "inlineStr") return [...cell.querySelectorAll("is t")].map((node) => node.textContent || "").join("");
  const raw = cell.querySelector("v")?.textContent || "";
  if (dateStyles.has(style) && raw && !Number.isNaN(Number(raw))) return excelSerialDate(Number(raw));
  return raw;
}

function agingText(dateString) {
  const date = Date.parse(normalizeImportDate(dateString) || dateString || "");
  if (!date) return "-";
  const days = Math.max(0, Math.floor((Date.now() - date) / 86400000));
  return `${days} day${days === 1 ? "" : "s"}`;
}

function excelColumnIndex(letters) {
  return String(letters || "A").split("").reduce((total, letter) => total * 26 + letter.toUpperCase().charCodeAt(0) - 64, 0) - 1;
}

function excelSerialDate(serial) {
  const date = new Date(Date.UTC(1899, 11, 30) + Math.round(Number(serial)) * MS_DAY);
  return dateInput(date);
}

function trimWorksheetToUsedImportRange(sheet) {
  if (!sheet || !sheet["!ref"] || !window.XLSX) return;
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  let lastHeaderCol = -1;
  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: col })];
    if (cell && String(cell.v ?? "").trim()) lastHeaderCol = col;
  }
  if (lastHeaderCol < range.s.c) return;
  let lastRow = range.s.r;
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    let hasValue = false;
    for (let col = range.s.c; col <= lastHeaderCol; col += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell && String(cell.v ?? "").trim()) {
        hasValue = true;
        break;
      }
    }
    if (hasValue) lastRow = row;
  }
  sheet["!ref"] = XLSX.utils.encode_range({
    s: { r: range.s.r, c: range.s.c },
    e: { r: lastRow, c: lastHeaderCol },
  });
}

function loadSheetJs() {
  if (window.XLSX) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Excel reader load timed out")), 4000);
    const existing = document.querySelector("script[data-xlsx-loader]");
    if (existing) {
      existing.addEventListener("load", () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      existing.addEventListener("error", (error) => {
        clearTimeout(timer);
        reject(error);
      }, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.dataset.xlsxLoader = "true";
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    script.onerror = (error) => {
      clearTimeout(timer);
      reject(error);
    };
    document.head.appendChild(script);
  });
}

function loadPdfTools() {
  if (window.jspdf?.jsPDF && window.jspdf.jsPDF.API.autoTable) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const loadScript = (src, marker) => new Promise((scriptResolve, scriptReject) => {
      const existing = document.querySelector(`script[data-loader="${marker}"]`);
      if (existing) {
        existing.addEventListener("load", scriptResolve, { once: true });
        existing.addEventListener("error", scriptReject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.dataset.loader = marker;
      script.src = src;
      script.onload = scriptResolve;
      script.onerror = scriptReject;
      document.head.appendChild(script);
    });
    loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js", "jspdfLoader")
      .then(() => loadScript("https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js", "autotableLoader"))
      .then(resolve)
      .catch(reject);
  });
}

function finishImport(rows, options = {}) {
  const compactRows = compactImportRows(rows);
  const cleanedRows = compactRows
    .map((row) => row.map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some(Boolean));
  if (options.forceFreshImport) {
    const imported = importRows(cleanedRows, { replace: true, assignSerials: true });
    if (!imported.total) return toast("No valid file records found. Please keep the Name column in the first row.");
    saveState({ skipMerge: true });
    toast(`${imported.total} file record(s) freshly imported`);
    activePage = "files";
    resetFilters();
    renderAll();
    return;
  }
  if (isTrackerFileImportRows(cleanedRows)) {
    const imported = importRows(cleanedRows);
    if (!imported.total && !imported.skipped) return toast("No valid file records found. Please keep the Name column in the first row.");
    saveState({ skipMerge: true });
    toast(`${imported.added} new file(s) imported${imported.skipped ? `, ${imported.skipped} duplicate(s) skipped` : ""}`);
    activePage = "files";
    resetFilters();
    renderAll();
    return;
  }
  if (isBulkFeeReceivedUpdateRows(cleanedRows)) {
    try {
      const result = processBulkFeeReceivedUpdateRows(cleanedRows);
      saveState({ skipMerge: true });
      toast(`Fee received update complete: ${result.summary.received} marked received, ${result.summary.unmatched} unmatched, ${result.summary.ambiguous} ambiguous`);
      state.filters.listView = "feePending";
      activePage = "files";
      renderAll();
    } catch (error) {
      saveState({ skipMerge: true });
      toast(`Fee received update failed and was rolled back: ${error.message || "Please check the Excel file."}`);
    }
    return;
  }
  if (isBulkBillingUpdateRows(cleanedRows)) {
    try {
      const result = processBulkBillingUpdateRows(cleanedRows);
      saveState({ skipMerge: true });
      toast(`Billing update complete: ${result.summary.nonBilled} non-billed, ${result.summary.billed} billed, ${result.summary.unmatched} unmatched, ${result.summary.ambiguous} ambiguous`);
      activePage = "dashboard";
      renderAll();
    } catch (error) {
      saveState({ skipMerge: true });
      toast(`Billing update failed and was rolled back: ${error.message || "Please check the Excel file."}`);
    }
    return;
  }
  const imported = importRows(cleanedRows);
  if (!imported.total) return toast("No valid file records found. Please keep the Name column in the first row.");
  saveState({ skipMerge: true });
  toast(`${imported.added} new file(s) imported${imported.skipped ? `, ${imported.skipped} duplicate(s) skipped` : ""}`);
  activePage = "files";
  resetFilters();
  renderAll();
}

function isTrackerFileImportRows(rows) {
  if (!rows.length) return false;
  const headers = rows[0].map(normalizeImportHeader);
  const has = (...keys) => keys.some((key) => headers.includes(normalizeImportHeader(key)));
  return has("Name", "Client", "Client Name")
    && has("PAN / Regn Number", "PAN", "Regn Number", "Registration Number")
    && has("Service Type", "Service")
    && (
      has("Due Date", "Due") ||
      has("Work Allotment Date", "Allotment Date", "Allotted Date") ||
      has("C/o", "Care Of", "CO", "C O") ||
      has("Priority")
    );
}

function compactImportRows(rows) {
  if (!rows?.length) return [];
  const header = rows[0] || [];
  let lastHeaderIndex = -1;
  header.forEach((cell, index) => {
    if (String(cell ?? "").trim()) lastHeaderIndex = index;
  });
  if (lastHeaderIndex < 0) return rows;
  const width = lastHeaderIndex + 1;
  return rows.map((row) => row.slice(0, width));
}

function processAssignedStaffUpdateRows(rows) {
  const summary = { matched: 0, unmatched: 0, ambiguous: 0, skipped: 0 };
  if (!state.files?.length || !rows.length) return { summary };
  const headers = rows[0].map(normalizeImportHeader);
  const has = (...keys) => keys.some((key) => headers.includes(normalizeImportHeader(key)));
  if (!has("Assigned Staff", "Staff") || !has("Name", "Client", "Client Name")) return { summary };
  const entries = rows.slice(1)
    .map((row, index) => assignedStaffUpdateEntryFromRow(headers, row, index + 2))
    .filter((entry) => entry.name || entry.serialNumber);
  if (!entries.length) return { summary };
  const auditRows = [];
  entries.forEach((entry) => {
    if (!hasAssignedStaffValue(entry.assignedStaff)) {
      summary.skipped += 1;
      return;
    }
    const candidates = assignedStaffUpdateCandidates(entry);
    if (!candidates.length) {
      summary.unmatched += 1;
      return;
    }
    if (candidates.length > 1) {
      summary.ambiguous += 1;
      return;
    }
    const { file, index } = candidates[0];
    const previousStaff = file.assignedStaff || "Not Assigned";
    const assignedStaff = canonicalStaffName(entry.assignedStaff, entry.assignedStaff);
    const assignedUser = findUserByStaffIdentity(assignedStaff) || {};
    state.files[index] = {
      ...file,
      assignedStaff,
      assignedStaffId: assignedUser.id || "",
      assignedStaffEmail: assignedUser.email || "",
      stages: {
        ...(file.stages || {}),
        Received: true,
        Allotted: hasAssignedStaffValue(assignedStaff),
      },
      lastUpdatedDate: todayDate(),
      updatedAt: Date.now(),
    };
    summary.matched += 1;
    auditRows.push({
      action: "Assigned Staff updated from Excel",
      fileId: file.id,
      fileName: file.name,
      pan: file.pan,
      serviceType: file.serviceType,
      excelRow: entry.sourceRow,
      previousAssignedStaff: previousStaff,
      newAssignedStaff: assignedStaff,
      updatedBy: state.currentUser || "CA Sadique",
      updatedAt: new Date().toISOString(),
    });
  });
  if (auditRows.length) state.auditLog = [...(state.auditLog || []), ...auditRows].slice(-1000);
  return { summary };
}

function assignedStaffUpdateEntryFromRow(headers, row, sourceRow) {
  const get = (...keys) => {
    for (const key of keys) {
      const index = headers.indexOf(normalizeImportHeader(key));
      if (index >= 0 && row[index] !== undefined && String(row[index]).trim()) return String(row[index]).trim();
    }
    return "";
  };
  return {
    sourceRow,
    serialNumber: normalizeImportSerial(get("SN", "S.N", "S No", "S.No", "Sl No", "Sl.No", "Serial No", "Serial Number", "No")),
    name: get("Name", "Client", "Client Name"),
    pan: get("PAN / Regn Number", "PAN", "Regn Number", "Registration Number"),
    serviceType: get("Service Type", "Service"),
    assignedStaff: canonicalStaffName(get("Assigned Staff", "Staff"), get("Assigned Staff", "Staff")),
  };
}

function assignedStaffUpdateCandidates(entry) {
  if (entry.serialNumber) {
    const serialMatches = state.files
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => Number(file.importSerialNumber || 0) === Number(entry.serialNumber));
    if (serialMatches.length) return serialMatches;
    const orderedFiles = [...state.files].sort((a, b) => fileSerialSortValue(a) - fileSerialSortValue(b));
    const bySnOrder = orderedFiles[Number(entry.serialNumber) - 1];
    if (bySnOrder) {
      const index = state.files.findIndex((file) => file.id === bySnOrder.id);
      if (index >= 0 && assignedStaffEntryMatchesFile(entry, bySnOrder)) return [{ file: bySnOrder, index }];
    }
  }
  return state.files
    .map((file, index) => ({ file, index }))
    .filter(({ file }) => assignedStaffEntryMatchesFile(entry, file));
}

function assignedStaffEntryMatchesFile(entry, file) {
  const entryName = normalizeImportMatchText(entry.name);
  const fileName = normalizeImportMatchText(file.name);
  if (!entryName || entryName !== fileName) return false;
  const entryPan = normalizeImportMatchText(entry.pan);
  const filePan = normalizeImportMatchText(file.pan);
  if (entryPan && entryPan !== "na" && filePan && filePan !== "na" && entryPan !== filePan) return false;
  const entryService = normalizeImportMatchText(entry.serviceType);
  const fileService = normalizeImportMatchText(file.serviceType);
  if (entryService && fileService && entryService !== fileService) return false;
  return true;
}

function isBulkFeeReceivedUpdateRows(rows) {
  if (!rows.length) return false;
  const headers = rows[0].map(normalizeImportHeader);
  const has = (...keys) => keys.some((key) => headers.includes(normalizeImportHeader(key)));
  const receivedIndex = headers.indexOf(normalizeImportHeader("Received"));
  return receivedIndex >= 0
    && has("Name", "Client", "Client Name")
    && has("PAN / Regn Number", "PAN", "Regn Number", "Registration Number")
    && has("Service Type", "Service")
    && rows.slice(1).some((row) => receivedAmountValue(row[receivedIndex]));
}

function processBulkFeeReceivedUpdateRows(rows) {
  const backup = structuredClone(state.files || []);
  const generatedAt = new Date().toISOString();
  const source = "NAJMA test 14.078.xlsx";
  try {
    const headers = rows[0].map(normalizeImportHeader);
    const entries = rows.slice(1)
      .map((row, index) => feeReceivedEntryFromRow(headers, row, index + 2))
      .filter((entry) => entry.name && entry.receivedAmount);
    const groups = groupBy(entries, (entry) => entry.matchKey);
    const candidateFiles = (state.files || [])
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => isBilledFile(file));
    const matchedIndices = new Set();
    const receivedRows = [];
    const unmatchedRows = [];
    const ambiguousRows = [];
    const auditRows = [];
    groups.forEach((group) => {
      const scoredCandidates = candidateFiles
        .filter(({ index }) => !matchedIndices.has(index))
        .map((candidate) => ({ ...candidate, score: feeReceivedEntryMatchScore(group[0], candidate.file) }))
        .filter((candidate) => candidate.score > 0)
        .sort((a, b) => b.score - a.score);
      const highestScore = scoredCandidates[0]?.score || 0;
      const candidates = scoredCandidates.filter((candidate) => candidate.score === highestScore);
      if (!candidates.length) {
        group.forEach((entry) => unmatchedRows.push(feeReceivedIssueRow(entry, "No matching fee pending file found")));
        return;
      }
      if (candidates.length !== group.length) {
        const reason = candidates.length > group.length
          ? `Ambiguous match: ${candidates.length} fee pending files found for ${group.length} Excel row(s)`
          : `Incomplete match: ${group.length} Excel row(s), ${candidates.length} fee pending file(s) found`;
        group.forEach((entry) => ambiguousRows.push(feeReceivedIssueRow(entry, reason)));
        return;
      }
      candidates.forEach(({ file, index }, candidateIndex) => {
        const entry = group[candidateIndex];
        const before = {
          feeReceived: Boolean(file.feeReceived),
          feeReceivedDate: file.feeReceivedDate || "",
          feeReceivedAmount: file.feeReceivedAmount || "",
        };
        file.feeReceived = true;
        file.feeReceivedDate = normalizeImportDate(entry.lastUpdatedDate) || todayDate();
        file.feeReceivedAmount = entry.receivedAmount;
        file.updatedAt = Date.now();
        matchedIndices.add(index);
        receivedRows.push(feeReceivedReportRow(file, before, entry));
        auditRows.push({
          id: crypto.randomUUID(),
          action: "Fee marked received from Excel",
          details: {
            source,
            excelRow: entry.sourceRow,
            fileId: file.id,
            fileName: file.name,
            pan: file.pan,
            serviceType: file.serviceType,
            previousFeeReceived: before.feeReceived,
            newFeeReceived: true,
            previousFeeReceivedDate: before.feeReceivedDate,
            newFeeReceivedDate: file.feeReceivedDate,
            previousFeeReceivedAmount: before.feeReceivedAmount,
            newFeeReceivedAmount: entry.receivedAmount,
          },
          user: state.currentUser || "CA Sadique",
          role: state.currentRole || "",
          at: generatedAt,
        });
      });
    });
    const summary = {
      totalExcelRows: entries.length,
      received: receivedRows.length,
      unmatched: unmatchedRows.length,
      ambiguous: ambiguousRows.length,
      errors: 0,
    };
    state.auditLog = [...(state.auditLog || []), ...auditRows].slice(-1000);
    state.bulkFeeReceivedReports = {
      source,
      generatedAt,
      summary,
      received: receivedRows,
      unmatchedOrAmbiguous: [...unmatchedRows, ...ambiguousRows],
    };
    return { summary };
  } catch (error) {
    state.files = backup;
    state.bulkFeeReceivedReports = {
      source,
      generatedAt,
      summary: {
        totalExcelRows: Math.max(rows.length - 1, 0),
        received: 0,
        unmatched: 0,
        ambiguous: 0,
        errors: 1,
      },
      received: [],
      unmatchedOrAmbiguous: [{ Reason: error.message || "Fee received update failed and was rolled back." }],
    };
    throw error;
  }
}

function feeReceivedEntryFromRow(headers, row, sourceRow) {
  const get = (...keys) => {
    for (const key of keys) {
      const index = headers.indexOf(normalizeImportHeader(key));
      if (index >= 0 && row[index] !== undefined && String(row[index]).trim()) return String(row[index]).trim();
    }
    return "";
  };
  const entry = {
    sourceRow,
    serialNumber: get("SN", "S.N", "Serial Number"),
    name: get("Name", "Client", "Client Name"),
    pan: get("PAN / Regn Number", "PAN", "Regn Number", "Registration Number"),
    serviceType: get("Service Type", "Service"),
    careOf: get("C/o", "Care Of", "CO", "C O"),
    mode: get("Mode"),
    fileReceivedDate: get("File Received Date", "Received Date", "Date Received"),
    assignedStaff: get("Assigned Staff", "Staff"),
    workAllotmentDate: get("Work Allotment Date", "Allotment Date", "Allotted Date"),
    reAssignedStaff: get("Re Assigned", "Reassigned", "Re Assigned Staff"),
    reAssignedDate: get("Re Assigned Date", "Reassigned Date"),
    dueDate: get("Due Date", "Due"),
    completedDate: get("Completed on", "Completed On", "Completed Date", "Date Completed"),
    lastUpdatedDate: get("Last Updated Date", "Updated Date"),
    receivedAmount: receivedAmountValue(get("Received", "Fee Received", "Amount Received")),
  };
  entry.matchKey = [
    normalizeImportMatchText(entry.name),
    normalizeImportMatchText(entry.pan) || "na",
    normalizeImportMatchText(entry.serviceType),
    normalizeImportMatchText(entry.reAssignedStaff || entry.assignedStaff),
    [...bulkBillingDateVariants(entry.fileReceivedDate)].sort().join("/"),
    [...bulkBillingDateVariants(entry.workAllotmentDate)].sort().join("/"),
    [...bulkBillingDateVariants(entry.reAssignedDate)].sort().join("/"),
    [...bulkBillingDateVariants(entry.dueDate)].sort().join("/"),
    [...bulkBillingDateVariants(entry.completedDate)].sort().join("/"),
  ].join("|");
  return entry;
}

function feeReceivedEntryMatchesIdentity(entry, file) {
  return feeReceivedEntryMatchScore(entry, file) > 0;
}

function feeReceivedEntryMatchScore(entry, file) {
  const serviceScore = feeReceivedTextScore(entry.serviceType, file.serviceType, { exact: 45, token: 18 });
  if (!serviceScore) return 0;

  const entryPan = normalizeImportIdentifierText(entry.pan);
  const filePan = normalizeImportIdentifierText(file.pan);
  const hasUsablePan = isUsableImportPan(entryPan);
  const panScore = hasUsablePan && entryPan === filePan ? 130 : 0;
  const nameScore = feeReceivedTextScore(entry.name, file.name, { exact: 55, token: 16 });
  if (hasUsablePan && !panScore) return 0;
  if (!hasUsablePan && !nameScore) return 0;

  let score = serviceScore + panScore + nameScore;
  const expectedStaff = entry.reAssignedStaff || entry.assignedStaff;
  const optionalTextMatches = [
    [entry.careOf, file.careOf || "Direct", 12],
    [entry.mode, file.mode || "", 6],
    [expectedStaff, file.assignedStaff, 10],
  ];
  optionalTextMatches.forEach(([left, right, points]) => {
    if (left && normalizeImportMatchText(left) === normalizeImportMatchText(right)) score += points;
  });

  const optionalDateMatches = [
    [entry.fileReceivedDate, file.fileReceivedDate, 10],
    [entry.workAllotmentDate, file.workAllotmentDate, 8],
    [entry.reAssignedDate, file.reAssignedDate, 5],
    [entry.dueDate, file.dueDate, 12],
    [entry.completedDate, workCompletedDate(file), 12],
  ];
  optionalDateMatches.forEach(([left, right, points]) => {
    if (left && bulkBillingDatesEqual(left, right)) score += points;
  });

  return hasUsablePan ? score : (score >= 90 ? score : 0);
}

function feeReceivedTextScore(left, right, points) {
  const leftText = normalizeImportMatchText(left);
  const rightText = normalizeImportMatchText(right);
  if (!leftText || !rightText) return 0;
  if (leftText === rightText) return points.exact;
  const leftCompact = leftText.replace(/[^a-z0-9]/g, "");
  const rightCompact = rightText.replace(/[^a-z0-9]/g, "");
  if (leftCompact && leftCompact === rightCompact) return points.exact;
  const overlap = importNameTokenOverlapScore(leftText, rightText);
  return overlap ? Math.min(points.exact - 1, overlap * points.token) : 0;
}

function isUsableImportPan(value) {
  const normalized = normalizeImportIdentifierText(value);
  return Boolean(normalized && !["na", "n/a", "nil", "none", "-"].includes(normalized));
}

function receivedAmountValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const numeric = Number(raw.replace(/,/g, ""));
  if (Number.isFinite(numeric) && numeric > 0) return raw;
  return "";
}

function feeReceivedReportRow(file, before, entry) {
  return {
    "Excel Row": entry.sourceRow,
    Name: file.name,
    "PAN / Regn Number": file.pan,
    "Service Type": file.serviceType,
    "File Received Date": displayDate(file.fileReceivedDate),
    "Assigned Staff": file.assignedStaff,
    "Completion Date": displayDate(workCompletedDate(file)),
    "Received Amount": entry.receivedAmount,
    "Previous Fee Received": before.feeReceived ? "Yes" : "No",
    "New Fee Received": "Yes",
    "Fee Received Date": displayDate(file.feeReceivedDate),
  };
}

function feeReceivedIssueRow(entry, reason) {
  return {
    "Excel Row": entry.sourceRow,
    SN: entry.serialNumber || "",
    Name: entry.name,
    "PAN / Regn Number": entry.pan,
    "Service Type": entry.serviceType,
    "File Received Date": displayDate(normalizeDayFirstImportDate(entry.fileReceivedDate) || normalizeImportDate(entry.fileReceivedDate)),
    "Assigned Staff": entry.assignedStaff,
    "Completion Date": displayDate(normalizeDayFirstImportDate(entry.completedDate) || normalizeImportDate(entry.completedDate)),
    "Received Amount": entry.receivedAmount,
    Reason: reason,
  };
}

function isBulkBillingUpdateRows(rows) {
  if (!rows.length) return false;
  if (isTrackerFileImportRows(rows)) return false;
  const headers = rows[0].map(normalizeImportHeader);
  const has = (...keys) => keys.some((key) => headers.includes(normalizeImportHeader(key)));
  return has("Name", "Client", "Client Name")
    && has("PAN / Regn Number", "PAN", "Regn Number", "Registration Number")
    && has("Service Type", "Service")
    && has("File Received Date", "Received Date", "Date Received")
    && has("Assigned Staff", "Staff")
    && has("Completed on", "Completed On", "Completed Date", "Date Completed")
    && has("Status", "Workflow", "Final Status");
}

function processBulkBillingUpdateRows(rows) {
  const backup = structuredClone(state.files || []);
  const generatedAt = new Date().toISOString();
  const source = "New XLS Worksheet.xls";
  try {
    localStorage.setItem(`${STORAGE_KEY}-bulk-billing-backup`, JSON.stringify({
      source,
      generatedAt,
      files: backup,
    }));
  } catch (error) {
    console.warn("Bulk billing backup could not be saved", error);
  }
  try {
    const headers = rows[0].map(normalizeImportHeader);
    const entries = rows.slice(1)
      .map((row, index) => bulkBillingEntryFromRow(headers, row, index + 2))
      .filter((entry) => entry.name);
    const excelGroups = groupBy(entries, (entry) => entry.excelKey);
    const completedFiles = (state.files || [])
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => isCheckedCompleted(file));
    const matchedIndices = new Set();
    const protectedIndices = new Set();
    const nonBilledRows = [];
    const billedRows = [];
    const unmatchedRows = [];
    const ambiguousRows = [];
    const auditRows = [];
    excelGroups.forEach((group) => {
      const candidates = completedFiles.filter(({ file, index }) => !matchedIndices.has(index) && bulkBillingEntryMatchesFile(group[0], file));
      if (!candidates.length) {
        group.forEach((entry) => unmatchedRows.push(bulkBillingIssueRow(entry, "No matching completed file found")));
        return;
      }
      if (candidates.length !== group.length) {
        candidates.forEach(({ index }) => protectedIndices.add(index));
        const reason = candidates.length > group.length
          ? `Ambiguous match: ${candidates.length} completed files found for ${group.length} Excel row(s)`
          : `Incomplete match: ${group.length} Excel row(s), ${candidates.length} completed file(s) found`;
        group.forEach((entry) => ambiguousRows.push(bulkBillingIssueRow(entry, reason)));
        return;
      }
      candidates.forEach(({ file, index }, candidateIndex) => {
        const before = bulkBillingSnapshot(file);
        file.billed = false;
        file.billingType = "Non-Billable";
        file.billedDate = "";
        file.feeReceived = false;
        file.feeReceivedDate = "";
        file.updatedAt = Date.now();
        matchedIndices.add(index);
        nonBilledRows.push(bulkBillingReportRow(file, before, "Non-Billed", group[candidateIndex]));
        auditRows.push(bulkBillingAuditRow(file, before, "Non-Billed", "", generatedAt, source));
      });
    });
    completedFiles.forEach(({ file, index }) => {
      if (matchedIndices.has(index) || protectedIndices.has(index)) return;
      const before = bulkBillingSnapshot(file);
      const completedDate = normalizeImportDate(workCompletedDate(file));
      file.billed = true;
      file.billingType = "Billable";
      file.billedDate = completedDate || "";
      file.updatedAt = Date.now();
      billedRows.push(bulkBillingReportRow(file, before, "Billed", null));
      auditRows.push(bulkBillingAuditRow(file, before, "Billed", file.billedDate, generatedAt, source));
    });
    const summary = {
      totalExcelRows: entries.length,
      nonBilled: nonBilledRows.length,
      unmatched: unmatchedRows.length,
      ambiguous: ambiguousRows.length,
      billed: billedRows.length,
      skipped: protectedIndices.size,
      errors: 0,
    };
    state.auditLog = [...(state.auditLog || []), ...auditRows].slice(-1000);
    state.bulkBillingReports = {
      source,
      generatedAt,
      summary,
      nonBilled: nonBilledRows,
      billed: billedRows,
      unmatchedOrAmbiguous: [...unmatchedRows, ...ambiguousRows],
    };
    return { summary };
  } catch (error) {
    state.files = backup;
    state.bulkBillingReports = {
      source,
      generatedAt,
      summary: {
        totalExcelRows: Math.max(rows.length - 1, 0),
        nonBilled: 0,
        unmatched: 0,
        ambiguous: 0,
        billed: 0,
        skipped: 0,
        errors: 1,
      },
      nonBilled: [],
      billed: [],
      unmatchedOrAmbiguous: [{ Reason: error.message || "Bulk billing update failed and was rolled back." }],
    };
    throw error;
  }
}

function bulkBillingEntryFromRow(headers, row, sourceRow) {
  const get = (...keys) => {
    for (const key of keys) {
      const index = headers.indexOf(normalizeImportHeader(key));
      if (index >= 0 && row[index] !== undefined && String(row[index]).trim()) return String(row[index]).trim();
    }
    return "";
  };
  const entry = {
    sourceRow,
    name: get("Name", "Client", "Client Name"),
    pan: get("PAN / Regn Number", "PAN", "Regn Number", "Registration Number"),
    serviceType: get("Service Type", "Service"),
    fileReceivedDate: get("File Received Date", "Received Date", "Date Received"),
    assignedStaff: get("Assigned Staff", "Staff"),
    completedDate: get("Completed on", "Completed On", "Completed Date", "Date Completed"),
  };
  entry.excelKey = [
    normalizeImportMatchText(entry.name),
    normalizeImportMatchText(entry.pan) || "na",
    normalizeImportMatchText(entry.serviceType),
    normalizeImportMatchText(entry.assignedStaff),
    [...bulkBillingDateVariants(entry.fileReceivedDate)].sort().join("/"),
    [...bulkBillingDateVariants(entry.completedDate)].sort().join("/"),
  ].join("|");
  return entry;
}

function bulkBillingEntryMatchesFile(entry, file) {
  return normalizeImportMatchText(entry.name) === normalizeImportMatchText(file.name)
    && (normalizeImportMatchText(entry.pan) || "na") === (normalizeImportMatchText(file.pan) || "na")
    && normalizeImportMatchText(entry.serviceType) === normalizeImportMatchText(file.serviceType)
    && normalizeImportMatchText(entry.assignedStaff) === normalizeImportMatchText(file.assignedStaff)
    && bulkBillingDatesEqual(entry.fileReceivedDate, file.fileReceivedDate)
    && bulkBillingDatesEqual(entry.completedDate, workCompletedDate(file));
}

function bulkBillingDatesEqual(left, right) {
  const leftVariants = bulkBillingDateVariants(left);
  const rightVariants = bulkBillingDateVariants(right);
  return [...leftVariants].some((date) => rightVariants.has(date));
}

function bulkBillingDateVariants(value) {
  const variants = new Set();
  const normalized = normalizeImportDate(value);
  const dayFirst = normalizeDayFirstImportDate(value);
  if (normalized) variants.add(normalized);
  if (dayFirst) variants.add(dayFirst);
  return variants;
}

function normalizeDayFirstImportDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!match) return normalizeImportDate(raw);
  const day = String(Number(match[1])).padStart(2, "0");
  const month = String(Number(match[2])).padStart(2, "0");
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${month}-${day}`;
}

function groupBy(items, getKey) {
  const map = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
}

function bulkBillingSnapshot(file) {
  return {
    billingStatus: file.billed ? "Billed" : (file.billingType === "Non-Billable" ? "Non-Billed" : "Not Billed"),
    billedDate: file.billedDate || "",
  };
}

function bulkBillingAuditRow(file, before, newBillingStatus, newBilledDate, generatedAt, source) {
  return {
    fileId: file.id,
    fileName: file.name,
    pan: file.pan,
    serviceType: file.serviceType,
    previousBillingStatus: before.billingStatus,
    newBillingStatus,
    previousBilledDate: before.billedDate,
    newBilledDate,
    updatedAt: generatedAt,
    updatedBy: state.currentUser || "CA Sadique",
    source,
  };
}

function bulkBillingReportRow(file, before, newBillingStatus, entry) {
  return {
    "Excel Row": entry?.sourceRow || "",
    Name: file.name,
    "PAN / Regn Number": file.pan,
    "Service Type": file.serviceType,
    "File Received Date": displayDate(file.fileReceivedDate),
    "Assigned Staff": file.assignedStaff,
    "Completion Date": displayDate(workCompletedDate(file)),
    "Previous Billing Status": before.billingStatus,
    "New Billing Status": newBillingStatus,
    "Previous Billed Date": displayDate(before.billedDate),
    "New Billed Date": displayDate(file.billedDate),
  };
}

function bulkBillingIssueRow(entry, reason) {
  return {
    "Excel Row": entry.sourceRow,
    Name: entry.name,
    "PAN / Regn Number": entry.pan,
    "Service Type": entry.serviceType,
    "File Received Date": displayDate(normalizeDayFirstImportDate(entry.fileReceivedDate) || normalizeImportDate(entry.fileReceivedDate)),
    "Assigned Staff": entry.assignedStaff,
    "Completion Date": displayDate(normalizeDayFirstImportDate(entry.completedDate) || normalizeImportDate(entry.completedDate)),
    Reason: reason,
  };
}

function parseImportRows(text) {
  if (/<table[\s>]/i.test(text)) {
    const doc = new DOMParser().parseFromString(text, "text/html");
    return [...doc.querySelectorAll("tr")]
      .map((tr) => [...tr.children].map((cell) => cell.textContent.trim()))
      .filter((row) => row.some(Boolean));
  }
  return parseDelimitedRows(text);
}

function parseDelimitedRows(text) {
  const delimiter = text.includes("\t") ? "\t" : ",";
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function importRows(rows, options = {}) {
  if (!rows.length) return 0;
  const headers = rows[0].map(normalizeImportHeader);
  const importedRecords = [];
  const importBatchTime = Date.now();
  rows.slice(1).forEach((row, rowIndex) => {
    const excelRowNumber = rowIndex + 2;
    const get = (...keys) => {
      for (const key of keys) {
        const index = headers.indexOf(normalizeImportHeader(key));
        if (index >= 0 && row[index] !== undefined && String(row[index]).trim()) return String(row[index]).trim();
      }
      return "";
    };
    const name = get("Name", "Client", "Client Name");
    if (!name) return;
    const importSerialNumber = normalizeImportSerial(get("SN", "S.N", "S No", "S.No", "Sl No", "Sl.No", "Serial No", "Serial Number", "No")) || (options.assignSerials ? rowIndex + 1 : "");
    const serviceType = get("Service Type", "Service") || state.services[0] || "Other Services";
    const careOf = get("C/o", "Care Of", "CO", "C O") || "Direct";
    const fy = get("FY", "Financial Year", "F.Y", "Assessment Year") || "NA";
    const mode = normalizeMode(get("Mode")) || "Whatsapp";
    const assignedStaff = canonicalStaffName(normalizeImportStaff(get("Assigned Staff", "Staff")), "Not Assigned");
    const reAssignedStaff = canonicalStaffName(normalizeImportStaff(get("Re Assigned", "Reassigned", "Re Assigned Staff")), "");
    const status = get("Status", "Workflow", "Final Status");
    const fileReceivedDate = normalizeImportDate(get(
      "File Received Date",
      "Received Date",
      "Date Received",
      "Receipt Date",
      "File Date",
      "Inward Date",
      "Received On",
      "Date",
    )) || todayDate();
    let workAllotmentDate = normalizeImportDate(get("Work Allotment Date", "Allotment Date", "Allotted Date")) || fileReceivedDate;
    const importedWorkStartedDate = normalizeImportDate(get("Work Started Date", "WIP Date", "Work Start Date"));
    const completedDate = normalizeImportDate(get("Completed on", "Completed On", "Completed Date", "Completion Date", "Date Completed", "Filed Date"));
    const billingImport = billingFromImport(get("Billed"), get("Fee Received", "Received"), get("Billing Type", "Billable"));
    const stagesObj = stagesFromImport(status, {
      workDone: get("Work Done"),
      approvalPending: get("Approval Pending", "Shared"),
      approved: get("Approved"),
      completed: get("Completed", "Filed"),
      billed: get("Billed"),
    });
    const billed = billingImport.billed || stagesObj.Billed;
    const completed = stagesObj.Completed || billed;
    stagesObj.Completed = completed;
    stagesObj.Billed = billed;
    const finalAssignedStaff = reAssignedStaff || assignedStaff;
    if (hasAssignedStaffValue(finalAssignedStaff)) stagesObj.Allotted = true;
    else stagesObj.Allotted = false;
    const record = {
      id: crypto.randomUUID(),
      name,
      pan: get("PAN / Regn Number", "PAN", "Regn Number", "Registration Number"),
      serviceType,
      careOf,
      fy,
      mode,
      fileReceivedDate,
      workDone: stagesObj["Work Done"],
      shared: stagesObj["Approval Pending"],
      reportPrepared: stagesObj["Work Done"],
      approved: stagesObj.Approved,
      filed: stagesObj.Completed,
      billed,
      billedDate: billingImport.billed ? (normalizeImportDate(get("Billed Date", "Billing Date", "Bill Date")) || completedDate || "") : "",
      billingType: billingImport.billingType,
      feeReceived: billingImport.feeReceived,
      feeReceivedDate: billingImport.feeReceived ? (normalizeImportDate(get("Fee Received Date", "Payment Received Date", "Fee Payment Date")) || completedDate || "") : "",
      stages: stagesObj,
      assignedStaff: finalAssignedStaff,
      workAllotmentDate,
      workStartedDate: importedWorkStartedDate || (stagesObj.WIP ? workAllotmentDate : ""),
      reAssignedStaff,
      reAssignedDate: normalizeImportDate(get("Re Assigned Date", "Reassigned Date")) || "",
      dueDate: normalizeImportDate(get("Due Date", "Due")) || todayDate(),
      priority: normalizePriority(get("Priority")) || "Medium",
      completionDate: completed ? completedDate : "",
      checkedBy: get("Checked By"),
      checkedDate: normalizeImportDate(get("Checked Date")),
      checkingRemarks: get("Checking Remarks", "Check Remarks"),
      remarks: get("Remarks", "Remark", "Notes"),
      attachments: [],
      excelRowNumber,
      importSerialNumber,
      lastUpdatedDate: "2026-07-14",
      updatedAt: importBatchTime,
    };
    rememberImportedLists(record);
    importedRecords.push(record);
  });
  const finalImportedRecords = collapseDuplicateImportedFiles(importedRecords);
  if (options.replace) {
    state.files = finalImportedRecords;
    state.deletedFileIds = [];
    return { total: finalImportedRecords.length, added: finalImportedRecords.length, updated: 0, skipped: 0 };
  }
  const existingFiles = state.files || [];
  const addedRecords = [];
  let skipped = 0;
  finalImportedRecords.forEach((record) => {
    const duplicate = [...existingFiles, ...addedRecords].some((file) => sameImportedFile(file, record));
    if (duplicate) {
      skipped += 1;
      return;
    }
    addedRecords.push(record);
  });
  state.files = [...existingFiles, ...addedRecords];
  return { total: finalImportedRecords.length, added: addedRecords.length, updated: 0, skipped };
}

function collapseDuplicateImportedFiles(files) {
  const map = new Map();
  const passthrough = [];
  files.forEach((file) => {
    const key = importedDuplicateKey(file);
    if (!key) {
      passthrough.push(file);
      return;
    }
    if (!map.has(key)) {
      map.set(key, file);
      return;
    }
    map.set(key, mergeDuplicateFileRecord(map.get(key), file));
  });
  return [...map.values(), ...passthrough].sort((a, b) => fileChangeTime(b) - fileChangeTime(a));
}

function importedDuplicateKey(file) {
  if (file.importSerialNumber) return `sn:${file.importSerialNumber}`;
  const name = normalizeImportMatchText(file.name);
  const service = normalizeImportMatchText(file.serviceType);
  const pan = normalizeImportMatchText(file.pan);
  if (!name) return "";
  if (pan && pan !== "na") return `pan:${pan}|name:${name}`;
  if (service) return `name:${name}|service:${service}`;
  return `name:${name}`;
}

function mergeDuplicateFileRecord(primary, duplicate) {
  return {
    ...duplicate,
    ...primary,
    fileReceivedDate: primary.fileReceivedDate || duplicate.fileReceivedDate || "",
    fy: primary.fy || duplicate.fy || "NA",
    workAllotmentDate: primary.workAllotmentDate || duplicate.workAllotmentDate || "",
    dueDate: primary.dueDate || duplicate.dueDate || "",
    completionDate: primary.completionDate || duplicate.completionDate || "",
    checkedBy: primary.checkedBy || duplicate.checkedBy || "",
    checkedDate: primary.checkedDate || duplicate.checkedDate || "",
    checkingRemarks: primary.checkingRemarks || duplicate.checkingRemarks || "",
    correctionRemarks: primary.correctionRemarks || duplicate.correctionRemarks || "",
    excelRowNumber: primary.excelRowNumber || duplicate.excelRowNumber || "",
    updatedAt: Math.max(Number(primary.updatedAt || 0), Number(duplicate.updatedAt || 0)),
  };
}

function mergeImportedFileRecord(existingFile, importedFile, importBatchTime) {
  const importedAssignedUser = findUserByStaffIdentity(importedFile.assignedStaff) || {};
  const importedReAssignedUser = findUserByStaffIdentity(importedFile.reAssignedStaff) || {};
  const assignedStaff = hasAssignedStaffValue(importedFile.assignedStaff) ? importedFile.assignedStaff : (existingFile.assignedStaff || "Not Assigned");
  const reAssignedStaff = hasAssignedStaffValue(importedFile.reAssignedStaff) ? importedFile.reAssignedStaff : (existingFile.reAssignedStaff || "");
  return {
    ...existingFile,
    fileReceivedDate: importedFile.fileReceivedDate,
    workAllotmentDate: importedFile.workAllotmentDate,
    dueDate: importedFile.dueDate,
    assignedStaff,
    assignedStaffId: importedAssignedUser.id || existingFile.assignedStaffId || "",
    assignedStaffEmail: importedAssignedUser.email || existingFile.assignedStaffEmail || "",
    reAssignedStaff,
    reAssignedStaffId: importedReAssignedUser.id || existingFile.reAssignedStaffId || "",
    reAssignedStaffEmail: importedReAssignedUser.email || existingFile.reAssignedStaffEmail || "",
    reAssignedDate: importedFile.reAssignedDate || existingFile.reAssignedDate || "",
    workDone: importedFile.workDone,
    shared: importedFile.shared,
    reportPrepared: importedFile.reportPrepared,
    approved: importedFile.approved,
    filed: importedFile.filed,
    billed: importedFile.billed,
    stages: importedFile.stages,
    completionDate: importedFile.completionDate || existingFile.completionDate || "",
    checkedBy: importedFile.checkedBy || existingFile.checkedBy || "",
    checkedDate: importedFile.checkedDate || existingFile.checkedDate || "",
    checkingRemarks: importedFile.checkingRemarks || existingFile.checkingRemarks || "",
    correctionRemarks: existingFile.correctionRemarks || "",
    excelRowNumber: importedFile.excelRowNumber || existingFile.excelRowNumber || "",
    importSerialNumber: importedFile.importSerialNumber || existingFile.importSerialNumber || "",
    lastUpdatedDate: todayDate(),
    updatedAt: importBatchTime,
  };
}

function findExistingImportMatch(importedFile) {
  if (importedFile.importSerialNumber) return findImportSerialMatch(importedFile);
  const exactIndex = state.files.findIndex((file) => sameImportedFile(file, importedFile));
  if (exactIndex >= 0) return exactIndex;
  const candidates = state.files
    .map((file, index) => ({ file, index }))
    .filter(({ file }) => existingImportDatesMissing(file))
    .map(({ file, index }) => ({ index, score: importedFileMatchScore(file, importedFile) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!candidates.length) return -1;
  const best = candidates[0];
  const next = candidates[1];
  if (best.score >= 100 && (!next || best.score > next.score)) return best.index;
  if (best.score >= 140) return best.index;
  return -1;
}

function findImportSerialMatch(importedFile) {
  const serial = Number(importedFile.importSerialNumber || 0);
  if (!Number.isInteger(serial) || serial <= 0) return -1;
  const allFiles = visibleFiles();
  const byFileListSn = allFiles[serial - 1];
  if (byFileListSn) return state.files.findIndex((file) => file.id === byFileListSn.id);
  return -1;
}

function importedFileMatchScore(existingFile, importedFile) {
  const existingPan = normalizeImportMatchText(existingFile.pan);
  const importedPan = normalizeImportMatchText(importedFile.pan);
  const samePan = existingPan && importedPan && existingPan !== "na" && importedPan !== "na" && existingPan === importedPan;
  const sameService = normalizeImportMatchText(existingFile.serviceType) === normalizeImportMatchText(importedFile.serviceType);
  const sameName = normalizeImportMatchText(existingFile.name) === normalizeImportMatchText(importedFile.name);
  let score = 0;
  if (sameName) score += 110;
  if (samePan) score += 60;
  if (sameService) score += 30;
  score += importNameTokenOverlapScore(existingFile.name, importedFile.name) * 12;
  if (!existingFile.dueDate && importedFile.dueDate) score += 12;
  if (!existingFile.fileReceivedDate && importedFile.fileReceivedDate) score += 8;
  if (!existingFile.workAllotmentDate && importedFile.workAllotmentDate) score += 8;
  if (!sameName && !samePan) score = 0;
  return score;
}

function sameImportedFile(existingFile, importedFile) {
  if (existingFile.importSerialNumber || importedFile.importSerialNumber) {
    return Boolean(existingFile.importSerialNumber && importedFile.importSerialNumber && Number(existingFile.importSerialNumber) === Number(importedFile.importSerialNumber));
  }
  if (existingFile.excelRowNumber && importedFile.excelRowNumber && Number(existingFile.excelRowNumber) === Number(importedFile.excelRowNumber)) return true;
  const existingPan = normalizeImportMatchText(existingFile.pan);
  const importedPan = normalizeImportMatchText(importedFile.pan);
  const sameName = normalizeImportMatchText(existingFile.name) === normalizeImportMatchText(importedFile.name);
  const sameService = normalizeImportMatchText(existingFile.serviceType) === normalizeImportMatchText(importedFile.serviceType);
  const hasUsablePan = existingPan && importedPan && existingPan !== "na" && importedPan !== "na";
  if (hasUsablePan && existingPan === importedPan) {
    if (sameName) return true;
    if (sameService && importNameTokenOverlap(existingFile.name, importedFile.name)) return true;
  }
  if (sameName && existingImportDatesMissing(existingFile)) return true;
  return sameName && sameService;
}

function normalizeImportMatchText(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeImportIdentifierText(value) {
  return normalizeImportMatchText(value).replace(/[^a-z0-9]/g, "");
}

function fileMatchKey(name, pan, service) {
  return `${normalizeImportMatchText(name)}|${normalizeImportMatchText(pan) || "na"}|${normalizeImportMatchText(service)}`;
}

function isForcedNonBilledFile(file) {
  return false;
}

function normalizeImportSerial(value) {
  const match = String(value || "").trim().match(/\d+/);
  return match ? Number(match[0]) : "";
}

function billingFromImport(billedValue, feeReceivedValue, billingTypeValue = "") {
  const billedText = normalizeImportMatchText(billedValue);
  const feeText = normalizeImportMatchText(feeReceivedValue);
  const typeText = normalizeImportMatchText(billingTypeValue);
  const compact = `${billedText} ${feeText} ${typeText}`.replace(/[^a-z0-9]/g, "");
  if (compact.includes("nonbillable") || compact.includes("nonbilled") || compact.includes("nonbilling")) {
    return { billed: false, feeReceived: false, billingType: "Non-Billable" };
  }
  const billed = isYes(billedValue);
  const feeReceived = billed && isYes(feeReceivedValue);
  return {
    billed,
    feeReceived,
    billingType: billed ? "Billable" : "",
  };
}

function existingImportDatesMissing(file) {
  return !file?.fileReceivedDate || !file?.workAllotmentDate || !file?.dueDate;
}

function importNameTokenOverlap(existingName, importedName) {
  return importNameTokenOverlapScore(existingName, importedName) > 0;
}

function importNameTokenOverlapScore(existingName, importedName) {
  const existingTokens = new Set(normalizeImportMatchText(existingName).split(" ").filter((token) => token.length > 4));
  return normalizeImportMatchText(importedName).split(" ").filter((token) => token.length > 4 && existingTokens.has(token)).length;
}

function importChronologyTime(file) {
  const date = file.workAllotmentDate || file.fileReceivedDate || file.dueDate || file.lastUpdatedDate || todayDate();
  return Date.parse(date) || 0;
}

function normalizeImportHeader(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeImportDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const isoDateTime = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?/);
  if (isoDateTime) {
    return `${isoDateTime[1]}-${isoDateTime[2].padStart(2, "0")}-${isoDateTime[3].padStart(2, "0")}`;
  }
  if (/^\d+(\.\d+)?$/.test(raw) && Number(raw) > 25000) {
    return dateInput(new Date((Number(raw) - 25569) * MS_DAY));
  }
  const match = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (match) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    const dayValue = first > 12 ? first : second;
    const monthValue = first > 12 ? second : first;
    const day = String(dayValue).padStart(2, "0");
    const month = String(monthValue).padStart(2, "0");
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    return `${year}-${month}-${day}`;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "" : dateInput(date);
}

function normalizePriority(value) {
  const found = ["Low", "Medium", "High", "Urgent"].find((item) => item.toLowerCase() === String(value || "").trim().toLowerCase());
  return found || "";
}

function normalizeMode(value) {
  return modes.find((item) => item.toLowerCase() === String(value || "").trim().toLowerCase()) || "";
}

function isYes(value) {
  const clean = String(value || "").trim().toLowerCase();
  return ["yes", "y", "true", "1", "received", "paid"].includes(clean);
}

function normalizeImportStaff(value) {
  const name = String(value || "").trim();
  if (!name) return "";
  if (name.toLowerCase() === "not assigned") return "Not Assigned";
  const existing = state.users.find((user) => user.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing.name;
  state.users.push({
    id: crypto.randomUUID(),
    name,
    email: `${name.toLowerCase().replaceAll(" ", ".")}@mandaca.in`,
    role: "Staff",
    password: "Password@123",
  });
  return name;
}

function stagesFromImport(status, flags) {
  const stageObj = Object.fromEntries(stages.map((stage) => [stage, false]));
  stageObj.Received = true;
  const normalizedStatus = String(status || "").trim().toLowerCase();
  const matchedStage = stages.find((stage) => stage.toLowerCase() === normalizedStatus)
    || (normalizedStatus === "file received" ? "Received" : "")
    || (normalizedStatus === "filed" ? "Completed" : "");
  if (matchedStage) {
    const index = stages.indexOf(matchedStage);
    stages.forEach((stage, stageIndex) => {
      if (stageIndex <= index) stageObj[stage] = true;
    });
  }
  if (yesValue(flags.workDone)) stageObj["Work Done"] = true;
  if (yesValue(flags.approvalPending)) stageObj["Approval Pending"] = true;
  if (yesValue(flags.approved)) stageObj.Approved = true;
  if (yesValue(flags.completed)) stageObj.Completed = true;
  if (yesValue(flags.billed)) stageObj.Billed = true;
  return stageObj;
}

function yesValue(value) {
  return ["yes", "true", "1", "y", "completed", "billed"].includes(String(value || "").trim().toLowerCase());
}

function rememberImportedLists(record) {
  if (record.serviceType && !state.services.includes(record.serviceType)) state.services.push(record.serviceType);
  if (record.careOf && !state.careOfList.includes(record.careOf)) state.careOfList.push(record.careOf);
  state.services = sortList(state.services);
  state.careOfList = sortList(state.careOfList);
}

function canUseVisitorModules() {
  return ["Admin", "Manager"].includes(state.currentRole);
}

function visitorSortTime(visitor) {
  return (Date.parse(visitor.date || "") || 0) * 1000000 + Number(visitor.createdAt || visitor.updatedAt || 0);
}

function visitorNewestFirst(a = {}, b = {}) {
  const aDate = String(a.date || a.visit_date || "");
  const bDate = String(b.date || b.visit_date || "");
  if (bDate !== aDate) return bDate.localeCompare(aDate);
  const aTime = String(a.visitTime || a.visit_time || "");
  const bTime = String(b.visitTime || b.visit_time || "");
  if (bTime !== aTime) return bTime.localeCompare(aTime);
  return (Date.parse(b.createdAt || b.created_at || b.updatedAt || b.updated_at || "") || 0) - (Date.parse(a.createdAt || a.created_at || a.updatedAt || a.updated_at || "") || 0);
}

function visitorPersonOptions() {
  return sortList([
    ...state.users.map((user) => user.name),
    "CA Sadique",
    "Najmunnisa",
    "Chindu",
  ]);
}

function filteredVisitors() {
  const f = state.filters;
  const today = indiaTodayDate();
  const historyOpen = f.visitorHistoryOpen === "Yes";
  return (state.visitors || [])
    .filter((visitor) => {
      if (!historyOpen) {
        if (visitor.date !== today) return false;
      } else {
        const selectedDate = f.visitorDate || "";
        if (selectedDate && visitor.date !== selectedDate) return false;
        if (f.visitorFrom && f.visitorTo && f.visitorFrom > f.visitorTo) return false;
        if (f.visitorFrom && visitor.date < f.visitorFrom) return false;
        if (f.visitorTo && visitor.date > f.visitorTo) return false;
      }
      if (f.visitorName && !normalizeImportMatchText(visitor.visitorName).includes(normalizeImportMatchText(f.visitorName))) return false;
      if (f.visitorCompany && !normalizeImportMatchText(visitor.company).includes(normalizeImportMatchText(f.visitorCompany))) return false;
      if (f.visitorPurpose && !normalizeImportMatchText(visitor.purpose).includes(normalizeImportMatchText(f.visitorPurpose))) return false;
      if (f.visitorMetWhom && !normalizeImportMatchText(visitor.metWhom).includes(normalizeImportMatchText(f.visitorMetWhom))) return false;
      if (f.visitorEnteredBy && !normalizeImportMatchText(visitor.enteredBy).includes(normalizeImportMatchText(f.visitorEnteredBy))) return false;
      return true;
    })
    .sort(visitorNewestFirst);
}

function renderVisitorsPage() {
  const page = document.querySelector("#visitors");
  if (!page) return;
  if (!canUseVisitorModules()) {
    page.innerHTML = `<div class="permission-note">Visitors is available only for Admin and Manager logins.</div>`;
    return;
  }
  const visitors = filteredVisitors();
  const today = indiaTodayDate();
  const historyOpen = state.filters.visitorHistoryOpen === "Yes";
  const selectedDate = historyOpen ? (state.filters.visitorDate || "") : today;
  page.innerHTML = `
    <div class="panel visitor-panel">
      <div class="filter-hero">
        <div>
          <h3>${historyOpen ? "Visitors Report" : "Visitors Today"}</h3>
          <p>${historyOpen ? visitorPeriodLabel() : displayDate(today)} | ${visitors.length} visitor record(s) | Asia/Kolkata</p>
        </div>
        <div class="visitor-head-actions">
          <button class="secondary-button" id="visitorHistoryToggle">${historyOpen ? "Back to Today" : "View Visitor History"}</button>
          <button class="primary-button" id="addVisitorButton">+ Add Visitor</button>
        </div>
      </div>
      ${historyOpen ? renderVisitorHistoryPanel() : ""}
      ${historyOpen ? "" : `<div class="visitor-today-note">Showing only visitors dated ${displayDate(today)}. Historical records remain stored and are available from Visitor History.</div>`}
      ${state.filters.visitorFilterError ? `<div class="form-error">${escapeHtml(state.filters.visitorFilterError)}</div>` : ""}
      ${state.filters.visitorEntryOpen === "Yes" ? renderVisitorInlineEntry() : ""}
      ${renderVisitorsTable(visitors)}
    </div>
  `;
  bindVisitorsPage(visitors);
}

function renderVisitorHistoryPanel() {
  return `
      <div class="filters visitor-filters">
        ${visitorDateInput("visitorDate", "Date")}
        ${visitorDateInput("visitorFrom", "From")}
        ${visitorDateInput("visitorTo", "To")}
        ${visitorTextInput("visitorName", "Visitor Name", "Search visitor")}
        ${visitorTextInput("visitorCompany", "Company", "Search company")}
        ${visitorTextInput("visitorPurpose", "Purpose", "Search purpose")}
        ${visitorTextInput("visitorMetWhom", "Met Whom", "Search person")}
        ${visitorTextInput("visitorEnteredBy", "Entered By", "Search user")}
      </div>
      <div class="action-row visitor-action-row">
        <button class="secondary-button" id="applyVisitorFilters">Apply Filter</button>
        <button class="secondary-button" id="clearVisitorFilters">Clear Filter</button>
        <button class="secondary-button" id="exportVisitorsExcel" ${rolePerm().export ? "" : "disabled"}>Export to Excel</button>
        <button class="secondary-button" id="exportVisitorsPdf" ${rolePerm().export ? "" : "disabled"}>Export to PDF</button>
        <button class="secondary-button" id="printVisitors">Print</button>
      </div>
  `;
}

function visitorPeriodLabel() {
  if (state.filters.visitorDate) return `Date ${displayDate(state.filters.visitorDate)}`;
  if (state.filters.visitorFrom || state.filters.visitorTo) {
    return `From ${state.filters.visitorFrom ? displayDate(state.filters.visitorFrom) : "Start"} to ${state.filters.visitorTo ? displayDate(state.filters.visitorTo) : "Today"}`;
  }
  return "All historical visitors";
}

function visitorTextInput(key, label, placeholder) {
  return `<div class="field"><label>${label}</label><input data-visitor-filter="${key}" value="${escapeHtml(state.filters[key] || "")}" placeholder="${placeholder}"></div>`;
}

function visitorDateInput(key, label) {
  const value = state.filters[key] || "";
  return `<div class="field"><label>${label}</label><input type="date" data-visitor-filter="${key}" value="${escapeHtml(value)}"></div>`;
}

function renderVisitorInlineEntry() {
  const date = state.filters.visitorEntryDate || state.filters.visitorDate || indiaTodayDate();
  return `
    <section class="visitor-inline-entry">
      <div class="field daily-date-field">
        <label>Visitor Date</label>
        <input type="date" id="visitorEntryDate" value="${escapeHtml(date)}">
        <span class="small-muted">${displayDate(date)}</span>
      </div>
      <div class="visitor-entry-table-wrap">
        <table class="visitor-entry-table">
          <thead><tr><th>Time</th><th>Name</th><th>Mobile</th><th>Company</th><th>Purpose</th><th>Met Whom</th><th>Remarks</th><th>Actions</th></tr></thead>
          <tbody id="visitorEntryRows">
            ${visitorEntryRow({}, 0)}
          </tbody>
        </table>
      </div>
      <div class="drawer-actions visitor-inline-actions">
        <button type="button" class="secondary-button" id="addVisitorLine">+ Add New Line</button>
        <button type="button" class="primary-button" id="saveVisitorButton">Save All</button>
        <button type="button" class="secondary-button" id="cancelVisitorEntry">Cancel</button>
      </div>
      <datalist id="visitorPersonList">${visitorPersonOptions().map((person) => `<option value="${escapeHtml(person)}"></option>`).join("")}</datalist>
    </section>
  `;
}

function renderVisitorEditRow(visitor, index) {
  return `
    <tr class="visitor-edit-row" data-edit-visitor-row="${visitor.id}">
      <td>${index + 1}</td>
      <td><input type="date" data-edit-field="date" value="${escapeHtml(visitor.date || indiaTodayDate())}"></td>
      <td><input type="time" data-edit-field="visitTime" value="${escapeHtml(visitor.visitTime || "")}"></td>
      <td><input data-edit-field="visitorName" value="${escapeHtml(visitor.visitorName || "")}"></td>
      <td><input data-edit-field="mobileNumber" value="${escapeHtml(visitor.mobileNumber || "")}"></td>
      <td><input data-edit-field="company" value="${escapeHtml(visitor.company || "")}"></td>
      <td><textarea data-edit-field="purpose" rows="2">${escapeHtml(visitor.purpose || "")}</textarea></td>
      <td>${visitorPersonSelect("data-edit-field=\"metWhom\"", visitor.metWhom || "")}</td>
      <td><textarea data-edit-field="remarks" rows="2">${escapeHtml(visitor.remarks || visitor.followUp || "")}</textarea></td>
      <td>${escapeHtml(visitor.enteredBy || "")}</td>
      <td><div class="action-row">
        <button class="mini-button success" data-save-visitor-edit="${visitor.id}">Save</button>
        <button class="mini-button" data-cancel-visitor-edit>Cancel</button>
      </div></td>
    </tr>
    <tr class="hidden"><td colspan="11"></td></tr>
  `;
}

function renderVisitorsTable(visitors) {
  if (!visitors.length) return empty("No visitors match these filters.");
  return `
    <div class="table-wrap file-table-wrap">
      <table class="file-table file-table-compact visitor-table">
        <thead><tr><th>SN</th><th>Visit Date</th><th>Visit Time</th><th>Visitor Name</th><th>Mobile Number</th><th>Company</th><th>Purpose</th><th>Met Whom</th><th>Remarks</th><th>Entered By</th><th class="action-col">Actions</th></tr></thead>
        <tbody>
          ${visitors.map((visitor, index) => `
            ${state.filters.editVisitorId === visitor.id ? renderVisitorEditRow(visitor, index) : `<tr>
              <td>${index + 1}</td>
              <td>${displayDate(visitor.date)}</td>
              <td>${escapeHtml(visitor.visitTime || "")}</td>
              <td><span class="client-name">${escapeHtml(visitor.visitorName)}</span></td>
              <td>${escapeHtml(visitor.mobileNumber || "")}</td>
              <td>${escapeHtml(visitor.company || "")}</td>
              <td class="visitor-purpose-cell">${escapeHtml(visitor.purpose)}</td>
              <td>${escapeHtml(visitor.metWhom)}</td>
              <td class="visitor-purpose-cell">${escapeHtml(visitor.remarks || visitor.followUp || "")}</td>
              <td>${escapeHtml(visitor.enteredBy || "")}</td>
              <td class="action-col"><div class="action-row">
                <button class="mini-button" data-edit-visitor="${visitor.id}">Edit</button>
                <button class="mini-button danger" data-delete-visitor="${visitor.id}">Delete</button>
              </div></td>
            </tr>`}
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bindVisitorsPage(visitors) {
  document.querySelector("#addVisitorButton").onclick = () => {
    state.filters.visitorEntryOpen = "Yes";
    state.filters.visitorEntryDate = state.filters.visitorDate || indiaTodayDate();
    saveState();
    renderVisitorsPage();
  };
  document.querySelector("#visitorHistoryToggle")?.addEventListener("click", () => {
    if (state.filters.visitorHistoryOpen === "Yes") {
      state.filters.visitorHistoryOpen = "";
      state.filters.visitorFilterError = "";
      ["visitorDate", "visitorFrom", "visitorTo", "visitorName", "visitorCompany", "visitorPurpose", "visitorMetWhom", "visitorEnteredBy"].forEach((key) => (state.filters[key] = ""));
    } else {
      state.filters.visitorHistoryOpen = "Yes";
    }
    saveState();
    renderVisitorsPage();
  });
  document.querySelectorAll("[data-visitor-filter]").forEach((input) => {
    input.oninput = (event) => {
      state.filters[event.target.dataset.visitorFilter] = event.target.value;
      state.filters.visitorFilterError = "";
    };
    input.onchange = input.oninput;
  });
  document.querySelector("#applyVisitorFilters")?.addEventListener("click", () => {
    if (state.filters.visitorFrom && state.filters.visitorTo && state.filters.visitorFrom > state.filters.visitorTo) {
      state.filters.visitorFilterError = "From Date cannot be later than To Date.";
    } else {
      state.filters.visitorFilterError = "";
    }
    saveState();
    renderVisitorsPage();
  });
  document.querySelector("#clearVisitorFilters")?.addEventListener("click", () => {
    ["visitorDate", "visitorFrom", "visitorTo", "visitorName", "visitorCompany", "visitorPurpose", "visitorMetWhom", "visitorEnteredBy"].forEach((key) => (state.filters[key] = ""));
    state.filters.visitorFilterError = "";
    saveState();
    renderVisitorsPage();
  });
  document.querySelector("#exportVisitorsExcel")?.addEventListener("click", () => exportVisitorsExcel(visitors));
  document.querySelector("#exportVisitorsPdf")?.addEventListener("click", () => printVisitorRows(visitors, "pdf"));
  document.querySelector("#printVisitors")?.addEventListener("click", () => printVisitorRows(visitors, "print"));
  bindVisitorInlineEntry();
  document.querySelectorAll("[data-edit-visitor]").forEach((btn) => {
    btn.onclick = () => {
      state.filters.editVisitorId = btn.dataset.editVisitor;
      saveState();
      renderVisitorsPage();
    };
  });
  document.querySelectorAll("[data-cancel-visitor-edit]").forEach((btn) => {
    btn.onclick = () => {
      state.filters.editVisitorId = "";
      saveState();
      renderVisitorsPage();
    };
  });
  document.querySelectorAll("[data-save-visitor-edit]").forEach((btn) => {
    btn.onclick = () => saveVisitorInlineEdit(btn.dataset.saveVisitorEdit);
  });
  document.querySelectorAll("[data-delete-visitor]").forEach((btn) => (btn.onclick = () => deleteVisitor(btn.dataset.deleteVisitor)));
}

function visitorExportRow(visitor, index) {
  return {
    SN: index + 1,
    "Visit Date": displayDate(visitor.date),
    "Visit Time": visitor.visitTime || "",
    "Visitor Name": visitor.visitorName,
    "Mobile Number": visitor.mobileNumber || "",
    Company: visitor.company || "",
    Purpose: visitor.purpose,
    "Met Whom": visitor.metWhom,
    Remarks: visitor.remarks || visitor.followUp || "",
    "Entered By": visitor.enteredBy || "",
    "Created On": displayDate(visitor.createdAt || visitor.created_at || visitor.date),
  };
}

async function exportVisitorsExcel(visitors) {
  if (!rolePerm().export) return toast("This role cannot export data.");
  await downloadXlsxRows(`visitors-${todayDate()}`, visitors.map(visitorExportRow));
  addAuditLog("Visitors exported", { format: "Excel", count: visitors.length });
  saveState();
  toast("Visitor Excel downloaded");
}

async function printVisitorRows(visitors, format) {
  if (format === "pdf" && !rolePerm().export) return toast("This role cannot export data.");
  const rows = visitors.map(visitorExportRow);
  const dateLine = [
    state.filters.visitorFrom ? `From ${displayDate(state.filters.visitorFrom)}` : "",
    state.filters.visitorTo ? `To ${displayDate(state.filters.visitorTo)}` : "",
    state.filters.visitorDate ? `Date ${displayDate(state.filters.visitorDate)}` : "",
  ].filter(Boolean).join(" | ");
  if (format === "pdf") {
    await downloadPdfRows(`visitors-${todayDate()}`, rows, ["Muhammad & Associates,", "Chartered Accountants,", "Visitors Report", dateLine || "All dates"]);
    addAuditLog("Visitors exported", { format: "PDF", count: visitors.length });
    saveState();
    toast("Visitor PDF downloaded");
    return;
  }
  printStructuredReport({
    title: "Visitors Report",
    sections: [{ title: "Visitors", rows }],
    format,
  });
  addAuditLog("Visitors exported", { format: format === "pdf" ? "PDF" : "Print", count: visitors.length });
  saveState();
}

function visitorEntryRow(visitor = {}, index = 0) {
  return `
    <tr data-visitor-entry-row>
      <td><input type="time" data-visitor-entry="visitTime" value="${escapeHtml(visitor.visitTime || "")}"></td>
      <td><input data-visitor-entry="visitorName" value="${escapeHtml(visitor.visitorName || "")}" placeholder="Visitor name"></td>
      <td><input data-visitor-entry="mobileNumber" value="${escapeHtml(visitor.mobileNumber || "")}" placeholder="Mobile"></td>
      <td><input data-visitor-entry="company" value="${escapeHtml(visitor.company || "")}" placeholder="Company"></td>
      <td><textarea data-visitor-entry="purpose" rows="2" placeholder="Purpose of visit">${escapeHtml(visitor.purpose || "")}</textarea></td>
      <td>${visitorPersonSelect("data-visitor-entry=\"metWhom\"", visitor.metWhom || "")}</td>
      <td><textarea data-visitor-entry="remarks" rows="2" placeholder="Remarks">${escapeHtml(visitor.remarks || visitor.followUp || "")}</textarea></td>
      <td class="visitor-remove-cell"><div class="action-row">
        <button type="button" class="mini-button" data-clear-visitor-row>Clear Row</button>
        ${index === 0 ? "" : `<button type="button" class="mini-button danger" data-remove-visitor-row>Remove Row</button>`}
      </div></td>
    </tr>
  `;
}

function bindVisitorInlineEntry() {
  const dateInput = document.querySelector("#visitorEntryDate");
  if (dateInput) {
    dateInput.onchange = () => {
      state.filters.visitorEntryDate = dateInput.value || indiaTodayDate();
      saveState();
    };
  }
  const addLine = document.querySelector("#addVisitorLine");
  if (addLine) addLine.onclick = () => {
    const body = document.querySelector("#visitorEntryRows");
    body.insertAdjacentHTML("beforeend", visitorEntryRow({}, body.children.length));
    bindVisitorEntryRows();
  };
  const cancel = document.querySelector("#cancelVisitorEntry");
  if (cancel) cancel.onclick = () => {
    state.filters.visitorEntryOpen = "";
    saveState();
    renderVisitorsPage();
  };
  const save = document.querySelector("#saveVisitorButton");
  if (save) save.onclick = saveVisitorInlineRows;
  bindVisitorEntryRows();
}

function visitorPersonSelect(attributes = "", value = "") {
  const options = visitorPersonOptions();
  return `<select ${attributes}>
    <option value="">Select staff</option>
    ${options.map((person) => `<option value="${escapeHtml(person)}" ${person === value ? "selected" : ""}>${escapeHtml(person)}</option>`).join("")}
  </select>`;
}

function bindVisitorEntryRows() {
  document.querySelectorAll("[data-remove-visitor-row]").forEach((btn) => {
    btn.onclick = () => btn.closest("[data-visitor-entry-row]")?.remove();
  });
  document.querySelectorAll("[data-clear-visitor-row]").forEach((btn) => {
    btn.onclick = () => {
      btn.closest("[data-visitor-entry-row]")?.querySelectorAll("[data-visitor-entry]").forEach((input) => (input.value = ""));
    };
  });
  document.querySelectorAll("[data-visitor-entry='metWhom']").forEach((input) => {
    input.onkeydown = (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        document.querySelector("#addVisitorLine")?.click();
        setTimeout(() => document.querySelector("#visitorEntryRows tr:last-child [data-visitor-entry='visitorName']")?.focus(), 0);
      }
    };
  });
}

async function saveVisitorInlineRows() {
  const saveButton = document.querySelector("#saveVisitorButton");
  if (saveButton?.disabled) return;
  if (saveButton) saveButton.disabled = true;
  const date = document.querySelector("#visitorEntryDate")?.value || state.filters.visitorEntryDate || indiaTodayDate();
  const now = Date.now();
  const rows = [...document.querySelectorAll("[data-visitor-entry-row]")];
  const records = [];
  let invalid = 0;
  rows.forEach((row) => {
    row.classList.remove("invalid-row");
    const values = Object.fromEntries([...row.querySelectorAll("[data-visitor-entry]")].map((input) => [input.dataset.visitorEntry, String(input.value || "").trim()]));
    const blank = !values.visitTime && !values.visitorName && !values.mobileNumber && !values.company && !values.purpose && !values.metWhom && !values.remarks;
    if (blank) return;
    if (!values.visitorName || !values.purpose || !values.metWhom) {
      row.classList.add("invalid-row");
      invalid += 1;
      return;
    }
    records.push({
      id: crypto.randomUUID(),
      date,
      visitTime: values.visitTime || "",
      visitorName: values.visitorName,
      mobileNumber: values.mobileNumber || "",
      company: values.company || "",
      purpose: values.purpose,
      metWhom: values.metWhom,
      remarks: values.remarks || "",
      followUp: values.remarks || "",
      enteredBy: state.currentUser || "CA Sadique",
      createdAt: now,
      updatedAt: now,
    });
  });
  if (!records.length) {
    if (saveButton) saveButton.disabled = false;
    return toast(invalid ? "Please complete the highlighted visitor rows." : "Please enter at least one visitor.");
  }
  try {
    if (isSupabaseMode()) {
      await saveVisitorsToApi(records);
    } else {
      records.forEach((record) => {
        state.visitors = [record, ...(state.visitors || [])].sort(visitorNewestFirst);
        addAuditLog("Visitor added", { updated: visitorAuditSnapshot(record) });
      });
      saveState();
    }
  } catch (error) {
    if (saveButton) saveButton.disabled = false;
    return toast(error.message || "Central visitor save failed.");
  }
  if (invalid) {
    toast(`${records.length} valid visitor(s) saved. Highlighted row(s) were not saved.`);
    document.querySelectorAll("[data-visitor-entry-row]:not(.invalid-row)").forEach((row) => row.remove());
    if (!document.querySelectorAll("[data-visitor-entry-row]").length) {
      document.querySelector("#visitorEntryRows")?.insertAdjacentHTML("beforeend", visitorEntryRow({}, 0));
    }
    bindVisitorEntryRows();
    if (saveButton) saveButton.disabled = false;
    return;
  } else {
    toast(`${records.length} visitor record(s) saved and synced`);
  }
  state.filters.visitorEntryOpen = "";
  state.filters.visitorDate = date;
  saveState({ skipMerge: true, skipRemote: true });
  renderAll();
}

async function saveVisitorInlineEdit(id) {
  const button = document.querySelector(`[data-save-visitor-edit="${CSS.escape(id)}"]`);
  if (button?.disabled) return;
  if (button) button.disabled = true;
  const row = [...document.querySelectorAll("[data-edit-visitor-row]")].find((item) => item.dataset.editVisitorRow === id);
  const existing = state.visitors.find((visitor) => visitor.id === id);
  if (!row || !existing) {
    if (button) button.disabled = false;
    return toast("Visitor record not found.");
  }
  row.classList.remove("invalid-row");
  const values = Object.fromEntries([...row.querySelectorAll("[data-edit-field]")].map((input) => [input.dataset.editField, String(input.value || "").trim()]));
  if (!values.date || !values.visitorName || !values.purpose || !values.metWhom) {
    row.classList.add("invalid-row");
    if (button) button.disabled = false;
    return toast("Please complete the highlighted visitor row.");
  }
  const record = {
    ...existing,
    date: values.date,
    visitTime: values.visitTime || "",
    visitorName: values.visitorName,
    mobileNumber: values.mobileNumber || "",
    company: values.company || "",
    purpose: values.purpose,
    metWhom: values.metWhom,
    remarks: values.remarks || "",
    followUp: values.remarks || "",
    updatedAt: Date.now(),
  };
  try {
    if (isSupabaseMode()) {
      await saveVisitorsToApi([record]);
    } else {
      state.visitors = state.visitors.map((visitor) => visitor.id === id ? record : visitor).sort(visitorNewestFirst);
      addAuditLog("Visitor edited", { previous: visitorAuditSnapshot(existing), updated: visitorAuditSnapshot(record) });
      saveState();
    }
    state.filters.editVisitorId = "";
    saveState({ skipMerge: true, skipRemote: true });
    toast("Visitor updated and synced");
    renderAll();
  } catch (error) {
    if (button) button.disabled = false;
    toast(error.message || "Central visitor update failed.");
  }
}

async function deleteVisitor(id) {
  if (!canUseVisitorModules()) return toast("Visitors is available only for Admin and Manager.");
  const visitor = state.visitors.find((item) => item.id === id);
  if (!visitor) return toast("Visitor record not found.");
  if (!confirm(`Delete visitor record for ${visitor.visitorName}?`)) return;
  try {
    if (isSupabaseMode()) {
      await deleteVisitorFromApi(id);
    } else {
      state.deletedVisitorIds = [...new Set([...(state.deletedVisitorIds || []), id])];
      state.visitors = state.visitors.filter((item) => item.id !== id);
      addAuditLog("Visitor deleted", { previous: visitorAuditSnapshot(visitor) });
      saveState({ skipMerge: true });
    }
    toast("Visitor deleted and synced");
    renderAll();
  } catch (error) {
    toast(error.message || "Central visitor delete failed.");
  }
}

function visitorAuditSnapshot(visitor) {
  return {
    date: visitor.date,
    visitTime: visitor.visitTime || "",
    visitorName: visitor.visitorName,
    mobileNumber: visitor.mobileNumber || "",
    company: visitor.company || "",
    purpose: visitor.purpose,
    metWhom: visitor.metWhom,
    remarks: visitor.remarks || visitor.followUp || "",
    enteredBy: visitor.enteredBy || "",
  };
}

function canUseExpenseModule() {
  return ["Admin", "Manager"].includes(state.currentRole);
}

function renderExpensesPage() {
  const root = document.querySelector("#expenses");
  if (!root) return;
  if (!canUseExpenseModule()) {
    root.innerHTML = "";
    return;
  }
  const tab = state.filters.expenseTab || "collections";
  const balance = cashBalanceForRange();
  const totalCashCollections = balance.feeCollections + balance.otherCollections;
  root.innerHTML = `
    <div class="expense-shell">
      <div class="transactions-page-head">
        <div>
          <h3>Transactions</h3>
          <p>Manage collections, expenses and cash reconciliation</p>
        </div>
      </div>
      <div class="expense-overview-grid">
        ${expenseOverviewCard("Current Cash Balance", balance.closing, "balance", "Live cash position", "wallet")}
        ${expenseOverviewCard("Total Cash Collections", totalCashCollections, "collection", "Cash receipts only", "arrow-down")}
        ${expenseOverviewCard("Total Cash Expenses", balance.cashExpenses, "expense", "Cash payments only", "arrow-up")}
        ${expenseOverviewCard("Fee Collections", balance.feeCollections, "fee", "Cash fee receipts", "receipt")}
      </div>
      <div class="expense-tabs">
        ${expenseTabButton("collections", "Collections", tab, "arrow-down")}
        ${expenseTabButton("expenses", "Expenses", tab, "arrow-up")}
        ${expenseTabButton("balance", "Cash Reconciliation", tab, "wallet")}
      </div>
      ${tab === "collections" ? renderCashCollectionsTab() : tab === "balance" ? renderCashBalanceTab() : renderExpenseEntryTab()}
    </div>
  `;
  bindExpensePage();
}

function expenseOverviewCard(label, amount, tone, helper = "", icon = "wallet") {
  return `<div class="expense-overview-card ${tone}">
    <div class="expense-card-icon" aria-hidden="true">${transactionIcon(icon)}</div>
    <div>
      <span>${label}</span>
      <strong class="${Number(amount || 0) < 0 ? "negative-amount" : ""}">${rupee(amount)}</strong>
      ${helper ? `<p>${helper}</p>` : ""}
      ${transactionSparkline(tone)}
    </div>
  </div>`;
}

function transactionSparkline(tone = "balance") {
  const values = {
    balance: [6, 7, 8, 6, 9, 10, 9],
    collection: [3, 5, 4, 7, 8, 7, 10],
    expense: [5, 4, 6, 5, 7, 5, 6],
    fee: [2, 4, 5, 5, 7, 8, 9],
  }[tone] || [2, 4, 3, 6, 5, 7, 8];
  const max = Math.max(...values);
  const points = values.map((value, index) => `${index * 18},${28 - (value / max) * 22}`).join(" ");
  return `<svg class="transaction-sparkline" viewBox="0 0 108 32" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}"></polyline></svg>`;
}

function expenseTabButton(key, label, selected, icon = "") {
  return `<button class="expense-tab-button tab-${key} ${selected === key ? "active-tab" : ""}" data-expense-tab="${key}">
    ${icon ? `<span class="tab-icon" aria-hidden="true">${transactionIcon(icon)}</span>` : ""}${label}
  </button>`;
}

function transactionIcon(name) {
  const icons = {
    wallet: "&#8377;",
    "arrow-down": "&#8595;",
    "arrow-up": "&#8593;",
    receipt: "&#9776;",
    search: "&#8981;",
    save: "&#10003;",
    reset: "&#8635;",
    file: "&#128206;",
  };
  return icons[name] || icons.wallet;
}

function rupee(value) {
  const amount = Number(value || 0);
  const formatted = Math.abs(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${amount < 0 ? "-" : ""}&#8377; ${formatted}`;
}

function normalizeCollectionType(value = "") {
  const raw = String(value || "").trim();
  const key = raw.toLowerCase().replace(/[\s-]+/g, "_");
  const aliases = {
    fee_collection: "fee_collection",
    other_cash_collection: "other_cash_collection",
    cash_collection: "other_cash_collection",
    bank_collection: "other_bank_collection",
    other_bank_collection: "other_bank_collection",
    other_collection: "other",
    refund: "refund",
    other: "other",
  };
  return aliases[key] || "";
}

function collectionTypeLabel(value = "") {
  const key = normalizeCollectionType(value);
  return key ? collectionTypeLabels[key] : "Collection Type Not Available";
}

function collectionTypeSelect(id, label, selectedValue = "") {
  const selected = normalizeCollectionType(selectedValue) || "other_cash_collection";
  return `<div class="field"><label>${escapeHtml(label)}</label><select id="${escapeHtml(id)}">${collectionTypeOptions.map((option) => `<option value="${escapeHtml(option.value)}" ${selected === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select></div>`;
}

function isCollectionType(item = {}, type) {
  return normalizeCollectionType(item.collectionType || item.collection_type) === type;
}

function renderExpenseEntryTab() {
  const rows = filteredExpenses();
  return `
    <div class="transaction-workspace">
      <section class="expense-stack transaction-main-column">
        <form id="expenseForm" class="expense-form expense-entry-form">
          <div class="expense-card-head">
            <h3>${state.filters.editExpenseId ? "Edit Expense" : "Add Expense"}</h3>
            <p>Record and manage business expenses</p>
          </div>
          ${expenseDateField("expenseDate", "Expense Date", editingExpense()?.date || todayDate())}
          ${expenseItemField(editingExpense()?.particulars || "")}
          ${expenseInput("expensePaidTo", "Paid To", editingExpense()?.paidTo || "", "text", "", "wide-field")}
          ${expenseInput("expenseAmount", "Amount", editingExpense()?.amount || "", "number", "0.01", "compact-field amount-field")}
          ${expenseSelect("expenseMode", "Payment Mode", ["Cash", "Bank", "UPI", "Cheque"], editingExpense()?.mode || "Cash")}
          ${expenseInput("expenseVoucherNo", "Voucher No.", editingExpense()?.voucherNo || "", "text", "", "compact-field ref-field")}
          ${expenseInput("expenseEnteredBy", "Entered By", editingExpense()?.createdBy || editingExpense()?.enteredBy || state.currentUser || "", "text")}
          ${expenseTextarea("expenseRemarks", "Remarks", editingExpense()?.remarks || "")}
          ${expenseAttachmentField(editingExpense())}
          <div class="action-row">
            <button class="secondary-button" type="button" id="resetExpenseForm">${state.filters.editExpenseId ? "Cancel" : "Reset"}</button>
            <button class="primary-button" type="submit"><span aria-hidden="true">${transactionIcon("save")}</span>${state.filters.editExpenseId ? "Update Expense" : "Save Expense"}</button>
          </div>
        </form>
        <div class="expense-tools-card">
          <div class="expense-card-head">
            <span>Search & Reports</span>
            <h3>Expense Register</h3>
          </div>
          ${renderExpenseFilters()}
        </div>
      </section>
      ${renderTransactionSidePanel("expenses")}
    </div>
    ${renderExpenseTable(rows)}
  `;
}

function renderOpeningBalancePanel() {
  const rows = [...(state.openingBalances || [])].sort((a, b) => a.date.localeCompare(b.date));
  return `
    <div class="expense-tools-card opening-balance-card admin-opening-balance">
      <div class="expense-card-head">
        <span>Admin Only</span>
        <h3>Set Opening Cash Balance</h3>
        <p>Enter the opening cash position from which reconciliation should begin</p>
      </div>
      <form id="openingBalanceForm" class="opening-balance-form">
        ${expenseInput("openingDate", "Opening Balance Date", todayDate(), "date", "", "compact-field")}
        ${expenseInput("openingAmount", "Opening Balance Amount", "", "number", "0.01", "compact-field amount-field")}
        <div class="field opening-balance-actions"><label>Action</label><button class="primary-button" type="submit">Save Opening Balance</button><button class="secondary-button" id="resetOpeningBalanceForm" type="button">Reset</button></div>
      </form>
      ${rows.length ? `<div class="table-wrap opening-balance-list"><table class="file-table expense-table transaction-table"><thead><tr><th>Effective Date</th><th class="amount-col">Opening Amount</th><th>Entered By</th><th>Entered On</th><th>Updated On</th><th>Actions</th></tr></thead><tbody>${rows.map((item) => `<tr><td>${expenseDisplayDate(item.date)}</td><td class="amount-cell">${money(item.amount)}</td><td>${escapeHtml(item.enteredBy || item.createdBy || "")}</td><td>${escapeHtml(formatDateTime(item.createdAt || item.created_at || ""))}</td><td>${escapeHtml(formatDateTime(item.updatedAt || item.updated_at || ""))}</td><td><button class="mini-button danger" data-delete-opening="${item.id}">Delete</button></td></tr>`).join("")}</tbody></table></div>` : ""}
    </div>
  `;
}

function renderCashCollectionsTab() {
  const rows = filteredCashCollections();
  return `
    <div class="transaction-workspace">
      <section class="expense-stack transaction-main-column">
        <form id="cashCollectionForm" class="expense-form collection-form">
          <div class="expense-card-head">
            <h3>${state.filters.editCashId ? "Edit Collection" : "Add Collection"}</h3>
            <p>Record cash, bank or other collections</p>
          </div>
          ${expenseDateField("cashDate", "Collection Date", editingCashCollection()?.date || todayDate())}
          ${collectionTypeSelect("cashCollectionType", "Collection Type", editingCashCollection()?.collectionType || editingCashCollection()?.collection_type || "other_cash_collection")}
          ${cashReceivedFromField(editingCashCollection()?.receivedFrom || "")}
          ${expenseInput("cashAmount", "Amount", editingCashCollection()?.amount || "", "number", "0.01", "compact-field amount-field")}
          ${expenseSelect("cashModeEntry", "Payment Mode", ["Cash", "Bank", "UPI", "Cheque"], editingCashCollection()?.mode || "Cash")}
          ${expenseInput("cashVoucherNo", "Ref No.", editingCashCollection()?.voucherNo || "", "text", "", "compact-field ref-field")}
          ${collectionParticularsSelect(editingCashCollection()?.particulars || "Fee Collection")}
          ${expenseInput("cashCollectedBy", "Collected By", editingCashCollection()?.createdBy || editingCashCollection()?.enteredBy || state.currentUser || "", "text")}
          ${cashAttachmentField(editingCashCollection())}
          <div class="action-row">
            <button class="secondary-button" type="button" id="resetCashForm">${state.filters.editCashId ? "Cancel" : "Reset"}</button>
            <button class="primary-button" type="submit"><span aria-hidden="true">${transactionIcon("save")}</span>${state.filters.editCashId ? "Update Collection" : "Save Collection"}</button>
          </div>
        </form>
        <div class="expense-tools-card">
          <div class="expense-card-head">
            <span>Search & Reports</span>
            <h3>Client Collection Register</h3>
          </div>
          ${renderCashFilters()}
        </div>
      </section>
      ${renderTransactionSidePanel("collections")}
    </div>
    ${renderCashCollectionTable(rows)}
  `;
}

function renderTransactionSidePanel(tab) {
  const balance = cashBalanceForRange();
  const today = indiaTodayDate();
  const todaysCollections = (state.otherCashCollections || []).filter((item) => item.date === today);
  const cashCollections = (state.otherCashCollections || []).filter((item) => item.mode === "Cash");
  const bankCollections = (state.otherCashCollections || []).filter((item) => item.mode === "Bank");
  const otherCollections = (state.otherCashCollections || []).filter((item) => !isCollectionType(item, "fee_collection"));
  return `<aside class="transaction-side-column">
    <section class="transaction-side-card">
      <div class="expense-card-head">
        <span>Today</span>
        <h3>Collection Summary</h3>
      </div>
      ${transactionInfoRow("Today's Collections", todaysCollections.reduce((sum, item) => sum + Number(item.amount || 0), 0), "collection")}
      ${transactionInfoRow("Total Collections", balance.feeCollections + balance.otherCollections, "balance")}
      ${transactionInfoRow("Cash Collections", cashCollections.reduce((sum, item) => sum + Number(item.amount || 0), 0), "collection")}
      ${transactionInfoRow("Bank Collections", bankCollections.reduce((sum, item) => sum + Number(item.amount || 0), 0), "fee")}
      ${transactionInfoRow("Other Collections", otherCollections.reduce((sum, item) => sum + Number(item.amount || 0), 0), "balance")}
      ${transactionInfoRow("Record Count", tab === "expenses" ? filteredExpenses().length : filteredCashCollections().length, "count", false)}
    </section>
    <section class="transaction-side-card">
      <div class="expense-card-head">
        <span>Quick Actions</span>
        <h3>Operations</h3>
      </div>
      <button class="transaction-quick-action" type="button" data-expense-tab="collections">${transactionIcon("arrow-down")} Add Collection</button>
      <button class="transaction-quick-action" type="button" data-expense-tab="expenses">${transactionIcon("arrow-up")} Add Expense</button>
      <button class="transaction-quick-action" type="button" data-expense-tab="balance">${transactionIcon("wallet")} Cash Reconciliation</button>
      <button class="transaction-quick-action" type="button" id="transactionImportShortcut">${transactionIcon("file")} Import Data</button>
      <button class="transaction-quick-action" type="button" id="transactionExportShortcut">${transactionIcon("save")} Export Data</button>
    </section>
  </aside>`;
}

function transactionInfoRow(label, value, tone, currency = true) {
  return `<div class="transaction-info-row ${tone}">
    <span>${escapeHtml(label)}</span>
    <strong>${currency ? rupee(value) : Number(value || 0).toLocaleString("en-IN")}</strong>
  </div>`;
}

function renderCashBalanceTab() {
  const from = state.filters.balanceFrom || "";
  const to = state.filters.balanceTo || "";
  const balance = cashBalanceForRange(from, to);
  return `
    ${state.currentRole === "Admin" ? renderOpeningBalancePanel() : ""}
    <div class="expense-tools-card balance-tools">
      <div class="expense-card-head">
        <h3>Cash Reconciliation</h3>
        <p>Review cash-only movement and closing balance</p>
      </div>
      <div class="filters colourful-filters expense-filters balance-filter-row">
        ${expenseFilterInput("balanceFrom", "From Date", "date")}
        ${expenseFilterInput("balanceTo", "To Date", "date")}
        ${expenseFilterInput("balanceEnteredBy", "Entered By")}
        ${expenseFilterSelect("balanceType", "Transaction Type", ["", "Collection", "Expense"])}
        <div class="field"><label>Action</label><button class="secondary-button" id="balanceSearch">Recalculate</button></div>
        <div class="field"><label>Reset</label><button class="secondary-button" id="balanceReset">Clear</button></div>
        <div class="field"><label>Export</label><button class="secondary-button" id="balanceExcel">Excel</button></div>
        <div class="field"><label>PDF</label><button class="secondary-button" id="balancePdf">PDF</button></div>
        <div class="field"><label>Print</label><button class="secondary-button" id="balancePrint">Print</button></div>
      </div>
    </div>
    <div class="cash-balance-grid">
      ${cashBalanceCard("Opening Cash Balance", balance.opening)}
      ${cashBalanceCard("Cash Collections", balance.feeCollections + balance.otherCollections)}
      ${cashBalanceCard("Cash Expenses", balance.cashExpenses)}
      ${cashBalanceCard("Closing Cash Balance", balance.closing, true)}
    </div>
    ${renderCashVerificationPanel(balance)}
    ${renderCashMovementTable()}
  `;
}

function formatDateTime(value) {
  if (!value) return "";
  const time = Number(value);
  const date = Number.isFinite(time) && String(value).length < 14 ? new Date(time) : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function cashBalanceCard(label, amount, highlight = false) {
  return `<div class="cash-balance-card ${highlight ? "highlight" : ""}"><span>${label}</span><strong class="${Number(amount || 0) < 0 ? "negative-amount" : ""}">${rupee(amount)}</strong></div>`;
}

function renderCashVerificationPanel(balance) {
  const physical = Number(state.filters.physicalCashCount || 0);
  const hasPhysical = state.filters.physicalCashCount !== undefined && state.filters.physicalCashCount !== "";
  const difference = hasPhysical ? physical - Number(balance.closing || 0) : 0;
  const status = !hasPhysical || Math.abs(difference) < 0.01 ? "Reconciled" : "Difference Found";
  return `
    <div class="expense-tools-card cash-verification-card">
      <div class="expense-card-head">
        <h3>Cash Verification</h3>
        <p>Compare system closing balance with physical cash count</p>
      </div>
      <div class="cash-status ${status === "Reconciled" ? "ok" : "warn"}">${status}</div>
      <div class="filters colourful-filters expense-filters cash-verify-grid">
        <div class="field"><label>System Closing Balance</label><input value="${escapeHtml(String(money(balance.closing)))}" readonly></div>
        ${expenseFilterInput("physicalCashCount", "Physical Cash Count", "number")}
        <div class="field"><label>Difference</label><input value="${escapeHtml(money(difference))}" readonly></div>
        ${expenseFilterInput("cashVerifiedBy", "Verified By")}
        ${expenseFilterInput("cashVerificationDate", "Verification Date", "date")}
        ${expenseFilterInput("cashVerificationRemarks", "Remarks")}
      </div>
    </div>
  `;
}

function renderExpenseFilters() {
  return `
    <div class="filters colourful-filters expense-filters expense-search-row">
      ${expenseFilterInput("expenseParticulars", "Search")}
      ${expenseFilterInput("expenseFrom", "From Date", "date")}
      ${expenseFilterInput("expenseTo", "To Date", "date")}
      ${expenseFilterSelect("expenseMode", "Payment Mode", ["", "Cash", "Bank", "UPI", "Cheque"])}
      ${expenseFilterInput("expenseItemFilter", "Expense Item")}
      ${expenseFilterInput("expensePaidTo", "Paid To")}
      ${expenseFilterInput("expenseEnteredBy", "Entered By")}
      <div class="field"><label>Apply</label><button class="secondary-button" id="expenseSearch">Apply Filter</button></div>
      <div class="field"><label>Clear</label><button class="secondary-button" id="expenseReset">Clear Filter</button></div>
      <div class="field"><label>Excel</label><button class="secondary-button" id="expenseExcel">Excel</button></div>
      <div class="field"><label>PDF</label><button class="secondary-button" id="expensePdf">PDF</button></div>
      <div class="field"><label>Print</label><button class="secondary-button" id="expensePrint">Print</button></div>
    </div>
  `;
}

function renderCashFilters() {
  return `
    <div class="filters colourful-filters expense-filters">
      ${expenseFilterInput("cashParticulars", "Search")}
      ${expenseFilterInput("cashFrom", "From Date", "date")}
      ${expenseFilterInput("cashTo", "To Date", "date")}
      ${expenseFilterSelect("cashMode", "Mode", ["", "Cash", "Bank", "UPI", "Cheque"])}
      ${expenseFilterSelect("cashCollectionTypeFilter", "Collection Type", ["", ...collectionTypeOptions.map((option) => option.label)])}
      ${expenseFilterInput("cashCollectedByFilter", "Collected By")}
      <div class="field"><label>Apply</label><button class="secondary-button" id="cashSearch">Apply Filter</button></div>
      <div class="field"><label>Clear</label><button class="secondary-button" id="cashReset">Clear Filter</button></div>
      <div class="field"><label>Excel</label><button class="secondary-button" id="cashExcel">Excel</button></div>
      <div class="field"><label>PDF</label><button class="secondary-button" id="cashPdf">PDF</button></div>
      <div class="field"><label>Print</label><button class="secondary-button" id="cashPrint">Print</button></div>
    </div>
  `;
}

function expenseInput(id, label, value = "", type = "text", step = "", className = "") {
  const amountClass = type === "number" ? " amount-input" : "";
  return `<div class="field ${escapeHtml(className)}"><label>${label}</label><input id="${id}" class="${amountClass}" type="${type}" ${type === "date" ? `max="9999-12-31"` : ""} ${step ? `step="${step}"` : ""} value="${escapeHtml(value)}"></div>`;
}

function expenseTextarea(id, label, value = "") {
  return `<div class="field expense-remarks-field"><label>${label}</label><textarea id="${id}" rows="2">${escapeHtml(value)}</textarea></div>`;
}

function expenseAttachmentField(expense) {
  const name = expense?.attachment?.name || expense?.attachmentName || "";
  return `
    <div class="field expense-attachment-field">
      <label>Attachment</label>
      <label class="upload-drop"><span>${transactionIcon("file")}</span><input id="expenseAttachment" type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,application/pdf,image/jpeg,image/png,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"><strong>${name ? `Current: ${escapeHtml(name)}` : "Drag and drop a file here or click to browse"}</strong><small>PDF, JPG, PNG or Excel - Max 5 MB</small></label>
    </div>
  `;
}

function cashAttachmentField(collection) {
  const name = collection?.attachment?.name || collection?.attachmentName || "";
  return `
    <div class="field expense-attachment-field">
      <label>Attachments</label>
      <label class="upload-drop"><span>${transactionIcon("file")}</span><input id="cashAttachment" type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,application/pdf,image/jpeg,image/png,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"><strong>${name ? `Current: ${escapeHtml(name)}` : "Drag and drop a file here or click to browse"}</strong><small>PDF, JPG, PNG or Excel - Max 5 MB</small></label>
    </div>
  `;
}

function expenseDateField(id, label, value) {
  return expenseInput(id, label, value, "date");
}

function expenseSelect(id, label, options, value = "") {
  return `<div class="field"><label>${label}</label><select id="${id}">${options.map((option) => `<option value="${escapeHtml(option)}" ${String(option) === String(value) ? "selected" : ""}>${escapeHtml(option || "Select")}</option>`).join("")}</select></div>`;
}

function expenseItemField(value = "") {
  return `
    <div class="field expense-item-field cash-received-from-field">
      <label>Particulars / Expense Item</label>
      <div class="expense-item-combo">
        <select id="expenseParticularsEntry">${state.expenseItems.map((item) => `<option value="${escapeHtml(item)}" ${item === value ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select>
        <button class="secondary-button" id="manageExpenseItems" type="button">Manage Items</button>
      </div>
    </div>
    ${state.filters.manageExpenseItemsOpen === "Yes" ? renderExpenseItemManager() : ""}
  `;
}

function renderExpenseItemManager() {
  return `
    <div class="modal-backdrop soft-modal-backdrop">
      <div class="modal-card expense-item-manager">
        <div class="expense-card-head">
          <h3>Manage Expense Items</h3>
          <p>Add or remove unused expense items</p>
        </div>
        <div class="expense-item-manager-grid">
          <input id="newExpenseItem" placeholder="New expense item">
          <button class="primary-button" id="addExpenseItemNow" type="button">Add Item</button>
        </div>
        <div class="expense-item-list">
          ${(state.expenseItems || []).map((item) => `<button class="mini-button" data-select-expense-item="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("")}
        </div>
        <div class="drawer-actions">
          <button class="secondary-button" id="removeExpenseItemNow" type="button">Remove Selected</button>
          <button class="secondary-button" id="closeExpenseItemManager" type="button">Close</button>
        </div>
      </div>
    </div>
  `;
}

function cashReceivedFromField(value = "") {
  const options = cashReceivedFromOptions(value);
  return `
    <div class="field expense-item-field">
      <label>Received From</label>
      <div class="expense-item-combo">
        <select id="cashReceivedFrom"><option value="">Select client/source</option>${options.map((item) => `<option value="${escapeHtml(item)}" ${item === value ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select>
        <input id="newCashReceivedFrom" placeholder="New client / source">
        <button class="secondary-button" id="addCashReceivedFrom" type="button">Add</button>
      </div>
    </div>
  `;
}

function cashReceivedFromOptions(currentValue = "") {
  const staffNames = new Set((state.users || []).map((user) => normalizePersonName(user.name)).filter(Boolean));
  return sortList([
    "CA Sadique",
    currentValue,
    ...(state.otherCashCollectionSources || []),
    ...(state.files || []).map((file) => file.name),
  ].map(properCaseName).filter((name) => name && (name === "CA Sadique" || !staffNames.has(normalizePersonName(name)))));
}

function collectionParticularsSelect(value = "Fee Collection") {
  const options = ["Fee Collection", "Tax Collection", "Tax & Fee Collection", "Other Collections", "Expense Reimbursement"];
  const selected = value || "Fee Collection";
  const list = options.includes(selected) ? options : [selected, ...options];
  return `<div class="field particulars-field"><label>Particulars</label><select id="cashParticularsEntry">${list.map((item) => `<option value="${escapeHtml(item)}" ${item === selected ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select></div>`;
}

function expenseFilterInput(key, label, type = "text") {
  return `<div class="field"><label>${label}</label><input data-expense-filter="${key}" type="${type}" ${type === "date" ? `max="9999-12-31"` : ""} value="${escapeHtml(state.filters[key] || "")}"></div>`;
}

function expenseFilterSelect(key, label, options) {
  return `<div class="field"><label>${label}</label><select data-expense-filter="${key}">${options.map((option) => `<option value="${escapeHtml(option)}" ${state.filters[key] === option ? "selected" : ""}>${escapeHtml(option || "All")}</option>`).join("")}</select></div>`;
}

function bindExpensePage() {
  document.querySelectorAll("[data-expense-tab]").forEach((btn) => {
    btn.onclick = () => {
      state.filters.expenseTab = btn.dataset.expenseTab;
      saveState();
      renderAll();
    };
  });
  document.querySelectorAll("[data-expense-filter]").forEach((input) => {
    input.oninput = () => {
      state.filters[input.dataset.expenseFilter] = input.value;
    };
    input.onchange = input.oninput;
  });
  const expenseForm = document.querySelector("#expenseForm");
  if (expenseForm) expenseForm.onsubmit = saveExpenseEntry;
  const openingForm = document.querySelector("#openingBalanceForm");
  if (openingForm) openingForm.onsubmit = saveOpeningBalance;
  document.querySelector("#resetOpeningBalanceForm")?.addEventListener("click", () => {
    document.querySelector("#openingBalanceForm")?.reset();
  });
  const cashForm = document.querySelector("#cashCollectionForm");
  if (cashForm) cashForm.onsubmit = saveCashCollectionEntry;
  document.querySelector("#cancelExpenseEdit")?.addEventListener("click", () => { state.filters.editExpenseId = ""; saveState(); renderAll(); });
  document.querySelector("#cancelCashEdit")?.addEventListener("click", () => { state.filters.editCashId = ""; saveState(); renderAll(); });
  document.querySelector("#resetExpenseForm")?.addEventListener("click", () => { state.filters.editExpenseId = ""; saveState(); renderAll(); });
  document.querySelector("#resetCashForm")?.addEventListener("click", () => { state.filters.editCashId = ""; saveState(); renderAll(); });
  document.querySelector("#manageExpenseItems")?.addEventListener("click", () => { state.filters.manageExpenseItemsOpen = "Yes"; saveState(); renderAll(); });
  document.querySelector("#closeExpenseItemManager")?.addEventListener("click", () => { state.filters.manageExpenseItemsOpen = ""; saveState(); renderAll(); });
  document.querySelector("#addExpenseItemNow")?.addEventListener("click", addExpenseItem);
  document.querySelector("#removeExpenseItemNow")?.addEventListener("click", removeExpenseItem);
  document.querySelectorAll("[data-select-expense-item]").forEach((btn) => btn.onclick = () => {
    const input = document.querySelector("#newExpenseItem");
    if (input) input.value = btn.dataset.selectExpenseItem || "";
  });
  document.querySelectorAll("[data-transaction-page]").forEach((btn) => {
    btn.onclick = () => {
      activePage = btn.dataset.transactionPage;
      saveState();
      renderAll();
    };
  });
  document.querySelector("#transactionImportShortcut")?.addEventListener("click", () => document.querySelector("#importExcel")?.click());
  document.querySelector("#transactionExportShortcut")?.addEventListener("click", () => {
    const tab = state.filters.expenseTab || "collections";
    if (tab === "expenses") return exportExpenseExcel();
    if (tab === "balance") return exportBalanceExcel();
    return exportCashExcel();
  });
  document.querySelector("#addCashReceivedFrom")?.addEventListener("click", addCashReceivedFromSource);
  document.querySelector("#expenseSearch")?.addEventListener("click", () => { saveState(); renderAll(); });
  document.querySelector("#expenseReset")?.addEventListener("click", resetExpenseFilters);
  document.querySelector("#cashSearch")?.addEventListener("click", () => { saveState(); renderAll(); });
  document.querySelector("#cashReset")?.addEventListener("click", resetCashFilters);
  document.querySelector("#balanceSearch")?.addEventListener("click", () => { saveState(); renderAll(); });
  document.querySelector("#balanceReset")?.addEventListener("click", resetBalanceFilters);
  document.querySelector("#expenseExcel")?.addEventListener("click", exportExpenseExcel);
  document.querySelector("#expensePdf")?.addEventListener("click", exportExpensePdf);
  document.querySelector("#expensePrint")?.addEventListener("click", printExpenseReport);
  document.querySelector("#cashExcel")?.addEventListener("click", exportCashExcel);
  document.querySelector("#cashPdf")?.addEventListener("click", exportCashPdf);
  document.querySelector("#cashPrint")?.addEventListener("click", printCashReport);
  document.querySelector("#balanceExcel")?.addEventListener("click", exportBalanceExcel);
  document.querySelector("#balancePdf")?.addEventListener("click", exportBalancePdf);
  document.querySelector("#balancePrint")?.addEventListener("click", printBalanceReport);
  document.querySelectorAll("[data-view-expense]").forEach((btn) => btn.onclick = () => viewTransactionDetail("Expense", (state.expenses || []).find((item) => item.id === btn.dataset.viewExpense)));
  document.querySelectorAll("[data-view-cash]").forEach((btn) => btn.onclick = () => viewTransactionDetail("Collection", (state.otherCashCollections || []).find((item) => item.id === btn.dataset.viewCash)));
  document.querySelectorAll("[data-edit-expense]").forEach((btn) => btn.onclick = () => { state.filters.editExpenseId = btn.dataset.editExpense; saveState(); renderAll(); });
  document.querySelectorAll("[data-delete-expense]").forEach((btn) => btn.onclick = () => deleteExpense(btn.dataset.deleteExpense));
  document.querySelectorAll("[data-delete-opening]").forEach((btn) => btn.onclick = () => deleteOpeningBalance(btn.dataset.deleteOpening));
  document.querySelectorAll("[data-edit-cash]").forEach((btn) => btn.onclick = () => { state.filters.editCashId = btn.dataset.editCash; saveState(); renderAll(); });
  document.querySelectorAll("[data-delete-cash]").forEach((btn) => btn.onclick = () => deleteCashCollection(btn.dataset.deleteCash));
}

async function saveExpenseEntry(event) {
  event.preventDefault();
  const submitButton = event.submitter || document.querySelector("#expenseForm button[type='submit']");
  if (submitButton?.disabled) return;
  if (submitButton) submitButton.disabled = true;
  const amount = Number(document.querySelector("#expenseAmount")?.value || 0);
  if (!amount) {
    if (submitButton) submitButton.disabled = false;
    return toast("Please enter expense amount.");
  }
  const existing = editingExpense();
  const uploadedAttachment = await readExpenseAttachment(document.querySelector("#expenseAttachment")?.files?.[0]);
  const attachment = uploadedAttachment || existing?.attachment || null;
  const record = {
    ...(existing || {}),
    id: existing?.id || crypto.randomUUID(),
    date: document.querySelector("#expenseDate")?.value || existing?.date || todayDate(),
    particulars: document.querySelector("#expenseParticularsEntry").value,
    voucherNo: document.querySelector("#expenseVoucherNo").value.trim(),
    amount,
    mode: document.querySelector("#expenseMode").value,
    category: document.querySelector("#expenseCategory")?.value || existing?.category || "General",
    paidTo: document.querySelector("#expensePaidTo").value.trim(),
    remarks: document.querySelector("#expenseRemarks").value.trim(),
    createdBy: document.querySelector("#expenseEnteredBy")?.value.trim() || existing?.createdBy || state.currentUser || "",
    enteredBy: document.querySelector("#expenseEnteredBy")?.value.trim() || existing?.enteredBy || state.currentUser || "",
    attachment,
    attachmentName: attachment?.name || existing?.attachmentName || "",
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  if (isSupabaseMode()) {
    try {
      await saveExpenseToApi(record);
      rememberExpenseItem(record.particulars);
      state.filters.editExpenseId = "";
      toast(existing ? "Expense updated and synced" : "Expense saved and synced");
      renderAll();
      return;
    } catch (error) {
      console.error("Expense save failed", { id: record.id, message: error.message });
      return toast(`Expense save failed: ${error.message || "Please retry."}`);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }
  state.expenses = existing ? state.expenses.map((item) => item.id === existing.id ? record : item) : [record, ...(state.expenses || [])];
  rememberExpenseItem(record.particulars);
  state.filters.editExpenseId = "";
  saveState();
  toast(existing ? "Expense updated" : "Expense saved");
  renderAll();
}

async function saveOpeningBalance(event) {
  event.preventDefault();
  if (state.currentRole !== "Admin") return toast("Only Admin can add opening balances.");
  const amount = Number(document.querySelector("#openingAmount")?.value || 0);
  const date = document.querySelector("#openingDate")?.value || todayDate();
  if (!date) return toast("Select opening balance date.");
  if (Number.isNaN(amount)) return toast("Enter opening balance amount.");
  const existing = (state.openingBalances || []).find((item) => item.date === date);
  if (existing && !confirm("Opening balance already exists for this date. Update it?")) return;
  const now = new Date().toISOString();
  const record = {
    ...(existing || {}),
    id: existing?.id || crypto.randomUUID(),
    particulars: "Opening Cash Balance",
    date,
    balance_date: date,
    amount,
    opening_balance: amount,
    enteredBy: existing?.enteredBy || state.currentUser || "",
    entered_by_user_name: existing?.entered_by_user_name || state.currentUser || "",
    createdAt: existing?.createdAt || now,
    created_at: existing?.created_at || now,
    updatedAt: now,
    updated_at: now,
  };
  if (isSupabaseMode()) {
    try {
      await saveOpeningBalanceToApi(record);
      toast(existing ? "Opening balance updated and synced" : "Opening balance saved and synced");
      renderAll();
      return;
    } catch (error) {
      console.error("Opening balance save failed", { message: error.message });
      return toast(`Opening balance save failed: ${error.message || "Please retry."}`);
    }
  }
  state.openingBalances = existing
    ? (state.openingBalances || []).map((item) => item.id === existing.id ? record : item)
    : [record, ...(state.openingBalances || [])];
  saveState();
  toast(existing ? "Opening balance updated" : "Opening balance added");
  renderAll();
}

async function deleteOpeningBalance(id) {
  if (state.currentRole !== "Admin") return toast("Only Admin can delete opening balances.");
  if (!confirm("Delete this opening balance?")) return;
  if (isSupabaseMode()) {
    try {
      await deleteOpeningBalanceFromApi(id);
      toast("Opening balance deleted and synced");
      renderAll();
      return;
    } catch (error) {
      console.error("Opening balance delete failed", { id, message: error.message });
      return toast(`Opening balance delete failed: ${error.message || "Please retry."}`);
    }
  }
  state.openingBalances = (state.openingBalances || []).filter((item) => item.id !== id);
  saveState();
  renderAll();
}

function readExpenseAttachment(file) {
  if (!file) return Promise.resolve(null);
  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  const extensionAllowed = /\.(pdf|jpg|jpeg|png|xls|xlsx)$/i.test(file.name);
  if (!allowed.includes(file.type) && !extensionAllowed) {
    toast("Attach PDF, JPG, PNG or Excel files only.");
    return Promise.resolve(null);
  }
  if (file.size > 5 * 1024 * 1024) {
    toast("Attachment must be below 5 MB.");
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
    reader.onerror = () => {
      toast("Could not read the attachment.");
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}

async function saveCashCollectionEntry(event) {
  event.preventDefault();
  const submitButton = event.submitter || document.querySelector("#cashCollectionForm button[type='submit']");
  if (submitButton?.disabled) return;
  if (submitButton) submitButton.disabled = true;
  const amount = Number(document.querySelector("#cashAmount")?.value || 0);
  if (!amount) {
    if (submitButton) submitButton.disabled = false;
    return toast("Please enter collection amount.");
  }
  const existing = editingCashCollection();
  const uploadedAttachment = await readExpenseAttachment(document.querySelector("#cashAttachment")?.files?.[0]);
  const attachment = uploadedAttachment || existing?.attachment || null;
  const record = {
    ...(existing || {}),
    id: existing?.id || crypto.randomUUID(),
    date: document.querySelector("#cashDate").value || todayDate(),
    collectionType: normalizeCollectionType(document.querySelector("#cashCollectionType")?.value || existing?.collectionType || existing?.collection_type || ""),
    collection_type: normalizeCollectionType(document.querySelector("#cashCollectionType")?.value || existing?.collectionType || existing?.collection_type || ""),
    particulars: document.querySelector("#cashParticularsEntry").value.trim(),
    voucherNo: document.querySelector("#cashVoucherNo").value.trim(),
    amount,
    mode: document.querySelector("#cashModeEntry").value,
    receivedFrom: properCaseName(document.querySelector("#newCashReceivedFrom")?.value.trim() || document.querySelector("#cashReceivedFrom").value.trim()),
    remarks: document.querySelector("#cashRemarks")?.value.trim() || existing?.remarks || "",
    createdBy: document.querySelector("#cashCollectedBy")?.value.trim() || existing?.createdBy || state.currentUser || "",
    enteredBy: document.querySelector("#cashCollectedBy")?.value.trim() || existing?.enteredBy || state.currentUser || "",
    attachment,
    attachmentName: attachment?.name || existing?.attachmentName || "",
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  if (isSupabaseMode()) {
    try {
      await saveCashCollectionToApi(record);
      rememberCashReceivedFrom(record.receivedFrom);
      state.filters.editCashId = "";
      toast(existing ? "Cash collection updated and synced" : "Cash collection saved and synced");
      renderAll();
      return;
    } catch (error) {
      console.error("Collection save failed", { id: record.id, message: error.message });
      return toast(`Collection save failed: ${error.message || "Please retry."}`);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }
  rememberCashReceivedFrom(record.receivedFrom);
  state.otherCashCollections = existing ? state.otherCashCollections.map((item) => item.id === existing.id ? record : item) : [record, ...(state.otherCashCollections || [])];
  state.filters.editCashId = "";
  saveState();
  toast(existing ? "Cash collection updated" : "Cash collection saved");
  renderAll();
}

function editingExpense() {
  return (state.expenses || []).find((item) => item.id === state.filters.editExpenseId);
}

function editingCashCollection() {
  return (state.otherCashCollections || []).find((item) => item.id === state.filters.editCashId);
}

function addExpenseItem() {
  const value = document.querySelector("#newExpenseItem")?.value.trim();
  if (!value) return toast("Enter expense item name.");
  rememberExpenseItem(value);
  saveState();
  toast("Expense item added");
  renderAll();
}

function removeExpenseItem() {
  const value = document.querySelector("#newExpenseItem")?.value.trim() || document.querySelector("#expenseParticularsEntry")?.value;
  if (!value) return toast("Select or enter expense item to remove.");
  const used = (state.expenses || []).some((item) => String(item.particulars || "").trim().toLowerCase() === value.toLowerCase());
  if (used) return toast("This expense item is already used in entries and cannot be removed.");
  state.expenseItems = (state.expenseItems || []).filter((item) => item.toLowerCase() !== value.toLowerCase());
  saveState();
  toast("Expense item removed");
  renderAll();
}

function handleExpenseItemAction(event) {
  const action = event.target.value;
  if (action === "add") addExpenseItem();
  if (action === "remove") removeExpenseItem();
  event.target.value = "";
}

function viewTransactionDetail(type, item) {
  if (!item) return toast("Transaction record not found.");
  const parts = [
    `${type}: ${item.particulars || collectionTypeLabel(item.collectionType || item.collection_type) || ""}`,
    `Date: ${expenseDisplayDate(item.date)}`,
    `Amount: ${money(item.amount)}`,
    `Mode: ${item.mode || ""}`,
    item.receivedFrom ? `Received From: ${item.receivedFrom}` : "",
    item.paidTo ? `Paid To: ${item.paidTo}` : "",
    item.voucherNo ? `Reference: ${item.voucherNo}` : "",
  ].filter(Boolean);
  alert(parts.join("\n"));
}

function rememberExpenseItem(value) {
  if (!value) return;
  state.expenseItems = sortList([...(state.expenseItems || []), value]);
}

function addCashReceivedFromSource() {
  const value = properCaseName(document.querySelector("#newCashReceivedFrom")?.value.trim());
  if (!value) return toast("Enter received from name.");
  rememberCashReceivedFrom(value);
  saveState();
  toast("Received from name added");
  renderAll();
}

function rememberCashReceivedFrom(value) {
  if (!value) return;
  state.otherCashCollectionSources = sortList([...(state.otherCashCollectionSources || []), properCaseName(value)]);
}

async function deleteExpense(id) {
  if (!confirm("Delete this expense entry?")) return;
  if (isSupabaseMode()) {
    try {
      await deleteExpenseFromApi(id);
      toast("Expense deleted and synced");
      renderAll();
      return;
    } catch (error) {
      console.error("Expense delete failed", { id, message: error.message });
      return toast(`Expense delete failed: ${error.message || "Please retry."}`);
    }
  }
  state.expenses = (state.expenses || []).filter((item) => item.id !== id);
  saveState();
  renderAll();
}

async function deleteCashCollection(id) {
  if (!confirm("Delete this cash collection entry?")) return;
  if (isSupabaseMode()) {
    try {
      await deleteCashCollectionFromApi(id);
      toast("Cash collection deleted and synced");
      renderAll();
      return;
    } catch (error) {
      console.error("Collection delete failed", { id, message: error.message });
      return toast(`Collection delete failed: ${error.message || "Please retry."}`);
    }
  }
  state.otherCashCollections = (state.otherCashCollections || []).filter((item) => item.id !== id);
  saveState();
  renderAll();
}

function expenseSearchActive() {
  return ["expenseFrom", "expenseTo", "expenseParticulars", "expensePaidTo"].some((key) => state.filters[key]);
}

function cashSearchActive() {
  return ["cashFrom", "cashTo", "cashParticulars", "cashMode", "cashCollectionTypeFilter", "cashCollectedByFilter"].some((key) => state.filters[key]);
}

function filteredExpenses() {
  return (state.expenses || []).filter((item) => {
    if (state.filters.expenseFrom && item.date < state.filters.expenseFrom) return false;
    if (state.filters.expenseTo && item.date > state.filters.expenseTo) return false;
    if (state.filters.expenseParticulars && !item.particulars.toLowerCase().includes(state.filters.expenseParticulars.toLowerCase())) return false;
    if (state.filters.expenseItemFilter && !item.particulars.toLowerCase().includes(state.filters.expenseItemFilter.toLowerCase())) return false;
    if (state.filters.expenseMode && item.mode !== state.filters.expenseMode) return false;
    if (state.filters.expenseCategoryFilter && (item.category || "General") !== state.filters.expenseCategoryFilter) return false;
    if (state.filters.expensePaidTo && !item.paidTo.toLowerCase().includes(state.filters.expensePaidTo.toLowerCase())) return false;
    if (state.filters.expenseEnteredBy && !String(item.createdBy || item.enteredBy || "").toLowerCase().includes(state.filters.expenseEnteredBy.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || String(b.voucherNo).localeCompare(String(a.voucherNo)));
}

function filteredCashCollections() {
  return (state.otherCashCollections || []).filter((item) => {
    if (state.filters.cashFrom && item.date < state.filters.cashFrom) return false;
    if (state.filters.cashTo && item.date > state.filters.cashTo) return false;
    if (state.filters.cashParticulars && !item.particulars.toLowerCase().includes(state.filters.cashParticulars.toLowerCase())) return false;
    if (state.filters.cashMode && item.mode !== state.filters.cashMode) return false;
    if (state.filters.cashCollectionTypeFilter && collectionTypeLabel(item.collectionType || item.collection_type) !== state.filters.cashCollectionTypeFilter) return false;
    if (state.filters.cashCollectedByFilter && !String(item.createdBy || item.enteredBy || "").toLowerCase().includes(state.filters.cashCollectedByFilter.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || String(b.voucherNo).localeCompare(String(a.voucherNo)));
}

function renderExpenseTable(rows) {
  if (!rows.length) return empty("No expense entries found.");
  const total = rows.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return `<div class="transaction-table-head"><span>${rows.length} record(s)</span><strong>Total Expenses: ${rupee(total)}</strong></div><div class="table-wrap"><table class="file-table expense-table transaction-table expense-register-table"><thead><tr><th>SN</th><th>Date</th><th class="wide-col expense-item-column">Expense Item</th><th class="wide-col paid-to-column">Paid To</th><th>Mode</th><th class="ref-col voucher-column">Voucher No.</th><th class="amount-col amount-column">Amount</th><th>Entered By</th><th class="action-col">Actions</th></tr></thead><tbody>${rows.map((item, index) => `<tr><td>${index + 1}</td><td class="expense-date-col">${expenseDisplayDate(item.date)}</td><td class="wide-cell expense-item-cell">${escapeHtml(item.particulars)}</td><td class="wide-cell paid-to-cell">${escapeHtml(item.paidTo)}</td><td>${escapeHtml(item.mode)}</td><td class="ref-cell voucher-cell" title="${escapeHtml(item.voucherNo)}">${escapeHtml(item.voucherNo)}</td><td class="amount-cell amount-column">${rupee(item.amount)}</td><td>${escapeHtml(item.createdBy || item.enteredBy || "")}</td><td class="action-col"><button title="View" class="mini-button" data-view-expense="${item.id}">View</button><button title="Edit" class="mini-button" data-edit-expense="${item.id}">Edit</button><button title="Delete" class="mini-button danger" data-delete-expense="${item.id}">Delete</button></td></tr>`).join("")}</tbody></table></div><div class="transaction-table-foot">Showing ${rows.length} newest entr${rows.length === 1 ? "y" : "ies"}</div>`;
}

function expenseAttachmentLink(item) {
  const attachment = item.attachment;
  const name = attachment?.name || item.attachmentName || "";
  if (!name) return "";
  if (attachment?.dataUrl) return `<a class="attachment-link" href="${attachment.dataUrl}" download="${escapeHtml(name)}">${escapeHtml(name)}</a>`;
  return escapeHtml(name);
}

function renderCashCollectionTable(rows) {
  if (!rows.length) return empty("No cash collection entries found.");
  const total = rows.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return `<div class="transaction-table-head"><span>${rows.length} record(s)</span><strong>Total Collections: ${rupee(total)}</strong></div><div class="table-wrap"><table class="file-table expense-table transaction-table collection-register-table"><thead><tr><th>SN</th><th>Date</th><th>Collection Type</th><th>Received From</th><th class="wide-col">Particulars</th><th class="ref-col">Ref No.</th><th>Mode</th><th class="amount-col">Amount</th><th>Collected By</th><th class="action-col">Actions</th></tr></thead><tbody>${rows.map((item, index) => `<tr><td>${index + 1}</td><td class="expense-date-col">${expenseDisplayDate(item.date)}</td><td>${escapeHtml(collectionTypeLabel(item.collectionType || item.collection_type))}</td><td>${escapeHtml(item.receivedFrom)}</td><td class="wide-cell">${escapeHtml(item.particulars)}</td><td class="ref-cell">${escapeHtml(item.voucherNo)}</td><td>${escapeHtml(item.mode)}</td><td class="amount-cell">${rupee(item.amount)}</td><td>${escapeHtml(item.createdBy || item.enteredBy || "")}</td><td class="action-col"><button title="View" class="mini-button" data-view-cash="${item.id}">View</button><button title="Edit" class="mini-button" data-edit-cash="${item.id}">Edit</button><button title="Delete" class="mini-button danger" data-delete-cash="${item.id}">Delete</button></td></tr>`).join("")}</tbody></table></div><div class="transaction-table-foot">Showing ${rows.length} newest entr${rows.length === 1 ? "y" : "ies"}</div>`;
}

function resetExpenseFilters() {
  ["expenseFrom", "expenseTo", "expenseParticulars", "expenseName", "expenseMode", "expenseCategoryFilter", "expenseItemFilter", "expensePaidTo", "expenseEnteredBy", "expenseVoucher"].forEach((key) => state.filters[key] = "");
  saveState();
  renderAll();
}

function resetCashFilters() {
  ["cashFrom", "cashTo", "cashParticulars", "cashMode", "cashCollectionTypeFilter", "cashCollectedByFilter", "cashReceivedFrom", "cashVoucher"].forEach((key) => state.filters[key] = "");
  saveState();
  renderAll();
}

function resetBalanceFilters() {
  state.filters.balanceFrom = "";
  state.filters.balanceTo = "";
  state.filters.balanceMode = "";
  state.filters.balanceEnteredBy = "";
  state.filters.balanceType = "";
  saveState();
  renderAll();
}

function cashBalanceForRange(from = state.filters.balanceFrom || "", to = state.filters.balanceTo || "") {
  const effectiveTo = to || from || todayDate();
  const openingEntry = applicableOpeningBalance(from, effectiveTo);
  const openingDate = openingEntry?.date || "";
  const effectiveFrom = from || openingDate || "";
  const inRange = (date) => (!effectiveFrom || date >= effectiveFrom) && (!effectiveTo || date <= effectiveTo);
  const mode = state.filters.balanceMode || "";
  const modeOk = (itemMode) => !mode || itemMode === mode;
  const opening = Number(openingEntry?.amount ?? state.openingCashBalance ?? 0) || 0;
  const feeCollections = visibleFiles().filter((file) => file.feeReceived && String(file.feeCollectionMode || file.paymentMode || "").toLowerCase() === "cash" && (!mode || mode === "Cash") && inRange(file.feeReceivedDate || file.lastUpdatedDate || "")).reduce((sum, file) => sum + (Number(file.feeReceivedAmount || 0) || 0), 0)
    + (state.otherCashCollections || []).filter((item) => isCollectionType(item, "fee_collection") && item.mode === "Cash" && modeOk(item.mode) && inRange(item.date)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const otherCollections = (state.otherCashCollections || []).filter((item) => !isCollectionType(item, "fee_collection") && item.mode === "Cash" && modeOk(item.mode) && inRange(item.date)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const cashExpenses = (state.expenses || []).filter((item) => item.mode === "Cash" && modeOk(item.mode) && inRange(item.date)).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return { opening, feeCollections, otherCollections, cashExpenses, closing: opening + feeCollections + otherCollections - cashExpenses };
}

function applicableOpeningBalance(from = "", to = todayDate()) {
  const target = from || to || todayDate();
  return [...(state.openingBalances || [])]
    .filter((item) => item.date && item.date <= target)
    .sort((a, b) => b.date.localeCompare(a.date) || String(b.updatedAt || b.updated_at || b.createdAt || "").localeCompare(String(a.updatedAt || a.updated_at || a.createdAt || "")))[0] || null;
}

function cashMovementRows() {
  const from = state.filters.balanceFrom || "";
  const to = state.filters.balanceTo || from || todayDate();
  const openingEntry = applicableOpeningBalance(from, to);
  const effectiveFrom = from || openingEntry?.date || "";
  const inRange = (date) => (!effectiveFrom || date >= effectiveFrom) && (!to || date <= to);
  const enteredByFilter = normalizeImportMatchText(state.filters.balanceEnteredBy || "");
  const typeFilter = state.filters.balanceType || "";
  const rows = [
    ...visibleFiles().filter((file) => file.feeReceived && String(file.feeCollectionMode || file.paymentMode || "").toLowerCase() === "cash" && inRange(file.feeReceivedDate || file.lastUpdatedDate || "")).map((file) => ({
      date: file.feeReceivedDate || file.lastUpdatedDate || "",
      time: "",
      type: "Collection",
      particulars: `Fee Collection - ${file.name || ""}`,
      reference: file.fileNo || file.crNo || "",
      cashIn: Number(file.feeReceivedAmount || 0),
      cashOut: 0,
      enteredBy: file.feeReceivedBy || file.lastUpdatedBy || file.staff || "",
      createdAt: file.updatedAt || file.createdAt || "",
    })),
    ...(state.otherCashCollections || []).filter((item) => item.mode === "Cash" && inRange(item.date)).map((item) => ({
      date: item.date,
      time: item.time || "",
      type: "Collection",
      particulars: `${collectionTypeLabel(item.collectionType || item.collection_type)} - ${item.particulars || item.receivedFrom || ""}`,
      reference: item.voucherNo || "",
      cashIn: Number(item.amount || 0),
      cashOut: 0,
      enteredBy: item.createdBy || item.enteredBy || "",
      createdAt: item.createdAt || item.created_at || "",
    })),
    ...(state.expenses || []).filter((item) => item.mode === "Cash" && inRange(item.date)).map((item) => ({
      date: item.date,
      time: item.time || "",
      type: "Expense",
      particulars: item.particulars || "",
      reference: item.voucherNo || "",
      cashIn: 0,
      cashOut: Number(item.amount || 0),
      enteredBy: item.createdBy || item.enteredBy || "",
      createdAt: item.createdAt || item.created_at || "",
    })),
  ].filter((row) => {
    if (typeFilter && row.type !== typeFilter) return false;
    if (enteredByFilter && !normalizeImportMatchText(row.enteredBy).includes(enteredByFilter)) return false;
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date) || String(a.time || "").localeCompare(String(b.time || "")) || ((Date.parse(a.createdAt || "") || 0) - (Date.parse(b.createdAt || "") || 0)));
  let running = Number(openingEntry?.amount ?? state.openingCashBalance ?? 0) || 0;
  return rows.map((row, index) => {
    running += row.cashIn - row.cashOut;
    return { ...row, sn: index + 1, runningBalance: running };
  });
}

function renderCashMovementTable() {
  const rows = cashMovementRows();
  if (!rows.length) return empty("No cash movement found for the selected range.");
  return `<div class="transaction-table-head"><span>${rows.length} movement(s)</span><strong>Cash Movement</strong></div><div class="table-wrap"><table class="file-table expense-table transaction-table"><thead><tr><th>SN</th><th>Date</th><th>Time</th><th>Transaction Type</th><th>Particulars</th><th>Reference</th><th class="amount-col">Cash In</th><th class="amount-col">Cash Out</th><th class="amount-col">Running Balance</th><th>Entered By</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${row.sn}</td><td>${expenseDisplayDate(row.date)}</td><td>${escapeHtml(row.time || "")}</td><td>${row.type}</td><td>${escapeHtml(row.particulars)}</td><td>${escapeHtml(row.reference)}</td><td class="amount-cell">${row.cashIn ? rupee(row.cashIn) : ""}</td><td class="amount-cell">${row.cashOut ? rupee(row.cashOut) : ""}</td><td class="amount-cell ${Number(row.runningBalance || 0) < 0 ? "negative-amount" : ""}">${rupee(row.runningBalance)}</td><td>${escapeHtml(row.enteredBy)}</td></tr>`).join("")}</tbody></table></div>`;
}

function expenseReportRows(rows = filteredExpenses()) {
  const mapped = rows.map((item, index) => ({ SN: index + 1, Date: expenseDisplayDate(item.date), "Expense Item": item.particulars, "Paid To": item.paidTo, Mode: item.mode, "Voucher No": item.voucherNo, Amount: money(item.amount), "Entered By": item.createdBy || item.enteredBy || "", Remarks: item.remarks }));
  return [...mapped, { SN: "", Date: "", Particulars: "", "V.No": "", "Paid To": "", Mode: "Total", Amount: money(rows.reduce((sum, item) => sum + Number(item.amount || 0), 0)), Remarks: "" }];
}

function cashReportRows(rows = filteredCashCollections()) {
  const mapped = rows.map((item, index) => ({ SN: index + 1, Date: expenseDisplayDate(item.date), "Collection Type": collectionTypeLabel(item.collectionType || item.collection_type), "Received From": item.receivedFrom, Particulars: item.particulars, Mode: item.mode, "Reference No": item.voucherNo, Amount: money(item.amount), "Entered By": item.createdBy || item.enteredBy || "", Remarks: item.remarks }));
  return [...mapped, { SN: "", Date: "", Particulars: "", "V.No": "", "Received From": "", Mode: "Total", Amount: money(rows.reduce((sum, item) => sum + Number(item.amount || 0), 0)), Remarks: "" }];
}

function transactionReportDateLine(fromKey, toKey) {
  const from = state.filters[fromKey] ? displayDate(state.filters[fromKey]) : "All";
  const to = state.filters[toKey] ? displayDate(state.filters[toKey]) : "All";
  return `From Date: ${from}    To Date: ${to}`;
}

function expenseReportTitleLines(title) {
  return ["Muhammad & Associates,", "Chartered Accountants,", title, transactionReportDateLine("expenseFrom", "expenseTo")];
}

function cashCollectionReportTitleLines() {
  return ["Muhammad & Associates,", "Chartered Accountants,", "Cash Collection Report", transactionReportDateLine("cashFrom", "cashTo")];
}

function balanceReportRows() {
  const b = cashBalanceForRange();
  return [
    { Particulars: "Opening Cash Balance", Amount: money(b.opening) },
    { Particulars: "Cash Fee Collections", Amount: money(b.feeCollections) },
    { Particulars: "Other Cash Collections", Amount: money(b.otherCollections) },
    { Particulars: "Cash Expenses", Amount: money(b.cashExpenses) },
    { Particulars: "Closing Cash Balance", Amount: money(b.closing) },
  ];
}

function exportExpenseExcel() { downloadExcelTable("expense-report", expenseReportRows(), expenseReportTitleLines("Expense Report")); }
function exportCashExcel() { downloadExcelTable("cash-collection-report", cashReportRows(), cashCollectionReportTitleLines()); }
function exportBalanceExcel() { downloadExcelTable("cash-balance-report", balanceReportRows()); }
async function exportExpensePdf() { await downloadPdfRows("expense-report", expenseReportRows(), expenseReportTitleLines("Expense Report")); }
async function exportCashPdf() { await downloadPdfRows("cash-collection-report", cashReportRows(), cashCollectionReportTitleLines()); }
async function exportBalancePdf() { await downloadPdfRows("cash-reconciliation-report", balanceReportRows(), ["Muhammad & Associates,", "Chartered Accountants,", "Cash Reconciliation"]); }
function printExpenseReport() {
  printStructuredReport({ title: "Expense Report", subtitle: transactionReportDateLine("expenseFrom", "expenseTo"), sections: [{ title: "Expenses", rows: expenseReportRows() }], format: "print" });
}
function printCashReport() {
  printStructuredReport({ title: "Cash Collection Report", subtitle: transactionReportDateLine("cashFrom", "cashTo"), sections: [{ title: "Collections", rows: cashReportRows() }], format: "print" });
}
function printBalanceReport() {
  printStructuredReport({ title: "Cash Reconciliation", sections: [{ title: "Summary", rows: balanceReportRows() }, { title: "Cash Movement", rows: cashMovementRows().map((row) => ({ SN: row.sn, Date: expenseDisplayDate(row.date), Time: row.time || "", Type: row.type, Particulars: row.particulars, Reference: row.reference, "Cash In": money(row.cashIn), "Cash Out": money(row.cashOut), "Running Balance": money(row.runningBalance), "Entered By": row.enteredBy })) }], format: "print" });
}

function expenseDisplayDate(date) {
  const normalized = normalizeImportDate(date);
  return normalized ? normalized.split("-").reverse().join(".") : "";
}

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function addAuditLog(action, details = {}) {
  state.auditLog = [
    ...(state.auditLog || []),
    {
      id: crypto.randomUUID(),
      action,
      details,
      user: state.currentUser || "CA Sadique",
      role: state.currentRole || "",
      at: new Date().toISOString(),
    },
  ].slice(-1000);
}

function dailyReportDate() {
  return state.filters.dailyReportDate || todayDate();
}

function dailyCompletedFiles(date = dailyReportDate()) {
  const seen = new Set();
  return visibleFiles()
    .filter((file) => isCheckedCompleted(file) && normalizeImportDate(workCompletedDate(file)) === date)
    .filter((file) => {
      const key = file.id || `${file.name}|${file.pan}|${file.serviceType}|${workCompletedDate(file)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => fileSerialSortValue(a) - fileSerialSortValue(b));
}

function dailyNewWorkFiles(date = dailyReportDate()) {
  const seen = new Set();
  return visibleFiles()
    .filter((file) => normalizeImportDate(file.fileReceivedDate) === date)
    .filter((file) => {
      const key = file.id || `${file.name}|${file.pan}|${file.serviceType}|${file.fileReceivedDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => fileSerialSortValue(a) - fileSerialSortValue(b));
}

function dailyVisitors(date = dailyReportDate()) {
  const seen = new Set();
  return (state.visitors || [])
    .filter((visitor) => visitor.date === date)
    .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))
    .filter((visitor) => {
      const key = visitor.id || `${visitor.date}|${visitor.visitorName}|${visitor.purpose}|${visitor.metWhom}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function dailyCompletedRows(date = dailyReportDate()) {
  return dailyCompletedFiles(date).map((file, index) => ({
    SN: index + 1,
    Name: file.name,
    "Type of Service": file.serviceType,
    "C/o": file.careOf || "Direct",
    "Work Done By": workDoneBy(file),
    "Checked By": file.checkedBy || "",
  }));
}

function dailyNewWorkRows(date = dailyReportDate()) {
  return dailyNewWorkFiles(date).map((file, index) => ({
    SN: index + 1,
    Name: file.name,
    "Type of Service": file.serviceType,
    "C/o": file.careOf || "Direct",
    "Assigned To": file.assignedStaff || "Not Assigned",
  }));
}

function dailyVisitorRows(date = dailyReportDate()) {
  return dailyVisitors(date).map((visitor, index) => ({
    SN: index + 1,
    "Visitor Name": visitor.visitorName || visitor.visitor_name || visitor.name || "",
    "Mobile No": visitor.mobileNumber || visitor.mobile_number || "",
    Company: visitor.company || visitor.company_or_organisation || "",
    Purpose: visitor.purpose || "",
    Time: visitor.visitTime || visitor.visit_time || "",
    Met: visitor.metWhom || visitor.met_whom || "",
  }));
}

function dailyVisitorPdfRows(date = dailyReportDate()) {
  return dailyVisitors(date).map((visitor, index) => ({
    SN: index + 1,
    "Visitor Name": visitor.visitorName || visitor.visitor_name || visitor.name || "",
    "Mobile No": visitor.mobileNumber || visitor.mobile_number || "",
    Company: visitor.company || visitor.company_or_organisation || "",
    Purpose: visitor.purpose || "",
    Time: visitor.visitTime || visitor.visit_time || "",
    Met: visitor.metWhom || visitor.met_whom || "",
  }));
}

function dailyExpenseRows(date = dailyReportDate()) {
  return (state.expenses || [])
    .filter((expense) => normalizeImportDate(expense.date) === date)
    .sort((a, b) => String(a.particulars || "").localeCompare(String(b.particulars || "")))
    .map((expense, index) => ({
    SN: index + 1,
    "Received from": expense.paidTo || expense.paid_to || "",
    Particulars: expense.particulars || "",
    "Ref No": expense.voucherNo || expense.voucher_number || "",
    Mode: expense.mode || "",
    Amount: money(expense.amount),
    "Collected By": expense.createdBy || expense.enteredBy || expense.entered_by_user_name || "",
    }));
}

function dailyExpensePdfRows(date = dailyReportDate()) {
  return (state.expenses || [])
    .filter((expense) => normalizeImportDate(expense.date || expense.expense_date) === date)
    .sort((a, b) => String(a.particulars || a.expense_item || "").localeCompare(String(b.particulars || b.expense_item || "")))
    .map((expense, index) => ({
      SN: index + 1,
      "Received from": expense.paidTo || expense.paid_to || "",
      Particulars: expense.expense_item || expense.particulars || "",
      "Ref No": expense.voucherNo || expense.voucher_number || "",
      Mode: expense.mode || expense.payment_mode || "",
      Amount: dailyPdfMoney(expense.amount),
      "Collected By": expense.createdBy || expense.enteredBy || expense.entered_by_user_name || "",
    }));
}

function dailyPdfMoney(value) {
  return `Rs. ${money(value)}`;
}

function dailyCollectionRows(date = dailyReportDate()) {
  return (state.otherCashCollections || [])
    .filter((collection) => normalizeImportDate(collection.date) === date)
    .sort((a, b) => String(a.receivedFrom || a.particulars || "").localeCompare(String(b.receivedFrom || b.particulars || "")))
    .map((collection, index) => ({
      SN: index + 1,
      "Received from": collection.receivedFrom || collection.particulars || "",
      Particulars: collection.particulars || "",
      "Ref No": collection.voucherNo || "",
      Mode: collection.mode || "",
      Amount: money(collection.amount),
      "Collected By": collection.createdBy || collection.enteredBy || "",
    }));
}

function workDoneBy(file) {
  return sortList([file.assignedStaff, file.reAssignedStaff].filter((name) => hasAssignedStaffValue(name))).join(", ") || file.assignedStaff || "";
}

function renderDailyReportPage() {
  const page = document.querySelector("#dailyReport");
  if (!page) return;
  if (!canUseVisitorModules()) {
    page.innerHTML = `<div class="permission-note">Daily Report is available only for Admin and Manager logins.</div>`;
    return;
  }
  const date = dailyReportDate();
  const newWorkRows = dailyNewWorkRows(date);
  const completedRows = dailyCompletedRows(date);
  const visitorRows = dailyVisitorRows(date);
  const collectionRows = dailyCollectionRows(date);
  const expenseRows = dailyExpenseRows(date);
  page.innerHTML = `
    <div class="panel daily-report-panel">
      <div class="daily-report-head">
        <div>
          <h3>Daily Report M&amp;A - ${displayDate(date)}</h3>
          <p>New work, completed files and visitors for the selected date.</p>
        </div>
        <div class="daily-report-actions">
          <button class="secondary-button" id="dailyReportPdf" ${rolePerm().export ? "" : "disabled"}>Export to PDF</button>
          <button class="secondary-button" id="dailyReportExcel" ${rolePerm().export ? "" : "disabled"}>Export to Excel</button>
          <button class="secondary-button" id="dailyReportPrint">Print</button>
          <button class="secondary-button" id="dailyReportRefresh">Refresh</button>
        </div>
      </div>
      <div class="field daily-date-field">
        <label>Report Date</label>
        <input type="date" id="dailyReportDate" max="9999-12-31" value="${date}">
      </div>
      ${renderDailySection("New Work Came", newWorkRows, ["SN", "Name", "Type of Service", "C/o", "Assigned To"], `Total New Work Received: ${newWorkRows.length}`, "No new work was received on the selected date.")}
      ${renderDailySection("Completed Files", completedRows, ["SN", "Name", "Type of Service", "C/o", "Work Done By", "Checked By"], `Total Completed Files: ${completedRows.length}`, "No files were completed on the selected date.")}
      ${renderDailySection("Visitors List", visitorRows, ["SN", "Visitor Name", "Mobile No", "Company", "Purpose", "Time", "Met"], `Total Visitors: ${visitorRows.length}`, "No visitors were recorded on the selected date.")}
      ${renderDailySection("Collections", collectionRows, ["SN", "Received from", "Particulars", "Ref No", "Mode", "Amount", "Collected By"], `Total Collections: ${money(collectionRows.reduce((sum, row) => sum + Number(String(row.Amount).replace(/,/g, "") || 0), 0))}`, "No collections were recorded on the selected date.")}
      ${renderDailySection("Expense Report", expenseRows, ["SN", "Received from", "Particulars", "Ref No", "Mode", "Amount", "Collected By"], `Total Expenses: ${money(expenseRows.reduce((sum, row) => sum + Number(String(row.Amount).replace(/,/g, "") || 0), 0))}`, "No expenses were recorded on the selected date.")}
    </div>
  `;
  bindDailyReportPage(date, newWorkRows, completedRows, visitorRows, collectionRows, expenseRows);
}

function renderDailySection(title, rows, headers, totalText, emptyText) {
  return `
    <section class="daily-report-section">
      <h3>${title}</h3>
      ${rows.length ? `
        <div class="table-wrap file-table-wrap">
          <table class="file-table file-table-compact daily-report-table">
            <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
            <tbody>${rows.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody>
          </table>
        </div>
      ` : `<div class="empty">${emptyText}</div>`}
      <p class="daily-report-total">${totalText}</p>
    </section>
  `;
}

function bindDailyReportPage(date, newWorkRows, completedRows, visitorRows, collectionRows, expenseRows) {
  document.querySelector("#dailyReportDate").onchange = (event) => {
    state.filters.dailyReportDate = event.target.value || todayDate();
    saveState();
    renderDailyReportPage();
  };
  document.querySelector("#dailyReportRefresh").onclick = () => {
    syncSharedState(localStorage.getItem(STORAGE_KEY), false);
    renderDailyReportPage();
    toast("Daily Report refreshed");
  };
  document.querySelector("#dailyReportPdf").onclick = (event) => exportDailyReport("PDF", date, newWorkRows, completedRows, visitorRows, collectionRows, expenseRows, event.currentTarget);
  document.querySelector("#dailyReportExcel").onclick = (event) => exportDailyReport("Excel", date, newWorkRows, completedRows, visitorRows, collectionRows, expenseRows, event.currentTarget);
  document.querySelector("#dailyReportPrint").onclick = (event) => exportDailyReport("Print", date, newWorkRows, completedRows, visitorRows, collectionRows, expenseRows, event.currentTarget);
}

async function exportDailyReport(format, date = dailyReportDate(), newWorkRows = dailyNewWorkRows(date), completedRows = dailyCompletedRows(date), visitorRows = dailyVisitorRows(date), collectionRows = dailyCollectionRows(date), expenseRows = dailyExpenseRows(date), button = null) {
  if (!rolePerm().export) return toast("This role cannot export data.");
  if (button?.disabled) return;
  const originalText = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = format === "Excel" ? "Preparing Excel..." : (format === "PDF" ? "Preparing PDF..." : "Preparing Print...");
  }
  const title = `Daily Report M&A - ${displayDate(date)}`;
  const pdfTitle = `Daily Report - ${displayDate(date)}`;
  try {
    if (format === "Excel") {
      await downloadDailyReportWorkbook(date, newWorkRows, completedRows, visitorRows, collectionRows, expenseRows);
      addAuditLog("Daily Report exported", { reportDate: date, format, newWork: newWorkRows.length, completedFiles: completedRows.length, visitors: visitorRows.length, collections: collectionRows.length, expenses: expenseRows.length });
      saveState();
      toast("Daily Report Excel downloaded");
      return;
    }
    const pdfSections = [
      { title: "Completed Files", rows: completedRows, total: `Total Completed Files: ${completedRows.length}`, empty: "No files were completed on the selected date." },
      { title: "New Work Came", rows: newWorkRows, total: `Total New Work Received: ${newWorkRows.length}`, empty: "No new work was received on the selected date." },
      { title: "Visitors List", rows: dailyVisitorPdfRows(date), total: `Total Visitors: ${visitorRows.length}`, empty: "No visitor records for the selected date.", columnStyles: dailyVisitorPdfColumnStyles() },
      { title: "Expense Report", rows: dailyExpensePdfRows(date), total: `Total Expenses: ${dailyPdfMoney((state.expenses || []).filter((expense) => normalizeImportDate(expense.date || expense.expense_date) === date).reduce((sum, expense) => sum + Number(expense.amount || 0), 0))}`, empty: "No expense records for the selected date.", columnStyles: dailyExpensePdfColumnStyles(), rightAlign: ["Amount"] },
      { title: "Collections", rows: collectionRows, total: `Total Collections: ${money(collectionRows.reduce((sum, row) => sum + Number(String(row.Amount).replace(/,/g, "") || 0), 0))}`, empty: "No collections were recorded on the selected date." },
    ];
    if (format === "PDF") {
      await downloadDailyReportPdf(date, pdfSections, pdfTitle);
      addAuditLog("Daily Report exported", { reportDate: date, format, newWork: newWorkRows.length, completedFiles: completedRows.length, visitors: visitorRows.length, collections: collectionRows.length, expenses: expenseRows.length });
      saveState();
      toast("Daily Report PDF downloaded");
      return;
    }
    const sections = [
      { title: "New Work Came", rows: newWorkRows, total: `Total New Work Received: ${newWorkRows.length}`, empty: "No new work was received on the selected date." },
      { title: "Completed Files", rows: completedRows, total: `Total Completed Files: ${completedRows.length}`, empty: "No files were completed on the selected date." },
      { title: "Visitors List", rows: visitorRows, total: `Total Visitors: ${visitorRows.length}`, empty: "No visitors were recorded on the selected date." },
      { title: "Collections", rows: collectionRows, total: `Total Collections: ${money(collectionRows.reduce((sum, row) => sum + Number(String(row.Amount).replace(/,/g, "") || 0), 0))}`, empty: "No collections were recorded on the selected date." },
      { title: "Expense Report", rows: expenseRows, total: `Total Expenses: ${money(expenseRows.reduce((sum, row) => sum + Number(String(row.Amount).replace(/,/g, "") || 0), 0))}`, empty: "No expenses were recorded on the selected date." },
    ];
    const opened = printStructuredReport({
      title,
      sections,
      format,
      showPrintAction: format === "Print",
    });
    if (opened) {
      addAuditLog("Daily Report exported", { reportDate: date, format, newWork: newWorkRows.length, completedFiles: completedRows.length, visitors: visitorRows.length, collections: collectionRows.length, expenses: expenseRows.length });
      saveState();
      toast("Daily Report opened in a new tab");
    }
  } catch (error) {
    toast(error.message || "Unable to export Daily Report.");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function downloadDailyReportPdf(date, sections, title) {
  await loadPdfTools();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 28;
  let y = 34;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text("MUHAMMAD & ASSOCIATES", pageWidth / 2, y, { align: "center" });
  y += 24;
  doc.setFontSize(13);
  doc.setTextColor(30, 64, 175);
  doc.text(title, pageWidth / 2, y, { align: "center" });
  y += 24;
  sections.forEach((section, index) => {
    if (index > 0 && y > 480) {
      doc.addPage();
      y = 34;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(section.title || "", margin, y);
    y += 8;
    const rows = section.rows || [];
    const headers = rows.length ? Object.keys(rows[0]) : ["Message"];
    const body = rows.length
      ? rows.map((row) => headers.map((header) => String(row[header] ?? "")))
      : [[section.empty || "No records found."]];
    const columnStyles = section.columnStyles || dailyAutoFitPdfColumnStyles(headers, pageWidth - (margin * 2));
    doc.autoTable({
      startY: y + 6,
      head: [headers],
      body,
      margin: { left: margin, right: margin },
      tableWidth: pageWidth - (margin * 2),
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 7.2,
        cellPadding: 3.2,
        overflow: "linebreak",
        valign: "top",
        lineColor: [203, 213, 225],
        lineWidth: 0.45,
        textColor: [15, 23, 42],
      },
      headStyles: {
        fillColor: [219, 234, 254],
        textColor: [30, 64, 175],
        fontStyle: "bold",
        halign: "left",
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles,
      didParseCell: (data) => {
        const header = headers[data.column.index];
        if (section.rightAlign?.includes(header)) data.cell.styles.halign = "right";
        if (["SN", "Visit Date", "Visit Time", "Actions"].includes(header)) data.cell.styles.halign = header === "SN" ? "center" : "left";
      },
    });
    y = doc.lastAutoTable.finalY + 14;
    if (section.total) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(section.total, margin, y);
      y += 18;
    }
  });
  const pageCount = doc.internal.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 16, { align: "right" });
  }
  doc.save(`daily-report-${date}.pdf`);
}

function dailyAutoFitPdfColumnStyles(headers, tableWidth) {
  if (!headers.length) return {};
  const styles = {};
  const snIndex = headers.indexOf("SN");
  const fixedWidth = snIndex >= 0 ? 28 : 0;
  const flexibleHeaders = headers.filter((_, index) => index !== snIndex);
  const flexibleWidth = Math.max(46, (tableWidth - fixedWidth) / Math.max(1, flexibleHeaders.length));
  headers.forEach((header, index) => {
    if (header === "SN") {
      styles[index] = { cellWidth: fixedWidth, halign: "center" };
    } else if (/amount|total|fee/i.test(header)) {
      styles[index] = { cellWidth: flexibleWidth, halign: "right" };
    } else {
      styles[index] = { cellWidth: flexibleWidth };
    }
  });
  return styles;
}

function dailyVisitorPdfColumnStyles() {
  return {
    0: { cellWidth: 26, halign: "center" },
    1: { cellWidth: 118 },
    2: { cellWidth: 78 },
    3: { cellWidth: 128 },
    4: { cellWidth: 210 },
    5: { cellWidth: 54 },
    6: { cellWidth: 82 },
  };
}

function dailyExpensePdfColumnStyles() {
  return {
    0: { cellWidth: 30, halign: "center" },
    1: { cellWidth: 118 },
    2: { cellWidth: 210 },
    3: { cellWidth: 68 },
    4: { cellWidth: 72 },
    5: { cellWidth: 82, halign: "right" },
    6: { cellWidth: 102 },
  };
}

async function downloadDailyReportWorkbook(date, newWorkRows, completedRows, visitorRows, collectionRows, expenseRows) {
  const title = `Daily Report M&A - ${displayDate(date)}`;
  await downloadXlsxSheets(`daily-report-${date}`, [
    { name: "New Work Came", rows: [{ SN: "", Name: title, "Type of Service": "", "C/o": "", "Assigned To": "" }, ...newWorkRows, { SN: "", Name: `Total New Work Received: ${newWorkRows.length}`, "Type of Service": "", "C/o": "", "Assigned To": "" }] },
    { name: "Completed Files", rows: [{ SN: "", Name: title, "Type of Service": "", "C/o": "", "Work Done By": "", "Checked By": "" }, ...completedRows, { SN: "", Name: `Total Completed Files: ${completedRows.length}`, "Type of Service": "", "C/o": "", "Work Done By": "", "Checked By": "" }] },
    { name: "Visitors List", rows: [{ SN: "", "Visitor Name": title, "Mobile No": "", Company: "", Purpose: "", Time: "", Met: "" }, ...visitorRows, { SN: "", "Visitor Name": `Total Visitors: ${visitorRows.length}`, "Mobile No": "", Company: "", Purpose: "", Time: "", Met: "" }] },
    { name: "Collections", rows: [{ SN: "", "Received from": title, Particulars: "", "Ref No": "", Mode: "", Amount: "", "Collected By": "" }, ...collectionRows, { SN: "", "Received from": "Total Collections", Particulars: "", "Ref No": "", Mode: "", Amount: money(collectionRows.reduce((sum, row) => sum + Number(String(row.Amount).replace(/,/g, "") || 0), 0)), "Collected By": "" }] },
    { name: "Expense Report", rows: [{ SN: "", "Received from": title, Particulars: "", "Ref No": "", Mode: "", Amount: "", "Collected By": "" }, ...expenseRows, { SN: "", "Received from": "Total Expenses", Particulars: "", "Ref No": "", Mode: "", Amount: money(expenseRows.reduce((sum, row) => sum + Number(String(row.Amount).replace(/,/g, "") || 0), 0)), "Collected By": "" }] },
  ]);
}

function printStructuredReport({ title, subtitle = "", sections = [], format = "Print", showPrintAction = true }) {
  const firmName = state.company?.name || "Muhammad & Associates";
  const html = `
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
          .report-page { padding: 8px; }
          .firm { color: #1d4ed8; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; }
          h1 { margin: 0 0 8px; font-size: 15px; color: #0f172a; }
          .subtitle { margin: -3px 0 8px; color: #334155; font-size: 10px; font-weight: 700; }
          h2 { margin: 10px 0 5px; font-size: 12px; color: #123f6d; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10px; page-break-inside: auto; }
          thead { display: table-header-group; }
          th { background: #dceeff; color: #0f3f6f; border: 1px solid #9bc7f5; padding: 4px 5px; text-align: left; }
          td { border: 1px solid #d1d5db; padding: 4px 5px; vertical-align: top; word-wrap: break-word; }
          th:first-child, td:first-child { width: 34px; max-width: 34px; text-align: center; }
          tr { page-break-inside: avoid; }
          tr:nth-child(even) td { background: #f8fafc; }
          .total { margin: 5px 0 0; font-weight: 800; color: #0f172a; font-size: 10px; }
          .empty { padding: 7px; border: 1px dashed #cbd5e1; background: #f8fafc; color: #64748b; font-size: 10px; }
          .screen-actions { position: sticky; top: 0; padding: 8px 0; background: #fff; border-bottom: 1px solid #e5e7eb; margin-bottom: 8px; }
          button { border: 0; border-radius: 8px; padding: 7px 10px; background: #1d4ed8; color: #fff; cursor: pointer; }
          @media print { .screen-actions { display: none; } .report-page { padding: 0; } }
        </style>
      </head>
      <body>
        ${showPrintAction ? `<div class="screen-actions"><button onclick="window.print()">Print / Save as PDF</button></div>` : ""}
        <div class="report-page">
          <div class="firm">${escapeHtml(firmName)}</div>
          <h1>${escapeHtml(title)}</h1>
          ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ""}
          ${sections.map((section) => structuredReportSection(section)).join("")}
        </div>
      </body>
    </html>
  `;
  return openHtmlReportTab(html, title);
}

function structuredReportSection(section) {
  const rows = section.rows || [];
  const headers = Object.keys(rows[0] || {});
  return `
    <section>
      <h2>${escapeHtml(section.title || "")}</h2>
      ${rows.length ? `
        <table>
          <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      ` : `<div class="empty">${escapeHtml(section.empty || "No records found.")}</div>`}
      ${section.total ? `<p class="total">${escapeHtml(section.total)}</p>` : ""}
    </section>
  `;
}

function renderReportsPage() {
  const fromDate = state.filters.reportFrom || "";
  const toDate = state.filters.reportTo || "";
  const all = filterFilesByReportDate(visibleFiles(), fromDate, toDate);
  const bulkReport = state.bulkBillingReports || null;
  const bulkReports = bulkReport ? [
    ["bulk-non-billed", "Files Marked Non-Billed", bulkReport.nonBilled || []],
    ["bulk-billed", "Files Marked Billed", bulkReport.billed || []],
    ["bulk-unmatched-ambiguous", "Unmatched / Ambiguous Records", bulkReport.unmatchedOrAmbiguous || []],
  ] : [];
  const feeReport = state.bulkFeeReceivedReports || null;
  const feeReports = feeReport ? [
    ["fee-received-marked", "Files Marked Fee Received", feeReport.received || []],
    ["fee-received-unmatched", "Unmatched / Ambiguous Fee Records", feeReport.unmatchedOrAmbiguous || []],
  ] : [];
  const reports = [
    ["all-files", "All Files", all, "grad-blue"],
    ["completed", "Completed", all.filter((f) => f.filed), "grad-green"],
    ["overdue", "Overdue", all.filter(isOverdue), "grad-red"],
    ["work-in-progress", "Allotted / WIP / Work Done", all.filter((f) => ["Allotted", "WIP", "Work Done"].includes(statusOf(f).label)), "grad-purple"],
    ["pending-files", "Pending Files", all.filter((f) => !isCheckedCompleted(f)), "grad-yellow"],
    ["approval-pending", "Approval Pending", all.filter(pendingApproval), "grad-yellow"],
    ["billing-pending", "Billing Pending", all.filter(completedNotBilled), "grad-pink"],
  ];
  document.querySelector("#reports").innerHTML = `
    <div class="panel">
      <div class="report-list-hero">
        <div>
          <h3>Reports & Export Centre</h3>
          <p>Download office reports in Excel or PDF format.</p>
        </div>
        <span>${all.length} records</span>
      </div>
      <div class="report-date-filter">
        <div class="field">
          <label>From</label>
          <input type="date" id="reportFromDate" value="${fromDate}">
        </div>
        <div class="field">
          <label>To</label>
          <input type="date" id="reportToDate" value="${toDate}">
        </div>
        <div class="field">
          <label>Action</label>
          <button class="secondary-button" id="clearReportDates">Clear Dates</button>
        </div>
      </div>
      <div class="grid metrics report-card-grid">
        ${reports.map(([key, title, rows, className]) => `
          <div class="metric-card report-export-card ${className}">
            <span>${title}</span>
            <strong>${rows.length}</strong>
          <p>Record(s)</p>
            <div class="report-card-actions">
              <button data-excel="${key}" ${rolePerm().export ? "" : "disabled"}>Excel</button>
              <button data-pdf="${key}" ${rolePerm().export ? "" : "disabled"}>Pdf</button>
            </div>
          </div>
        `).join("")}
      </div>
      ${bulkReport ? `
        <div class="bulk-report-panel">
          <div>
            <h3>Latest Bulk Billing Update</h3>
            <p>Source: ${escapeHtml(bulkReport.source || "Excel upload")} | Updated ${fmt((bulkReport.generatedAt || "").slice(0, 10))}</p>
          </div>
          <div class="bulk-report-summary">
            <span>Total Excel Rows <strong>${bulkReport.summary?.totalExcelRows || 0}</strong></span>
            <span>Non-Billed <strong>${bulkReport.summary?.nonBilled || 0}</strong></span>
            <span>Billed <strong>${bulkReport.summary?.billed || 0}</strong></span>
            <span>Unmatched <strong>${bulkReport.summary?.unmatched || 0}</strong></span>
            <span>Ambiguous <strong>${bulkReport.summary?.ambiguous || 0}</strong></span>
            <span>Skipped <strong>${bulkReport.summary?.skipped || 0}</strong></span>
          </div>
          <div class="report-list compact-report-list">
            ${bulkReports.map(([key, title, rows]) => `
              <div class="report-row">
                <strong>${title} <span class="small-muted">(${rows.length})</span></strong>
                <button data-bulk-excel="${key}" ${rolePerm().export ? "" : "disabled"}>Excel</button>
                <button data-bulk-pdf="${key}" ${rolePerm().export ? "" : "disabled"}>Pdf</button>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
      ${feeReport ? `
        <div class="bulk-report-panel">
          <div>
            <h3>Latest Fee Received Update</h3>
            <p>Source: ${escapeHtml(feeReport.source || "Excel upload")} | Updated ${fmt((feeReport.generatedAt || "").slice(0, 10))}</p>
          </div>
          <div class="bulk-report-summary">
            <span>Total Excel Rows <strong>${feeReport.summary?.totalExcelRows || 0}</strong></span>
            <span>Marked Received <strong>${feeReport.summary?.received || 0}</strong></span>
            <span>Unmatched <strong>${feeReport.summary?.unmatched || 0}</strong></span>
            <span>Ambiguous <strong>${feeReport.summary?.ambiguous || 0}</strong></span>
          </div>
          <div class="report-list compact-report-list">
            ${feeReports.map(([key, title, rows]) => `
              <div class="report-row">
                <strong>${title} <span class="small-muted">(${rows.length})</span></strong>
                <button data-fee-excel="${key}" ${rolePerm().export ? "" : "disabled"}>Excel</button>
                <button data-fee-pdf="${key}" ${rolePerm().export ? "" : "disabled"}>Pdf</button>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
      <div class="report-list compact-report-list">
        ${reports.map(([key, title, rows]) => `
          <div class="report-row">
            <strong>${title} <span class="small-muted">(${rows.length})</span></strong>
            <button data-excel="${key}" ${rolePerm().export ? "" : "disabled"}>Excel</button>
            <button data-pdf="${key}" ${rolePerm().export ? "" : "disabled"}>Pdf</button>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  document.querySelectorAll("[data-excel]").forEach((btn) => {
    btn.onclick = () => exportExcel(btn.dataset.excel, reports.find((r) => r[0] === btn.dataset.excel)[2]);
  });
  document.querySelectorAll("[data-pdf]").forEach((btn) => {
    btn.onclick = () => exportPdf(btn.dataset.pdf, reports.find((r) => r[0] === btn.dataset.pdf)[2]);
  });
  document.querySelectorAll("[data-bulk-excel]").forEach((btn) => {
    btn.onclick = () => exportExcel(btn.dataset.bulkExcel, bulkReports.find((r) => r[0] === btn.dataset.bulkExcel)[2]);
  });
  document.querySelectorAll("[data-bulk-pdf]").forEach((btn) => {
    btn.onclick = () => exportPdf(btn.dataset.bulkPdf, bulkReports.find((r) => r[0] === btn.dataset.bulkPdf)[2]);
  });
  document.querySelectorAll("[data-fee-excel]").forEach((btn) => {
    btn.onclick = () => exportExcel(btn.dataset.feeExcel, feeReports.find((r) => r[0] === btn.dataset.feeExcel)[2]);
  });
  document.querySelectorAll("[data-fee-pdf]").forEach((btn) => {
    btn.onclick = () => exportPdf(btn.dataset.feePdf, feeReports.find((r) => r[0] === btn.dataset.feePdf)[2]);
  });
  document.querySelector("#reportFromDate").onchange = (event) => {
    state.filters.reportFrom = event.target.value;
    saveState();
    renderReportsPage();
  };
  document.querySelector("#reportToDate").onchange = (event) => {
    state.filters.reportTo = event.target.value;
    saveState();
    renderReportsPage();
  };
  document.querySelector("#clearReportDates").onclick = () => {
    state.filters.reportFrom = "";
    state.filters.reportTo = "";
    saveState();
    renderReportsPage();
  };
}

function filterFilesByReportDate(files, fromDate = "", toDate = "") {
  return (files || []).filter((file) => {
    const reportDate = file.workAllotmentDate || file.fileReceivedDate || file.lastUpdatedDate || file.dueDate;
    if (fromDate && reportDate < fromDate) return false;
    if (toDate && reportDate > toDate) return false;
    return true;
  });
}

function staffReportRows() {
  return state.users.map((user) => ({ name: user.name, role: user.role, ...staffStats(user.name) }));
}

function cleanReportRows(rows) {
  const fileReport = rows.some(isFileRecord);
  const normalized = rows.map((row) => isFileRecord(row) ? flattenFile(row) : row);
  const allowedHeaders = [
    "Name",
    "PAN / Regn Number",
    "Service Type",
    "C/o",
    "Mode",
    "File Received Date",
    "Assigned Staff",
    "Work Allotment Date",
    "Re Assigned",
    "Re Assigned Date",
    "Due Date",
    "Billed Date",
    "Fee Received Date",
    "Fee Received Amount",
    "Priority",
    "Status",
    "Last Updated Date",
    "Remarks",
  ];
  const blockedHeaders = new Set([
    "id",
    "name",
    "pan",
    "serviceType",
    "careOf",
    "mode",
    "fileReceivedDate",
    "workDone",
    "shared",
    "reportPrepared",
    "approved",
    "filed",
    "billed",
    "stages",
    "assignedStaff",
    "workAllotmentDate",
    "workStartedDate",
    "dueDate",
    "billedDate",
    "feeReceivedDate",
    "feeReceivedAmount",
    "priority",
    "lastUpdatedDate",
    "updatedAt",
    "assignedStaffId",
    "assignedStaffEmail",
    "reAssignedStaff",
    "reAssignedStaffId",
    "reAssignedStaffEmail",
  ]);
  const rawHeaders = [...new Set(normalized.flatMap((row) => Object.keys(row)))].filter((header) => !blockedHeaders.has(String(header).trim()));
  const headers = fileReport ? allowedHeaders.filter((header) => rawHeaders.includes(header)) : rawHeaders;
  const visibleHeaders = headers.filter((header) => normalized.some((row) => {
    const value = row[header];
    return value !== undefined && value !== null && String(value).trim() !== "";
  }));
  return normalized.map((row) => Object.fromEntries(visibleHeaders.map((header) => [header, row[header] ?? ""])));
}

function isFileRecord(row) {
  return row && typeof row === "object" && ("name" in row || "serviceType" in row || "fileReceivedDate" in row || "assignedStaff" in row);
}

function fileListSectionTitle() {
  const listViewTitles = {
    active: "Active Files",
    completed: "Completed Files",
    notChecked: "Not Checked Files",
    correctionRequired: "Correction Required Files",
    billed: "Billed Files",
    nonBilled: "Non-Billed Files",
    feePending: "Fee Pending Files",
  };
  const dashboardTitles = {
    pending: "Pending Files",
    shared: "Reports Shared",
    reportsPrepared: "Reports Prepared",
    completed: "Completed Files",
    correctionRequired: "Correction Required Files",
    reAllotted: "Re-Allotted Files",
  };
  if (state.filters.listView && listViewTitles[state.filters.listView]) return listViewTitles[state.filters.listView];
  if (state.filters.dashboardKind && dashboardTitles[state.filters.dashboardKind]) return dashboardTitles[state.filters.dashboardKind];
  return "File List";
}

function fileListPdfFileName(sectionTitle) {
  const range = [state.filters.fileFrom, state.filters.fileTo].filter(Boolean).map((date) => displayDate(date)).join("-to-");
  const reportDate = displayDate(todayDate());
  const name = [sectionTitle || "File List", range || reportDate].filter(Boolean).join("-");
  return name.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function fileExportDateTime() {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date()).replace(",", "");
}

function fileExportFilterSummary() {
  const labels = {
    search: "Search",
    client: "Client",
    careOfFilter: "C/o",
    staff: "Staff",
    service: "Service",
    workflow: "Workflow",
    status: "Status",
    billing: "Billing",
    checkingStatus: "Checking",
    pan: "PAN / Regn",
    due: "Due Date",
    priority: "Priority",
    overdue: "Overdue",
    pendingApproval: "Approval Pending",
    fileFrom: "From",
    fileTo: "To",
    receivedSort: "Received Sort",
  };
  const parts = Object.entries(labels)
    .map(([key, label]) => {
      const value = String(state.filters[key] || "").trim();
      if (!value) return "";
      const displayValue = key.toLowerCase().includes("date") || ["due", "fileFrom", "fileTo"].includes(key) ? displayDate(value) : value;
      return `${label}: ${displayValue}`;
    })
    .filter(Boolean);
  return parts.length ? parts.join(" | ") : "No filters applied";
}

function filePdfText(value, fallback = "") {
  const text = String(value ?? fallback ?? "").trim();
  return text || fallback;
}

function filePdfDate(value) {
  return displayDate(normalizeImportDate(value) || value);
}

function filePdfCompletionDate(file) {
  return filePdfDate(fileActualCompletionDate(file));
}

function filePdfAmount(value) {
  return money(Number(value || 0));
}

function filePendingAmount(file) {
  const billed = dashboardFileAmount(file, "billed");
  const received = dashboardFileAmount(file, "received");
  return Math.max(billed - received, 0);
}

function fileCrNumber(file = {}) {
  return filePdfText(file.crNo || file.crNumber || file.clientCode || file.pan);
}

function fileDpName(file = {}) {
  return filePdfText(file.dp || file.dealingPerson || file.dealtBy || file.createdBy || file.receivedBy);
}

function fileSpName(file = {}) {
  return filePdfText(file.sp || file.supervisor || file.salesPerson || file.allottedBy);
}

function fileListReportRows(files) {
  const section = state.filters.listView || state.filters.dashboardKind || "files";
  return (files || []).map((file, index) => {
    const base = {
      SN: index + 1,
      "Client Name": filePdfText(file.name),
      "CR No.": fileCrNumber(file),
      "Service Type": filePdfText(file.serviceType),
      "C/o": filePdfText(file.careOf, "Direct"),
      FY: filePdfText(fileFy(file), "NA"),
      "Received Date": filePdfDate(file.fileReceivedDate),
      "Work Allotted": filePdfDate(file.workAllotmentDate || file.fileReceivedDate),
      "Assigned Staff": filePdfText(file.assignedStaff, "Not Assigned"),
      DP: fileDpName(file),
      SP: fileSpName(file),
      Status: statusOf(file).label,
      Priority: filePdfText(file.priority),
      "Due Date": filePdfDate(file.dueDate),
      Remarks: filePdfText(file.remarks),
    };
    if (section === "completed") {
      return {
        SN: base.SN,
        "Client Name": base["Client Name"],
        FY: base.FY,
        "Service Type": base["Service Type"],
        "Completion Date": filePdfCompletionDate(file),
        "Done By": filePdfText(file.completedBy || file.workDoneBy || file.assignedStaff, "Not Assigned"),
        "Checking Status": filePdfText(checkingStatusOf(file).label, "-"),
        "Checked By": filePdfText(file.checkedBy, "-"),
        "Checked Date": filePdfDate(file.checkedDate),
        "Billing Status": isBilledFile(file) ? "Billed" : isNonBilledFile(file) ? "Non-Billed" : "Pending",
        Remarks: base.Remarks,
      };
    }
    if (section === "notChecked") {
      return {
        SN: base.SN,
        "Client Name": base["Client Name"],
        "Service Type": base["Service Type"],
        "Assigned Staff": base["Assigned Staff"],
        "Completion Date": filePdfCompletionDate(file),
        "Submitted for Checking": filePdfDate(file.submittedForCheckingDate || file.submitted_at || fileActualCompletionDate(file)),
        "Checking Status": filePdfText(checkingStatusOf(file).label, "-"),
        "Correction Status": filePdfText(file.correctionStatus || checkingStatusOf(file).label, "-"),
        "Correction Reason": filePdfText(file.correctionReason || file.checkingRemarks || file.remarks),
      };
    }
    if (section === "billed") {
      return {
        SN: base.SN,
        "Client Name": base["Client Name"],
        "Service Type": base["Service Type"],
        "Completion Date": filePdfCompletionDate(file),
        "Billed Date": filePdfDate(file.billedDate),
        "Billed Amount": filePdfAmount(dashboardFileAmount(file, "billed")),
        "Received Amount": filePdfAmount(dashboardFileAmount(file, "received")),
        "Received On": filePdfDate(file.feeReceivedDate),
        "Payment Status": file.feeReceived ? "Received" : "Pending",
      };
    }
    if (section === "nonBilled") {
      return {
        SN: base.SN,
        "Client Name": base["Client Name"],
        "Service Type": base["Service Type"],
        "Assigned Staff": base["Assigned Staff"],
        "Completion Date": filePdfCompletionDate(file),
        "Billing Type": filePdfText(file.billingType, "Non-Billable"),
        Remarks: base.Remarks,
      };
    }
    if (section === "feePending") {
      return {
        SN: base.SN,
        "Client Name": base["Client Name"],
        "Service Type": base["Service Type"],
        "Assigned Staff": base["Assigned Staff"],
        "Completion Date": filePdfCompletionDate(file),
        "Billed Amount": filePdfAmount(dashboardFileAmount(file, "billed")),
        "Received Amount": filePdfAmount(dashboardFileAmount(file, "received")),
        "Pending Amount": filePdfAmount(filePendingAmount(file)),
        "Payment Status": file.feeReceived ? "Received" : "Pending",
      };
    }
    return {
      SN: base.SN,
      "Client Name": base["Client Name"],
      "CR No.": base["CR No."],
      "Service Type": base["Service Type"],
      "Received Date": base["Received Date"],
      "Assigned Staff": base["Assigned Staff"],
      DP: base.DP,
      SP: base.SP,
      Status: base.Status,
      Priority: base.Priority,
      "Due Date": base["Due Date"],
    };
  });
}

async function exportFilteredFilesPdf(files, button) {
  if (!rolePerm().export) return toast("This role cannot export data.");
  const sourceFiles = Array.isArray(files) ? files : sortFilesForDisplay(filteredFiles());
  if (!sourceFiles.length) return toast("No records available for the selected filters.");
  const sectionTitle = fileListSectionTitle();
  const reportTitle = `${sectionTitle} Report`.toUpperCase();
  const rows = fileListReportRows(sourceFiles);
  const headers = Object.keys(rows[0] || {});
  const previousHtml = button?.innerHTML;
  if (button) {
    button.disabled = true;
    button.innerHTML = `${navIcon("pdf")}Generating...`;
  }
  try {
    await loadPdfTools();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Muhammad & Associates", pageWidth / 2, 34, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Chartered Accountants", pageWidth / 2, 49, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(reportTitle, pageWidth / 2, 76, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Generated On: ${fileExportDateTime()} | Total Records: ${sourceFiles.length}`, 40, 96);
    doc.text(`Applied Filters: ${fileExportFilterSummary()}`, 40, 110, { maxWidth: pageWidth - 80 });
    doc.autoTable({
      columns: headers.map((header) => ({ header, dataKey: header })),
      body: rows,
      startY: 124,
      theme: "grid",
      showHead: "everyPage",
      styles: { fontSize: 7.2, cellPadding: 3, overflow: "linebreak", valign: "middle", lineWidth: 0.15, lineColor: [180, 195, 215] },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold", halign: "center", lineWidth: 0.2, lineColor: [148, 163, 184] },
      alternateRowStyles: { fillColor: [248, 251, 255] },
      margin: { left: 28, right: 28 },
      columnStyles: {
        SN: { halign: "center", cellWidth: 24 },
        "Client Name": { cellWidth: 106 },
        "CR No.": { cellWidth: 58 },
        "Service Type": { cellWidth: 92 },
        "Received Date": { halign: "center", cellWidth: 56 },
        "Completion Date": { halign: "center", cellWidth: 60 },
        "Submitted for Checking": { halign: "center", cellWidth: 68 },
        "Billed Date": { halign: "center", cellWidth: 56 },
        "Received On": { halign: "center", cellWidth: 56 },
        "Due Date": { halign: "center", cellWidth: 54 },
        "Assigned Staff": { cellWidth: 82 },
        DP: { cellWidth: 52 },
        SP: { cellWidth: 52 },
        Status: { halign: "center", cellWidth: 64 },
        "Checking Status": { halign: "center", cellWidth: 66 },
        "Correction Status": { halign: "center", cellWidth: 70 },
        Priority: { halign: "center", cellWidth: 46 },
        "Payment Status": { halign: "center", cellWidth: 62 },
        "Billed Amount": { halign: "right", cellWidth: 66 },
        "Received Amount": { halign: "right", cellWidth: 70 },
        "Pending Amount": { halign: "right", cellWidth: 70 },
        Remarks: { cellWidth: 118 },
        "Correction Reason": { cellWidth: 150 },
      },
    });
    const totalPages = doc.internal.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      doc.setFontSize(8);
      doc.setTextColor(90);
      doc.text(`Page ${page} of ${totalPages}`, pageWidth / 2, pageHeight - 18, { align: "center" });
      doc.text("CA File Tracker", 28, pageHeight - 18);
    }
    doc.save(`${fileListPdfFileName(sectionTitle)}.pdf`);
    toast("PDF file downloaded");
  } catch (error) {
    console.error(error);
    toast("Unable to generate PDF. Please try again.");
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = previousHtml;
    }
  }
}

async function exportExcel(name, rows) {
  if (!rolePerm().export) return toast("This role cannot export data.");
  const normalized = cleanReportRows(rows);
  await downloadXlsxRows(`${name}-${todayDate()}`, normalized);
  toast("Excel file downloaded");
}

async function exportPdf(name, rows) {
  if (!rolePerm().export) return toast("This role cannot export data.");
  const printableRows = cleanReportRows(rows);
  if (!printableRows.length) return toast("No data to export.");
  await downloadPdfRows(`${name}-${todayDate()}`, printableRows, ["Muhammad & Associates,", "Chartered Accountants,", titleCaseReportName(name)]);
  toast("PDF file downloaded");
}

function flattenFile(file) {
  return {
    Name: file.name,
    "PAN / Regn Number": file.pan,
    "Service Type": file.serviceType,
    "C/o": file.careOf || "Direct",
    FY: file.fy || "NA",
    Mode: file.mode || "Whatsapp",
    "File Received Date": displayDate(file.fileReceivedDate),
    "Assigned Staff": file.assignedStaff,
    "Work Allotment Date": displayDate(file.workAllotmentDate),
    "Re Assigned": file.reAssignedStaff || "",
    "Re Assigned Date": displayDate(file.reAssignedDate),
    "Due Date": displayDate(file.dueDate),
    "Billed Date": displayDate(file.billedDate),
    "Fee Received Date": displayDate(file.feeReceivedDate),
    "Fee Received Amount": file.feeReceivedAmount || "",
    Priority: file.priority,
    Status: statusOf(file).label,
    "Last Updated Date": displayDate(file.lastUpdatedDate),
    Remarks: file.remarks,
  };
}

function openNotifications() {
  const panel = document.querySelector("#notificationPanel");
  const allItems = allNotificationItems();
  const activeFilter = panel?.dataset.filter || "all";
  const items = filterNotificationItems(allItems, activeFilter);
  const unreadTotal = allItems.filter((item) => !item.isRead).length;
  panel.innerHTML = `
    <div class="drawer-head modern-drawer-head">
      <div>
        <span class="drawer-eyebrow">Workspace</span>
        <h3>Notifications</h3>
        <p class="small-muted">${unreadTotal} unread update(s)</p>
      </div>
      <div class="drawer-head-actions">
        <button class="mini-button" id="markAllRead" ${unreadTotal ? "" : "disabled"}>Mark All as Read</button>
        <button class="icon-button drawer-close" id="closeNotifications" title="Close">X</button>
      </div>
    </div>
    <div class="drawer-body notification-drawer-body">
      <div class="notification-tabs">
        ${notificationFilterTab("all", "All", activeFilter)}
        ${notificationFilterTab("unread", "Unread", activeFilter)}
        ${notificationFilterTab("files", "Files", activeFilter)}
        ${notificationFilterTab("corrections", "Corrections", activeFilter)}
        ${notificationFilterTab("billing", "Billing", activeFilter)}
        ${notificationFilterTab("assignments", "Assignments", activeFilter)}
        ${notificationFilterTab("system", "System", activeFilter)}
      </div>
      <div class="notification-list">
        ${renderNotificationGroups(items)}
      </div>
    </div>
  `;
  panel.dataset.filter = activeFilter;
  panel.classList.add("open");
  document.querySelector("#backdrop").classList.add("show");
  document.querySelector("#closeNotifications").onclick = closeOverlays;
  document.querySelector("#markAllRead").onclick = () => {
    markNotificationItemsRead(allItems);
    panel.dataset.filter = "unread";
    refreshNotificationsPanel();
  };
  document.querySelectorAll("[data-notification-filter]").forEach((btn) => {
    btn.onclick = () => {
      panel.dataset.filter = btn.dataset.notificationFilter;
      openNotifications();
    };
  });
  document.querySelectorAll("[data-mark-read]").forEach((btn) => {
    btn.onclick = () => {
      const item = allNotificationItems().find((row) => row.id === btn.dataset.markRead) || { id: btn.dataset.markRead };
      markNotificationItemsRead([item]);
      refreshNotificationsPanel();
    };
  });
  document.querySelectorAll("[data-open-notification-file]").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.openNotificationFile;
      const itemId = btn.dataset.notificationId;
      if (itemId) state.readNotifications = [...new Set([...(state.readNotifications || []), itemId])];
      const file = state.files.find((row) => row.id === id);
      if (!file) {
        saveState();
        mount();
        openNotifications();
        return toast("Referenced file is unavailable.");
      }
      activePage = "files";
      saveState();
      mount();
      openFileDrawer(id);
    };
  });
}

function markNotificationItemsRead(items = []) {
  const ids = items.map((item) => item.id).filter(Boolean);
  state.readNotifications = [...new Set([...(state.readNotifications || []), ...ids])];
  const chatIds = items.filter((item) => item.chatId).map((item) => item.chatId);
  if (chatIds.length) markChatMessagesRead(chatIds);
  saveState({ skipMerge: true });
}

function refreshNotificationsPanel() {
  updateTopActionBadges();
  renderNav();
  openNotifications();
}

function notificationFilterTab(value, label, activeFilter) {
  return `<button class="notification-tab ${activeFilter === value ? "active" : ""}" data-notification-filter="${value}" type="button">${label}</button>`;
}

function filterNotificationItems(items, activeFilter) {
  if (activeFilter === "all") return items;
  if (activeFilter === "unread") return items.filter((item) => !item.isRead);
  return items.filter((item) => item.category === activeFilter);
}

function renderNotificationGroups(items) {
  if (!items.length) return empty("No notifications yet.");
  const groups = [
    ["Today", items.filter((item) => notificationDayGroup(item) === "Today")],
    ["Yesterday", items.filter((item) => notificationDayGroup(item) === "Yesterday")],
    ["Earlier", items.filter((item) => notificationDayGroup(item) === "Earlier")],
  ].filter(([, rows]) => rows.length);
  return groups.map(([label, rows]) => `
    <section class="notification-group">
      <h4>${label}</h4>
      ${rows.map(notificationCard).join("")}
    </section>
  `).join("");
}

function notificationDayGroup(item) {
  const time = Number(item.createdAt || 0) || Date.parse(item.date || "") || 0;
  if (!time) return "Earlier";
  const today = new Date(indiaTodayDate());
  const date = new Date(time);
  const dateKey = date.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === today.toISOString().slice(0, 10)) return "Today";
  if (dateKey === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  return "Earlier";
}

function notificationCard(item) {
  const timeText = item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : [fmt(item.date), item.time].filter(Boolean).join(" ");
  return `
    <article class="notification-card ${item.isRead ? "is-read" : "is-unread"} tone-${escapeHtml(item.tone || "progress")}">
      <div class="notification-icon">${notificationIcon(item.category)}</div>
      <div class="notification-content">
        <div class="notification-title-line">
          <strong>${escapeHtml(item.title || "Notification")}</strong>
          ${item.isRead ? "" : `<span class="unread-dot" title="Unread"></span>`}
        </div>
        <p>${escapeHtml(item.text || "")}</p>
        <div class="notification-meta">
          <span>${escapeHtml(item.type || "Update")}</span>
          ${item.actor ? `<span>${escapeHtml(item.actor)}</span>` : ""}
          ${timeText ? `<time>${escapeHtml(timeText)}</time>` : ""}
        </div>
      </div>
      <div class="notification-actions">
        ${item.fileId ? `<button class="mini-button" data-open-notification-file="${escapeHtml(item.fileId)}" data-notification-id="${escapeHtml(item.id)}">View File</button>` : ""}
        <button class="mini-button notification-read-button" data-mark-read="${escapeHtml(item.id)}" ${item.isRead ? "disabled" : ""}>Read</button>
      </div>
    </article>
  `;
}

function notificationIcon(category = "") {
  if (category === "billing") return navIcon("rupee");
  if (category === "corrections") return navIcon("pending");
  if (category === "assignments") return navIcon("users");
  if (category === "chat") return navIcon("chat");
  if (category === "system") return navIcon("database");
  return navIcon("file");
}

function openTeamChat(clearDraft = false) {
  syncSharedState(localStorage.getItem(STORAGE_KEY), false);
  const panel = document.querySelector("#teamChatPanel");
  if (!panel) return;
  ensureActiveChatConversation();
  const previousText = clearDraft ? "" : (document.querySelector("#chatText")?.value || "");
  panel.innerHTML = `
    <div class="drawer-head modern-drawer-head chat-shell-head">
      <div>
        <span class="drawer-eyebrow">Team Workspace</span>
        <h3>Team Chat</h3>
        <p class="small-muted">Private and group messages synced through the central database.</p>
      </div>
      <button class="icon-button drawer-close" id="closeTeamChat" title="Close chat" aria-label="Close chat">X</button>
    </div>
    <div class="drawer-body team-chat-body modern-chat-body">
      <aside class="chat-sidebar" id="chatSidebar">
        <div class="chat-sidebar-top">
          <div class="chat-title-row">
            <div>
              <strong>Messages</strong>
              <span>${chatConversationSummaries().length} conversation(s)</span>
            </div>
            <button class="chat-new-button" id="newChatButton" type="button" title="New chat">+ New</button>
          </div>
          <label class="chat-search-wrap">
            ${navIcon("search")}
            <input id="chatSearch" type="search" placeholder="Search users or chats" aria-label="Search users or chats" autocomplete="off" value="${escapeHtml(chatUiState.search)}">
            <button class="chat-search-clear ${chatUiState.search ? "" : "hidden"}" id="clearChatSearch" type="button" aria-label="Clear chat search">x</button>
          </label>
          <div class="chat-filter-tabs" role="tablist" aria-label="Chat filters">
            ${["all", "private", "groups", "unread"].map((filter) => `<button class="chat-filter-chip ${chatUiState.filter === filter ? "active" : ""}" data-chat-filter="${filter}" type="button">${properCaseName(filter)}</button>`).join("")}
          </div>
        </div>
        <div class="chat-conversation-list" id="chatConversationList">
          ${renderChatConversationList()}
        </div>
        ${renderNewChatPanel()}
      </aside>
      <section class="chat-conversation-panel" id="chatConversationPanel">
        ${renderActiveConversationPanel(previousText)}
      </section>
    </div>
  `;
  panel.classList.add("open");
  document.querySelector("#backdrop").classList.add("show");
  bindTeamChatEvents();
  markActiveConversationRead();
  scrollActiveChatToBottom();
  updateTopActionBadges();
}

function bindTeamChatEvents() {
  document.querySelector("#closeTeamChat")?.addEventListener("click", closeOverlays);
  bindChatSidebarEvents();
  bindChatComposerEvents();
}

function bindChatSidebarEvents() {
  document.querySelector("#newChatButton")?.addEventListener("click", () => {
    chatUiState.newChatOpen = !chatUiState.newChatOpen;
    renderChatSidebarContent();
  });
  document.querySelectorAll("[data-chat-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      chatUiState.filter = btn.dataset.chatFilter || "all";
      renderChatSidebarContent();
    });
  });
  const searchInput = document.querySelector("#chatSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      chatUiState.search = searchInput.value;
      document.querySelector("#clearChatSearch")?.classList.toggle("hidden", !chatUiState.search);
      clearTimeout(chatSearchTimer);
      chatSearchTimer = setTimeout(renderChatConversationListOnly, 240);
    });
    searchInput.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Escape") {
        event.preventDefault();
        chatUiState.search = "";
        searchInput.value = "";
        document.querySelector("#clearChatSearch")?.classList.add("hidden");
        renderChatConversationListOnly();
      }
    });
  }
  document.querySelector("#clearChatSearch")?.addEventListener("click", () => {
    chatUiState.search = "";
    if (searchInput) {
      searchInput.value = "";
      searchInput.focus();
    }
    document.querySelector("#clearChatSearch")?.classList.add("hidden");
    renderChatConversationListOnly();
  });
  bindChatConversationClicks();
  bindNewChatEvents();
}

function bindChatConversationClicks() {
  document.querySelectorAll("[data-chat-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      chatUiState.targetType = btn.dataset.chatType || "group";
      chatUiState.recipientId = btn.dataset.chatRecipient || (chatUiState.targetType === "group" ? "team" : "");
      chatUiState.newChatOpen = false;
      document.querySelector(".new-chat-panel")?.remove();
      document.querySelector("#teamChatPanel")?.classList.add("chat-mobile-open");
      document.querySelector("#chatConversationPanel").innerHTML = renderActiveConversationPanel("");
      renderChatConversationListOnly();
      bindChatComposerEvents();
      markActiveConversationRead();
      scrollActiveChatToBottom();
    });
  });
}

function bindChatComposerEvents() {
  document.querySelector("#chatComposeForm")?.addEventListener("submit", handleChatSubmit);
  const textarea = document.querySelector("#chatText");
  if (textarea) {
    textarea.addEventListener("input", () => {
      resizeChatTextarea(textarea);
      updateSendButtonState();
    });
    textarea.addEventListener("keydown", handleMessageKeyDown);
    resizeChatTextarea(textarea);
    updateSendButtonState();
  }
  const attachmentInput = document.querySelector("#chatAttachment");
  if (attachmentInput) {
    attachmentInput.addEventListener("change", () => {
      renderChatAttachmentPreview();
      updateSendButtonState();
    });
  }
  document.querySelector("#clearChatAttachment")?.addEventListener("click", () => {
    const input = document.querySelector("#chatAttachment");
    if (input) input.value = "";
    renderChatAttachmentPreview();
    updateSendButtonState();
  });
}

function resizeChatTextarea(textarea = document.querySelector("#chatText")) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 58), 148)}px`;
}

function bindNewChatEvents() {
  document.querySelector("#closeNewChatPanel")?.addEventListener("click", () => {
    chatUiState.newChatOpen = false;
    renderChatSidebarContent();
  });
  document.querySelectorAll("[data-new-chat-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      chatUiState.newChatMode = btn.dataset.newChatMode || "private";
      renderChatSidebarContent();
    });
  });
  document.querySelectorAll("[data-start-private-chat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      chatUiState.targetType = "personal";
      chatUiState.recipientId = btn.dataset.startPrivateChat || "";
      document.querySelector("#teamChatPanel")?.classList.add("chat-mobile-open");
      chatUiState.newChatOpen = false;
      chatUiState.search = "";
      renderChatSidebarContent();
      document.querySelector("#chatConversationPanel").innerHTML = renderActiveConversationPanel("");
      bindChatComposerEvents();
      markActiveConversationRead();
      scrollActiveChatToBottom();
      document.querySelector("#chatText")?.focus();
    });
  });
  document.querySelectorAll("[data-toggle-group-member]").forEach((box) => {
    box.addEventListener("change", () => {
      const id = box.dataset.toggleGroupMember || "";
      chatUiState.groupMembers = box.checked
        ? [...new Set([...chatUiState.groupMembers, id])]
        : chatUiState.groupMembers.filter((item) => item !== id);
      renderChatSidebarContent();
    });
  });
  const groupNameInput = document.querySelector("#newGroupName");
  if (groupNameInput) {
    groupNameInput.addEventListener("input", () => {
      chatUiState.groupName = groupNameInput.value;
    });
  }
  document.querySelector("#createChatGroup")?.addEventListener("click", createChatGroup);
}

function renderChatSidebarContent() {
  const sidebar = document.querySelector("#chatSidebar");
  if (!sidebar) return openTeamChat(false);
  const active = document.activeElement?.id;
  sidebar.innerHTML = `
    <div class="chat-sidebar-top">
      <div class="chat-title-row">
        <div>
          <strong>Messages</strong>
          <span>${chatConversationSummaries().length} conversation(s)</span>
        </div>
        <button class="chat-new-button" id="newChatButton" type="button" title="New chat">+ New</button>
      </div>
      <label class="chat-search-wrap">
        ${navIcon("search")}
        <input id="chatSearch" type="search" placeholder="Search users or chats" aria-label="Search users or chats" autocomplete="off" value="${escapeHtml(chatUiState.search)}">
        <button class="chat-search-clear ${chatUiState.search ? "" : "hidden"}" id="clearChatSearch" type="button" aria-label="Clear chat search">x</button>
      </label>
      <div class="chat-filter-tabs" role="tablist" aria-label="Chat filters">
        ${["all", "private", "groups", "unread"].map((filter) => `<button class="chat-filter-chip ${chatUiState.filter === filter ? "active" : ""}" data-chat-filter="${filter}" type="button">${properCaseName(filter)}</button>`).join("")}
      </div>
    </div>
    <div class="chat-conversation-list" id="chatConversationList">
      ${renderChatConversationList()}
    </div>
    ${renderNewChatPanel()}
  `;
  bindChatSidebarEvents();
  if (active === "chatSearch") {
    const input = document.querySelector("#chatSearch");
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  }
}

function renderChatConversationListOnly() {
  const list = document.querySelector("#chatConversationList");
  if (!list) return;
  list.innerHTML = renderChatConversationList();
  bindChatConversationClicks();
}

function renderChatConversationList() {
  const rows = filterChatConversations(chatConversationSummaries(chatUiState.targetType, chatUiState.recipientId));
  return rows.length ? rows.map(chatConversationButton).join("") : `<div class="chat-empty-state">No members found.</div>`;
}

function filterChatConversations(items = []) {
  const query = normalizeChatSearchText(chatUiState.search);
  return items.filter((item) => {
    if (chatUiState.filter === "private" && item.type !== "personal") return false;
    if (chatUiState.filter === "groups" && item.type !== "group") return false;
    if (chatUiState.filter === "unread" && !item.unread) return false;
    if (!query) return true;
    return normalizeChatSearchText(item.searchText).includes(query);
  });
}

function renderActiveConversationPanel(draftText = "") {
  const activeConversation = chatConversationTitle(chatUiState.targetType, chatUiState.recipientId);
  const messages = chatConversationMessages(chatUiState.targetType, chatUiState.recipientId).slice(-150);
  return `
    <div class="chat-conversation-head">
      <button class="chat-mobile-back" type="button" onclick="document.querySelector('#teamChatPanel')?.classList.remove('chat-mobile-open')">${navIcon("back")}</button>
      <div class="chat-avatar">${escapeHtml(activeConversation.initials)}</div>
      <div class="chat-active-copy">
        <h4>${escapeHtml(activeConversation.title)}</h4>
        <p>${escapeHtml(activeConversation.subtitle)}</p>
      </div>
      <div class="chat-head-tools">
        <button class="chat-head-icon" type="button" title="Search messages">${navIcon("search")}</button>
        <button class="chat-head-icon" type="button" title="Conversation information">i</button>
      </div>
    </div>
    <div class="chat-messages" id="chatMessages">
      ${renderChatMessages(messages)}
    </div>
    <form class="chat-compose" id="chatComposeForm">
      <div id="chatAttachmentPreview"></div>
      <div class="chat-composer-line">
        <label class="chat-tool-button" for="chatAttachment" title="Attach PDF or Excel" aria-label="Attach file">${navIcon("backup")}</label>
        <input class="hidden" type="file" id="chatAttachment" accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
        <textarea id="chatText" placeholder="Type a message..." rows="2">${escapeHtml(draftText)}</textarea>
        <button class="chat-send-button" id="sendChatMessage" type="submit" title="Send message" aria-label="Send message">${navIcon("chat")}</button>
      </div>
    </form>
  `;
}

function renderNewChatPanel() {
  if (!chatUiState.newChatOpen) return "";
  const users = chatRecipientUsers().filter((user) => {
    const query = normalizeChatSearchText(chatUiState.search);
    if (!query) return true;
    return chatUserSearchText(user).includes(query);
  });
  if (chatUiState.newChatMode === "group") {
    return `
      <div class="new-chat-panel">
        <div class="new-chat-panel-head">
          <strong>New chat</strong>
          <button class="chat-search-clear" id="closeNewChatPanel" type="button" aria-label="Close new chat selector">x</button>
        </div>
        <div class="new-chat-mode">
          <button class="" data-new-chat-mode="private" type="button">Private</button>
          <button class="active" data-new-chat-mode="group" type="button">Group</button>
        </div>
        <input id="newGroupName" value="${escapeHtml(chatUiState.groupName)}" placeholder="Group name" aria-label="Group name">
        <div class="new-chat-user-list">
          ${users.map((user) => `<label class="new-chat-user"><input type="checkbox" data-toggle-group-member="${escapeHtml(user.id)}" ${chatUiState.groupMembers.includes(user.id) ? "checked" : ""}><span class="chat-avatar">${escapeHtml(userInitials(chatDisplayName(user)))}</span><span><strong>${escapeHtml(chatDisplayName(user))}</strong><small>${escapeHtml(user.role || user.email || "Team member")}</small></span></label>`).join("") || `<div class="chat-empty-state">No members found.</div>`}
        </div>
        <button class="primary-button create-group-button" id="createChatGroup" type="button">Create Group</button>
      </div>
    `;
  }
  return `
    <div class="new-chat-panel">
      <div class="new-chat-panel-head">
        <strong>New chat</strong>
        <button class="chat-search-clear" id="closeNewChatPanel" type="button" aria-label="Close new chat selector">x</button>
      </div>
      <div class="new-chat-mode">
        <button class="active" data-new-chat-mode="private" type="button">Private</button>
        <button data-new-chat-mode="group" type="button">Group</button>
      </div>
      <div class="new-chat-user-list">
        ${users.map((user) => `<button class="new-chat-user" data-start-private-chat="${escapeHtml(user.id)}" type="button" title="${escapeHtml(chatDisplayName(user))}"><span class="chat-avatar">${escapeHtml(userInitials(chatDisplayName(user)))}</span><span><strong>${escapeHtml(chatDisplayName(user))}</strong><small>${escapeHtml(user.role || user.email || "Team member")}</small></span><em>Start</em></button>`).join("") || `<div class="chat-empty-state">No members found.</div>`}
      </div>
    </div>
  `;
}

function createChatGroup() {
  if (!["Admin", "Manager", "Staff Manager"].includes(state.currentRole)) return toast("Only authorised users can create groups.");
  const name = String(chatUiState.groupName || "").trim();
  if (!name) return toast("Enter a group name.");
  if (!chatUiState.groupMembers.length) return toast("Select at least one member.");
  const existing = (state.chatGroups || []).find((group) => String(group.name || "").trim().toLowerCase() === name.toLowerCase());
  const group = existing || {
    id: `group-${crypto.randomUUID()}`,
    name,
    memberIds: [...new Set(chatUiState.groupMembers)],
    createdBy: state.currentUser,
    createdAt: new Date().toISOString(),
  };
  state.chatGroups = existing
    ? (state.chatGroups || []).map((item) => item.id === existing.id ? { ...item, name, memberIds: [...new Set(chatUiState.groupMembers)], updatedAt: new Date().toISOString() } : item)
    : [...(state.chatGroups || []), group];
  chatUiState.targetType = "group";
  chatUiState.recipientId = group.id;
  document.querySelector("#teamChatPanel")?.classList.add("chat-mobile-open");
  chatUiState.newChatOpen = false;
  chatUiState.groupName = "";
  chatUiState.groupMembers = [];
  saveState();
  renderChatSidebarContent();
  document.querySelector("#chatConversationPanel").innerHTML = renderActiveConversationPanel("");
  bindChatComposerEvents();
  scrollActiveChatToBottom();
  toast(existing ? "Group updated" : "Group created");
}

function ensureActiveChatConversation() {
  if (chatUiState.targetType === "personal" && !state.users.some((user) => user.id === chatUiState.recipientId)) {
    chatUiState.targetType = "group";
    chatUiState.recipientId = "team";
  }
  if (chatUiState.targetType === "group" && chatUiState.recipientId !== "team" && !(state.chatGroups || []).some((group) => group.id === chatUiState.recipientId)) {
    chatUiState.recipientId = "team";
  }
}

function markActiveConversationRead() {
  const unreadIds = chatConversationMessages(chatUiState.targetType, chatUiState.recipientId)
    .filter((message) => !chatSenderIsCurrentUser(message) && !isChatMessageRead(message))
    .map((message) => message.id);
  if (unreadIds.length) {
    markChatMessagesRead(unreadIds);
    saveState({ skipMerge: true, fullRemote: true });
    renderChatConversationListOnly();
    updateTopActionBadges();
  }
}

function refreshOpenChatFromState() {
  if (!document.querySelector("#teamChatPanel")?.classList.contains("open")) return;
  ensureActiveChatConversation();
  renderChatConversationListOnly();
  refreshActiveChatMessages(false);
  markActiveConversationRead();
  updateTopActionBadges();
}

function refreshActiveChatMessages(forceScroll = false) {
  const list = document.querySelector("#chatMessages");
  if (!list) return;
  const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 90;
  const messages = chatConversationMessages(chatUiState.targetType, chatUiState.recipientId).slice(-150);
  list.innerHTML = renderChatMessages(messages);
  if (forceScroll || nearBottom) scrollActiveChatToBottom();
}

function scrollActiveChatToBottom() {
  const list = document.querySelector("#chatMessages");
  if (list) list.scrollTop = list.scrollHeight;
}

function handleMessageKeyDown(event) {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    event.stopPropagation();
    sendChatMessage();
  }
}

function handleChatSubmit(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  sendChatMessage();
}

function updateSendButtonState() {
  const text = document.querySelector("#chatText")?.value.trim() || "";
  const hasFile = Boolean(document.querySelector("#chatAttachment")?.files?.[0]);
  const button = document.querySelector("#sendChatMessage");
  if (button) button.disabled = chatSendInFlight || (!text && !hasFile);
}

function renderChatAttachmentPreview() {
  const file = document.querySelector("#chatAttachment")?.files?.[0];
  const preview = document.querySelector("#chatAttachmentPreview");
  if (!preview) return;
  preview.innerHTML = file ? `<div class="chat-attachment-preview"><span>${escapeHtml(file.name)} (${formatFileSize(file.size)})</span><button id="clearChatAttachment" type="button">Remove</button></div>` : "";
  document.querySelector("#clearChatAttachment")?.addEventListener("click", () => {
    const input = document.querySelector("#chatAttachment");
    if (input) input.value = "";
    renderChatAttachmentPreview();
    updateSendButtonState();
  });
}

function addChatStaffFromPrompt() {
  if (!rolePerm().invite) return toast("Only Admin and Manager can add staff.");
  const name = prompt("Enter staff name");
  if (!name) return openTeamChat();
  const email = prompt("Enter staff email ID");
  if (!email) return openTeamChat();
  const password = prompt("Enter login password for this staff");
  if (!password) return openTeamChat();
  const result = createOrUpdateTeamLogin({ name, email, role: "Staff", password });
  if (result.error) {
    toast(result.error);
    return openTeamChat();
  }
  saveAccessState();
  toast(result.updated ? "Staff updated and added to chat list" : "New staff added to chat list");
  openTeamChat();
  const typeSelect = document.querySelector("#chatTargetType");
  const recipientSelect = document.querySelector("#chatRecipient");
  if (typeSelect) typeSelect.value = "personal";
  if (recipientSelect) recipientSelect.value = result.user.id;
  document.querySelector("#chatRecipientField")?.classList.remove("hidden");
}

function chatConversationTitle(targetType = "all", recipientId = "") {
  if (targetType === "personal") {
    const user = state.users.find((item) => item.id === recipientId) || chatRecipientUsers()[0] || {};
    return {
      title: chatDisplayName(user) || "Personal Chat",
      subtitle: `${user.role || "Team member"}${user.email ? ` - ${user.email}` : ""}`,
      initials: userInitials(chatDisplayName(user) || user.email || "PC"),
    };
  }
  if (targetType === "group") {
    const group = chatGroupById(recipientId);
    const memberCount = group?.id === "team" ? chatRecipientUsers().length + 1 : (group?.memberIds || []).length + 1;
    return { title: group?.name || "Team Chat", subtitle: `Group Chat - ${memberCount} member(s)`, initials: userInitials(group?.name || "GC") };
  }
  return { title: "All Conversations", subtitle: "Group and personal messages", initials: "AC" };
}

function chatConversationSummaries(activeType = "all", activeRecipient = "") {
  const recipients = chatRecipientUsers();
  const groups = chatGroups();
  const rows = [
    ...groups.map((group) => {
      const messages = visibleChatMessages().filter((message) => (message.targetType || "group") === "group" && (message.groupId || message.group_id || "team") === group.id);
      const memberCount = group.id === "team" ? recipients.length + 1 : (group.memberIds || []).length + 1;
      return chatConversationSummary("group", group.id, group.name, `${memberCount} members`, messages, activeType === "group" && (activeRecipient || "team") === group.id);
    }),
    ...recipients.map((user) => {
      const messages = visibleChatMessages().filter((message) => isChatWithUser(message, user, loggedInUser()));
      return chatConversationSummary("personal", user.id, chatDisplayName(user), user.role || user.email || "Team member", messages, activeType === "personal" && activeRecipient === user.id, user);
    }),
  ];
  const sorted = rows
    .sort((a, b) =>
      (b.unread || 0) - (a.unread || 0) ||
      Number(Boolean(b.latestAt)) - Number(Boolean(a.latestAt)) ||
      (b.latestAt || 0) - (a.latestAt || 0) ||
      String(a.title).localeCompare(String(b.title))
    );
  return sorted;
}

function chatConversationSummary(type, recipientId, title, subtitle, messages, active, user = null) {
  const latest = sortChatMessages(messages || []).at(-1);
  const unread = (messages || []).filter((message) => !chatSenderIsCurrentUser(message) && !isChatMessageRead(message)).length;
  const latestAt = latest ? chatMessageTime(latest) : 0;
  return {
    type,
    recipientId,
    title: title || "Unknown User",
    subtitle,
    latestText: latest?.text || (latest?.attachments?.length ? `Attachment: ${latest.attachments[0].name}` : "Start a new conversation"),
    latestTime: latest ? formatChatListTime(latest) : "",
    latestAt,
    initials: userInitials(title),
    unread,
    active,
    searchText: [
      title,
      subtitle,
      user?.email,
      user?.id,
      user?.authUserId,
      user?.role,
      user?.designation,
      user?.position,
      user?.department,
      type,
    ].filter(Boolean).join(" "),
  };
}

function chatConversationButton(item) {
  return `
    <button class="chat-conversation-item ${item.active ? "active" : ""} ${item.unread ? "unread" : ""}" data-chat-type="${escapeHtml(item.type)}" data-chat-recipient="${escapeHtml(item.recipientId || "")}" type="button" title="${escapeHtml(item.title)}">
      <span class="chat-avatar">${escapeHtml(item.initials)}</span>
      <span class="chat-conversation-copy">
        <strong class="chat-user-name">${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.latestText)}</small>
      </span>
      <span class="chat-conversation-meta">
        ${item.latestTime ? `<time>${escapeHtml(item.latestTime)}</time>` : ""}
        ${item.unread ? `<em aria-label="${item.unread} unread message(s)">${item.unread > 99 ? "99+" : item.unread}</em>` : ""}
      </span>
    </button>
  `;
}

function chatGroups() {
  const user = loggedInUser();
  const customGroups = (state.chatGroups || []).filter((group) =>
    ["Admin", "Manager", "Staff Manager"].includes(state.currentRole) ||
    (group.memberIds || []).includes(user?.id)
  );
  return [
    { id: "team", name: "Team Chat", memberIds: chatRecipientUsers().map((user) => user.id) },
    ...customGroups,
  ];
}

function chatGroupById(id = "team") {
  return chatGroups().find((group) => group.id === (id || "team")) || chatGroups()[0];
}

function chatDisplayName(user = {}) {
  const name = String(user.name || user.displayName || user.fullName || "").trim();
  if (name) return name;
  const email = String(user.email || "").trim();
  if (email) return properCaseName(email.split("@")[0].replace(/[._-]+/g, " "));
  return "Unknown User";
}

function chatUserSearchText(user = {}) {
  return normalizeChatSearchText([
    chatDisplayName(user),
    user.name,
    user.email,
    user.id,
    user.authUserId,
    user.role,
    user.designation,
    user.position,
    user.department,
  ].filter(Boolean).join(" "));
}

function normalizeChatSearchText(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function formatChatListTime(message = {}) {
  const time = chatMessageTime(message);
  if (!time) return "";
  const date = new Date(time);
  const today = indiaTodayDate();
  const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
  if (key === today) {
    return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true }).format(date);
  }
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short" }).format(date);
}

function renderChatMessages(messages = []) {
  if (!messages.length) return empty("No messages yet. Start the conversation.");
  let lastGroup = "";
  return messages.map((message) => {
    const group = chatDateSeparator(message);
    const separator = group !== lastGroup ? `<div class="chat-date-separator">${escapeHtml(group)}</div>` : "";
    lastGroup = group;
    return `${separator}${chatMessageCard(message)}`;
  }).join("");
}

function chatDateSeparator(message = {}) {
  const time = chatMessageTime(message);
  if (!time) return "Earlier";
  const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(time));
  const today = indiaTodayDate();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === today) return "Today";
  if (dateKey === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  return displayDate(dateKey);
}

function chatMessageCard(message) {
  const own = chatSenderIsCurrentUser(message);
  const attachments = message.attachments || [];
  const statusLabel = properCaseName(message.status || "Sent");
  return `
    <div class="chat-message ${own ? "own" : ""}">
      <div class="chat-meta">
        ${own ? "" : `<strong>${escapeHtml(message.user || "Team Member")}</strong>`}
        <span>${escapeHtml(formatChatListTime(message))}${own ? ` · ${escapeHtml(statusLabel)}` : ""}</span>
      </div>
      ${message.text ? `<p>${escapeHtml(message.text || "")}</p>` : ""}
      ${attachments.map((file) => `
        <a class="chat-attachment-card" href="${file.dataUrl}" download="${escapeHtml(file.name)}" target="_blank" rel="noopener">
          <span>Attachment</span>
          <strong>${escapeHtml(file.name)}</strong>
          <small>${escapeHtml(file.type || "File")} | ${formatFileSize(file.size || 0)}</small>
        </a>
      `).join("")}
    </div>`;
}

async function sendChatMessage() {
  if (chatSendInFlight) return;
  const input = document.querySelector("#chatText");
  const fileInput = document.querySelector("#chatAttachment");
  const sendButton = document.querySelector("#sendChatMessage");
  const text = input?.value.trim();
  const uploadedFile = fileInput?.files?.[0] || null;
  if (!text && !uploadedFile) return;
  syncSharedState(localStorage.getItem(STORAGE_KEY), false);
  const sender = loggedInUser() || {};
  const targetType = chatUiState.targetType === "personal" ? "personal" : "group";
  const selectedRecipientId = chatUiState.recipientId || "";
  const targetUser = targetType === "personal"
    ? state.users.find((user) => user.id === selectedRecipientId)
    : null;
  if (targetType === "personal" && !targetUser) return toast("Please select a team member.");
  const activeGroup = targetType === "group" ? chatGroupById(selectedRecipientId || "team") : null;
  chatSendInFlight = true;
  if (sendButton) sendButton.disabled = true;
  let attachments = [];
  if (uploadedFile) {
    const allowedExtensions = [".pdf", ".xls", ".xlsx"];
    const lowerName = uploadedFile.name.toLowerCase();
    const allowed = allowedExtensions.some((ext) => lowerName.endsWith(ext));
    if (!allowed) {
      chatSendInFlight = false;
      updateSendButtonState();
      return toast("Please attach only PDF or Excel files.");
    }
    if (uploadedFile.size > 1500000) {
      chatSendInFlight = false;
      updateSendButtonState();
      return toast("Please attach a file below 1.5 MB for this local version.");
    }
    try {
      attachments = [await readChatAttachment(uploadedFile)];
    } catch (error) {
      chatSendInFlight = false;
      updateSendButtonState();
      return toast(error.message || "Unable to read attachment.");
    }
  }
  const clientMessageId = crypto.randomUUID();
  const optimistic = {
    id: `local-${clientMessageId}`,
    client_message_id: clientMessageId,
    clientMessageId: clientMessageId,
    userId: sender.id || state.session?.userId || "",
    user: sender.name || state.currentUser || "Team Member",
    userEmail: sender.email || state.session?.userEmail || "",
    role: sender.role || state.currentRole || "",
    targetType,
    targetUserId: targetUser?.id || "",
    targetUserName: targetUser?.name || "",
    targetUserEmail: targetUser?.email || "",
    groupId: activeGroup?.id || "",
    groupName: activeGroup?.name || "",
    text,
    attachments,
    status: "sending",
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  state.chatMessages = mergeChatMessages(state.chatMessages || [], [optimistic]);
  if (input) input.value = "";
  if (fileInput) fileInput.value = "";
  renderChatAttachmentPreview();
  resizeChatTextarea(input);
  updateSendButtonState();
  renderChatConversationListOnly();
  refreshActiveChatMessages(true);
  if (isSupabaseMode()) {
    try {
      const result = await apiJson("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          clientMessageId,
          targetType,
          targetUserId: targetUser?.id || "",
          targetUserName: targetUser?.name || "",
          targetUserEmail: targetUser?.email || "",
          groupId: activeGroup?.id || "",
          groupName: activeGroup?.name || "",
          text,
          attachments,
        }),
      });
      state.chatMessages = mergeChatMessages(state.chatMessages || [], result.chatMessages || []);
      const sent = state.chatMessages.find((message) => message.client_message_id === clientMessageId || message.clientMessageId === clientMessageId)
        || state.chatMessages[state.chatMessages.length - 1];
      if (sent?.id) markChatMessageRead(sent.id, sender);
      saveState({ skipMerge: true, skipRemote: true });
      toast("Message sent");
      renderChatConversationListOnly();
      refreshActiveChatMessages(true);
      input?.focus();
      return;
    } catch (error) {
      state.chatMessages = mergeChatMessages((state.chatMessages || []).filter((message) => message.id !== optimistic.id), [{ ...optimistic, status: "failed" }]);
      if (input) input.value = text;
      resizeChatTextarea(input);
      renderChatConversationListOnly();
      refreshActiveChatMessages(true);
      input?.focus();
      console.error("Failed message insert", { targetType, targetUserId: targetUser?.id || "", message: error.message });
      return toast(`Message failed to send: ${error.message || "Please retry."}`);
    } finally {
      chatSendInFlight = false;
      if (sendButton) sendButton.disabled = false;
      updateSendButtonState();
    }
  }
  const messageId = crypto.randomUUID();
  state.chatMessages = mergeChatMessages((state.chatMessages || []).filter((message) => message.id !== optimistic.id), [
    {
      id: messageId,
      client_message_id: clientMessageId,
      clientMessageId: clientMessageId,
      userId: sender.id || state.session?.userId || "",
      user: sender.name || state.currentUser || "Team Member",
      userEmail: sender.email || state.session?.userEmail || "",
      role: sender.role || state.currentRole || "",
      targetType,
      targetUserId: targetUser?.id || "",
      targetUserName: targetUser?.name || "",
      targetUserEmail: targetUser?.email || "",
      groupId: activeGroup?.id || "",
      groupName: activeGroup?.name || "",
      text,
      attachments,
      status: "sent",
      deliveredAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      date: todayDate(),
      time: "",
    },
  ]);
  markChatMessageRead(messageId, sender);
  saveState();
  chatSendInFlight = false;
  updateSendButtonState();
  renderChatConversationListOnly();
  refreshActiveChatMessages(true);
  input?.focus();
}

function readChatAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type || "File",
      size: file.size,
      dataUrl: reader.result,
      uploadedAt: todayDate(),
      uploadedBy: state.currentUser,
    });
    reader.onerror = () => reject(new Error("Unable to read attachment"));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size = 0) {
  const bytes = Number(size) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function alertCard(item, canMark = false) {
  return `<div class="alert-card"><div><span class="badge ${item.tone}">${item.type}</span><strong class="subtext" style="color:var(--text);font-size:14px">${item.title}</strong><p>${item.text}</p></div>${canMark ? `<button class="mini-button" data-mark-read="${item.id}">Mark read</button>` : ""}</div>`;
}

function closeOverlays() {
  document.querySelector("#fileDrawer")?.classList.remove("open");
  document.querySelector("#notificationPanel")?.classList.remove("open");
  document.querySelector("#teamChatPanel")?.classList.remove("open");
  document.querySelector("#sidebar")?.classList.remove("open");
  document.querySelector("#markReceivedModal")?.remove();
  document.querySelector("#backdrop")?.classList.remove("show");
}

function toast(message) {
  const el = document.querySelector("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function empty(message) {
  return `<div class="empty">${message}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function bootApp() {
  resetSidebarLayoutForOperationsTheme();
  const recoverySession = recoverySessionFromUrl();
  if (recoverySession) {
    renderPasswordRecovery(recoverySession);
    return;
  }
  if (state.session?.loggedIn && isSupabaseMode()) {
    const loaded = await loadStateFromApi();
    if (loaded) return;
  }
  mount();
}

bootApp();


