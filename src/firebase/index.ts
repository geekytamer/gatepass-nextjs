// src/firebase/index.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, disableNetwork, enableNetwork } from 'firebase/firestore';
import firebaseConfig from './config';

function initializeFirebaseServices() {
  const isConfigured = getApps().length > 0;
  const app = isConfigured ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // THIS IS THE KEY PART FOR OFFLINE-ONLY
  // We disable the network connection to ensure no data is ever sent to the cloud.
  // disableNetwork(firestore);

  return { app, auth, firestore, isConfigured };
}

export function initializeFirebase() {
  const { app, auth, firestore } = initializeFirebaseServices();
  return { app, auth, firestore };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
