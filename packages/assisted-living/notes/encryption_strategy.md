# Envelope Encryption with Role-Based Access Control (RBAC)

This document outlines an architecture for implementing partial, role-based decryption of sensitive data using an envelope encryption scheme. This is a best-practice approach for applications like EHRs that handle data with varying levels of sensitivity.

### The Core Idea: Multiple Keys for Multiple Data Categories

Instead of using a single Data Encryption Key (DEK) for an entire document, you use **multiple DEKs** for different "categories" of data within that document. Access to decrypt these DEKs is then determined by the user's role.

Let's imagine you categorize your resident data like this:

1.  **General Info:** `resident_name`, `room_no` (Low sensitivity)
2.  **Contact Info:** `emergency_contacts` (Medium sensitivity)
3.  **Medical Info:** `allergies`, `medications` (High sensitivity)

### The Encryption Workflow (`toFirestore`)

When you save a resident's record, the process would look like this:

1.  **Generate Multiple DEKs:** Your application would generate a unique DEK for each data category (e.g., `dek_general`, `dek_contact`, `dek_medical`).
2.  **Encrypt Data in Categories:**
    *   Encrypt the general info fields using `dek_general`.
    *   Encrypt the contact info fields using `dek_contact`.
    *   Encrypt the medical info fields using `dek_medical`.
3.  **Wrap All DEKs:** You would then use your single master key (the KEK in your KMS) to encrypt each of these DEKs individually.
4.  **Store Everything:** Your Firestore document would now store the encrypted data fields alongside all the *encrypted* DEKs.

Your document might look something like this:
```json
{
  "encrypted_resident_name": "...",
  "encrypted_emergency_contacts": "...",
  "encrypted_medical_records": "...",
  
  "encrypted_dek_general": "...",
  "encrypted_dek_contact": "...",
  "encrypted_dek_medical": "..."
}
```

### The Role-Based Decryption Workflow (`fromFirestore`)

This is where the magic happens. Your `fromFirestore` converter would need to be aware of the role of the user making the request.

1.  **Get User Role:** Your backend logic would identify the user's role (e.g., 'NURSE', 'RECEPTIONIST') from their authentication token (e.g., Firebase Auth custom claims).
2.  **Fetch Encrypted Data:** It fetches the entire document from Firestore, with all data and all DEKs still encrypted.
3.  **Attempt to Decrypt DEKs Based on Role:**
    *   Your code checks the user's role.
    *   It then makes API calls to the KMS to decrypt **only the DEKs that the role is permitted to access**.
4.  **Partially Decrypt Data:**
    *   Your application uses the plaintext DEKs it successfully retrieved to decrypt the corresponding data fields.
    *   If the application couldn't get a specific DEK (because the user's role lacks permission), it simply cannot decrypt that part of the data. That data would be returned as `null` or omitted entirely.

The result is a `Resident` object that is "partially hydrated" with only the data the user is authorized to see.

### Enforcing the Rules: Application vs. KMS

You can enforce the "who can decrypt what" rules in two places:

*   **In your Application:** Your code has `if/else` logic based on the user's role. This is simpler to start with.
*   **In the KMS (Recommended):** For maximum security, you can create multiple master keys (KEKs) in your KMS—one for each data sensitivity level (e.g., `kek-general`, `kek-contact`, `kek-medical`). You then use IAM policies to define that a 'NURSE' role can only *use* the `kek-general` and `kek-contact` keys. This is more secure because even if there's a bug in your application code, the KMS itself will block any unauthorized decryption attempts.
