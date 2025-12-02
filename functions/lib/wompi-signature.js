"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIntegritySignature = void 0;
const functions = require("firebase-functions");
const CryptoJS = require("crypto-js");
const integrityKey = process.env.INTEGRITY_KEY;
exports.generateIntegritySignature = functions.https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        res.status(200).send();
        return;
    }
    console.log("🔐 ===== SOLICITUD DE FIRMA =====");
    console.log("Body recibido:", req.body);
    const reference = req.body.reference;
    const amountInCents = String(req.body.amountInCents);
    const currency = req.body.currency;
    if (!reference || !amountInCents || !currency) {
        console.error("❌ Campos faltantes");
        res.status(400).json({ error: "Missing fields" });
        return;
    }
    const plain = reference + amountInCents + currency + integrityKey;
    console.log("📝 Cadena para firma:", plain);
    const signature = CryptoJS.SHA256(plain).toString();
    console.log("✅ Firma generada:", signature);
    res.json({ signature });
});
//# sourceMappingURL=wompi-signature.js.map