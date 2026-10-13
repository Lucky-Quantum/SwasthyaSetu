import { sharedFacilities } from "./facilityData";

export type ReferralPriority = "Emergency" | "High" | "Medium" | "Routine";
export type TriageLevel = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
export type ReferralStatus =
  | "New"
  | "Accepted"
  | "Awaiting Diagnostics"
  | "Consultation"
  | "Diagnostics"
  | "Treatment"
  | "Follow-up"
  | "Completed"
  | "Stuck";

export type JourneyStage =
  | "Referral Created"
  | "Referral Accepted"
  | "Appointment Booked"
  | "Consultation"
  | "Diagnostics"
  | "Treatment"
  | "Follow-up"
  | "Completed";

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  village: string;
  district: string;
  allergies: string[];
  conditions: string[];
  currentMedications: string[];
  chiefComplaint: string;
  symptoms: string[];
  vitals: {
    bp: string;
    pulse: string;
    temp: string;
    spo2: string;
  };
  relevantHistory: string;
  previousConsultations: string[];
  previousDiagnostics: string[];
  preferredLanguage: "English" | "Hindi" | "Marathi";
  emergencyContact: string;
}

export interface ReferralRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientVillage: string;
  patientDistrict: string;
  specialty: string;
  facility: string;
  referringFacility: string;
  referringWorker: string;
  reasonForReferral: string;
  priority: ReferralPriority;
  triageLevel?: TriageLevel;
  triageSignals?: string[];
  status: ReferralStatus;
  waitingTime: string;
  diagnosticsAvailable: string[];
  distance: string;
  createdAt: string;
  acceptedAt?: string;
  appointmentDate?: string;
  journey: JourneyStage[];
  aiSummary?: {
    keyConcerns: string[];
    importantFindings: string[];
    missingInformation: string[];
    previousCare: string;
    referralReason: string;
  };
  doctorNotes?: string;
  treatment?: string;
  prescription?: string;
  followUpDate?: string;
  requestedDiagnostics?: string[];
  careGaps?: string[];
}

export interface Bottleneck {
  id: string;
  label: string;
  severity: "High" | "Medium" | "Low";
  count: number;
  description: string;
}

export interface DelayReason {
  category: string;
  count: number;
  percentage: number;
}

export interface FacilityData {
  name: string;
  district: string;
  activeReferrals: number;
  avgWaitingTime: string;
  specialistAvailability: string;
  diagnosticAvailability: string;
  completionRate: number;
  currentBottleneck: string;
}

export interface AdminStats {
  totalPatients: number;
  activeReferrals: number;
  referralCompletionRate: number;
  highRiskPatients: number;
  avgReferralTime: string;
  pendingFollowups: number;
}

export const demoPatients: PatientRecord[] = [
  {
    id: "SS-PAT-1024",
    name: "Ramesh Patil",
    age: 52,
    gender: "Male",
    village: "Karanji",
    district: "Nashik",
    allergies: ["Penicillin"],
    conditions: ["Type 2 Diabetes", "Hypertension"],
    currentMedications: ["Metformin 500 mg", "Amlodipine 5 mg"],
    chiefComplaint: "Persistent weakness and elevated blood pressure",
    symptoms: ["Weakness", "Dizziness", "Blurred vision"],
    vitals: { bp: "146/92", pulse: "84 bpm", temp: "98.6 °F", spo2: "98%" },
    relevantHistory: "Diagnosed with Type 2 Diabetes 3 years ago. Hypertension managed with medication.",
    previousConsultations: [
      "PHC Karanji - General check-up (Aug 2026)",
      "PHC Karanji - BP monitoring (Jul 2026)",
    ],
    previousDiagnostics: [
      "CBC - Normal (Aug 2026)",
      "HbA1c - 7.2% (Aug 2026)",
    ],
    preferredLanguage: "Marathi",
    emergencyContact: "Meena Patil - Family",
  },
  {
    id: "SS-PAT-1048",
    name: "Sita More",
    age: 28,
    gender: "Female",
    village: "Karanji",
    district: "Nashik",
    allergies: ["None recorded"],
    conditions: ["Pregnancy (2nd trimester)"],
    currentMedications: ["Folic acid", "Iron supplement"],
    chiefComplaint: "ANC follow-up - routine prenatal check-up",
    symptoms: ["Fatigue", "Nausea", "Back pain"],
    vitals: { bp: "112/72", pulse: "76 bpm", temp: "98.4 °F", spo2: "99%" },
    relevantHistory: "No complications in current pregnancy. Previous delivery was normal.",
    previousConsultations: [
      "PHC Karanji - ANC visit (Jul 2026)",
      "District Hospital - Ultrasound (Aug 2026)",
    ],
    previousDiagnostics: [
      "CBC - Normal",
      "Blood group - B+",
    ],
    preferredLanguage: "Marathi",
    emergencyContact: "Rajesh More - Family",
  },
  {
    id: "SS-PAT-1072",
    name: "Mahesh Pawar",
    age: 64,
    gender: "Male",
    village: "Dindori Road",
    district: "Nashik",
    allergies: ["Sulfa drugs"],
    conditions: ["Diabetes Type 2", "Chronic kidney disease"],
    currentMedications: ["Metformin 500 mg", "Enalapril 10 mg"],
    chiefComplaint: "Diabetes review - glucose levels inconsistent",
    symptoms: ["Increased thirst", "Frequent urination", "Fatigue"],
    vitals: { bp: "138/88", pulse: "78 bpm", temp: "98.2 °F", spo2: "97%" },
    relevantHistory: "CKD stage 2 diagnosed 6 months ago. Kidney function being monitored.",
    previousConsultations: [
      "PHC Karanji - Diabetes review (Aug 2026)",
      "District Hospital - Kidney function test (Sep 2026)",
    ],
    previousDiagnostics: [
      "HbA1c - 8.1% (Sep 2026)",
      "Serum creatinine - 1.4 mg/dL",
    ],
    preferredLanguage: "Hindi",
    emergencyContact: "Sunita Pawar - Family",
  },
  {
    id: "SS-PAT-1091",
    name: "Aarav Shinde",
    age: 7,
    gender: "Male",
    village: "Karanji",
    district: "Nashik",
    allergies: ["None recorded"],
    conditions: [],
    currentMedications: [],
    chiefComplaint: "High fever with breathing difficulty for 3 days",
    symptoms: ["Fever", "Cough", "Breathing difficulty", "Chest congestion"],
    vitals: { bp: "98/62", pulse: "112 bpm", temp: "102.4 °F", spo2: "94%" },
    relevantHistory: "No known chronic conditions. Previous episode of pneumonia at age 3.",
    previousConsultations: [
      "PHC Karanji - Immunization (May 2026)",
    ],
    previousDiagnostics: [
      "Chest X-Ray - Normal (May 2026)",
    ],
    preferredLanguage: "Marathi",
    emergencyContact: "Priya Shinde - Mother",
  },
  {
    id: "SS-PAT-1114",
    name: "Lata Gaikwad",
    age: 47,
    gender: "Female",
    village: "Peth",
    district: "Nashik",
    allergies: ["Aspirin"],
    conditions: ["Thyroid disorder", "Migraine"],
    currentMedications: ["Levothyroxine 75 mcg", "Sumatriptan 50 mg"],
    chiefComplaint: "Referral awaiting acceptance - thyroid nodule evaluation",
    symptoms: ["Neck swelling", "Weight gain", "Fatigue", "Cold intolerance"],
    vitals: { bp: "124/78", pulse: "72 bpm", temp: "98.5 °F", spo2: "98%" },
    relevantHistory: "Hypothyroidism for 5 years. Thyroid nodule detected in recent ultrasound.",
    previousConsultations: [
      "PHC Karanji - Thyroid check (Aug 2026)",
      "Rural Hospital Dindori - USG (Sep 2026)",
    ],
    previousDiagnostics: [
      "TSH - 8.2 mIU/L (Sep 2026)",
      "Thyroid USG - Nodule 1.8 cm",
    ],
    preferredLanguage: "Marathi",
    emergencyContact: "Balwant Gaikwad - Husband",
  },
  {
    id: "SS-PAT-1140",
    name: "Abdul Khan",
    age: 39,
    gender: "Male",
    village: "Karanji",
    district: "Nashik",
    allergies: ["None recorded"],
    conditions: [],
    currentMedications: [],
    chiefComplaint: "General check-up - health screening",
    symptoms: ["No specific complaints"],
    vitals: { bp: "120/78", pulse: "70 bpm", temp: "98.6 °F", spo2: "99%" },
    relevantHistory: "No known medical conditions. Non-smoker, moderate physical activity.",
    previousConsultations: [
      "PHC Karanji - Annual check-up (2025)",
    ],
    previousDiagnostics: [
      "CBC - Normal (2025)",
      "Fasting glucose - Normal (2025)",
    ],
    preferredLanguage: "Hindi",
    emergencyContact: "Zara Khan - Family",
  },
];

export const demoReferrals: ReferralRecord[] = [
  {
    id: "REF-MH-2026-0038",
    patientId: "SS-PAT-1024",
    patientName: "Ramesh Patil",
    patientAge: 52,
    patientGender: "Male",
    patientVillage: "Karanji",
    patientDistrict: "Nashik",
    specialty: "General Medicine",
    facility: "District Hospital Nashik",
    referringFacility: "PHC Karanji",
    referringWorker: "Sunita Jadhav • ASHA",
    reasonForReferral: "Persistent weakness and elevated BP during PHC assessment. BP 146/92 with diabetes history requiring specialist review.",
    priority: "High",
    status: "New",
    waitingTime: "2 hours",
    diagnosticsAvailable: ["CBC", "X-Ray", "ECG"],
    distance: "18 km",
    createdAt: "09 Sep 2026 • 11:15 AM",
    journey: ["Referral Created"],
    requestedDiagnostics: ["ECG", "HbA1c", "Kidney Function Test"],
    aiSummary: {
      keyConcerns: [
        "Elevated blood pressure (146/92) with diabetes comorbidity",
        "Risk of hypertensive complications if unmanaged",
        "Medication adherence needs verification",
      ],
      importantFindings: [
        "BP 146/92 — Stage 1 hypertension",
        "HbA1c previously 7.2% — suboptimal control",
        "Currently on Metformin + Amlodipine",
        "No recorded drug allergies (Penicillin noted)",
      ],
      missingInformation: [
        "Recent HbA1c result pending",
        "Kidney function trend not available",
        "Current medication adherence log not provided",
      ],
      previousCare: "Managed at PHC Karanji with regular BP and glucose monitoring. Last review Aug 2026.",
      referralReason: "Specialist review needed for uncontrolled BP with diabetes comorbidity.",
    },
    careGaps: ["Recent HbA1c result pending", "Kidney function trend not available"],
  },
  {
    id: "REF-MH-2026-0039",
    patientId: "SS-PAT-1048",
    patientName: "Sita More",
    patientAge: 28,
    patientGender: "Female",
    patientVillage: "Karanji",
    patientDistrict: "Nashik",
    specialty: "OB-GYN",
    facility: "District Hospital Nashik",
    referringFacility: "PHC Karanji",
    referringWorker: "Sunita Jadhav • ASHA",
    reasonForReferral: "Routine ANC follow-up at 24 weeks. Need specialist assessment and growth scan.",
    priority: "Medium",
    status: "Accepted",
    waitingTime: "1 day",
    diagnosticsAvailable: ["Ultrasound", "CBC", "Blood group"],
    distance: "18 km",
    createdAt: "08 Sep 2026 • 02:30 PM",
    acceptedAt: "08 Sep 2026 • 04:00 PM",
    appointmentDate: "12 Sep 2026 • 09:00 AM",
    journey: ["Referral Created", "Referral Accepted", "Appointment Booked"],
    aiSummary: {
      keyConcerns: ["Routine ANC at 24 weeks", "Growth scan needed"],
      importantFindings: [
        "BP normal at 112/72",
        "SpO2 99%",
        "Pregnancy progressing normally",
      ],
      missingInformation: ["Growth scan not yet done", "Blood sugar levels during pregnancy not recorded"],
      previousCare: "Regular ANC at PHC Karanji. Previous delivery normal.",
      referralReason: "Specialist ANC assessment and growth scan at 24 weeks.",
    },
  },
  {
    id: "REF-MH-2026-0040",
    patientId: "SS-PAT-1072",
    patientName: "Mahesh Pawar",
    patientAge: 64,
    patientGender: "Male",
    patientVillage: "Dindori Road",
    patientDistrict: "Nashik",
    specialty: "Endocrinology",
    facility: "District Hospital Nashik",
    referringFacility: "PHC Karanji",
    referringWorker: "Rajesh Nimbalkar • ANM",
    reasonForReferral: "Diabetes management with inconsistent glucose readings and CKD monitoring needed.",
    priority: "High",
    status: "Awaiting Diagnostics",
    waitingTime: "3 days",
    diagnosticsAvailable: ["HbA1c", "Kidney Function", "Lipid Profile"],
    distance: "22 km",
    createdAt: "07 Sep 2026 • 09:00 AM",
    acceptedAt: "07 Sep 2026 • 11:00 AM",
    appointmentDate: "14 Sep 2026 • 11:00 AM",
    journey: ["Referral Created", "Referral Accepted", "Appointment Booked"],
    requestedDiagnostics: ["HbA1c", "Kidney Function Test", "Lipid Profile"],
    aiSummary: {
      keyConcerns: [
        "HbA1c 8.1% — above target",
        "CKD stage 2 requires monitoring",
        "Medication review needed",
      ],
      importantFindings: [
        "HbA1c 8.1% — poor control",
        "Serum creatinine 1.4 mg/dL",
        "BP 138/88",
        "On Metformin + Enalapril",
      ],
      missingInformation: [
        "Latest lipid profile not available",
        "Urine albumin not tested recently",
        "Medication adherence data missing",
      ],
      previousCare: "Regular diabetes review at PHC Karanji. CKD monitoring at District Hospital.",
      referralReason: "Endocrinology referral for uncontrolled diabetes with CKD comorbidity.",
    },
    careGaps: ["Lipid profile overdue", "Urine albumin not tested"],
  },
  {
    id: "REF-MH-2026-0041",
    patientId: "SS-PAT-1091",
    patientName: "Aarav Shinde",
    patientAge: 7,
    patientGender: "Male",
    patientVillage: "Karanji",
    patientDistrict: "Nashik",
    specialty: "Pediatrics",
    facility: "Rural Hospital Dindori",
    referringFacility: "PHC Karanji",
    referringWorker: "Sunita Jadhav • ASHA",
    reasonForReferral: "High fever with breathing difficulty for 3 days. Possible pneumonia. Emergency case.",
    priority: "Emergency",
    status: "New",
    waitingTime: "45 min",
    diagnosticsAvailable: ["Chest X-Ray", "CBC", "CRP"],
    distance: "26 km",
    createdAt: "09 Sep 2026 • 11:25 AM",
    journey: ["Referral Created"],
    requestedDiagnostics: ["Chest X-Ray", "CBC", "CRP"],
    aiSummary: {
      keyConcerns: [
        "High fever 102.4°F with breathing difficulty",
        "SpO2 94% — borderline",
        "History of pneumonia",
      ],
      importantFindings: [
        "Fever 102.4°F for 3 days",
        "Tachycardia 112 bpm",
        "SpO2 94%",
        "Cough and chest congestion",
      ],
      missingInformation: [
        "Chest X-ray not yet done",
        "CRP not available",
        "Previous pneumonia records need review",
      ],
      previousCare: "Immunization records up to date. Previous pneumonia at age 3.",
      referralReason: "Emergency pediatric referral for persistent fever with respiratory distress.",
    },
    careGaps: ["Chest X-ray urgently needed", "CRP not done"],
  },
  {
    id: "REF-MH-2026-0042",
    patientId: "SS-PAT-1114",
    patientName: "Lata Gaikwad",
    patientAge: 47,
    patientGender: "Female",
    patientVillage: "Peth",
    patientDistrict: "Nashik",
    specialty: "Endocrinology",
    facility: "District Hospital Nashik",
    referringFacility: "Rural Hospital Dindori",
    referringWorker: "Rajesh Nimbalkar • ANM",
    reasonForReferral: "Thyroid nodule evaluation needed. TSH elevated at 8.2 mIU/L. Nodule 1.8 cm.",
    priority: "Medium",
    status: "Stuck",
    waitingTime: "36 hours",
    diagnosticsAvailable: ["Thyroid USG", "Fine Needle Aspiration", "TSH"],
    distance: "26 km",
    createdAt: "08 Sep 2026 • 10:00 AM",
    acceptedAt: "08 Sep 2026 • 02:00 PM",
    journey: ["Referral Created", "Referral Accepted"],
    careGaps: [
      "Specialist not available today",
      "Appointment slot not scheduled",
      "Fine needle aspiration pending",
    ],
    aiSummary: {
      keyConcerns: [
        "Referral stuck at acceptance stage for 36 hours",
        "Thyroid nodule 1.8 cm needs evaluation",
        "TSH 8.2 — significantly elevated",
      ],
      importantFindings: [
        "TSH 8.2 mIU/L",
        "Thyroid nodule 1.8 cm",
        "On Levothyroxine 75 mcg",
        "Allergic to Aspirin",
      ],
      missingInformation: [
        "Fine needle aspiration cytology not done",
        "Recent ultrasound not available",
        "Specialist availability unclear",
      ],
      previousCare: "Thyroid management at PHC Karanji and Rural Hospital Dindori.",
      referralReason: "Endocrinology referral for thyroid nodule evaluation with elevated TSH.",
    },
  },
  {
    id: "REF-MH-2026-0043",
    patientId: "SS-PAT-1140",
    patientName: "Abdul Khan",
    patientAge: 39,
    patientGender: "Male",
    patientVillage: "Karanji",
    patientDistrict: "Nashik",
    specialty: "General Medicine",
    facility: "PHC Karanji",
    referringFacility: "PHC Karanji",
    referringWorker: "Sunita Jadhav • ASHA",
    reasonForReferral: "Routine general health screening requested by patient.",
    priority: "Routine",
    status: "Completed",
    waitingTime: "1 day",
    diagnosticsAvailable: ["CBC", "Fasting Glucose", "Lipid Profile"],
    distance: "4 km",
    createdAt: "05 Sep 2026 • 09:00 AM",
    acceptedAt: "05 Sep 2026 • 10:00 AM",
    appointmentDate: "06 Sep 2026 • 11:00 AM",
    journey: ["Referral Created", "Referral Accepted", "Appointment Booked", "Consultation", "Diagnostics", "Completed"],
    aiSummary: {
      keyConcerns: ["Routine screening"],
      importantFindings: [
        "BP normal at 120/78",
        "All vitals within range",
        "No chronic conditions",
      ],
      missingInformation: ["No significant missing information"],
      previousCare: "Annual check-up in 2025.",
      referralReason: "Patient-requested general health screening.",
    },
  },
];

export const demoAdminStats: AdminStats = {
  totalPatients: 1284,
  activeReferrals: 47,
  referralCompletionRate: 73,
  highRiskPatients: 31,
  avgReferralTime: "18 hours",
  pendingFollowups: 24,
};

export const demoBottlenecks: Bottleneck[] = [
  { id: "B1", label: "Specialist Availability Shortage", severity: "High", count: 12, description: "Endocrinology and cardiology specialists unavailable on average 2.3 days per week." },
  { id: "B2", label: "Diagnostic Delay", severity: "High", count: 18, description: "Lab results averaging 2-3 days delay, especially for HbA1c and kidney function panels." },
  { id: "B3", label: "Referral Waiting Too Long", severity: "High", count: 9, description: "7 referrals waiting over 36 hours for specialist acceptance." },
  { id: "B4", label: "Facility Overload", severity: "Medium", count: 6, description: "District Hospital at 115% OPD capacity on peak days." },
  { id: "B5", label: "Medicine Unavailable", severity: "Medium", count: 4, description: "Specific medications out of stock at PHC level for 3-5 days." },
  { id: "B6", label: "Follow-up Overdue", severity: "Medium", count: 24, description: "Patients missing scheduled follow-up appointments by 7+ days." },
  { id: "B7", label: "Connectivity Issue", severity: "Low", count: 3, description: "Remote villages experiencing intermittent connectivity affecting data sync." },
  { id: "B8", label: "Patient Not Reached", severity: "Low", count: 2, description: "Patients unable to travel to referred facility due to transport barriers." },
];

export const demoDelayReasons: DelayReason[] = [
  { category: "Specialist unavailable", count: 12, percentage: 26 },
  { category: "Appointment unavailable", count: 8, percentage: 17 },
  { category: "Diagnostic pending", count: 18, percentage: 38 },
  { category: "Patient did not arrive", count: 3, percentage: 6 },
  { category: "Transport/travel issue", count: 2, percentage: 4 },
  { category: "Connectivity issue", count: 3, percentage: 6 },
  { category: "Facility overload", count: 6, percentage: 13 },
  { category: "Follow-up missed", count: 5, percentage: 10 },
];

export const demoFacilities: FacilityData[] = sharedFacilities.map((facility) => ({
  name: facility.name,
  district: facility.district,
  activeReferrals: facility.activeReferrals,
  avgWaitingTime: facility.avgWaitingTime,
  specialistAvailability: facility.specialistAvailability,
  diagnosticAvailability: facility.diagnosticAvailability,
  completionRate: facility.completionRate,
  currentBottleneck: facility.currentBottleneck,
}));

export const referralStageLabels: { label: string }[] = [
  { label: "Referral Created" },
  { label: "Referral Accepted" },
  { label: "Appointment Booked" },
  { label: "Consultation" },
  { label: "Diagnostics" },
  { label: "Treatment" },
  { label: "Follow-up" },
  { label: "Completed" },
];
