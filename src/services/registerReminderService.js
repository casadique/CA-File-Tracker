const { supabaseAdmin } = require("../config/supabase");
const { notifyRegisterUser } = require("./registerNotificationService");

let reminderRun = null;

function activeProfiles(rows) {
  return (rows || []).filter((row) => row?.id && row.is_active !== false);
}

async function dispatchRegisterReminders() {
  if (reminderRun) return reminderRun;
  reminderRun = run().finally(() => { reminderRun = null; });
  return reminderRun;
}

async function run() {
  const now = new Date();
  const nowIso = now.toISOString();
  const today = nowIso.slice(0, 10);
  const { data: escalationProfiles, error: profileError } = await supabaseAdmin
    .from("app_users").select("id,auth_user_id,email,name,role,is_active").in("role", ["Admin", "Manager"]).eq("is_active", true);
  if (profileError) throw profileError;
  const escalation = activeProfiles(escalationProfiles);

  const { data: complaintRows, error: complaintError } = await supabaseAdmin
    .from("complaints")
    .select("id,complaint_no,subject,status,priority,assigned_user_id,follow_up_at,sla_due_at,created_at")
    .not("status", "in", "(Resolved,Closed)")
    .limit(500);
  if (complaintError) throw complaintError;
  for (const row of complaintRows || []) {
    const recipients = new Set([row.assigned_user_id].filter(Boolean));
    let stage = "";
    if (row.sla_due_at && Date.parse(row.sla_due_at) <= now.getTime()) stage = "sla-breached";
    else if (row.sla_due_at && Date.parse(row.sla_due_at) - now.getTime() <= 2 * 60 * 60 * 1000) stage = "sla-approaching";
    else if (row.follow_up_at && Date.parse(row.follow_up_at) <= now.getTime()) stage = "follow-up-due";
    else if (["High", "Critical"].includes(row.priority) && !row.assigned_user_id) stage = "unassigned-priority";
    if (!stage) continue;
    if (["sla-breached", "unassigned-priority"].includes(stage)) escalation.forEach((profile) => recipients.add(profile.id));
    for (const recipientProfileId of recipients) await notifyRegisterUser({
      recipientProfileId,
      eventKey: `complaint:${stage}:${row.id}:${today}:${recipientProfileId}`,
      eventType: stage === "sla-breached" ? "Complaint SLA Breached" : stage === "sla-approaching" ? "Complaint SLA Approaching" : stage === "follow-up-due" ? "Complaint Follow-up Due" : "High Priority Complaint Unassigned",
      title: row.complaint_no, message: `${row.complaint_no} — ${row.subject} requires attention.`,
      route: `/?page=complaints&complaint=${row.id}`, category: "complaints", actor: { name: "System" },
    });
  }

  const { data: dscConfig, error: configError } = await supabaseAdmin.from("dsc_settings").select("reminder_days").eq("id", "default").single();
  if (configError) throw configError;
  const maxDays = Math.max(...(dscConfig.reminder_days || [90]));
  const end = new Date(now.getTime() + maxDays * 86400000).toISOString().slice(0, 10);
  const { data: dscRows, error: dscError } = await supabaseAdmin.from("dsc_master")
    .select("id,dsc_id,client_name,holder_name,expiry_date,assigned_user_id,status")
    .gte("expiry_date", today).lte("expiry_date", end).not("status", "in", "(Revoked,Closed)").limit(500);
  if (dscError) throw dscError;
  for (const row of dscRows || []) {
    const days = Math.ceil((Date.parse(`${row.expiry_date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
    const stage = (dscConfig.reminder_days || []).find((configured) => days <= configured);
    if (stage === undefined) continue;
    const recipients = new Set([row.assigned_user_id].filter(Boolean));
    escalation.forEach((profile) => recipients.add(profile.id));
    for (const recipientProfileId of recipients) await notifyRegisterUser({
      recipientProfileId, eventKey: `dsc:expiry:${row.id}:${stage}:${recipientProfileId}`,
      eventType: "DSC Expiry Approaching", title: row.dsc_id,
      message: `${row.holder_name} / ${row.client_name} expires on ${row.expiry_date} (${days} day(s)).`,
      route: `/?page=dsc&record=${row.id}`, category: "dsc", actor: { name: "System" },
    });
  }

  const { data: overdue, error: overdueError } = await supabaseAdmin.from("dsc_handover_requests")
    .select("id,request_no,dsc_id,expected_return_date,dsc:dsc_master(dsc_id,client_name,holder_name,assigned_user_id)")
    .eq("status", "Handed Over").lt("expected_return_date", today).limit(200);
  if (overdueError) throw overdueError;
  for (const request of overdue || []) {
    const recipients = new Set([request.dsc?.assigned_user_id].filter(Boolean)); escalation.forEach((profile) => recipients.add(profile.id));
    for (const recipientProfileId of recipients) await notifyRegisterUser({
      recipientProfileId, eventKey: `dsc:return-overdue:${request.id}:${today}:${recipientProfileId}`,
      eventType: "DSC Return Overdue", title: request.request_no,
      message: `${request.dsc?.holder_name || "DSC"} / ${request.dsc?.client_name || "client"} was due for return on ${request.expected_return_date}.`,
      route: `/?page=dsc&request=${request.id}`, category: "dsc", actor: { name: "System" },
    });
  }
  return { complaints: (complaintRows || []).length, dsc: (dscRows || []).length, overdue: (overdue || []).length, checkedAt: nowIso };
}

module.exports = { dispatchRegisterReminders };
