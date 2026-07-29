import admin from "firebase-admin";

let db: admin.firestore.Firestore | null;

export const connectDB = (): admin.firestore.Firestore | never => {
  if (db) return db;

  const cred = process.env.FIREBASE_CRED;
  if (!cred) throw new Error("DB credentials missing");

  const parsedCred = JSON.parse(cred);
  const credentials: admin.ServiceAccount = {
    projectId: parsedCred.project_id,
    clientEmail: parsedCred.client_email,
    privateKey: parsedCred.private_key,
  };

  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });

  db = admin.firestore();

  return db;
};
