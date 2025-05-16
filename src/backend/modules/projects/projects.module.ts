import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Module({
  providers: [PrismaService],
})
export class ProjectsModule {} 