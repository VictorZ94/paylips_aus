"use client";

import {
  collection,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import type { Payslip } from "./types";
import { getFirebaseDb, getFirebaseAuth } from "./firebase/client";

const COLLECTION = "payslips";

function requireDb() {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error("Firestore is not configured.");
  }
  return db;
}

function requireUid(): string {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) {
    throw new Error("Not signed in.");
  }
  return user.uid;
}

function payslipsCol(uid: string) {
  return collection(requireDb(), "users", uid, COLLECTION);
}

function withCompanyBackfill(rows: unknown[]): Payslip[] {
  const out: Payslip[] = [];
  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const obj = raw as Partial<Payslip> & { id?: unknown };
    if (typeof obj.id !== "string") continue;
    out.push({
      id: obj.id,
      startDate: String(obj.startDate ?? ""),
      endDate: String(obj.endDate ?? ""),
      hoursWorked: Number(obj.hoursWorked ?? 0),
      earns: Number(obj.earns ?? 0),
      laundryAllowances: Number(obj.laundryAllowances ?? 0),
      taxWithheld: Number(obj.taxWithheld ?? 0),
      super: Number(obj.super ?? 0),
      totalEarned: Number(obj.totalEarned ?? 0),
      company:
        typeof obj.company === "string" && obj.company ? obj.company : "Unknown",
    });
  }
  return out;
}

async function getAllRows(): Promise<Payslip[]> {
  const uid = requireUid();
  const snap = await getDocs(payslipsCol(uid));
  const rows = withCompanyBackfill(snap.docs.map((d) => d.data()));
  rows.sort((a, b) => a.startDate.localeCompare(b.startDate));
  return rows;
}

async function putAllRows(rows: Payslip[]): Promise<void> {
  const uid = requireUid();
  const colRef = payslipsCol(uid);
  const db = requireDb();
  const existing = await getDocs(colRef);
  const batch = writeBatch(db);
  for (const existingDoc of existing.docs) {
    batch.delete(doc(colRef, existingDoc.id));
  }
  for (const row of rows) {
    const ref = doc(colRef, row.id);
    batch.set(ref, {
      ...row,
      uid,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

async function clearAllRows(): Promise<void> {
  const uid = requireUid();
  const colRef = payslipsCol(uid);
  const db = requireDb();
  const existing = await getDocs(colRef);
  if (existing.empty) return;
  const batch = writeBatch(db);
  for (const existingDoc of existing.docs) {
    batch.delete(doc(colRef, existingDoc.id));
  }
  await batch.commit();
}

export const payslipsRepo = {
  getAll: getAllRows,
  putAll: putAllRows,
  clear: clearAllRows,
};
