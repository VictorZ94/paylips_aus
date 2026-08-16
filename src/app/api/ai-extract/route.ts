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

function coerceRow(
  raw: Record<string, unknown>,
): { row: Payslip; defaultedAllowances: boolean } | null {
  const startRaw = raw.startDate;
  const endRaw = raw.endDate;
  if (startRaw === undefined || endRaw === undefined) return null;

  const startDate = toIsoDate(String(startRaw));
  const endDate = toIsoDate(String(endRaw));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return null;
  }

  const reqNum = (v: unknown): number | null => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const hoursWorked = reqNum(raw.hoursWorked);
  const earns = reqNum(raw.earns);
  const taxWithheld = reqNum(raw.taxWithheld);
  const sup = reqNum(raw.super);
  const totalEarned = reqNum(raw.totalEarned);
  // laundryAllowances defaults to 0 if absent
  const laundryRaw = raw.laundryAllowances;
  const defaultedAllowances =
    laundryRaw === undefined || laundryRaw === null || laundryRaw === "";
  const laundryAllowances =
    defaultedAllowances ? 0 : (reqNum(laundryRaw) ?? 0);

  if (
    hoursWorked === null ||
    earns === null ||
    taxWithheld === null ||
    sup === null ||
    totalEarned === null
  ) {
    return null;
  }

  const companyRaw = raw.company;
  const company =
    typeof companyRaw === "string" && companyRaw.trim().length > 0
      ? companyRaw.trim()
      : "Unknown";

  return {
    row: {
      id: `${startDate}|${endDate}`,
      startDate,
      endDate,
      hoursWorked,
      earns,
      laundryAllowances,
      taxWithheld,
      super: sup,
      totalEarned,
      company,
    },
    defaultedAllowances,
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
    let defaultedAllowances = 0;
    for (const raw of result.payslips) {
      const coerced = coerceRow(raw as unknown as Record<string, unknown>);
      if (coerced) {
        payslips.push(coerced.row);
        if (coerced.defaultedAllowances) defaultedAllowances++;
      }
    }
    return NextResponse.json({
      payslips,
      model,
      warnings: {
        defaultedAllowances,
        droppedRows: result.payslips.length - payslips.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, snippet: message.slice(0, 400) }, { status: 502 });
  }
}