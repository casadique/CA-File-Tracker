const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const client = read("register-client.js");
const service = read("src/services/complaintService.js");
const routes = read("src/routes/complaintRoutes.js");
const sidebar = read("sidebar-accordion.js");
const css = read("registers.css");
const index = read("index.html");

["All Complaints","Open","Assigned to Me","Pending Client Response","Escalated","Resolved","Closed"].forEach((label) => assert(client.includes(`\"${label}\"`), `Missing complaint tab: ${label}`));
["SN","Complaint No. / Date","Client Name","Subject / Issue","Priority","Status","Assigned To","SLA Due","Last Follow-up","Actions"].forEach((heading) => assert(client.includes(`<th>${heading}</th>`), `Missing table heading: ${heading}`));
assert(client.includes("Track, assign and resolve client concerns."), "Compact hero subtitle is missing");
assert(client.includes("Export Excel") && client.includes("Export PDF") && client.includes("+ New Complaint"), "Hero actions are incomplete");
assert(client.includes("Search complaint no., client, PAN or subject"), "Search placeholder is incomplete");
assert(client.includes("complaintQuery(true)"), "Exports/list must retain the current filters and view");
assert(routes.includes('router.get("/counts"'), "Filtered complaint counts endpoint is missing");
assert(service.includes('head: true') && service.includes('complaintCounts'), "Counts must use server-side head queries");
assert(service.includes('.in("complaint_id", ids)') && service.includes("attachLastFollowUps"), "Last follow-up must use one batched lookup");
assert(service.includes("description.ilike"), "Complaint description must be searchable");
assert(sidebar.includes('new Set(["complaints-all", "complaints-settings"])'), "Complaint sidebar must contain only All Complaints and Settings");
assert(css.includes(".complaint-table th{position:sticky") && css.includes(".complaint-table th:last-child"), "Sticky table header/actions are missing");
assert(css.includes(".complaint-floating-menu{position:fixed"), "Row menu must escape the scroll container");
assert(index.includes("20261102-complaint-modern-v130"), "Complaint assets need a release cache key");

console.log("Complaint Register modernization checks passed.");
