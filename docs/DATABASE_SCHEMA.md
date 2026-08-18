# Database Schema — ERD Reference

All timestamps stored in UTC.
Soft-delete via `deletedAt` on entities where history must be preserved.

---

## Entity Relationship Summary

```
Company 1──* User
Company 1──* Candidate
Company 1──* Interview

User 1──1 Interviewer
Interviewer 1──* AvailabilityRule
Interviewer 1──* AvailabilityException
Interviewer 1──* Interview

Candidate 1──* Resume
Candidate 1──* Interview

Interview 1──* InterviewQuestion
Interview 1──1 InterviewFeedback
Interview 1──* AuditLog (via entityId)

InterviewType 1──1 EvaluationTemplate
EvaluationTemplate 1──* EvaluationCriteria

QuestionBank 1──* InterviewQuestion (via bankQuestionId)

User 1──* RefreshToken
User 1──* AuditLog (via actorId)
```

---

## Tables

### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| passwordHash | TEXT | NOT NULL |
| firstName | VARCHAR(100) | NOT NULL |
| lastName | VARCHAR(100) | NOT NULL |
| phone | VARCHAR(20) | |
| role | ENUM | NOT NULL |
| isActive | BOOLEAN | DEFAULT true |
| companyId | UUID | FK → companies (nullable for ADMIN/INTERVIEWER) |
| createdAt | TIMESTAMPTZ | DEFAULT now() |
| updatedAt | TIMESTAMPTZ | |
| lastLoginAt | TIMESTAMPTZ | |
| deletedAt | TIMESTAMPTZ | |

Roles: ADMIN, COMPANY_ADMIN, RECRUITER, INTERVIEWER

---

### companies
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | |
| phone | VARCHAR(20) | |
| website | VARCHAR(255) | |
| logoUrl | TEXT | |
| isActive | BOOLEAN | DEFAULT true |
| createdAt | TIMESTAMPTZ | DEFAULT now() |
| updatedAt | TIMESTAMPTZ | |
| deletedAt | TIMESTAMPTZ | |

---

### candidates
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| companyId | UUID | FK → companies, NOT NULL |
| createdById | UUID | FK → users |
| firstName | VARCHAR(100) | NOT NULL |
| lastName | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | |
| phone | VARCHAR(20) | |
| location | VARCHAR(255) | |
| currentRole | VARCHAR(255) | |
| experienceYears | INTEGER | |
| skills | TEXT[] | |
| linkedinUrl | TEXT | |
| status | ENUM | DEFAULT 'NEW' |
| createdAt | TIMESTAMPTZ | DEFAULT now() |
| updatedAt | TIMESTAMPTZ | |
| deletedAt | TIMESTAMPTZ | |

Statuses: NEW, INTERVIEW_SCHEDULED, INTERVIEWING, NEXT_ROUND, ON_HOLD, REJECTED, HIRED

Indexes: companyId, status, email, (companyId, status)

---

### resumes
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| candidateId | UUID | FK → candidates, NOT NULL |
| uploadedById | UUID | FK → users |
| fileName | VARCHAR(255) | NOT NULL |
| fileUrl | TEXT | NOT NULL (S3 path) |
| storageKey | TEXT | NOT NULL |
| mimeType | VARCHAR(100) | |
| fileSize | INTEGER | (bytes) |
| isActive | BOOLEAN | DEFAULT true |
| uploadedAt | TIMESTAMPTZ | DEFAULT now() |

Indexes: candidateId, isActive

---

### interviewers
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK → users, UNIQUE, NOT NULL |
| bio | TEXT | |
| yearsOfExperience | INTEGER | |
| expertise | TEXT[] | |
| technologies | TEXT[] | |
| hourlyRate | DECIMAL(10,2) | |
| timezone | VARCHAR(50) | DEFAULT 'UTC' |
| isAvailable | BOOLEAN | DEFAULT true |
| createdAt | TIMESTAMPTZ | DEFAULT now() |
| updatedAt | TIMESTAMPTZ | |
| deletedAt | TIMESTAMPTZ | |

---

### availability_rules
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| interviewerId | UUID | FK → interviewers, NOT NULL |
| dayOfWeek | INTEGER | 0=Sun, 6=Sat |
| startTime | TIME | NOT NULL (local time in interviewer tz) |
| endTime | TIME | NOT NULL |
| timezone | VARCHAR(50) | NOT NULL |
| isActive | BOOLEAN | DEFAULT true |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |

Unique: (interviewerId, dayOfWeek, startTime, endTime)
Index: (interviewerId, dayOfWeek, isActive)

---

### availability_exceptions
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| interviewerId | UUID | FK → interviewers, NOT NULL |
| date | DATE | NOT NULL |
| startTime | TIME | nullable (null = full day) |
| endTime | TIME | nullable |
| type | ENUM | NOT NULL |
| reason | TEXT | |
| createdAt | TIMESTAMPTZ | |

Types: UNAVAILABLE, AVAILABLE (AVAILABLE overrides a normally blocked day)
Index: (interviewerId, date)

---

### interview_types
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| description | TEXT | |
| durationMinutes | INTEGER | NOT NULL |
| difficulty | ENUM | |
| evaluationTemplateId | UUID | FK → evaluation_templates nullable |
| isActive | BOOLEAN | DEFAULT true |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |
| deletedAt | TIMESTAMPTZ | |

Difficulty: EASY, MEDIUM, HARD

---

### evaluation_templates
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| description | TEXT | |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |

---

### evaluation_criteria
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| templateId | UUID | FK → evaluation_templates, NOT NULL |
| name | VARCHAR(100) | NOT NULL |
| description | TEXT | |
| weight | DECIMAL(3,2) | DEFAULT 1.0 |
| sortOrder | INTEGER | DEFAULT 0 |

---

### interviews
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| candidateId | UUID | FK → candidates, NOT NULL |
| interviewerId | UUID | FK → interviewers, NOT NULL |
| companyId | UUID | FK → companies, NOT NULL |
| interviewTypeId | UUID | FK → interview_types, NOT NULL |
| scheduledStart | TIMESTAMPTZ | NOT NULL |
| scheduledEnd | TIMESTAMPTZ | NOT NULL |
| actualStart | TIMESTAMPTZ | |
| actualEnd | TIMESTAMPTZ | |
| timezone | VARCHAR(50) | NOT NULL |
| status | ENUM | DEFAULT 'SCHEDULED' |
| meetingRoomId | VARCHAR(100) | UNIQUE |
| roundNumber | INTEGER | NOT NULL DEFAULT 1 |
| notes | TEXT | (private, interviewer only) |
| cancelReason | TEXT | |
| cancelledById | UUID | FK → users |
| createdById | UUID | FK → users, NOT NULL |
| createdAt | TIMESTAMPTZ | DEFAULT now() |
| updatedAt | TIMESTAMPTZ | |

Statuses: SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW

Indexes: 
- (interviewerId, scheduledStart, scheduledEnd) — for overlap checks
- (candidateId, roundNumber)
- (companyId, status)
- (scheduledStart) — for upcoming interviews query
- meetingRoomId

Constraint: roundNumber >= 1

---

### interview_questions
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| interviewId | UUID | FK → interviews, NOT NULL |
| bankQuestionId | UUID | FK → question_bank nullable (null = custom) |
| questionText | TEXT | NOT NULL |
| category | VARCHAR(100) | |
| difficulty | ENUM | |
| expectedAnswer | TEXT | |
| candidateAnswer | TEXT | |
| interviewerNotes | TEXT | |
| score | INTEGER | CHECK (score >= 1 AND score <= 5) |
| sortOrder | INTEGER | DEFAULT 0 |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |

Index: interviewId

---

### interview_feedback
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| interviewId | UUID | FK → interviews, UNIQUE, NOT NULL |
| interviewerId | UUID | FK → interviewers, NOT NULL |
| scores | JSONB | { criteriaId: score, ... } |
| overallScore | DECIMAL(3,2) | |
| strengths | TEXT | |
| weaknesses | TEXT | |
| concerns | TEXT | |
| recommendation | ENUM | NOT NULL |
| submittedAt | TIMESTAMPTZ | |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |

Recommendation: STRONG_HIRE, HIRE, NEXT_ROUND, HOLD, REJECT

---

### question_bank
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| category | VARCHAR(100) | NOT NULL |
| technology | VARCHAR(100) | |
| question | TEXT | NOT NULL |
| expectedAnswer | TEXT | |
| difficulty | ENUM | NOT NULL |
| tags | TEXT[] | |
| isActive | BOOLEAN | DEFAULT true |
| createdById | UUID | FK → users |
| createdAt | TIMESTAMPTZ | |
| updatedAt | TIMESTAMPTZ | |
| deletedAt | TIMESTAMPTZ | |

Indexes: category, technology, difficulty, tags (GIN index)

---

### refresh_tokens
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK → users, NOT NULL |
| tokenHash | TEXT | UNIQUE, NOT NULL |
| familyId | UUID | NOT NULL (groups rotation chain) |
| expiresAt | TIMESTAMPTZ | NOT NULL |
| revokedAt | TIMESTAMPTZ | |
| replacedById | UUID | FK → refresh_tokens self-reference |
| ipAddress | VARCHAR(45) | |
| userAgent | TEXT | |
| createdAt | TIMESTAMPTZ | DEFAULT now() |

Indexes: userId, tokenHash, familyId

---

### audit_logs
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| actorId | UUID | FK → users nullable |
| companyId | UUID | FK → companies nullable |
| action | VARCHAR(100) | NOT NULL |
| entityType | VARCHAR(50) | |
| entityId | UUID | |
| metadata | JSONB | |
| ipAddress | VARCHAR(45) | |
| userAgent | TEXT | |
| createdAt | TIMESTAMPTZ | DEFAULT now() |

Indexes: actorId, companyId, action, (entityType, entityId), createdAt

---

### notifications
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| userId | UUID | FK → users nullable |
| type | VARCHAR(100) | NOT NULL |
| channel | ENUM | DEFAULT 'EMAIL' |
| recipient | VARCHAR(255) | NOT NULL |
| subject | TEXT | |
| body | TEXT | |
| status | ENUM | DEFAULT 'PENDING' |
| sentAt | TIMESTAMPTZ | |
| failureReason | TEXT | |
| metadata | JSONB | |
| createdAt | TIMESTAMPTZ | DEFAULT now() |

Channels: EMAIL, SMS, WHATSAPP
Statuses: PENDING, SENT, FAILED, SKIPPED

---

## Key Database Decisions

1. **UUID primary keys** — avoids sequential enumeration attacks, works across future microservice splits.
2. **GIN index on `tags` array** — fast tag-based question bank filtering.
3. **Composite index on interviews(interviewerId, scheduledStart, scheduledEnd)** — fast overlap detection.
4. **Soft delete** on candidates, interviewers, interview_types, question_bank — audit trail preserved.
5. **JSONB scores** on feedback — criteria can change per interview type without schema migration.
6. **notes TEXT on interviews** — stored directly on interview, not a separate table (single interviewer, private).
7. **familyId on refresh_tokens** — enables full session/family revocation on theft detection.
8. **meetingRoomId UNIQUE** — prevents two rooms being created for same interview.
