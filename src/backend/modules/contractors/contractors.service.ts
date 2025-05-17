import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';

@Injectable()
export class ContractorsService {
  constructor(private prisma: PrismaService) {}

  async create(createContractorDto: CreateContractorDto) {
    return this.prisma.contractor.create({
      data: createContractorDto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(verified?: boolean) {
    const where = verified !== undefined ? { verified } : {};

    return this.prisma.contractor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const contractor = await this.prisma.contractor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        projects: true,
        requests: true,
      },
    });

    if (!contractor) {
      throw new NotFoundException(`Подрядчик с ID ${id} не найден`);
    }

    return contractor;
  }

  async update(id: string, updateContractorDto: UpdateContractorDto) {
    try {
      return await this.prisma.contractor.update({
        where: { id },
        data: updateContractorDto,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Подрядчик с ID ${id} не найден`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.contractor.delete({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Подрядчик с ID ${id} не найден`);
      }
      throw error;
    }
  }
}
