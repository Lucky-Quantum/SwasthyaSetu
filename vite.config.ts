import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function readJsonBody(req: any) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk: any) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}") as Record<string, unknown>);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: any, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function getOfflineAssistantReply(prompt: string, lang: string): string {
  const text = prompt.toLowerCase();

  // Emergency query
  if (
    text.includes("emergency") ||
    text.includes("108") ||
    text.includes("urgent") ||
    text.includes("आपात") ||
    text.includes("तातडी")
  ) {
    if (lang === "hi") {
      return "आपातकालीन स्थिति में तुरंत 108 नंबर पर कॉल करें या नजदीकी आपातकालीन केंद्र (District Hospital/CHC) जाएँ। स्वास्थ्यसेतु रेफरल समन्वय के लिए है, आपातकालीन प्राथमिक उपचार के लिए नहीं।";
    }
    if (lang === "mr") {
      return "तातडीच्या प्रसंगी त्वरित 108 रुग्णवाहिका सेवेला संपर्क साधा किंवा जवळच्या शासकीय रुग्णालयात जा. स्वास्थ्यसेतू रेफरल समन्वय सेवा आहे, आपत्कालीन प्रथमोपचार नाही.";
    }
    return "For acute medical emergencies, call 108 immediately or visit your nearest Emergency Department. SwasthyaSetu provides referral coordination and does not handle acute emergency response.";
  }

  // Referral query
  if (
    text.includes("referral") ||
    text.includes("work") ||
    text.includes("रेफरल") ||
    text.includes("काम") ||
    text.includes("flow")
  ) {
    if (lang === "hi") {
      return "स्वास्थ्यसेतु में एक बंद लूप (Closed-Loop) रेफरल प्रक्रिया है: आशा कार्यकर्ता गाँव में मरीज की जाँच कर डिजिटल रेफरल बनाती हैं। पीएचसी/सीएचसी के डॉक्टर इसे स्वीकार कर अप्वाइंटमेंट तय करते हैं और उपचार पूरा होने तक मरीज व प्रशासन को हर चरण दिखता है।";
    }
    if (lang === "mr") {
      return "स्वास्थ्यसेतूमध्ये रेफरल प्रवास अखंड जोडलेला आहे: आशा कार्यकर्त्या प्राथमिक तपासणी करून डिजिटल रेफरल तयार करतात. रुग्णालयातील डॉक्टर रेफरल स्वीकारून वेळ निश्चित करतात आणि उपचार पूर्ण होईपर्यंत स्थिती दिसते.";
    }
    return "In SwasthyaSetu, referrals follow a closed-loop journey: the frontline health worker (ASHA/CHO) logs vitals, runs decision support, and creates a digital referral. The receiving doctor accepts it, books an appointment, and records consultations until care is completed.";
  }

  // Appointment / Bring query
  if (
    text.includes("bring") ||
    text.includes("appointment") ||
    text.includes("document") ||
    text.includes("लाना") ||
    text.includes("कागद") ||
    text.includes("आणा")
  ) {
    if (lang === "hi") {
      return "अस्पताल जाते समय अपना आधार कार्ड या सरकारी पहचान पत्र, स्वास्थ्यसेतु मरीज आईडी, पूर्व की सभी मेडिकल रिपोर्ट्स/पर्चियाँ, और वर्तमान में चल रही दवाइयाँ साथ लेकर आएँ।";
    }
    if (lang === "mr") {
      return "रुग्णालयात जाताना आधार कार्ड किंवा ओळखपत्र, स्वास्थ्यसेतू रुग्ण आयडी, जुने वैद्यकीय अहवाल आणि सध्या सुरू असणारी औषधे सोबत ठेवावीत.";
    }
    return "Please bring your Government ID (e.g. Aadhaar card), your SwasthyaSetu Patient ID (such as SS-PAT-1024), any previous lab/diagnostic reports, and current medications to your appointment.";
  }

  // Follow-up query
  if (
    text.includes("follow") ||
    text.includes("care") ||
    text.includes("फॉलो") ||
    text.includes("पाठपुरावा") ||
    text.includes("gaps")
  ) {
    if (lang === "hi") {
      return "डॉक्टर द्वारा परामर्श और उपचार दर्ज करने के बाद मरीज का डिजिटल कार्ड अपडेट हो जाता है। स्थानीय आशा कार्यकर्ता को अलर्ट मिलता है ताकि वे घर जाकर स्वास्थ्य सुधार का फॉलो-अप ले सकें।";
    }
    if (lang === "mr") {
      return "डॉक्टरांनी उपचार पूर्ण केल्यावर डिजिटल कार्डवर नोंदी अद्ययावत होतात. स्थानिक आशा सेविकेला सूचना मिळते आणि त्या प्रत्यक्ष भेट देऊन तब्येतीचा पाठपुरावा घेतात.";
    }
    return "After your consultation and diagnostics, follow-up dates and instructions appear directly in your Patient Dashboard. Your local ASHA worker also receives a care-gap reminder to verify recovery.";
  }

  // General fallback
  if (lang === "hi") {
    return "स्वास्थ्यसेतु ग्रामीण स्वास्थ्य व्यवस्था को जोड़ता है ताकि किसी भी मरीज का इलाज अधूरा न रहे। आप रेफरल, अप्वाइंटमेंट या सुविधाओं के बारे में प्रश्न पूछ सकते हैं।";
  }
  if (lang === "mr") {
    return "स्वास्थ्यसेतू ग्रामीण आरोग्य यंत्रणेतील प्रत्येक पाऊल जोडते. आपण रेफरल, भेटीची वेळ किंवा आरोग्य केंद्रांबाबत अधिक माहिती विचारू शकता.";
  }
  return "SwasthyaSetu coordinates care across village health workers, doctors, and district health authorities to ensure no referral is lost. You can ask about referral workflows, appointments, or navigating public health services.";
}

function computeServerRuleBasedTriage(input: any) {
  const symptomsLower = (input.symptoms || []).map((s: string) => String(s).toLowerCase());
  const symptomsStr = symptomsLower.join(" ");

  let sys = 120;
  let dia = 80;
  if (input.vitals?.bloodPressure) {
    const parts = String(input.vitals.bloodPressure)
      .replace(/\s+/g, "")
      .split("/")
      .map((p: string) => parseInt(p, 10));
    if (!isNaN(parts[0])) sys = parts[0];
    if (!isNaN(parts[1])) dia = parts[1];
  }

  const pulse = parseInt(input.vitals?.pulse || "80", 10) || 80;
  const spo2 = parseInt(input.vitals?.spo2 || "98", 10) || 98;
  const tempStr = String(input.vitals?.temperature || "98.6");
  const tempVal = parseFloat(tempStr) || 98.6;
  const isHighFever = tempVal >= 101.5 || (tempVal < 50 && tempVal >= 38.6);

  let urgency: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY" = "LOW";
  const keyConcerns: string[] = [];
  const importantFindings: string[] = [];
  const missingInformation: string[] = [];

  const emergencyKeywords = [
    "chest pain",
    "unconscious",
    "severe breathlessness",
    "breathing difficulty",
    "convulsion",
    "seizure",
    "heavy bleeding",
    "stroke",
  ];
  const conditionLower = String(input.currentCondition || "").toLowerCase();
  const hasEmergencySymptom = emergencyKeywords.some(
    (k) => symptomsStr.includes(k) || conditionLower.includes(k)
  );

  if (hasEmergencySymptom && (spo2 < 93 || sys >= 170 || sys < 85 || pulse > 120)) {
    urgency = "EMERGENCY";
    keyConcerns.push("Immediate acute distress detected with unstable vital parameters");
    if (spo2 < 93) keyConcerns.push(`Respiratory distress with SpO2 at ${spo2}%`);
    if (sys >= 170) keyConcerns.push(`Hypertensive urgency/crisis warning (BP: ${sys}/${dia} mmHg)`);
    if (pulse > 120) keyConcerns.push(`Severe tachycardia: ${pulse} bpm`);
  } else if (
    hasEmergencySymptom ||
    spo2 < 94 ||
    sys >= 145 ||
    dia >= 92 ||
    pulse > 105 ||
    pulse < 55 ||
    isHighFever ||
    symptomsStr.includes("dizziness") ||
    symptomsStr.includes("fainting") ||
    symptomsStr.includes("weakness")
  ) {
    urgency = "HIGH";
    if (sys >= 140 || dia >= 90) {
      keyConcerns.push(`Elevated blood pressure (${sys}/${dia} mmHg) indicates Stage 1/2 Hypertension`);
    }
    if (symptomsStr.includes("dizziness") || symptomsStr.includes("weakness")) {
      keyConcerns.push("Postural instability, transient cerebral hypoperfusion, or metabolic dehydration");
    }
    if (spo2 < 95) {
      keyConcerns.push(`Sub-optimal oxygen saturation (${spo2}%) requiring respiratory auscultation`);
    }
    if (isHighFever) {
      keyConcerns.push(`Febrile syndrome (${tempStr}) requiring acute infection screening`);
    }
  } else if (
    symptomsLower.length > 0 ||
    sys >= 130 ||
    dia >= 85 ||
    symptomsStr.includes("cough") ||
    symptomsStr.includes("pain")
  ) {
    urgency = "MEDIUM";
    keyConcerns.push("Symptomatic presentation requiring secondary clinical evaluation");
    if (sys >= 130 || dia >= 85) {
      keyConcerns.push(`Pre-hypertension baseline (BP ${sys}/${dia} mmHg)`);
    }
  } else {
    urgency = "LOW";
    keyConcerns.push("Routine assessment; vital signs within manageable primary care parameters");
  }

  if (input.vitals?.bloodPressure) importantFindings.push(`Recorded BP: ${input.vitals.bloodPressure}`);
  if (input.vitals?.pulse) importantFindings.push(`Pulse: ${input.vitals.pulse} bpm`);
  if (input.vitals?.spo2) importantFindings.push(`Oxygen Saturation (SpO2): ${input.vitals.spo2}%`);
  if (input.vitals?.temperature) importantFindings.push(`Body Temp: ${input.vitals.temperature}`);
  if (input.symptoms?.length > 0) importantFindings.push(`Symptoms logged: ${input.symptoms.join(", ")}`);

  if (!input.notes || String(input.notes).trim().length < 5) {
    missingInformation.push("Detailed symptom onset duration and progression history");
  }
  missingInformation.push("Recent laboratory tests (Hb/CBC, fasting blood glucose, kidney panel)");
  missingInformation.push("Medication adherence history and known drug allergies");

  let referralReason = "";
  let recommendedAction = "";

  if (urgency === "EMERGENCY") {
    referralReason = "Acute clinical presentation with compromised vital parameters requiring immediate higher-center evaluation.";
    recommendedAction = "Activate 108 emergency transport to nearest District Hospital; provide basic life support monitoring en route.";
  } else if (urgency === "HIGH") {
    referralReason = "Persistent symptomatic cluster (weakness/dizziness/elevated vitals) requiring specialist consultation and diagnostic workup.";
    recommendedAction = "Refer to Community Health Centre (CHC) or Sub-District Hospital for physician review within 24-48 hours; advise patient rest and hydration.";
  } else if (urgency === "MEDIUM") {
    referralReason = "Sub-acute presentation requiring medical officer assessment and routine laboratory investigations.";
    recommendedAction = "Schedule outpatient consultation at nearest Primary Health Centre (PHC); advise lifestyle management and regular vitals check.";
  } else {
    referralReason = "Routine wellness evaluation and preventative screening.";
    recommendedAction = "Counsel on diet and hydration; schedule routine follow-up with ASHA/CHO in 7 days.";
  }

  return {
    urgency,
    keyConcerns,
    importantFindings,
    missingInformation,
    referralReason,
    recommendedAction,
    clinicianReviewRequired: true,
    model: "Clinical Decision Support Rule Engine (Screening / Offline Mode)",
    generatedAt: new Date().toISOString(),
  };
}

function createOpenRouterChatMiddleware(env: Record<string, string>) {
  return async (req: any, res: any, next: any) => {
    if (req.method !== "POST") {
      next();
      return;
    }

    let messages: Array<{ role: "user" | "assistant"; content: string }>;
    let language: "en" | "hi" | "mr" = "en";
    try {
      const body = await readJsonBody(req);
      if (body.language === "hi" || body.language === "mr" || body.language === "en") {
        language = body.language;
      }
      if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 10) {
        sendJson(res, 400, { error: "Send between 1 and 10 chat messages." });
        return;
      }

      messages = body.messages.map((entry) => {
        if (!entry || typeof entry !== "object") {
          throw new Error("Invalid chat message.");
        }
        const message = entry as Record<string, unknown>;
        if (
          (message.role !== "user" && message.role !== "assistant") ||
          typeof message.content !== "string" ||
          message.content.trim().length === 0 ||
          message.content.length > 1200
        ) {
          throw new Error("Chat messages must be text under 1,200 characters.");
        }
        return {
          role: message.role,
          content: message.content.trim(),
        };
      });
    } catch (error) {
      sendJson(res, 400, {
        error: error instanceof Error ? error.message : "Invalid chat request.",
      });
      return;
    }

    // If OpenRouter API key is not configured, gracefully provide the offline knowledge response
    if (!env.OPENROUTER_API_KEY) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
      const reply = getOfflineAssistantReply(lastUserMsg, language);
      sendJson(res, 200, { reply });
      return;
    }

    const systemMessage = [
      "You are SwasthyaSetu Assistant for a public-sector healthcare navigation prototype in India.",
      `Reply in ${language === "hi" ? "Hindi" : language === "mr" ? "Marathi" : "English"}.`,
      "Give concise, plain-language general information about public health services and how to use this app.",
      "Do not diagnose, triage symptoms, recommend or prescribe medicine, or replace a qualified clinician.",
      "For emergencies, tell the user to call 108 or their local emergency service immediately; do not assess severity.",
      "Never claim access to patient records, real-time facility availability, or a user's location.",
      "Do not ask for names, patient IDs, ABHA numbers, phone numbers, or private health details.",
      "For personal medical advice, direct the user to a qualified healthcare professional.",
    ].join(" ");

    try {
      const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": env.OPENROUTER_SITE_URL || "http://localhost",
          "X-Title": "SwasthyaSetu Assistant",
        },
        body: JSON.stringify({
          model: env.OPENROUTER_MODEL || "openrouter/auto",
          messages: [
            { role: "system", content: systemMessage },
            ...messages,
          ],
          temperature: 0.3,
          max_tokens: 450,
          stream: false,
        }),
        signal: AbortSignal.timeout(25_000),
      });

      const payload = (await upstream.json().catch(() => ({}))) as Record<string, any>;
      if (!upstream.ok) {
        const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
        sendJson(res, 200, { reply: getOfflineAssistantReply(lastUserMsg, language) });
        return;
      }

      const reply = payload?.choices?.[0]?.message?.content;
      if (typeof reply !== "string" || !reply.trim()) {
        const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
        sendJson(res, 200, { reply: getOfflineAssistantReply(lastUserMsg, language) });
        return;
      }

      sendJson(res, 200, { reply: reply.trim() });
    } catch {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
      sendJson(res, 200, { reply: getOfflineAssistantReply(lastUserMsg, language) });
    }
  };
}

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i)?.[1] ?? text;
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("The model did not return JSON");
  }
  return JSON.parse(fenced.slice(start, end + 1)) as Record<string, unknown>;
}

function demoApiPlugin(env: Record<string, string>): Plugin {
  const openRouterChatMiddleware = createOpenRouterChatMiddleware(env);

  const syncMiddleware = async (req: any, res: any, next: any) => {
    if (req.method !== "POST") {
      next();
      return;
    }

    try {
      const body = await readJsonBody(req);
      const patients = Array.isArray(body.patients) ? body.patients.length : 0;
      const referrals = Array.isArray(body.referrals) ? body.referrals.length : 0;
      sendJson(res, 200, {
        ok: true,
        syncedAt: new Date().toISOString(),
        accepted: { patients, referrals },
        target: "demo-local-sync-endpoint",
      });
    } catch (error) {
      sendJson(res, 400, {
        ok: false,
        error: error instanceof Error ? error.message : "Sync failed",
      });
    }
  };

  const triageMiddleware = async (req: any, res: any, next: any) => {
    if (req.method !== "POST") {
      next();
      return;
    }

    try {
      const input = await readJsonBody(req);

      // If Qwen API key is not configured, immediately use the intelligent decision support rule engine
      if (!env.QWEN_API_KEY || !env.QWEN_BASE_URL) {
        const fallbackResult = computeServerRuleBasedTriage(input);
        sendJson(res, 200, {
          result: fallbackResult,
        });
        return;
      }

      const model = env.QWEN_MODEL || "qwen-plus";
      const endpoint = `${env.QWEN_BASE_URL.replace(/\/$/, "")}/chat/completions`;

      const systemPrompt = [
        "You are a clinical decision-support assistant for the SwasthyaSetu rural public-health prototype.",
        "You are NOT a diagnosing doctor. Do not prescribe medication.",
        "Analyze only the provided symptoms, vitals and context.",
        "Return ONLY a valid JSON object matching this schema:",
        '{"urgency":"LOW|MEDIUM|HIGH|EMERGENCY","keyConcerns":["..."],"importantFindings":["..."],"missingInformation":["..."],"referralReason":"...","recommendedAction":"...","clinicianReviewRequired":true}',
        "Emergency should be used only when the supplied information contains clear danger signs. Otherwise use HIGH or MEDIUM conservatively.",
        "The final clinical decision must remain with a qualified healthcare professional.",
      ].join("\n");

      const userPrompt = JSON.stringify(input, null, 2);

      const aiResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.QWEN_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 700,
        }),
      });

      const payload = (await aiResponse.json().catch(() => ({}))) as Record<string, any>;

      if (!aiResponse.ok) {
        // Upstream failed: fall back to rule engine
        sendJson(res, 200, { result: computeServerRuleBasedTriage(input) });
        return;
      }

      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        sendJson(res, 200, { result: computeServerRuleBasedTriage(input) });
        return;
      }

      const result = extractJson(content);
      sendJson(res, 200, {
        result: {
          ...result,
          clinicianReviewRequired: true,
          model,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch {
      sendJson(res, 200, { result: computeServerRuleBasedTriage({}) });
    }
  };

  return {
    name: "swasthya-demo-api",
    configureServer(server) {
      server.middlewares.use("/api/chat", openRouterChatMiddleware);
      server.middlewares.use("/api/sync", syncMiddleware);
      server.middlewares.use("/api/ai/triage", triageMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/chat", openRouterChatMiddleware);
      server.middlewares.use("/api/sync", syncMiddleware);
      server.middlewares.use("/api/ai/triage", triageMiddleware);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), demoApiPlugin(env)],
  };
});
