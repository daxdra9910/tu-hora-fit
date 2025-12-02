import * as functions from "firebase-functions";
import * as CryptoJS from "crypto-js";
import { Request, Response } from "express";

const integrityKey = process.env.INTEGRITY_KEY!;

export const generateIntegritySignature = functions.https.onRequest(
  async (req: Request, res: Response): Promise<void> => {
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
  }
);
