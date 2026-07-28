const AuditLog = require("../models/AuditLog");

const logAudit = async (actor, action, target) => {
  try {
    await AuditLog.create({ actor: String(actor || "unknown"), action, target: String(target || "") });
  } catch (err) {
    console.error("[AUDIT_LOG] Failed to record entry:", err.message);
  }
};

module.exports = { logAudit };
