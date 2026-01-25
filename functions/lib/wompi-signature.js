"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIntegritySignature = void 0;
const functions = require("firebase-functions");
const CryptoJS = require("crypto-js");
exports.generateIntegritySignature = functions.https.onRequest(async (req, res) => {
    var _a;
    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(200).send();
        return;
    }
    const integrityKey = (_a = functions.config().wompi) === null || _a === void 0 ? void 0 : _a.integrity_key;
    if (!integrityKey) {
        console.error("❌ INTEGRITY_KEY no configurada");
        res.status(500).json({ error: "Integrity key not configured" });
        return;
    }
    const { reference, amountInCents, currency } = req.body;
    if (!reference || !amountInCents || !currency) {
        res.status(400).json({ error: "Missing fields" });
        return;
    }
    // 🔴 NORMALIZACIÓN CRÍTICA
    const normalizedAmount = String(amountInCents);
    const plain = `${reference}${normalizedAmount}${currency}${integrityKey}`;
    const signature = CryptoJS.SHA256(plain).toString();
    console.log("📝 Firma generada correctamente");
    res.json({ signature });
});
//# sourceMappingURL=wompi-signature.js.map