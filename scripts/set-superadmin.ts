import admin from "firebase-admin";

// Minimal setup - rely on same env variables as the server
if (!admin.apps.length) {
  try {
    const base64Credentials = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (base64Credentials) {
      const decodedKey = Buffer.from(base64Credentials, "base64").toString(
        "utf8",
      );
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(decodedKey)),
      });
    } else {
      // Default fallback using standard credentials logic
      admin.initializeApp();
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    process.exit(1);
  }
}

async function setSuperadminClaim(email: string) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { superadmin: true });
    console.log(
      `✅ Successfully granted 'superadmin: true' custom claim to user: ${email}`,
    );
    process.exit(0);
  } catch (error) {
    console.error(`❌ Failed to set superadmin claim for ${email}:`, error);
    process.exit(1);
  }
}

const targetEmail = process.argv[2];
if (!targetEmail) {
  console.error("Usage: npx tsx scripts/set-superadmin.ts <email>");
  process.exit(1);
}

setSuperadminClaim(targetEmail);
