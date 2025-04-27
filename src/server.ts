import { initMyCloud } from "biqpod/ui/apis";
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
    devUri: (fnId) => `https://biqpod.netlify.app/.netlify/functions/${fnId}`,
  },
});
// this is needed in the project for default informations
cloud.setAsMain();
export const { nosql: db, auth, storage } = cloud.app;
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
