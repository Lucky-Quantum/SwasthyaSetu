export type CareStageStatus = "completed" | "current" | "upcoming";

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  village: string;
  district: string;
  preferredLanguage: "English" | "Hindi" | "Marathi";
  assignedWorker: string;
  emergencyContact: string;
  allergies: string[];
  conditions: string[];
}

export interface CareJourneyStep {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  status: CareStageStatus;
  detail: string;
}

export interface Referral {
  id: string;
  specialty: string;
  facility: string;
  reason: string;
  status: "In Progress" | "Completed" | "Needs Action";
  appointment: string;
  nextAction: string;
  progress: number;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  doctor: string;
  specialty: string;
  facility: string;
  mode: "In-person" | "Teleconsultation";
  token?: string;
}

export interface FollowUp {
  id: string;
  date: string;
  title: string;
  description: string;
  status: "Due" | "Scheduled" | "Completed";
}

export interface DiagnosticRecord {
  id: string;
  name: string;
  requestedOn: string;
  status: "Result Ready" | "Processing" | "Scheduled";
  facility: string;
}

export interface Prescription {
  id: string;
  medicine: string;
  instructions: string;
  duration: string;
  prescribedOn: string;
}

export interface PatientDashboardData {
  patient: PatientProfile;
  referral: Referral;
  appointments: Appointment[];
  followUps: FollowUp[];
  diagnostics: DiagnosticRecord[];
  prescriptions: Prescription[];
  careJourney: CareJourneyStep[];
}

export const demoPatientData: PatientDashboardData = {
  patient: {
    id: "SS-PAT-1024",
    name: "Ramesh Patil",
    age: 52,
    gender: "Male",
    village: "Karanji",
    district: "Nashik",
    preferredLanguage: "Marathi",
    assignedWorker: "Sunita Jadhav • ASHA",
    emergencyContact: "Meena Patil • Family",
    allergies: ["None recorded"],
    conditions: ["Type 2 Diabetes"],
  },
  referral: {
    id: "REF-MH-1024",
    specialty: "General Medicine",
    facility: "District Hospital Nashik",
    reason: "Persistent weakness and elevated BP during PHC assessment",
    status: "In Progress",
    appointment: "12 Sep 2026 • 10:30 AM",
    nextAction: "Attend specialist consultation",
    progress: 68,
  },
  appointments: [
    {
      id: "APT-1024",
      date: "12 Sep 2026",
      time: "10:30 AM",
      doctor: "Dr. Anjali Sharma",
      specialty: "General Medicine",
      facility: "District Hospital Nashik",
      mode: "In-person",
      token: "18",
    },
    {
      id: "APT-1012",
      date: "20 Sep 2026",
      time: "03:00 PM",
      doctor: "Dr. Rahul Mehta",
      specialty: "Diabetes Follow-up",
      facility: "PHC Karanji",
      mode: "Teleconsultation",
    },
  ],
  followUps: [
    {
      id: "FU-1024",
      date: "15 Sep 2026",
      title: "Blood pressure review",
      description: "Review BP reading after specialist consultation.",
      status: "Due",
    },
    {
      id: "FU-1009",
      date: "28 Sep 2026",
      title: "Diabetes medication review",
      description: "Review medication adherence and glucose records.",
      status: "Scheduled",
    },
  ],
  diagnostics: [
    {
      id: "LAB-2301",
      name: "Complete Blood Count",
      requestedOn: "10 Sep 2026",
      status: "Result Ready",
      facility: "District Hospital Nashik",
    },
    {
      id: "LAB-2302",
      name: "HbA1c",
      requestedOn: "10 Sep 2026",
      status: "Processing",
      facility: "District Hospital Nashik",
    },
  ],
  prescriptions: [
    {
      id: "RX-1002",
      medicine: "Metformin 500 mg",
      instructions: "1 tablet after breakfast and dinner",
      duration: "30 days",
      prescribedOn: "08 Sep 2026",
    },
    {
      id: "RX-1003",
      medicine: "Amlodipine 5 mg",
      instructions: "1 tablet after breakfast",
      duration: "30 days",
      prescribedOn: "08 Sep 2026",
    },
  ],
  careJourney: [
    {
      id: "J1",
      title: "Patient Registration",
      subtitle: "Assisted by ASHA",
      date: "08 Sep 2026 • 09:20 AM",
      status: "completed",
      detail: "Patient profile created at Karanji PHC.",
    },
    {
      id: "J2",
      title: "PHC Assessment",
      subtitle: "Vitals and symptoms captured",
      date: "08 Sep 2026 • 10:05 AM",
      status: "completed",
      detail: "Assessment completed and priority identified for doctor review.",
    },
    {
      id: "J3",
      title: "Specialist Referral",
      subtitle: "General Medicine",
      date: "09 Sep 2026 • 11:15 AM",
      status: "completed",
      detail: "Referral created and accepted by District Hospital Nashik.",
    },
    {
      id: "J4",
      title: "Specialist Consultation",
      subtitle: "District Hospital Nashik",
      date: "12 Sep 2026 • 10:30 AM",
      status: "current",
      detail: "Appointment confirmed. Token 18.",
    },
    {
      id: "J5",
      title: "Diagnostics",
      subtitle: "CBC + HbA1c",
      date: "After consultation",
      status: "upcoming",
      detail: "CBC result is ready; HbA1c is being processed.",
    },
    {
      id: "J6",
      title: "Follow-up",
      subtitle: "BP review",
      date: "15 Sep 2026",
      status: "upcoming",
      detail: "Follow-up due after specialist consultation.",
    },
  ],
};
