const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.resolve(__dirname, "..", "app.js"), "utf8");

assert.match(appSource, /let reusableFileSnapshot = false;/);
assert.match(appSource, /localStorage\.getItem\(FILE_SNAPSHOT_USER_KEY\) === currentUserKey/);
assert.match(appSource, /localStorage\.getItem\(FILE_SNAPSHOT_VERSION_KEY\)/);
assert.match(appSource, /if \(!reusableFileSnapshot\) \{\s*state\.files = \[\];/);
assert.match(appSource, /if \(!reusableNotificationSnapshot\) state\.fileNotifications = \[\];/);
assert.match(appSource, /function adoptLegacySameSessionFileSnapshot\(\)/);
assert.match(appSource, /state\.session\?\.loggedIn[\s\S]*localStorage\.setItem\(FILE_SNAPSHOT_USER_KEY, userKey\)/);
assert.match(appSource, /if \(state\.session\?\.loggedIn && isSupabaseMode\(\)\) \{\s*adoptLegacySameSessionFileSnapshot\(\);/);
assert.doesNotMatch(
  appSource,
  /if \(user\.source === "supabase-auth"\) \{\s*state\.files = \[\];\s*state\.fileNotifications = \[\];/,
  "A returning user must not discard a valid same-user dashboard cache"
);

console.log("Same-user dashboard login cache checks passed.");
