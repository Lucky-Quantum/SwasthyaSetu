import { sharedFacilities } from "./facilityData";

export type WorkerPriority = "Emergency" | "High" | "Referral Delayed" | "Follow-up Due" | "Routine";

export interface AssignedPatient {
  id: string;
  name: string;
  age: number;
  village: string;
  issue: string;
  priority: WorkerPriority;
  lastVisit: string;
  nextAction: string;
  gender?: string;
  mobile?: string;
  address?: string;
  emergencyContact?: string;
  preferredLanguage?: string;
  registrationSource?: string;
  registeredBy?: string;
  registeredAt?: string;
}

export interface ReferralRecommendation {
  id: string;
  name: string;
  distance: string;
  specialty: string;
  doctor: string;
  appointment: string;
  diagnostics: string[];
  reason: string;
  status: "Recommended" | "Alternative";
}

export const workerProfile = {
  name: "Sunita Jadhav",
  role: "ASHA Worker",
  workerId: "ASHA-NK-0184",
  village: "Karanji",
  district: "Nashik",
  language: "Marathi" as const,
};

export const assignedPatients: AssignedPatient[] = [
  { id: "SS-PAT-1024", name: "Ramesh Patil", age: 52, village: "Karanji", issue: "Weakness + elevated BP", priority: "High", lastVisit: "Today, 10:05 AM", nextAction: "Complete referral", gender: "Male", preferredLanguage: "Marathi" },
  { id: "SS-PAT-1048", name: "Sita More", age: 28, village: "Karanji", issue: "ANC follow-up", priority: "Follow-up Due", lastVisit: "09 Sep 2026", nextAction: "Confirm ANC visit", gender: "Female", preferredLanguage: "Marathi" },
  { id: "SS-PAT-1072", name: "Mahesh Pawar", age: 64, village: "Dindori Road", issue: "Diabetes review", priority: "Routine", lastVisit: "08 Sep 2026", nextAction: "Check glucose log", gender: "Male", preferredLanguage: "Hindi" },
  { id: "SS-PAT-1091", name: "Aarav Shinde", age: 7, village: "Karanji", issue: "Fever + breathing difficulty", priority: "Emergency", lastVisit: "Today, 11:25 AM", nextAction: "Immediate escalation", gender: "Male", preferredLanguage: "Marathi" },
  { id: "SS-PAT-1114", name: "Lata Gaikwad", age: 47, village: "Peth", issue: "Referral awaiting acceptance", priority: "Referral Delayed", lastVisit: "08 Sep 2026", nextAction: "Escalate referral", gender: "Female", preferredLanguage: "Marathi" },
  { id: "SS-PAT-1140", name: "Abdul Khan", age: 39, village: "Karanji", issue: "General check-up", priority: "Routine", lastVisit: "07 Sep 2026", nextAction: "Routine review", gender: "Male", preferredLanguage: "Hindi" },
];

export const referralRecommendations: ReferralRecommendation[] = sharedFacilities.map((facility, index) => ({
  id: facility.id,
  name: facility.name,
  distance: `${facility.distanceFromKaranjiKm} km`,
  specialty: facility.specialties[0] ?? "General Medicine",
  doctor: facility.doctors[0] ?? "Duty Medical Officer",
  appointment: facility.appointmentSlots[0] ?? "Next available slot",
  diagnostics: facility.diagnostics,
  reason: index === 0
    ? "Strongest match for specialist care, diagnostics and appointment availability."
    : index === 2
      ? "Closest facility for initial review or stabilization."
      : `Available care at ${facility.name}; compare distance, diagnostics and queue before referral.`,
  status: index === 0 ? "Recommended" : "Alternative",
}));
