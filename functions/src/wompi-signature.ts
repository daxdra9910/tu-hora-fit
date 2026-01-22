import * as functions from "firebase-functions";
import * as CryptoJS from "crypto-js";
import { Request, Response } from "express";

export const generateIntegritySignature = functions.https.onRequest(
  async (req: Request, res: Response): Promise<void> => {

    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(200).send();
      return;
    }

    const integrityKey = functions.config().wompi?.integrity_key;

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
  }
);
