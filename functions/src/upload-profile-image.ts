import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as Busboy from "busboy";
import * as cors from "cors";


const corsHandler = cors({ origin: true });

if (!admin.apps.length) {
  admin.initializeApp();
}

export const uploadProfileImage = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {

    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const busboy = Busboy({ headers: req.headers });
    const bucket = admin.storage().bucket();

    let uploadPromise: Promise<string> | null = null;

    busboy.on("file", (_fieldname, file, info) => {
      const { filename, mimeType } = info;

      const filePath = `profile-images/${Date.now()}-${filename}`;
      const fileUpload = bucket.file(filePath);

      uploadPromise = new Promise((resolve, reject) => {
        const stream = fileUpload.createWriteStream({
          metadata: { contentType: mimeType },
        });

        file.pipe(stream);

        stream.on("finish", async () => {
          await fileUpload.makePublic();
          resolve(
            `https://storage.googleapis.com/${bucket.name}/${filePath}`
          );
        });

        stream.on("error", reject);
      });
    });

    busboy.on("finish", async () => {
      if (!uploadPromise) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const url = await uploadPromise;
      res.json({ url });
    });

    busboy.end(req.rawBody);
  });
});
