import { User, Contractor, Project, Request, UserRole, ProjectStatus, RequestStatus } from '@prisma/client';

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