import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  preset: 'ts-jest/',
  moduleNameMapper: {
    '^#root/(.*)$': '<rootDir>/$1',
    '^server-only$': '<rootDir>/test-data/empty.ts',
  },
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts',
    '<rootDir>/test-data/integrationSetup.ts',
  ],
  testMatch: ['<rootDir>/**/*.integration.test.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  testTimeout: 30000,
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },
}

export default createJestConfig(config)
