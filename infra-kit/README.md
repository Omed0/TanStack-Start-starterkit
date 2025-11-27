# 🚀 Infra-Kit

A comprehensive TypeScript/JavaScript SDK for self-hosted infrastructure services. Built for production with BullMQ, Redis, and MinIO.

[![npm version](https://img.shields.io/npm/v/@infra-kit/core.svg)](https://www.npmjs.com/package/@infra-kit/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 📦 **Queue Management** - Background jobs with BullMQ
- ⚡ **Cache** - High-performance caching with Redis
- 📁 **Object Storage** - S3-compatible storage with MinIO
- 🔔 **Event Bus** - Pub/Sub messaging with Redis
- 🛡️ **Rate Limiting** - Sliding window rate limiting
- 🔒 **Distributed Locking** - Redis-based distributed locks
- 👤 **Session Management** - Secure session storage

## Installation

```bash
npm install @infra-kit/core bullmq ioredis minio
# or
pnpm add @infra-kit/core bullmq ioredis minio
# or
bun add @infra-kit/core bullmq ioredis minio
```

## Quick Start

### 1. Initialize Configuration

```typescript
import { initConfig } from '@infra-kit/core';

// Programmatic configuration
initConfig({
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'your-password'
  },
  storage: {
    endPoint: 'localhost',
    port: 9000,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin'
  }
});

// Or from environment variables
import { initFromEnv } from '@infra-kit/core';
initFromEnv();

```

### 2. Use the Modules

**Queue Management**

```typescript
import { addJob, processJobs } from '@infra-kit/core/queue';

// Add a job
await addJob('emails', 'send-welcome', {
  to: 'user@example.com',
  subject: 'Welcome!'
}, {
  delay: 5000,
  attempts: 3
});

// Process jobs
processJobs('emails', async (job) => {
  console.log('Sending email:', job.data);
  // Send email logic
  return { sent: true };
}, { concurrency: 5 });
```

**Cache**

```typescript
import { setCache, getCache } from '@infra-kit/core/cache';

// Set with TTL
await setCache('user:123', { name: 'John', email: 'john@example.com' }, 3600);

// Get
const user = await getCache('user:123');
console.log(user?.name);
```

**Object Storage**

```typescript
import { uploadFile, getDownloadUrl } from '@infra-kit/core/storage';

// Upload file
await uploadFile('uploads', 'images/photo.jpg', '/tmp/photo.jpg');

// Get presigned download URL
const url = await getDownloadUrl('uploads', 'images/photo.jpg', 3600);
```

**Event Bus**

```typescript
import { publish, subscribe } from '@infra-kit/core/events';

// Subscribe
await subscribe('user.created', (data) => {
  console.log('New user:', data);
});

// Publish
await publish('user.created', {
  userId: '123',
  email: 'user@example.com'
});
```

**Rate Limiting**

```typescript
import { checkRateLimit } from '@infra-kit/core/rate-limit';

const result = await checkRateLimit('user:123', {
  limit: 100,
  window: 60,
  key: 'api-requests'
});

if (!result.allowed) {
  throw new Error(`Rate limit exceeded. Retry in ${result.retryAfter}ms`);
}
```

**Distributed Locking**

```typescript
import { withLock } from '@infra-kit/core/lock';

await withLock('critical-section', async () => {
  // Critical work here
  console.log('Locked section');
}, { ttl: 30000 });
```

**Session Management**

```typescript
import { setSession, getSession } from '@infra-kit/core/session';

// Create session
await setSession('sess_123', {
  userId: '456',
  email: 'user@example.com'
}, { ttl: 3600 });

// Get session
const session = await getSession('sess_123');
```

## Configuration

### Environment Variables

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0

# Storage (MinIO/S3)
S3_ENDPOINT=localhost
S3_PORT=9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_USE_SSL=false
```

## API Documentation

### Queue

- `addJob(queueName, jobName, data, options)` - Add a job
- `addBulkJobs(queueName, jobs)` - Add multiple jobs
- `scheduleJob(queueName, jobName, data, repeatOptions)` - Schedule recurring job
- `processJobs(queueName, processor, options)` - Process jobs
- `getQueueMetrics(queueName)` - Get queue stats
- `cleanQueue(queueName, grace, limit, type)` - Clean old jobs
- `pauseQueue(queueName)` / `resumeQueue(queueName)` - Control queue

### Cache

- `setCache(key, value, ttl)` - Set cache entry
- `getCache(key)` - Get cache entry
- `deleteCache(key)` - Delete entry
- `hasCache(key)` - Check if exists
- `increment(key, amount)` / `decrement(key, amount)` - Atomic operations
- `getMany(keys)` / `setMany(entries)` - Bulk operations
- `clearCache()` - Clear all cache

### Storage

- `uploadFile(bucket, objectName, filePath, metadata)` - Upload file
- `downloadFile(bucket, objectName, filePath)` - Download file
- `deleteObject(bucket, objectName)` - Delete object
- `listObjects(bucket, prefix, recursive)` - List objects
- `getUploadUrl(bucket, objectName, expiry)` - Presigned upload URL
- `getDownloadUrl(bucket, objectName, expiry)` - Presigned download URL

### Events

- `publish(channel, data)` - Publish event
- `subscribe(channel, handler)` - Subscribe to events
- `subscribeMany(channels, handler)` - Subscribe to multiple channels
- `unsubscribe(channel)` - Unsubscribe from channel

### Rate Limit

- `checkRateLimit(identifier, options)` - Check and consume rate limit
- `peekRateLimit(identifier, options)` - Check without consuming
- `resetRateLimit(identifier, key)` - Reset limits
- `createRateLimiter(options)` - Create reusable limiter

### Lock

- `acquireLock(key, options)` - Acquire lock
- `releaseLock(key, token)` - Release lock
- `extendLock(key, token, ttl)` - Extend lock TTL
- `withLock(key, fn, options)` - Execute with lock

### Session

- `setSession(sessionId, data, options)` - Create/update session
- `getSession(sessionId)` - Get session data
- `updateSession(sessionId, data, options)` - Merge update
- `deleteSession(sessionId)` - Delete session
- `refreshSession(sessionId, ttl)` - Refresh TTL

## Docker Setup

Use this `docker-compose.yml` for local development:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: bitnami/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data

volumes:
  redis_data:
  minio_data:
```

## Module Exports

Import specific modules for better tree-shaking:

```typescript
import { addJob } from '@infra-kit/core/queue';
import { setCache } from '@infra-kit/core/cache';
import { uploadFile } from '@infra-kit/core/storage';
import { publish } from '@infra-kit/core/events';
import { checkRateLimit } from '@infra-kit/core/rate-limit';
import { acquireLock } from '@infra-kit/core/lock';
import { setSession } from '@infra-kit/core/session';
```

## TypeScript Support

Full TypeScript support with type definitions included.

```typescript
import type { Config, RateLimitResult } from '@infra-kit/core';
```

## License

MIT © [Your Name]

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

- 📖 [Documentation](https://github.com/omed0/infra-kit)
- 🐛 [Issues](https://github.com/omed0/infra-kit/issues)
- 💬 [Discussions](https://github.com/omed0/infra-kit/discussions)
