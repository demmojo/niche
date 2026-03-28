import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json"));
config.apiKey = process.env.VITE_FIREBASE_API_KEY;

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  console.log("Fetching workspaces...");
  try {
    const ws = await getDocs(collection(db, "workspaces"));
    ws.forEach((d) => console.log(d.id));
    console.log("Done");
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
