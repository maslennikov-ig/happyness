import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestStatus } from '@/backend/types';

@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  async create(createRequestDto: CreateRequestDto) {
    return this.prisma.request.create({
      data: createRequestDto,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: true,
        contractor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(status?: RequestStatus) {
    const where = status ? { status } : {};

    return this.prisma.request.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: true,
        contractor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: true,
        contractor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Запрос с ID ${id} не найден`);
    }

    return request;
  }

  async update(id: string, updateRequestDto: UpdateRequestDto) {
    try {
      return await this.prisma.request.update({
        where: { id },
        data: updateRequestDto,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: true,
          contractor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Запрос с ID ${id} не найден`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.request.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Запрос с ID ${id} не найден`);
      }
      throw error;
    }
  }
}
