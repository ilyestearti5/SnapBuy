import { initMyCloud } from "@biqpod/app/ui/apis";
import { Biqpod } from "@biqpod/app/ui/types";
export const cloud = initMyCloud({
  apiKey: "AIzaSyB0XSUnBSOaIWp-37u2N4ib5bY8-09Zeq0",
  authDomain: "water-fetch.firebaseapp.com",
  databaseURL: "https://water-fetch-default-rtdb.firebaseio.com",
  projectId: "water-fetch",
  storageBucket: "water-fetch.appspot.com",
  messagingSenderId: "911813185967",
  appId: "1:911813185967:web:4447a361eeaddd00315f5a",
  measurementId: "G-8GB7LZPHVX",
  functions: {
    devUri: (fnId) => `http://localhost:3000/invoke/${fnId}`,
    prodUri: (fnId) => {
      return `https://developed-nickie-biqpod-7b27f741.koyeb.app/invoke/${fnId}`;
    },
  },
});
// this is needed in the project for default informations
cloud.setAsMain();
export const { nosql: db, functions, auth, storage, ai } = cloud.app;
export const {
  getDoc,
  getDocs,
  getCollections,
  createDoc,
  upsertDoc: setDoc,
  deleteDoc,
  onCollectionSnapshot,
  onDocSnapshot,
  onAutoSnapshot,
} = cloud.app.nosql;
export const {
  signIn,
  signOut,
  generateToken,
  onAuthStateChanged,
  deleteUser,
  signInWithCustomToken,
  getCurrentAuth,
} = cloud.app.auth;
export const {
  upsertFile: uploadFile,
  deleteFile,
  getDownloadURL,
  getFileContent: getContent,
} = cloud.app.storage;
export const settings: Biqpod.System.Setting.Type[] = [];
