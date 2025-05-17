// Определяем типы на основе схемы Prisma вместо импорта
// import { User, Contractor, Project, Request, UserRole, ProjectStatus, RequestStatus } from '@prisma/client';

// Определение собственных типов на основе схемы Prisma
export interface User {
  id: string;
  email: string;
  name?: string | null;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Определяем перечисления вручную, соответствующие схеме Prisma
export enum UserRole {
  ADMIN = 'ADMIN',
  ENTREPRENEUR = 'ENTREPRENEUR',
  CONTRACTOR = 'CONTRACTOR',
}

export interface Contractor {
  id: string;
  userId: string;
  companyName?: string | null;
  description?: string | null;
  services: string[];
  rating: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  budget?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  contractorId?: string | null;
}

// Определяем перечисления вручную, соответствующие схеме Prisma
export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Request {
  id: string;
  title: string;
  description: string;
  budget?: number | null;
  deadline?: Date | null;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  projectId?: string | null;
  contractorId?: string | null;
}

// Определяем перечисления вручную, соответствующие схеме Prisma
export enum RequestStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Типы для аутентификации
export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  role: UserRole;
}

// Типы для проектов
export interface CreateProjectRequest {
  title: string;
  description?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  contractorId?: string;
}

// Типы для запросов
export interface CreateRequestRequest {
  title: string;
  description: string;
  budget?: number;
  deadline?: Date;
  projectId?: string;
}

export interface UpdateRequestRequest {
  title?: string;
  description?: string;
  budget?: number;
  deadline?: Date;
  status?: RequestStatus;
  contractorId?: string;
}

// Типы для подрядчиков
export interface CreateContractorRequest {
  companyName?: string;
  description?: string;
  services: string[];
}

export interface UpdateContractorRequest {
  companyName?: string;
  description?: string;
  services?: string[];
  verified?: boolean;
}

// Типы для API ответов
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Типы для пагинации
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
