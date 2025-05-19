// Определяем типы на основе схемы Prisma вместо импорта
// import { User, Contractor, Project, Request, UserRole, ProjectStatus, RequestStatus } from '@prisma/client';

// Определение собственных типов на основе схемы Prisma
export interface User {
  id: string;
  email: string;
  name?: string | null;
  password: string;
  role: UserRole;
  phone?: string | null;
  avatar?: string | null;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
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
  specializations: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  address?: string | null;
  socialLinks?: any | null;
  availableHours?: any | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  budget?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  completedAt?: Date | null;
  priority: Priority;
  tags: string[];
  visibility: Visibility;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  ownerId: string;
  contractorId?: string | null;
}

// Определяем перечисления вручную, соответствующие схеме Prisma
export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
  REVIEW = 'REVIEW',
}

// Приоритеты
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Видимость
export enum Visibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  INVITATION_ONLY = 'INVITATION_ONLY',
}

export interface Request {
  id: string;
  title: string;
  description: string;
  budget?: number | null;
  deadline?: Date | null;
  status: RequestStatus;
  category?: string | null;
  specializationTags: string[];
  requiredSkills: string[];
  location?: string | null;
  isRemote: boolean;
  isUrgent: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
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
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
}

// Модель предложения от подрядчика
export interface Proposal {
  id: string;
  requestId: string;
  contractorId: string;
  price: number;
  description: string;
  estimatedDays?: number | null;
  status: ProposalStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Статусы предложения
export enum ProposalStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

// Модель вехи проекта
export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  status: MilestoneStatus;
  amount?: number | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Статусы вехи
export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Модель задачи
export interface Task {
  id: string;
  milestoneId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: Date | null;
  completedAt?: Date | null;
  assignedTo?: string | null;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
}

// Статусы задачи
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Модель сообщения
export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  projectId?: string | null;
  requestId?: string | null;
  proposalId?: string | null;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Типы уведомлений
export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

// Модель уведомления
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  createdAt: Date;
}

// Модель документа
export interface Document {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  userId: string;
  projectId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Модель вложения
export interface Attachment {
  id: string;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  projectId?: string | null;
  requestId?: string | null;
  createdAt: Date;
}

// Модель отзыва
export interface Review {
  id: string;
  authorId: string;
  targetId: string;
  projectId: string;
  rating: number;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Модель элемента портфолио
export interface PortfolioItem {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  projectUrl?: string | null;
  completionDate?: Date | null;
  userId: string;
  contractorId?: string | null;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Типы платежных методов
export enum PaymentType {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  ELECTRONIC_WALLET = 'ELECTRONIC_WALLET',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY',
}

// Модель платежного метода
export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentType;
  provider: string;
  accountNumber?: string | null;
  expiryDate?: Date | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Типы транзакций
export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  FEE = 'FEE',
}

// Статусы транзакций
export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Модель транзакции
export interface Transaction {
  id: string;
  userId: string;
  projectId?: string | null;
  paymentMethodId?: string | null;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  description?: string | null;
  externalId?: string | null;
  createdAt: Date;
  completedAt?: Date | null;
}

// Модель журнала активности
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any | null;
  projectId?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

// Модель навыка
export interface Skill {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Модель категории
export interface Category {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  phone?: string;
}

// Типы для проектов
export interface CreateProjectRequest {
  title: string;
  description?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  priority?: Priority;
  tags?: string[];
  visibility?: Visibility;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  completedAt?: Date;
  priority?: Priority;
  tags?: string[];
  visibility?: Visibility;
  contractorId?: string;
}

// Типы для запросов
export interface CreateRequestRequest {
  title: string;
  description: string;
  budget?: number;
  deadline?: Date;
  projectId?: string;
  category?: string;
  specializationTags?: string[];
  requiredSkills?: string[];
  location?: string;
  isRemote?: boolean;
  isUrgent?: boolean;
}

export interface UpdateRequestRequest {
  title?: string;
  description?: string;
  budget?: number;
  deadline?: Date;
  status?: RequestStatus;
  contractorId?: string;
  category?: string;
  specializationTags?: string[];
  requiredSkills?: string[];
  location?: string;
  isRemote?: boolean;
  isUrgent?: boolean;
}

// Типы для подрядчиков
export interface CreateContractorRequest {
  companyName?: string;
  description?: string;
  services: string[];
  specializations?: string[];
  experience?: number;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  socialLinks?: any;
  availableHours?: any;
}

export interface UpdateContractorRequest {
  companyName?: string;
  description?: string;
  services?: string[];
  specializations?: string[];
  experience?: number;
  verified?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  socialLinks?: any;
  availableHours?: any;
}

// Типы для предложений
export interface CreateProposalRequest {
  requestId: string;
  contractorId: string;
  price: number;
  description: string;
  estimatedDays?: number;
}

export interface UpdateProposalRequest {
  price?: number;
  description?: string;
  estimatedDays?: number;
  status?: ProposalStatus;
}

// Типы для вех проекта
export interface CreateMilestoneRequest {
  projectId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  amount?: number;
  order?: number;
}

export interface UpdateMilestoneRequest {
  title?: string;
  description?: string;
  dueDate?: Date;
  completedAt?: Date;
  status?: MilestoneStatus;
  amount?: number;
  order?: number;
}

// Типы для задач
export interface CreateTaskRequest {
  milestoneId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  assignedTo?: string;
  priority?: Priority;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: Date;
  completedAt?: Date;
  assignedTo?: string;
  priority?: Priority;
}

// Типы для отзывов
export interface CreateReviewRequest {
  authorId: string;
  targetId: string;
  projectId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

// Типы для элементов портфолио
export interface CreatePortfolioItemRequest {
  title: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  completionDate?: Date;
  skills?: string[];
}

export interface UpdatePortfolioItemRequest {
  title?: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  completionDate?: Date;
  skills?: string[];
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

// Типы для фильтрации
export interface FilterParams {
  [key: string]: any;
}

// Типы для сортировки
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// Интерфейс для загрузки файлов
export interface FileUploadResponse {
  fileUrl: string;
  fileType: string;
  fileSize: number;
  filename: string;
}
