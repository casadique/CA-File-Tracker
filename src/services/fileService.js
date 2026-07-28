const crypto = require("crypto");
const { patchAppState } = require("./appStateService");

async function listFiles(state) {
  return state.files || [];
}

async function upsertFile(file, userId) {
  return patchAppState((state) => {
    const now = Date.now();
    const record = {
      ...file,
      id: file.id || crypto.randomUUID(),
      updatedAt: now,
    };
    const files = state.files || [];
    const index = files.findIndex((item) => item.id === record.id);
    if (index >= 0) files[index] = { ...files[index], ...record };
    else files.push({ ...record, createdAt: now });
    state.files = files;
    return state;
  }, userId);
}

async function deleteFile(fileId, userId) {
  return patchAppState((state) => {
    state.files = (state.files || []).filter((file) => file.id !== fileId);
    state.deletedFileIds = [...new Set([...(state.deletedFileIds || []), fileId])];
    return state;
  }, userId);
}

module.exports = { listFiles, upsertFile, deleteFile };
