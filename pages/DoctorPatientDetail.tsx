import { useState } from "react";
import {
  ArrowLeft,
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  HeartPulse,
  Pill,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  UserRound,
  AlertTriangle,
  X,
} from "lucide-react";
import Brand from "../components/Brand";
import { useCare } from "../src/store/careStore";
import { referralStageLabels } from "../src/data/careData";
import type { JourneyStage, ReferralRecord } from "../src/data/careData";

interface DoctorPatientDetailProps {
  referral: ReferralRecord;
  onBack: () => void;
  onUpdate: (updates: Partial<ReferralRecord>) => void;
}

export default function DoctorPatientDetail({
  referral,
  onBack,
  onUpdate,
}: DoctorPatientDetailProps) {
  const { getPatientById } = useCare();
  const patient = getPatientById(referral.patientId);

  const [notes, setNotes] = useState(referral.doctorNotes || "");
  const [treatment, setTreatment] = useState(referral.treatment || "");
  const [prescription, setPrescription] = useState(referral.prescription || "");
  const [followUpDate, setFollowUpDate] = useState(referral.followUpDate || "");
  const [requestedDiag, setRequestedDiag] = useState(
    referral.requestedDiagnostics?.join(", ") || ""
  );
  const [stageIndex, setStageIndex] = useState<number>(() => {
    const stageMap: Record<string, number> = {
      New: 0,
      Accepted: 1,
      "Awaiting Diagnostics": 2,
      Consultation: 3,
      Diagnostics: 4,
      Treatment: 5,
      "Follow-up": 6,
      Completed: 7,
    };
    return stageMap[referral.status] ?? 0;
  });
  const [saved, setSaved] = useState(false);
  const [stageChanged, setStageChanged] = useState(false);

  const handleSave = () => {
    const updates: Partial<ReferralRecord> = {
      doctorNotes: notes,
      treatment,
      prescription,
      followUpDate: followUpDate || undefined,
    };
    if (stageChanged) {
      const statuses = ["New", "Accepted", "Awaiting Diagnostics", "Consultation", "Diagnostics", "Treatment", "Follow-up", "Completed"];
      updates.status = statuses[stageIndex] as ReferralRecord["status"];
      const stageLabel = referralStageLabels[stageIndex]?.label as JourneyStage | undefined;
      if (stageLabel && !referral.journey.includes(stageLabel)) {
        updates.journey = [...referral.journey, stageLabel];
      }
    }
    if (requestedDiag) {
      updates.requestedDiagnostics = requestedDiag.split(",").map((s) => s.trim());
    }
    onUpdate(updates);
    setSaved(true);
    setStageChanged(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const aiSummary = referral.aiSummary;
  const stages = referralStageLabels.map((s) => s.label);

  return (
    <main className="doctor-detail-page">
      <div className="doctor-detail-topbar">
        <button className="doctor-back" onClick={onBack}>
          <ArrowLeft size={18} /> Back to Referral Queue
        </button>
        <span className="doctor-ref-id">{referral.id}</span>
      </div>

      <div className="doctor-detail-header">
        <div className="doctor-patient-header">
          <div className="doctor-patient-avatar">
            {referral.patientName.charAt(0)}
          </div>
          <div className="doctor-patient-meta">
            <h1>{referral.patientName}</h1>
            <div className="doctor-patient-tags">
              <span>ID: {referral.patientId}</span>
              <span>{referral.patientAge} yrs</span>
              <span>{referral.patientGender}</span>
              <span>{referral.patientVillage}</span>
              {referral.triageLevel && <span className={`triage-pill triage-${referral.triageLevel.toLowerCase()}`}>{referral.triageLevel} triage</span>}
            </div>
          </div>
          <div className="doctor-status-stack">
            <span className={`priority-badge large priority-${referral.priority.toLowerCase()}`}>
              <i className={referral.priority === "Emergency" ? "dot-red" : referral.priority === "High" ? "dot-orange" : referral.priority === "Medium" ? "dot-amber" : "dot-green"} />
              {referral.priority}
            </span>
            <span className="status-badge" style={{ color: "#0b6ee8", borderColor: "#0b6ee8" }}>
              {referral.status}
            </span>
          </div>
        </div>
      </div>

      <div className="doctor-detail-grid">
        <div className="doctor-detail-main">
          <section className="doctor-panel">
            <div className="doctor-panel-heading">
              <div>
                <span>PATIENT SNAPSHOT</span>
                <h2>Clinical overview</h2>
              </div>
              <UserRound size={20} />
            </div>
            <div className="patient-snapshot">
              {patient && (
                <>
                  <div className="snapshot-section">
                    <h3><FileText size={16} /> Chief Complaint</h3>
                    <p>{patient.chiefComplaint || referral.reasonForReferral}</p>
                  </div>
                  <div className="snapshot-grid">
                    <div className="snapshot-item">
                      <strong>Allergies</strong>
                      <span>{patient.allergies.join(", ")}</span>
                    </div>
                    <div className="snapshot-item">
                      <strong>Conditions</strong>
                      <span>{patient.conditions.join(", ") || "None recorded"}</span>
                    </div>
                    <div className="snapshot-item">
                      <strong>Medications</strong>
                      <span>{patient.currentMedications.join(", ") || "None"}</span>
                    </div>
                    <div className="snapshot-item">
                      <strong>Emergency Contact</strong>
                      <span>{patient.emergencyContact}</span>
                    </div>
                  </div>
                  <div className="snapshot-section">
                    <h3><Activity size={16} /> Vitals</h3>
                    <div className="vitals-row">
                      <div className="vital-item"><span>BP</span><strong>{patient.vitals.bp}</strong></div>
                      <div className="vital-item"><span>Pulse</span><strong>{patient.vitals.pulse}</strong></div>
                      <div className="vital-item"><span>Temp</span><strong>{patient.vitals.temp}</strong></div>
                      <div className="vital-item"><span>SpO₂</span><strong>{patient.vitals.spo2}</strong></div>
                    </div>
                  </div>
                  <div className="snapshot-section">
                    <h3><HeartPulse size={16} /> Symptoms</h3>
                    <div className="symptom-tags">
                      {patient.symptoms.map((s) => (
                        <span key={s} className="symptom-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="snapshot-section">
                    <h3><Stethoscope size={16} /> Relevant History</h3>
                    <p>{patient.relevantHistory}</p>
                  </div>
                  {patient.previousConsultations.length > 0 && (
                    <div className="snapshot-section">
                      <h3><CalendarDays size={16} /> Previous Consultations</h3>
                      {patient.previousConsultations.map((c, i) => (
                        <div key={i} className="history-item">{c}</div>
                      ))}
                    </div>
                  )}
                  {patient.previousDiagnostics.length > 0 && (
                    <div className="snapshot-section">
                      <h3><Activity size={16} /> Recent Diagnostics</h3>
                      {patient.previousDiagnostics.map((d, i) => (
                        <div key={i} className="history-item">{d}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {aiSummary && (
            <section className="doctor-panel ai-summary-panel-clinical">
              <div className="doctor-panel-heading">
                <div>
                  <span>AI-ASSISTED SUMMARY</span>
                  <h2>Clinical support overview</h2>
                </div>
                <ShieldCheck size={20} />
              </div>
              <small className="ai-disclaimer-clinical">
                AI-generated support summary. Clinical decisions remain with the treating doctor.
              </small>
              <div className="ai-clinical-grid">
                <div>
                  <h4><AlertTriangle size={14} /> Key Concerns</h4>
                  {aiSummary.keyConcerns.map((c, i) => (
                    <div key={i} className="ai-list-item concern">{c}</div>
                  ))}
                </div>
                <div>
                  <h4><CheckCircle2 size={14} /> Important Findings</h4>
                  {aiSummary.importantFindings.map((f, i) => (
                    <div key={i} className="ai-list-item finding">{f}</div>
                  ))}
                </div>
                <div>
                  <h4><Clock3 size={14} /> Missing Information</h4>
                  {aiSummary.missingInformation.map((m, i) => (
                    <div key={i} className="ai-list-item missing">{m}</div>
                  ))}
                </div>
                <div>
                  <h4><FileText size={14} /> Previous Care</h4>
                  <p className="ai-paragraph">{aiSummary.previousCare}</p>
                  <h4><RefreshCw size={14} /> Referral Reason</h4>
                  <p className="ai-paragraph">{aiSummary.referralReason}</p>
                </div>
              </div>
            </section>
          )}

          <section className="doctor-panel">
            <div className="doctor-panel-heading">
              <div>
                <span>REFERRAL JOURNEY</span>
                <h2>Patient care path</h2>
              </div>
              <RefreshCw size={20} />
            </div>
            <div className="journey-timeline">
              {stages.map((stage, index) => {
                const done = index < stageIndex;
                const current = index === stageIndex;
                return (
                  <div key={stage} className={`journey-node ${done ? "done" : ""} ${current ? "current" : ""}`}>
                    <div className="journey-node-marker">
                      {done ? "✓" : index + 1}
                    </div>
                    <span className="journey-node-label">{stage}</span>
                  </div>
                );
              })}
            </div>
            <div className="journey-steps-detail">
              {referral.journey.map((step, i) => (
                <div key={i} className="journey-step-detail">
                  <CheckCircle2 size={14} /> {step}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="doctor-detail-side">
          <section className="doctor-panel">
            <div className="doctor-panel-heading">
              <div><span>CONSULTATION WORKFLOW</span><h2>Add your assessment</h2></div>
              <Stethoscope size={20} />
            </div>

            <div className="consultation-form">
              <div className="consultation-section">
                <h3><FileText size={16} /> Consultation Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
                  placeholder="Record observations, findings, and clinical impression"
                  rows={4}
                />
              </div>

              <div className="consultation-section">
                <h3><HeartPulse size={16} /> Treatment Recommendation</h3>
                <textarea
                  value={treatment}
                  onChange={(e) => { setTreatment(e.target.value); setSaved(false); }}
                  placeholder="Recommended treatment plan"
                  rows={3}
                />
              </div>

              <div className="consultation-section">
                <h3><Pill size={16} /> Prescription</h3>
                <textarea
                  value={prescription}
                  onChange={(e) => { setPrescription(e.target.value); setSaved(false); }}
                  placeholder="Medications, dosage, instructions"
                  rows={3}
                />
              </div>

              <div className="consultation-section">
                <h3><Activity size={16} /> Request Additional Diagnostics</h3>
                <input
                  value={requestedDiag}
                  onChange={(e) => { setRequestedDiag(e.target.value); setSaved(false); }}
                  placeholder="e.g. ECG, HbA1c, Kidney Function"
                />
              </div>

              <div className="consultation-section">
                <h3><CalendarDays size={16} /> Follow-up Date</h3>
                <input
                  type="text"
                  value={followUpDate}
                  onChange={(e) => { setFollowUpDate(e.target.value); setSaved(false); }}
                  placeholder="e.g. 15 Sep 2026"
                />
              </div>

              <div className="consultation-section">
                <h3><RefreshCw size={16} /> Mark Referral Stage</h3>
                <div className="stage-selector">
                  {stages.map((stage, index) => (
                    <button
                      key={stage}
                      className={stageIndex === index ? "selected" : ""}
                      onClick={() => { setStageIndex(index); setStageChanged(true); setSaved(false); }}
                    >
                      {index + 1}. {stage}
                    </button>
                  ))}
                </div>
              </div>

              <div className="consultation-actions">
                <button className="button secondary" onClick={onBack}>Cancel</button>
                <button className="button primary" onClick={handleSave}>
                  {saved ? <CheckCircle2 size={17} /> : null}
                  {saved ? "Saved" : "Save & Update"}
                </button>
              </div>
            </div>
          </section>

          <section className="doctor-panel">
            <div className="doctor-panel-heading">
              <div><span>QUICK ACTIONS</span><h2>Common tasks</h2></div>
            </div>
            <div className="quick-actions-list">
              <button className="quick-action">
                <Bell size={18} />
                <span>Escalate</span>
              </button>
              <button className="quick-action">
                <HeartPulse size={18} />
                <span>Request Emergency Review</span>
              </button>
              <button className="quick-action">
                <Stethoscope size={18} />
                <span>Refer to Another Specialist</span>
              </button>
              <button className="quick-action">
                <ShieldCheck size={18} />
                <span>Mark Care Gap</span>
              </button>
            </div>
          </section>

          <section className="doctor-panel referral-meta-panel">
            <div className="doctor-panel-heading">
              <div><span>REFERRAL META</span><h2>Key information</h2></div>
            </div>
            <div className="meta-grid">
              <div><span>Referring Facility</span><strong>{referral.referringFacility}</strong></div>
              <div><span>Referring Worker</span><strong>{referral.referringWorker}</strong></div>
              <div><span>Specialty</span><strong>{referral.specialty}</strong></div>
              <div><span>Receiving Facility</span><strong>{referral.facility}</strong></div>
              <div><span>Distance</span><strong>{referral.distance}</strong></div>
              <div><span>Created</span><strong>{referral.createdAt}</strong></div>
              <div><span>Reason</span><strong>{referral.reasonForReferral}</strong></div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
