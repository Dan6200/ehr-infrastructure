// This file configures a Redis client for a standard Node.js environment.
// It uses ioredis, which is suitable for connecting to Google Cloud Memorystore.
// Ensure you have the following environment variables set:
// REDIS_HOST
// REDIS_PORT
// REDIS_PASSWORD (if applicable)

import Redis from 'ioredis'

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
  throw new Error('Redis environment variables are not set.')
}

const redis = new Redis({
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT!),
  password: process.env.REDIS_PASSWORD,
  connectTimeout: 100_000,
})

export default redis
