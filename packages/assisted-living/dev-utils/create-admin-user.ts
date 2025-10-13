import * as admin from 'firebase-admin'

// This script requires Google Application Credentials to be set up.
// See: https://firebase.google.com/docs/admin/setup#initialize-sdk

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  })
}

const VALID_ROLES = ['ADMIN', 'CLINICIAN', 'CAREGIVER', 'VIEWER']

async function createAdminUser(
  email: string,
  password: string,
  roles: string[],
) {
  console.log(
    `Attempting to create user: ${email} with roles: ${roles.join(', ')}`,
  )

  // Validate roles
  for (const role of roles) {
    if (!VALID_ROLES.includes(role.toUpperCase())) {
      console.error(
        `Error: Invalid role '${role}'. Valid roles are: ${VALID_ROLES.join(', ')}`,
      )
      process.exit(1)
    }
  }

  try {
    // Create the new user
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: true,
      disabled: false,
    })

    console.log(`Successfully created new user with UID: ${userRecord.uid}`)

    // Set custom claims for the specified roles
    await admin.auth().setCustomUserClaims(userRecord.uid, { roles: roles })

    console.log(
      `Successfully set roles [${roles.join(', ')}] for user: ${userRecord.uid}`,
    )
    console.log('User setup complete!')
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.error(
        `Error: The email address ${email} is already in use by another account.`,
      )
    } else if (error.code === 'auth/invalid-password') {
      console.error(
        `Error: The specified password is not valid. It must be a string with at least six characters.`,
      )
    } else {
      console.error('Error creating new user:', error)
    }
    process.exit(1)
  }
}

// --- Script Execution ---

const email = process.argv[2]
const password = process.argv[3]
const rolesArg = process.argv[4] // Expects a comma-separated string, e.g., "ADMIN,CLINICIAN"

if (!email || !password) {
  console.error(
    'Usage: pnpm ts-node dev-utils/create-admin-user.ts <email> <password> [roles]',
  )
  console.error(
    'Example: pnpm ts-node dev-utils/create-admin-user.ts user@example.com StrongPass1! ADMIN,CAREGIVER',
  )
  process.exit(1)
}

// Default to ['VIEWER'] if no roles are provided
const roles = rolesArg
  ? rolesArg.split(',').map((role) => role.trim().toUpperCase())
  : ['VIEWER']

createAdminUser(email, password, roles)
