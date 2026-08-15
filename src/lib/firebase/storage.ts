"use client";

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { getFirebaseApp } from "./client";

export function getFirebaseStorage() {
  const app = getFirebaseApp();
  if (!app) return null;
  return getStorage(app);
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
}

export async function uploadPayslipPdf(
  file: File,
  uid: string,
): Promise<{ url: string; path: string }> {
  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error(
      "Firebase Storage is not configured. Ensure NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is set.",
    );
  }
  const ts = Date.now();
  const path = `payslips/${uid}/${ts}-${safeName(file.name || "payslip.pdf")}`;
  const ref = storageRef(storage, path);
  const snapshot = await uploadBytes(ref, file, {
    contentType: file.type || "application/pdf",
  });
  const url = await getDownloadURL(snapshot.ref);
  return { url, path };
}