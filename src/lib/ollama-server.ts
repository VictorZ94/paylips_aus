import { Ollama } from "ollama";

export const PAYSLIP_SCHEMA = {
  type: "object",
  properties: {
    payslips: {
      type: "array",
      items: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "DD/MM/YYYY" },
          endDate: { type: "string", description: "DD/MM/YYYY" },
          hoursWorked: { type: "number" },
          earns: { type: "number", description: "Gross earnings in AUD" },
          laundryAllowances: { type: "number", description: "Laundry allowances in AUD" },
          taxWithheld: { type: "number", description: "Tax withheld in AUD" },
          super: { type: "number", description: "Super contributions in AUD" },
          totalEarned: { type: "number", description: "Net total earned in AUD" },
        },
        required: [
          "startDate",
          "endDate",
          "hoursWorked",
          "earns",
          "laundryAllowances",
          "taxWithheld",
          "super",
          "totalEarned",
        ],
      },
    },
  },
  required: ["payslips"],
} as const;

export const PROMPT = [
  "You are an Australian payroll data extractor. Two PDF formats reach this pipeline: a detailed format that breaks out allowances and super, and a minimal format that only prints gross/tax/net. The output schema is the SAME for both formats.",
  "",
  "Read the attached payslip pages and return a JSON object with a `payslips` array. Every payslip row must include ALL eight fields below:",
  "",
  "- startDate (DD/MM/YYYY)",
  "- endDate (DD/MM/YYYY)",
  "- hoursWorked (number — total hours worked in the pay period)",
  "- earns (number — gross earnings in AUD)",
  "- laundryAllowances (number — AUD; if no allowance line appears on the payslip, output 0; this is the ONLY field that may be defaulted)",
  "- taxWithheld (number — AUD)",
  "- super (number — AUD contribution for the period)",
  "- totalEarned (number — net AUD)",
  "",
  "Rules:",
  "- Output 0 for `laundryAllowances` when the source has no allowance line. All other numeric fields must come from the source — output the value exactly as printed. If a non-allowance numeric value is unreadable, omit the payslip rather than guess.",
  "- Preserve the original values exactly when they are present.",
  "- Only omit a payslip if start/end dates are unreadable.",
  "- The two formats differ only in which numeric lines they print; the field set is identical.",
].join("\n");

export const DEFAULT_MODEL = "gemma4:cloud";

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();

  // 1. Direct parse — happy path
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  // 2. Strip ```json ... ``` / ``` ... ``` code fences
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      // continue
    }
  }

  // 3. Find the first balanced top-level JSON object in the text
  const start = trimmed.indexOf("{");
  if (start >= 0) {
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = start; i < trimmed.length; i++) {
      const c = trimmed[i];
      if (inStr) {
        if (esc) {
          esc = false;
        } else if (c === "\\") {
          esc = true;
        } else if (c === '"') {
          inStr = false;
        }
      } else {
        if (c === '"') {
          inStr = true;
        } else if (c === "{") {
          depth++;
        } else if (c === "}") {
          depth--;
          if (depth === 0) {
            try {
              return JSON.parse(trimmed.slice(start, i + 1));
            } catch {
              break;
            }
          }
        }
      }
    }
  }

  // 4. Couldn't extract — surface the raw text in the error
  throw new Error(`Model returned non-JSON content: ${trimmed.slice(0, 200)}`);
}

export interface RawPayslip {
  startDate: string;
  endDate: string;
  hoursWorked: number;
  earns: number;
  laundryAllowances: number;
  taxWithheld: number;
  super: number;
  totalEarned: number;
}

export interface OllamaExtractResult {
  payslips: RawPayslip[];
}

export function newOllamaClient(): Ollama {
  const host = process.env.OLLAMA_HOST ?? "https://ollama.com";
  const apiKey = process.env.OLLAMA_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  return new Ollama({ host, headers });
}

export async function extractPayslipsFromImages(
  imagesBase64: string[],
  model: string = DEFAULT_MODEL,
): Promise<OllamaExtractResult> {
  const client = newOllamaClient();
  const response = await client.chat({
    model,
    messages: [
      {
        role: "user",
        content: PROMPT,
        images: imagesBase64,
      },
    ],
    format: PAYSLIP_SCHEMA,
    stream: false,
  });
  const text = response.message?.content ?? "";
  const parsed = extractJsonObject(text) as OllamaExtractResult;
  if (!parsed || !Array.isArray(parsed.payslips)) {
    throw new Error("Model response missing payslips array");
  }
  return parsed;
}