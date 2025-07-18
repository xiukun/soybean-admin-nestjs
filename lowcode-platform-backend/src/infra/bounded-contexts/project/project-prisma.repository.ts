import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { ProjectRepository } from '@project/domain/project.repository';
import { Project, ProjectStatus } from '@project/domain/project.model';

@Injectable()
export class ProjectPrismaRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(project: Project): Promise<Project> {
    const data = {
      name: project.name,
      code: project.code,
      description: project.description,
      version: project.version,
      config: project.config,
      status: project.status,
      createdBy: project.createdBy,
      createdAt: project.createdAt,
    };

    const saved = await this.prisma.project.create({ data });
    return Project.fromPersistence({
      ...saved,
      status: saved.status as ProjectStatus,
    });
  }

  async findById(id: string): Promise<Project | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) return null;

    return Project.fromPersistence({
      ...project,
      status: project.status as ProjectStatus,
    });
  }

  async findByCode(code: string): Promise<Project | null> {
    const project = await this.prisma.project.findFirst({
      where: { code },
    });

    if (!project) return null;

    return Project.fromPersistence({
      ...project,
      status: project.status as ProjectStatus,
    });
  }

  async findAll(): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return projects.map(project => Project.fromPersistence({
      ...project,
      status: project.status as ProjectStatus,
    }));
  }

  async update(project: Project): Promise<Project> {
    const data = {
      name: project.name,
      code: project.code,
      description: project.description,
      version: project.version,
      config: project.config,
      status: project.status,
      updatedBy: project.updatedBy,
      updatedAt: project.updatedAt,
    };

    const updated = await this.prisma.project.update({
      where: { id: project.id },
      data,
    });

    return Project.fromPersistence({
      ...updated,
      status: updated.status as ProjectStatus,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({
      where: { id },
    });
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const project = await this.prisma.project.findFirst({
      where: {
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!project;
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: any
  ): Promise<{
    projects: Project[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const where = {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as any } },
          { code: { contains: filters.search, mode: 'insensitive' as any } },
          { description: { contains: filters.search, mode: 'insensitive' as any } },
        ],
      }),
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      projects: projects.map(project => Project.fromPersistence({
        ...project,
        status: project.status as ProjectStatus,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async countByStatus(status: string): Promise<number> {
    return await this.prisma.project.count({
      where: { status },
    });
  }

  async countTotal(): Promise<number> {
    return await this.prisma.project.count();
  }
}
