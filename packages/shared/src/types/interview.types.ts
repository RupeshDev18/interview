import {
  InterviewStatus,
  CandidateStatus,
  Recommendation,
  Difficulty,
  UserRole,
  ParticipantRole,
} from '../enums';

export interface CompanySummary {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface CandidateSummary {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  currentRole?: string | null;
  experienceYears?: number | null;
  skills: string[];
  status: CandidateStatus;
}

export interface InterviewerSummary {
  id: string;
  userId: string;
  user: UserSummary;
  bio?: string | null;
  yearsOfExperience?: number | null;
  expertise: string[];
  technologies: string[];
  timezone: string;
  isAvailable: boolean;
}

export interface AvailabilityRuleDto {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface AvailabilityExceptionDto {
  id: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  type: 'UNAVAILABLE' | 'AVAILABLE';
  reason?: string | null;
}

export interface EvaluationCriteriaDto {
  id: string;
  name: string;
  description?: string | null;
  weight: number;
  sortOrder: number;
}

export interface EvaluationTemplateDto {
  id: string;
  name: string;
  description?: string | null;
  criteria: EvaluationCriteriaDto[];
}

export interface InterviewTypeDto {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  difficulty?: Difficulty | null;
  evaluationTemplateId?: string | null;
  evaluationTemplate?: EvaluationTemplateDto | null;
  isActive: boolean;
}

export interface InterviewQuestionDto {
  id: string;
  interviewId: string;
  bankQuestionId?: string | null;
  questionText: string;
  category?: string | null;
  difficulty?: Difficulty | null;
  expectedAnswer?: string | null;
  candidateAnswer?: string | null;
  interviewerNotes?: string | null;
  score?: number | null;
  sortOrder: number;
}

export interface InterviewFeedbackDto {
  id: string;
  interviewId: string;
  interviewerId: string;
  templateId?: string | null;
  scores: Record<string, number>;
  overallScore?: number | null;
  strengths?: string | null;
  weaknesses?: string | null;
  concerns?: string | null;
  recommendation: Recommendation;
  submittedAt?: string | null;
  template?: EvaluationTemplateDto | null;
}

export interface InterviewDto {
  id: string;
  candidateId: string;
  interviewerId: string;
  companyId: string;
  interviewTypeId: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  timezone: string;
  status: InterviewStatus;
  meetingRoomId: string;
  roundNumber: number;
  notes?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;

  candidate: CandidateSummary;
  interviewer: InterviewerSummary;
  company: CompanySummary;
  interviewType: InterviewTypeDto;
  questions?: InterviewQuestionDto[];
  feedback?: InterviewFeedbackDto | null;
}

export interface CreateInterviewDto {
  candidateId: string;
  interviewerId: string;
  interviewTypeId: string;
  companyId?: string;
  scheduledStart: string; // ISO date string
  scheduledEnd: string;   // ISO date string
  timezone?: string;
  roundNumber?: number;
  notes?: string;
  initialQuestions?: Array<{
    questionText: string;
    category?: string;
    difficulty?: Difficulty;
    expectedAnswer?: string;
  }>;
}

export interface UpdateInterviewDto {
  scheduledStart?: string;
  scheduledEnd?: string;
  timezone?: string;
  interviewerId?: string;
  interviewTypeId?: string;
  roundNumber?: number;
  notes?: string;
}

export interface UpdateInterviewNotesDto {
  notes: string;
}

export interface UpdateQuestionNotesDto {
  candidateAnswer?: string;
  interviewerNotes?: string;
  score?: number;
}

export interface SubmitFeedbackDto {
  scores: Record<string, number>;
  overallScore?: number;
  strengths?: string;
  weaknesses?: string;
  concerns?: string;
  recommendation: Recommendation;
  templateId?: string;
  nextCandidateStatus?: CandidateStatus;
}

export interface InterviewFiltersDto {
  companyId?: string;
  candidateId?: string;
  interviewerId?: string;
  status?: InterviewStatus;
  roundNumber?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CandidateDossierDto {
  candidate: CandidateSummary & {
    company: CompanySummary;
    resumes: Array<{
      id: string;
      fileName: string;
      fileUrl: string;
      uploadedAt: string;
    }>;
  };
  interviews: InterviewDto[];
  totalRounds: number;
  completedRounds: number;
  averageScore?: number | null;
  finalRecommendation?: Recommendation | null;
}

export interface CandidateJoinDetailsDto {
  interviewId: string;
  meetingRoomId: string;
  scheduledStart: string;
  scheduledEnd: string;
  timezone: string;
  status: InterviewStatus;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
  };
  company: {
    name: string;
    logoUrl?: string | null;
  };
  interviewType: {
    name: string;
    durationMinutes: number;
  };
  interviewerName: string;
}

export interface CreateGuestLinkDto {
  role?: ParticipantRole; // HR_OBSERVER or CO_INTERVIEWER
  guestName?: string;
  expiresInMinutes?: number;
}

export interface GuestJoinDetailsDto {
  interviewId: string;
  meetingRoomId: string;
  scheduledStart: string;
  scheduledEnd: string;
  timezone: string;
  status: InterviewStatus;
  role: ParticipantRole;
  guestName?: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
  };
  company: {
    name: string;
    logoUrl?: string | null;
  };
  interviewType: {
    name: string;
    durationMinutes: number;
  };
  interviewerName: string;
}

export interface RemoteParticipantDto {
  socketId: string;
  name: string;
  role: ParticipantRole | string;
  isMuted?: boolean;
  isVideoOff?: boolean;
}
