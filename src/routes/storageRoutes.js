const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { uploadAttachment } = require("../services/storageService");

const router = express.Router();

router.post("/attachments", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Please upload a file." });
      return;
    }
    res.status(201).json({ attachment: await uploadAttachment(req.file) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
