export interface SharedFacility {
  id: string;
  name: string;
  district: string;
  level: "PHC" | "CHC" | "District Hospital" | "Rural Hospital";
  address: string;
  distanceFromKaranjiKm: number;
  specialties: string[];
  doctors: string[];
  diagnostics: string[];
  medicines: string[];
  appointmentSlots: string[];
  specialistAvailability: string;
  diagnosticAvailability: string;
  medicineAvailability: string;
  activeReferrals: number;
  avgWaitingTime: string;
  completionRate: number;
  currentBottleneck: string;
  status: "Ready" | "Limited" | "Overloaded";
}

export const sharedFacilities: SharedFacility[] = [
  {
    id: "FAC-001",
    name: "District Hospital Nashik",
    district: "Nashik",
    level: "District Hospital",
    address: "District Hospital Road, Nashik",
    distanceFromKaranjiKm: 18,
    specialties: ["General Medicine", "OB-GYN", "Endocrinology", "Pediatrics", "Cardiology"],
    doctors: ["Dr. Anjali Sharma", "Dr. Vikram Joshi", "Dr. Meera Kulkarni"],
    diagnostics: ["CBC", "X-Ray", "ECG", "Ultrasound", "HbA1c", "Kidney Function", "Blood group", "Lipid Profile"],
    medicines: ["Metformin", "Amlodipine", "Iron + Folic Acid", "Insulin", "Paracetamol"],
    appointmentSlots: ["Today • 02:15 PM", "Tomorrow • 10:30 AM", "Tomorrow • 11:30 AM"],
    specialistAvailability: "60%",
    diagnosticAvailability: "85%",
    medicineAvailability: "92%",
    activeReferrals: 18,
    avgWaitingTime: "14 hours",
    completionRate: 78,
    currentBottleneck: "Specialist shortage",
    status: "Ready",
  },
  {
    id: "FAC-014",
    name: "Rural Hospital Dindori",
    district: "Dindori",
    level: "Rural Hospital",
    address: "Dindori Rural Hospital Campus, Nashik",
    distanceFromKaranjiKm: 26,
    specialties: ["General Medicine", "Pediatrics", "Emergency Care"],
    doctors: ["Dr. Rahul Mehta", "Dr. Nisha Pawar"],
    diagnostics: ["CBC", "BP Monitoring", "Chest X-Ray", "CRP"],
    medicines: ["Paracetamol", "Amlodipine", "Amoxicillin"],
    appointmentSlots: ["Today • 04:00 PM", "Tomorrow • 09:30 AM"],
    specialistAvailability: "40%",
    diagnosticAvailability: "65%",
    medicineAvailability: "81%",
    activeReferrals: 9,
    avgWaitingTime: "22 hours",
    completionRate: 58,
    currentBottleneck: "Diagnostic delay",
    status: "Limited",
  },
  {
    id: "FAC-021",
    name: "PHC Karanji",
    district: "Nashik",
    level: "PHC",
    address: "Karanji Primary Health Centre, Nashik",
    distanceFromKaranjiKm: 4,
    specialties: ["Medical Officer", "General Medicine", "Maternal Care"],
    doctors: ["Dr. Neha Patil"],
    diagnostics: ["Basic Lab", "Blood Sugar", "Blood Pressure monitoring"],
    medicines: ["Amlodipine", "Metformin", "Iron + Folic Acid", "Paracetamol"],
    appointmentSlots: ["Today • 02:15 PM", "Today • 04:00 PM"],
    specialistAvailability: "N/A",
    diagnosticAvailability: "75%",
    medicineAvailability: "82%",
    activeReferrals: 12,
    avgWaitingTime: "8 hours",
    completionRate: 82,
    currentBottleneck: "Referral volume",
    status: "Ready",
  },
  {
    id: "FAC-031",
    name: "PHC Peth",
    district: "Nashik",
    level: "PHC",
    address: "Peth Primary Health Centre, Nashik",
    distanceFromKaranjiKm: 14,
    specialties: ["Medical Officer", "General Medicine"],
    doctors: ["Dr. Sameer Patil"],
    diagnostics: ["Basic Lab", "Blood Pressure monitoring"],
    medicines: ["Amlodipine", "Paracetamol"],
    appointmentSlots: ["Tomorrow • 12:00 PM"],
    specialistAvailability: "N/A",
    diagnosticAvailability: "50%",
    medicineAvailability: "74%",
    activeReferrals: 5,
    avgWaitingTime: "12 hours",
    completionRate: 64,
    currentBottleneck: "Diagnostic availability",
    status: "Limited",
  },
  {
    id: "FAC-041",
    name: "PHC Dindori Road",
    district: "Nashik",
    level: "PHC",
    address: "Dindori Road Primary Health Centre, Nashik",
    distanceFromKaranjiKm: 11,
    specialties: ["Medical Officer", "General Medicine"],
    doctors: ["Dr. Asha Kale"],
    diagnostics: ["Basic Lab", "Blood Sugar"],
    medicines: ["Metformin", "Paracetamol", "Iron + Folic Acid"],
    appointmentSlots: ["Tomorrow • 09:00 AM"],
    specialistAvailability: "N/A",
    diagnosticAvailability: "70%",
    medicineAvailability: "86%",
    activeReferrals: 3,
    avgWaitingTime: "10 hours",
    completionRate: 71,
    currentBottleneck: "Follow-up gaps",
    status: "Ready",
  },
];

export function getFacilityById(id: string) {
  return sharedFacilities.find((facility) => facility.id === id);
}

export function getFacilityByName(name: string) {
  return sharedFacilities.find((facility) => facility.name === name);
}
