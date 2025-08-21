// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.ts`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
// @ts-ignore
import { jest } from "@jest/globals";

/* TODO setup firebase-admin and initialize here:
 *
 * const admin = require('firebase-admin');

 * beforeAll(() => {
 *   // Initialize emulator-connected admin instance
 * });
 * 
 * test('create user with real rules', async () => {
 *   const user = await admin.auth().createUser({ email: 'test@emulator.com' });
 *   expect(user.uid).toBeDefined();
 * });
 *
 */

// Mock environment variables if needed
// process.env.NEXT_PUBLIC_FB_API_KEY = 'mock-api-key';
// process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN = 'mock-auth-domain';
// ... add other necessary env vars

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    const error = new Error("not_found");
    (error as any).digest = "NEXT_NOT_FOUND";
    throw error;
  }),
  redirect: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: jest.fn(() => "/mock-path"),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

jest.mock("@vercel/analytics/react", () => ({
  Analytics: () => null, // Mock Analytics component
}));

// Mock other external dependencies or browser APIs if necessary
// For example, mocking fetch:
// global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));
