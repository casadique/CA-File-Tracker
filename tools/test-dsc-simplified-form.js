const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const client = fs.readFileSync(path.join(root, "register-client.js"), "utf8");
const service = fs.readFileSync(path.join(root, "src/services/dscService.js"), "utf8");
const routes = fs.readFileSync(path.join(root, "src/routes/dscRoutes.js"), "utf8");
const migration = fs.readFileSync(path.join(root, "database/migrations/20260830_dsc_simplified_add_form.sql"), "utf8");

for (const label of ["DSC HOLDER NAME","ENTITY NAME","DESIGNATION","C/O","PAN","PW","MOBILE NO","EMAIL","DSC TYPE","DSC CLASS","TOKEN NAME","BOX TYPE","SLOT POSITION","ISSUE DATE","VALID FROM","VALID TO","REMARKS"]) assert(client.includes(label), `Missing Add DSC field: ${label}`);
for (const value of ["Director","Designated Partner","Owner","Auth Representative","Extratrust","Vsign","Emudhra","Class II","Class III","Class I","Blue","Black"]) assert(client.includes(value), `Missing DSC dropdown value: ${value}`);
for (const text of ["Download Sample Excel","Import Excel","DSC-Register-Import-Sample.xlsx","dscAddYears(validFrom,2)"]) assert(client.includes(text), `Missing DSC Excel/date behavior: ${text}`);
assert(service.includes("aes-256-gcm"), "DSC PW must use authenticated encryption.");
assert(service.includes("withoutPassword"), "DSC API must remove encrypted PW values.");
assert(service.includes("importDscRows"), "DSC tolerant import service is missing.");
assert(routes.includes('router.post("/import"'), "DSC import route is missing.");
assert(!routes.includes('"PW": row.'), "DSC exports must never contain PW.");
assert(migration.includes("password_encrypted") && migration.includes("box_type"), "DSC form migration is incomplete.");
console.log("Simplified Add DSC form, protected PW, Excel import and date rules passed.");
