import admin from "firebase-admin";
import * as dotenv from "dotenv";
dotenv.config();

if (!admin.apps.length) {
  try {
    const base64Credentials = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (base64Credentials) {
      const decodedKey = Buffer.from(base64Credentials, "base64").toString(
        "utf8",
      );
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(decodedKey)),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    process.exit(1);
  }
}

async function createOrUpdateUser() {
  const email = "mo.hassaniv@gmail.com";
  const password = "rockpaperscissorsnuke";
  try {
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log("User already exists, updating password...");
      await admin.auth().updateUser(user.uid, { password });
    } catch (e: any) {
      if (e.code === "auth/user-not-found") {
        console.log("User not found, creating new user...");
        user = await admin.auth().createUser({ email, password });
      } else {
        throw e;
      }
    }
    await admin.auth().setCustomUserClaims(user.uid, { superadmin: true });
    console.log(
      `✅ Successfully configured user ${email} with superadmin claims and set password.`,
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createOrUpdateUser();
