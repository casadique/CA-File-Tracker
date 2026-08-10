const assert = require("assert");
const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const index = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const start = app.indexOf("function activeUserList()");
const end = app.indexOf("function chatRecipientUsers", start);
const implementation = app.slice(start, end);

assert(start >= 0 && end > start, "activeUserList must exist");
assert(implementation.includes("user.isActive !== false && user.is_active !== false"), "all active application profiles must be shown");
assert(!implementation.includes('user.source === "team-login"'), "Supabase-auth users must not be filtered out");
assert(!implementation.includes("invitedEmails.has"), "an obsolete local invitation must not be required");
assert(implementation.includes("!isRevokedAccess(user)"), "revoked users must remain hidden");
assert(index.includes("20260810-notification-dedupe-v100"), "the repaired user list must remain on the current cache version");
console.log("User Access Status Supabase-profile visibility checks passed.");
