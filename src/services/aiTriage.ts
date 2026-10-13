export interface TriageInput {
  patientId: string;
  age: number;
  gender: string;
  symptoms: string[];
  vitals: {
    bloodPressure: string;
    pulse: string;
    temperature: string;
    spo2: string;
  };
  currentCondition: string;
  notes: string;
}

export interface TriageResult {
  urgency: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
  keyConcerns: string[];
  importantFindings: string[];
  missingInformation: string[];
  referralReason: string;
  recommendedAction: string;
  clinicianReviewRequired: true;
  model: string;
  generatedAt: string;
}

export async function runAiTriage(input: TriageInput): Promise<TriageResult> {
  const response = await fetch("/api/ai/triage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    result?: Partial<TriageResult>;
    error?: string;
    model?: string;
  };

  if (!response.ok || !payload.result) {
    throw new Error(payload.error ?? "AI triage request failed");
  }

  return {
    urgency: payload.result.urgency ?? "MEDIUM",
    keyConcerns: payload.result.keyConcerns ?? [],
    importantFindings: payload.result.importantFindings ?? [],
    missingInformation: payload.result.missingInformation ?? [],
    referralReason: payload.result.referralReason ?? "Clinical review required.",
    recommendedAction: payload.result.recommendedAction ?? "Review by qualified healthcare professional.",
    clinicianReviewRequired: true,
    model: payload.result.model ?? payload.model ?? "Qwen",
    generatedAt: payload.result.generatedAt ?? new Date().toISOString(),
  };
}
