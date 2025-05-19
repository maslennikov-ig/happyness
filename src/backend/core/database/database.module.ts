import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UserRepository } from './repositories/user.repository';
import { ProjectRepository } from './repositories/project.repository';
import { ContractorRepository } from './repositories/contractor.repository';
import { RequestRepository } from './repositories/request.repository';

/**
 * Модуль базы данных, который предоставляет PrismaService и репозитории
 */
@Module({
  providers: [
    PrismaService,
    UserRepository,
    ProjectRepository,
    ContractorRepository,
    RequestRepository,
  ],
  exports: [
    PrismaService,
    UserRepository,
    ProjectRepository,
    ContractorRepository,
    RequestRepository,
  ],
})
export class DatabaseModule {}
