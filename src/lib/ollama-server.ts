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

export const PROMPT =
  "You are an Australian payroll data extractor. Read the attached payslip pages and return a JSON object with a `payslips` array. Each item must include: startDate (DD/MM/YYYY), endDate (DD/MM/YYYY), hoursWorked (total hours worked in the period), earns (gross $), laundryAllowances ($), taxWithheld ($), super ($ contributed), totalEarned ($ net). Preserve the original values exactly. If a value is unclear, omit that payslip rather than guessing.";

export const DEFAULT_MODEL = "gemma4:cloud";

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
  const text = response.message?.content ?? "{}";
  let parsed: OllamaExtractResult;
  try {
    parsed = JSON.parse(text) as OllamaExtractResult;
  } catch {
    throw new Error(`Model returned non-JSON content: ${text.slice(0, 200)}`);
  }
  if (!parsed || !Array.isArray(parsed.payslips)) {
    throw new Error("Model response missing payslips array");
  }
  return parsed;
}