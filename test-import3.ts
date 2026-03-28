import * as adminNamespace from "firebase-admin";
const admin = (adminNamespace as any).default || adminNamespace;
console.log("admin.apps:", admin.apps);
