import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const setCustomUserRole = onRequest(async (request, response) => {
  logger.info("setCustomUserRole function triggered!", { structuredData: true });

  // IMPORTANT: In a production environment, secure this function with proper authentication
  // and authorization checks (e.g., only allowing calls from an authenticated admin user).
  // For demonstration, we'll allow direct calls.

  const uid = request.query.uid as string;
  const role = request.query.role as string;

  if (!uid || !role) {
    response.status(400).send("Missing UID or Role parameter.");
    return;
  }

  // Validate role against our defined roles
  const validRoles = ['ADMIN', 'CLINICIAN', 'CAREGIVER', 'VIEWER'];
  if (!validRoles.includes(role.toUpperCase())) {
    response.status(400).send(`Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
    return;
  }

  try {
    // Set custom claims for the user
    await admin.auth().setCustomUserClaims(uid, { roles: [role.toUpperCase()] });

    // Get the user to verify claims were set (optional, for logging)
    const user = await admin.auth().getUser(uid);
    logger.info(`Custom claims set for user ${uid}:`, user.customClaims);

    response.status(200).send(`Custom role '${role}' set for user ${uid}.`);
  } catch (error: any) {
    logger.error("Error setting custom user claims:", error);
    response.status(500).send(`Error setting custom role: ${error.message}`);
  }
});

export const revokeAllSessionsFunction = onRequest(async (request, response) => {
  logger.info("revokeAllSessionsFunction triggered!", { structuredData: true });

  if (request.method !== 'POST') {
    response.status(405).send('Method Not Allowed');
    return;
  }

  const uid = request.body.uid;
  if (!uid) {
    response.status(400).send("Missing UID in request body.");
    return;
  }

  // Optional: Add authorization check here if needed (e.g., only admins can revoke sessions)
  // This would require passing an ID token and verifying it.

  try {
    await admin.auth().revokeRefreshTokens(uid);
    logger.info(`Sessions revoked for user: ${uid}`);
    response.status(200).json({ success: true });
  } catch (error: any) {
    logger.error("Error revoking sessions in Cloud Function:", error);
    response.status(500).json({ success: false, error: error.message });
  }
});

export const verifySessionCookieFunction = onRequest(async (request, response) => {
  logger.info("verifySessionCookieFunction triggered!", { structuredData: true });

  if (request.method !== 'POST') {
    response.status(405).send('Method Not Allowed');
    return;
  }

  const sessionCookie = request.body.sessionCookie;

  if (!sessionCookie) {
    response.status(400).send("Missing sessionCookie in request body.");
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifySessionCookie(sessionCookie, true);
    response.status(200).json(decodedIdToken);
  } catch (error: any) {
    logger.error("Session verification failed in Cloud Function:", error);
    response.status(401).json({ error: 'Session verification failed', details: error.message });
  }
});
