# Technical Interview Management Platform — Architecture

## 1. System Overview

A multi-tenant SaaS platform enabling companies to manage the full lifecycle of technical interviews:
candidate intake → resume upload → interviewer selection → scheduling → live interview room →
structured feedback → hiring decision → next-round scheduling.

---

## 2. High-Level Architecture

```
                         ┌──────────────────────────┐
                         │         Browser           │
                         │  Next.js (App Router)     │
                         └────────────┬─────────────┘
                                      │  HTTPS / WSS
                         ┌────────────▼─────────────┐
                         │      Express API           │
                         │  REST + Socket.IO          │
                         └───┬──────────┬────────────┘
                             │          │
                  ┌──────────▼──┐  ┌────▼──────────┐
                  │ PostgreSQL  │  │     Redis      │
                  │  (primary)  │  │  (cache/rate)  │
                  └──────────┬──┘  └───────────────┘
                             │  Domain Events
                  ┌──────────▼──────────┐
                  │        Kafka         │
                  └────┬────────────┬───┘
                       │            │
              ┌────────▼──┐  ┌──────▼────────┐
              │Notification│  │ Audit/Event   │
              │ Consumer   │  │  Consumer     │
              └────────────┘  └──────────────┘

  Browser ──── WebRTC (P2P) ──── Interview Room
  
  S3 / MinIO ──── Candidate Resumes (signed URLs)
  
  MailHog (dev) / SMTP (prod) ──── Email Notifications
```

---

## 3. Repository Structure (Monorepo)

```
intvwplt/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/                      # App Router pages
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── forgot-password/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── candidates/
│   │   │   │   ├── interviews/
│   │   │   │   ├── interviewers/
│   │   │   │   ├── availability/
│   │   │   │   ├── questions/
│   │   │   │   ├── settings/
│   │   │   │   └── admin/
│   │   │   └── interviews/[id]/room/ # Interview room (special layout)
│   │   ├── components/               # Shared UI components
│   │   ├── features/                 # Feature-specific components + logic
│   │   │   ├── auth/
│   │   │   ├── candidates/
│   │   │   ├── interviews/
│   │   │   ├── interviewers/
│   │   │   ├── availability/
│   │   │   ├── questions/
│   │   │   ├── feedback/
│   │   │   └── analytics/
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── services/                 # API client functions (TanStack Query)
│   │   ├── lib/                      # Utilities, API client, socket
│   │   ├── types/                    # Shared TypeScript types
│   │   ├── schemas/                  # Zod schemas (client-side)
│   │   └── stores/                   # Zustand stores (auth token in memory)
│   │
│   └── api/                          # Express backend
│       ├── src/
│       │   ├── config/               # env, constants, logger
│       │   ├── middleware/           # auth, rbac, error, rate-limit
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── auth.repository.ts
│       │   │   │   ├── auth.routes.ts
│       │   │   │   └── auth.validator.ts
│       │   │   ├── users/
│       │   │   ├── companies/
│       │   │   ├── candidates/
│       │   │   ├── resumes/
│       │   │   ├── interviewers/
│       │   │   ├── availability/
│       │   │   ├── interviews/
│       │   │   ├── questions/
│       │   │   ├── feedback/
│       │   │   ├── notifications/
│       │   │   ├── analytics/
│       │   │   └── audit/
│       │   ├── events/
│       │   │   ├── kafka/
│       │   │   │   ├── producer.ts
│       │   │   │   ├── consumers/
│       │   │   │   │   ├── notification.consumer.ts
│       │   │   │   │   └── audit.consumer.ts
│       │   │   │   └── topics.ts
│       │   │   └── domain-events.ts
│       │   ├── sockets/
│       │   │   ├── socket.server.ts
│       │   │   ├── handlers/
│       │   │   │   ├── interview-room.handler.ts
│       │   │   │   └── webrtc-signaling.handler.ts
│       │   │   └── socket.auth.ts
│       │   ├── lib/
│       │   │   ├── prisma.ts
│       │   │   ├── redis.ts
│       │   │   ├── s3.ts
│       │   │   ├── mailer.ts
│       │   │   └── logger.ts
│       │   ├── utils/
│       │   ├── app.ts
│       │   └── server.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── tests/
│           ├── unit/
│           ├── integration/
│           └── e2e/
│
├── packages/
│   └── shared/                       # Shared types/constants between apps
│       ├── src/
│       │   ├── types/
│       │   ├── enums/
│       │   └── constants/
│       └── package.json
│
├── docker-compose.yml
├── docker-compose.override.yml       # Dev overrides
├── .env.example
├── package.json                      # Root workspace package.json
└── turbo.json                        # Turborepo config
```

---

## 4. Authentication & Refresh Token Flow

### Token Strategy

| Token | Storage | Expiry | Purpose |
|-------|---------|--------|---------|
| Access JWT | Zustand memory (never localStorage) | 10 minutes | API authorization |
| Refresh JWT | `httpOnly; Secure; SameSite=Strict` cookie | 7 days | Issue new access tokens |

### Flow

```
POST /api/v1/auth/login
  → Verify credentials
  → Issue access token (10m) → returned in response body
  → Issue refresh token (7d) → stored as httpOnly cookie
  → Hash refresh token → store RefreshToken record in DB
  → Return { accessToken, user }

Subsequent API calls:
  Authorization: Bearer <accessToken>

Access token expires:
  POST /api/v1/auth/refresh
  → Read refresh token from cookie
  → Hash it → look up RefreshToken in DB
  → If not found or revoked → 401
  → If found:
      → Mark old token as revoked (revokedAt = now)
      → Create new refresh token
      → Set replacedByTokenId on old record
      → Issue new access token
      → Issue new refresh token cookie
  → Return { accessToken }

Reuse detection (token theft):
  If a REVOKED refresh token is presented:
  → The entire token family is revoked (all tokens with same root)
  → All sessions for that user are invalidated
  → Return 401

POST /api/v1/auth/logout
  → Revoke current refresh token
  → Clear cookie

POST /api/v1/auth/logout-all
  → Revoke ALL refresh tokens for the user
  → Clears all sessions
```

### RefreshToken Table

```
RefreshToken {
  id           String   @id
  userId       String
  tokenHash    String   @unique  // bcrypt hash of raw token
  familyId     String            // groups related rotation chain
  expiresAt    DateTime
  revokedAt    DateTime?
  replacedById String?           // points to the next token in chain
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime
}
```

---

## 5. Double-Booking Prevention

### The Problem
Two recruiters simultaneously select the same interviewer + time slot. Without protection, both succeed and the interviewer has two overlapping interviews.

### Solution: PostgreSQL Advisory Locks + Transaction

```
POST /api/v1/interviews  (booking request)

1. BEGIN TRANSACTION (serializable isolation)
2. SELECT pg_advisory_xact_lock(interviewer_id_hash)
   → Serializes concurrent bookings for same interviewer
3. SELECT existing interviews for interviewer
   WHERE scheduledStart < requestedEnd
   AND scheduledEnd > requestedStart
   AND status NOT IN (CANCELLED, NO_SHOW)
   FOR UPDATE
4. If overlap found → ROLLBACK → HTTP 409 CONFLICT
5. Check AvailabilityRule covers the requested time
6. Check AvailabilityException (UNAVAILABLE type) blocks the time
7. Check candidate doesn't have a simultaneous interview
8. INSERT interview record
9. COMMIT
```

### Why PostgreSQL Advisory Locks?
- Row-level locks on non-existent rows (no existing interview) don't prevent the race.
- Advisory locks on `interviewer_id` integer hash guarantee only one transaction proceeds at a time per interviewer.
- The lock is automatically released when the transaction ends.

### Redis Distributed Lock (backup layer)
- Acquire Redis lock with key `lock:interviewer:{id}:{date}` (TTL 10s) before entering transaction.
- Prevents unnecessary DB load from concurrent requests.
- PostgreSQL remains the source of truth even if Redis is unavailable.

---

## 6. WebRTC Architecture

### Design Principle
WebRTC implementation is isolated in `features/interview-room/webrtc/` on the frontend and `sockets/handlers/webrtc-signaling.handler.ts` on the backend. Swapping to a third-party provider (Daily.co, Twilio) requires only replacing these files.

### Signaling Flow (via Socket.IO)

```
Interviewer joins room         Candidate joins room
      │                               │
      │── socket.emit('join-room') ──▶│
      │                     Server    │
      │◀── 'room-joined' ────────────│
      │                               │
      │── 'offer' (SDP) ────────────▶│
      │◀── 'answer' (SDP) ───────────│
      │── 'ice-candidate' ──────────▶│
      │◀── 'ice-candidate' ──────────│
      │                               │
      │←──────── P2P Media ──────────│
      │         (audio/video)         │
```

### STUN/TURN Configuration
```typescript
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },           // Free STUN (dev)
    { urls: process.env.NEXT_PUBLIC_TURN_URL,            // Configurable TURN (prod)
      username: process.env.NEXT_PUBLIC_TURN_USER,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL }
  ].filter(s => s.urls)
};
```

### Interview Room State Machine
```
WAITING → CONNECTING → CONNECTED → IN_INTERVIEW → COMPLETED
                                       ↓
                                   RECONNECTING
```

---

## 7. Kafka Usage (Async Only)

Kafka is used ONLY for events where async processing adds value. It is NOT used for synchronous request/response operations.

### Topics & Producers

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `interview.created` | interview.service | notification.consumer | Send confirmation emails |
| `interview.rescheduled` | interview.service | notification.consumer | Notify participants |
| `interview.cancelled` | interview.service | notification.consumer | Notify participants |
| `interview.completed` | interview.service | notification.consumer, audit.consumer | Notify recruiter, log event |
| `candidate.status_changed` | candidate.service | notification.consumer | Notify recruiter |
| `resume.uploaded` | resume.service | audit.consumer | Log upload event |
| `notification.requested` | any service | notification.consumer | Generic notification dispatch |
| `audit.event` | any service | audit.consumer | Persist to AuditLog table |

### What Kafka is NOT used for
- Login / Register
- Booking (synchronous, needs immediate 409 response)
- Fetching availability
- Saving notes (low-latency autosave, direct API)
- Fetching candidate data

---

## 8. Redis Usage

| Use Case | Key Pattern | TTL |
|----------|-------------|-----|
| Rate limiting | `rl:{ip}:{route}` | 1 minute |
| Availability slot cache | `avail:{interviewerId}:{date}` | 5 minutes |
| Interview room participants | `room:{interviewId}:participants` | 2 hours |
| Distributed booking lock | `lock:interviewer:{id}:{date}` | 10 seconds |
| Email verification codes | `verify:{userId}` | 15 minutes |

Redis is NEVER the source of truth for bookings or interview data.

---

## 9. Authorization Matrix (RBAC)

| Resource | ADMIN | COMPANY_ADMIN | RECRUITER | INTERVIEWER |
|----------|-------|---------------|-----------|-------------|
| All companies | CRUD | Own company R | - | - |
| All users | CRUD | Company users CRUD | - | - |
| All candidates | CRUD | Company CRUD | Company CRUD | Assigned R |
| Resume upload | ✓ | ✓ | ✓ | - |
| Resume read | ✓ | ✓ | ✓ | Assigned only |
| Interview types | CRUD | R | R | R |
| All interviewers | CRUD | R | R | Own profile |
| Availability | ✓ | R | R | Own CRUD |
| Schedule interview | ✓ | ✓ | ✓ | - |
| Join interview room | ✓ | - | - | Assigned only |
| Interview notes | ✓ | - | - | Own (write) |
| Read notes | ✓ | ✓ (summary) | ✓ (summary) | Own only |
| Submit feedback | ✓ | - | - | Assigned only |
| View feedback | ✓ | ✓ | ✓ | Own |
| Question bank | CRUD | R | R | R |
| Analytics | ✓ | Own company | Own | Own |
| Audit logs | ✓ | - | - | - |

Notes are NEVER visible to candidates. Candidates do not have a login in V1.

---
