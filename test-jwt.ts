import * as adminNamespace from "firebase-admin";
import fs from "fs";
const firebaseConfig = JSON.parse(
  fs.readFileSync("./firebase-applet-config.json", "utf-8"),
);
const admin = (adminNamespace as any).default || adminNamespace;
const app = admin.initializeApp({ projectId: firebaseConfig.projectId });
console.log(app.options.projectId);
