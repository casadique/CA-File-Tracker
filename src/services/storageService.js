const crypto = require("crypto");
const path = require("path");
const { supabaseAdmin } = require("../config/supabase");
const { env } = require("../config/env");

async function uploadAttachment(file, folder = "attachments") {
  const ext = path.extname(file.originalname || "");
  const objectPath = `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${ext}`;
  const { data, error } = await supabaseAdmin.storage
    .from(env.storageBucket)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype || "application/octet-stream",
      upsert: false,
    });
  if (error) throw error;
  const { data: signed, error: signedError } = await supabaseAdmin.storage
    .from(env.storageBucket)
    .createSignedUrl(data.path, 60 * 60);
  if (signedError) throw signedError;
  return {
    path: data.path,
    name: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    signedUrl: signed.signedUrl,
  };
}

module.exports = { uploadAttachment };
