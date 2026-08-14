import { NextResponse } from "next/server";
import { extractPayslipsFromImages, DEFAULT_MODEL } from "../../../lib/ollama-server";
import type { Payslip } from "../../../lib/types";

const MAX_PAGES = 6;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

const DATE_DDMMYYYY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

function toIsoDate(raw: string): string {
  const v = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = DATE_DDMMYYYY.exec(v);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    return `${m[3]}-${mm}-${dd}`;
  }
  return v;
}

function coerceRow(raw: Record<string, unknown>): Payslip | null {
  const required = [
    "startDate",
    "endDate",
    "hoursWorked",
    "earns",
    "laundryAllowances",
    "taxWithheld",
    "super",
    "totalEarned",
  ];
  for (const k of required) {
    if (raw[k] === undefined || raw[k] === null) return null;
  }
  const startDate = toIsoDate(String(raw.startDate));
  const endDate = toIsoDate(String(raw.endDate));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return null;
  }
  const hoursWorked = Number(raw.hoursWorked);
  const earns = Number(raw.earns);
  const laundryAllowances = Number(raw.laundryAllowances);
  const taxWithheld = Number(raw.taxWithheld);
  const sup = Number(raw.super);
  const totalEarned = Number(raw.totalEarned);
  if (
    ![hoursWorked, earns, laundryAllowances, taxWithheld, sup, totalEarned].every(Number.isFinite)
  ) {
    return null;
  }
  return {
    id: `${startDate}|${endDate}`,
    startDate,
    endDate,
    hoursWorked,
    earns,
    laundryAllowances,
    taxWithheld,
    super: sup,
    totalEarned,
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!process.env.OLLAMA_API_KEY) {
    return NextResponse.json(
      {
        error:
          "OLLAMA_API_KEY is not configured server-side. Add it to .env.local and restart the dev server.",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const images = form.getAll("images").filter((f): f is File => f instanceof File);
  if (images.length === 0) {
    return NextResponse.json(
      { error: "No images provided. Expected 'images' field with one file per page." },
      { status: 400 },
    );
  }
  if (images.length > MAX_PAGES) {
    return NextResponse.json(
      { error: `Too many pages; max ${MAX_PAGES}` },
      { status: 400 },
    );
  }

  for (const f of images) {
    if (f.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `Image too large (${f.name}, ${f.size} bytes); max ${MAX_FILE_BYTES}` },
        { status: 400 },
      );
    }
  }

  const modelField = form.get("model");
  const model = typeof modelField === "string" && modelField.trim().length > 0
    ? modelField.trim()
    : DEFAULT_MODEL;

  const base64: string[] = [];
  for (const f of images) {
    const buf = Buffer.from(await f.arrayBuffer());
    base64.push(buf.toString("base64"));
  }

  try {
    const result = await extractPayslipsFromImages(base64, model);
    const payslips: Payslip[] = [];
    for (const raw of result.payslips) {
      const row = coerceRow(raw as unknown as Record<string, unknown>);
      if (row) payslips.push(row);
    }
    return NextResponse.json({ payslips, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}