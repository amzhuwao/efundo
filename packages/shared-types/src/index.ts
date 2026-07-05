export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  LECTURER = 'LECTURER',
  MODERATOR = 'MODERATOR',
  STUDENT = 'STUDENT',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum EducationLevel {
  PRIMARY = 'PRIMARY',
  O_LEVEL = 'O_LEVEL',
  A_LEVEL = 'A_LEVEL',
  TERTIARY = 'TERTIARY',
  OTHER = 'OTHER',
}

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  [EducationLevel.PRIMARY]: 'Primary',
  [EducationLevel.O_LEVEL]: 'O-Level',
  [EducationLevel.A_LEVEL]: 'A-Level',
  [EducationLevel.TERTIARY]: 'Tertiary',
  [EducationLevel.OTHER]: 'Other',
};

export enum ResourceType {
  PAST_PAPER = 'PAST_PAPER',
  TEXTBOOK = 'TEXTBOOK',
  LECTURE_NOTE = 'LECTURE_NOTE',
  ASSIGNMENT = 'ASSIGNMENT',
  SOLUTION = 'SOLUTION',
  RESEARCH_PAPER = 'RESEARCH_PAPER',
  LAB_MANUAL = 'LAB_MANUAL',
  REVISION_GUIDE = 'REVISION_GUIDE',
  SLIDES = 'SLIDES',
  CASE_STUDY = 'CASE_STUDY',
  EXTERNAL_COURSE = 'EXTERNAL_COURSE',
}

export enum ResourceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  educationLevel?: EducationLevel | null;
  programId?: string | null;
  year?: number | null;
  createdAt: string;
}

export interface Program {
  id: string;
  level: EducationLevel;
  name: string;
  slug: string;
  description?: string | null;
  providerName?: string | null;
  formOrGrade?: number | null;
  durationYears?: number | null;
  orderIndex?: number;
  status?: string;
  subjects?: Subject[];
}

export interface Subject {
  id: string;
  programId: string;
  name: string;
  code: string;
  year?: number | null;
  semester?: number | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ResourceSummary {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  type: ResourceType;
  status: ResourceStatus;
  educationLevel?: EducationLevel | null;
  program?: {
    id: string;
    name: string;
    slug: string;
    level: EducationLevel;
    providerName?: string | null;
  } | null;
  subject?: { id: string; name: string; code: string } | null;
  year?: number | null;
  semester?: number | null;
  author?: string | null;
  uploader?: { id: string; fullName: string } | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  hasFile: boolean;
  downloadCount: number;
  viewCount: number;
  tags: string[];
  externalUrl?: string | null;
  sourceName?: string | null;
  sourceCatalogUrl?: string | null;
  attributionNotice?: string | null;
  durationWeeks?: number | null;
  avgRating?: number | null;
  reviewCount: number;
  isBookmarked?: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}