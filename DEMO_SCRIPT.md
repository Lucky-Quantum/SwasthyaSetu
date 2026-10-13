# SwasthyaSetu — PS26133 3-Minute Jury Demo

## Goal
Show one patient moving through one closed-loop referral across all four roles.

## Patient
Ramesh Patil — SS-PAT-1024 — Karanji, Nashik.

## Flow
1. **Health Worker**
   - Open Ramesh Patil.
   - Open Assessment.
   - Keep/select Weakness + Dizziness (or the visible symptoms).
   - Enter/review vitals.
   - Click **Run AI Review**.
   - Show the structured urgency/recommendation and the clinician-review disclaimer.
   - Click **Save Assessment** and **Continue to Referral**.
   - Select the recommended facility and create the referral.
2. **Doctor**
   - Open Referrals.
   - Open Ramesh's referral.
   - Accept referral.
   - Book appointment.
   - Enter clinical action / diagnostics as appropriate.
   - Move the referral to Consultation → Diagnostics/Treatment → Follow-up or Completed.
3. **Admin**
   - Open Command Center.
   - Show the referral funnel and operational counters reflecting the same referral.
   - Show the facility/resource view using the shared facility catalogue.
4. **Patient**
   - Open Ramesh's dashboard.
   - Show the live referral status and live care-journey stages.
   - If the doctor scheduled an appointment, show the updated appointment/referral state.

## Offline proof
1. On Worker dashboard click **Test offline**.
2. Change/save an assessment.
3. Show `Working offline` and the pending-sync count.
4. Click **Reconnect** / **Sync now**.
5. Show the queue clearing and the last-sync timestamp.

> “SwasthyaSetu does not stop at creating a referral. The same referral is visible to the worker, receiving doctor, district administrator and patient until care is completed.”
