### Recommended Role Structure for Flexibility & Security

The best practice is to align roles with **what the person does** and **what data they are authorized to see.**

| Role Name                                                     | Access Level / Permissions                                                                                                                              | Why It's a Better Name                                                                                                                                                |
| :------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Super Administrator / System Admin** (Replaces **Admin**)   | **Full Access:** User Management, System Configuration, Billing Settings (if added later), Global Reporting, Deactivating other Admins.                 | Clearly defines this as the highest level, focused on _system integrity_ and _user management_.                                                                       |
| **Nurse / Clinician** (Replaces **Senior Staff**)             | **Full Clinical Access:** Edit/Add Medications, Allergies, Diagnosis, Vital Signs, Update Treatment Notes, Access to full history, Print QR codes.      | Reflects professional licensing and legal responsibility for medical data. They need the most access to PHI.                                                          |
| **Caregiver / Direct Care Staff** (Replaces **Junior Staff**) | **Read-Only Access to PHI:** View only (Meds, Allergies, Contacts), Log basic Daily Activity (e.g., toileting, meals), Scan QR code for emergency info. | Focuses on their direct, hands-on function. Restricting them to read-only for key clinical data minimizes risk and aligns with their scope of work.                   |
| **Viewer / Ancillary Staff** (New Recommended Role)           | **Minimal Access:** View only (Name, Room Number, Emergency Contacts). No access to medications or diagnoses.                                           | Ideal for non-clinical employees like kitchen staff, maintenance, or receptionists who only need basic info (e.g., room number, family contact) but no sensitive PHI. |

### Why Senior/Junior Staff is Risky:

1.  **Security Risk:** Does a "Senior Staff" member need the ability to delete audit logs? If you give them high-level system permissions, they pose an elevated risk if their account is compromised.
2.  **Lack of Clarity:** If an audit log shows "Senior Staff modified the medication," it's unclear if that was a licensed nurse or a non-licensed long-term employee. **HIPAA demands clear accountability** based on professional role.
3.  **Ambiguous Training:** New "Senior Staff" might not be trained for the high-level system permissions you assign to that group, increasing the chance of accidental errors.

**Recommendation:** Adopt the functional names (Admin, Clinician, Caregiver, Viewer) and define permissions strictly based on the **job responsibilities** and **legal/clinical scope** of each role.
