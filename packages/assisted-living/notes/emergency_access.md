# Emergency Access (Break-Glass) Strategy

This document outlines a strategy for providing temporary, short-lived, and highly audited access to sensitive data in emergency scenarios.

---

That is a critical distinction. The scenario of **"first responders"** (or emergency access/break-glass access) introduces unique requirements for speed, non-repudiation, and **short-lived, highly privileged access**.

The answer to where you set the temporary access still leans heavily towards the **KMS layer and its surrounding Identity and Access Management (IAM) infrastructure**, but with a twist: you leverage **short-lived tokens/credentials** instead of long-term policies.

Here is a breakdown of how to handle emergency, short-lived access, keeping both the Application and KMS layers in mind.

---

## 1. The Ideal Implementation: KMS via Short-Lived Tokens

The most secure pattern for emergency access is to grant temporary privilege by issuing a set of very short-lived credentials that are only valid for the emergency access role. This ensures that even if an attacker gets hold of the credentials, the "blast radius" is limited to minutes or hours.

### The Role of the KMS/IAM (The Authority)

The KMS/IAM layer is the **authoritative source** for generating and validating these tokens, ensuring the access is temporary and auditable.

1.  **Define the Emergency Role/Service Account:**
    You create a dedicated IAM role (e.g., `KEK-Responder-Decrypter`) that has the specific KMS permissions (like `kms:Decrypt`) on the most sensitive KEKs. This role has **no permanent users**.

2.  **Use a Security Token Service (STS):**
    All major cloud providers (and third-party identity providers) offer a Security Token Service (STS) to exchange existing credentials (like a user's multi-factor authenticated sign-in) for *temporary, limited-privilege* credentials.
    * **In an Emergency:** The authenticated "First Responder" (User) calls the STS to **assume** the `KEK-Responder-Decrypter` role.
    * **The STS response** is a set of **short-lived credentials** (an access key, secret key, and session token) that are only valid for a preset, short duration (e.g., 15 minutes to 1 hour).

3.  **KMS Enforcement:**
    When the application uses these short-lived tokens to call the KMS to decrypt a KEK, the KMS checks two things:
    * Does the underlying role (`KEK-Responder-Decrypter`) have permission for the KEK? (Yes, you pre-configured this).
    * Are the temporary credentials still valid? (If 15 minutes have passed, the KMS immediately denies the request).

### Why this is superior:

* **Self-Revocation:** The credentials automatically expire, eliminating the risk of a forgotten, powerful key lying around.
* **Audit Trail:** The STS/IAM logs a clear event: **User X assumed Role Y at Time Z for a 15-minute session**. The KMS logs all decryption requests made using that session ID. This is critical for regulatory compliance in emergency access scenarios.
* **Separation of Duties:** The long-lived KEK permissions reside only on the temporary role, which no one can access without going through the emergency activation process (MFA, approval, etc.).

---

## 2. The Role of the Application Layer (The Trigger)

The Application Layer is the **enforcement mechanism** that controls *when* a user can trigger the token creation process.

### The Application's Responsibilities for Emergency Access:

1.  **"Break Glass" Workflow:** This should be the only way a First Responder can obtain the temporary token. This workflow should involve:
    * **High-Assurance Authentication:** Multi-Factor Authentication (MFA) or other high-friction measures.
    * **Approval/Justification:** The user must state the reason for access (e.g., ticket number, incident severity).
    * **Triggering STS:** The application takes the authenticated user's session and securely requests the short-lived token from the KMS/STS layer.

2.  **Key Delivery:**
    * The application receives the temporary token from the STS.
    * It temporarily caches or passes this token to the client/service that needs to perform the KMS decryption operation.
    * It performs the decryption operation for the First Responder's current session.

3.  **Secure Log-off:** When the session is over, the application destroys the temporary token immediately (even if its expiration time hasn't passed), enforcing a short session duration.

### A Concrete Example (e.g., Using a QR Code):

In healthcare (where this is common for PHI access):

1.  A paramedic (First Responder) at an accident scene needs a patient's medical history.
2.  They scan a **Secure QR Code** (e.g., on a medical bracelet) that contains a unique, non-identifying reference ID.
3.  The paramedic's tablet/app authenticates them (e.g., with their agency ID and biometrics/MFA).
4.  The **Application** calls a backend service with the QR ID and the paramedic's authentication.
5.  The backend **Authorization System** verifies the user's "First Responder" role and the emergency context.
6.  The backend calls the **STS** to get a 5-minute access token for the `KEK-Responder-Decrypter` role.
7.  The backend uses that 5-minute token to call the **KMS** to decrypt the patient's data key (DEK) using the **KEK-Responder**.
8.  The data is instantly decrypted and displayed on the paramedic's tablet for the duration of the 5-minute session.

In this model, the **KMS/IAM layer** is the one that strictly enforces the **temporary time constraint**, making it the most secure place to set this type of access.
