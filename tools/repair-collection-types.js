const { patchAppState } = require("../src/services/appStateService");

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

function clearlyFeeCollection(row = {}) {
  const text = [
    row.particulars,
    row.remarks,
    row.source,
    row.transactionSource,
    row.transaction_source,
    row.receiptNumber,
    row.receipt_number,
    row.invoiceNumber,
    row.invoice_number,
    row.fileId,
    row.file_id,
    row.feeReceiptId,
    row.fee_receipt_id,
  ].join(" ").toLowerCase();
  return /\bfee\s+collection\b/.test(text)
    || /\bfee\s+receipt\b/.test(text)
    || /\binvoice\b/.test(text)
    || /\breceipt\b/.test(text)
    || Boolean(row.fileId || row.file_id || row.feeReceiptId || row.fee_receipt_id);
}

async function main() {
  let fixed = 0;
  let reviewed = 0;
  await patchAppState((state) => {
    state.otherCashCollections = (state.otherCashCollections || []).map((row) => {
      const currentType = normalizeCollectionType(row.collectionType || row.collection_type);
      const next = { ...row, collectionType: currentType, collection_type: currentType };
      reviewed += 1;
      if (currentType === "other_cash_collection" && clearlyFeeCollection(row)) {
        fixed += 1;
        next.collectionType = "fee_collection";
        next.collection_type = "fee_collection";
        next.collectionTypeCorrectedAt = new Date().toISOString();
        next.collection_type_corrected_at = next.collectionTypeCorrectedAt;
      }
      return next;
    });
    state.auditLog = [
      ...(state.auditLog || []),
      {
        id: `collection-type-repair-${Date.now()}`,
        action: "Collection types repaired",
        details: { reviewed, fixed },
        user: "System",
        role: "Maintenance",
        at: new Date().toISOString(),
      },
    ].slice(-1000);
    return state;
  }, "collection-type-repair");
  console.log(JSON.stringify({ ok: true, reviewed, fixed }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
