import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { ApiRepository } from '@api-context/domain/api.repository';
import { Api, ApiMethod, ApiStatus } from '@api-context/domain/api.model';

@Injectable()
export class ApiPrismaRepository implements ApiRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(api: Api): Promise<Api> {
    const data = {
      projectId: api.projectId,
      entityId: api.entityId,
      name: api.name,
      code: api.code,
      path: api.path,
      method: api.method,
      description: api.description,
      requestConfig: api.requestConfig,
      responseConfig: api.responseConfig,
      queryConfig: api.queryConfig,
      authConfig: api.authConfig,
      version: api.version,
      status: api.status,
      createdBy: api.createdBy,
      createdAt: api.createdAt,
    };

    const saved = await this.prisma.api.create({ data });
    return Api.fromPersistence({
      ...saved,
      method: saved.method as ApiMethod,
      status: saved.status as ApiStatus,
    });
  }

  async findById(id: string): Promise<Api | null> {
    const api = await this.prisma.api.findUnique({
      where: { id },
    });

    if (!api) return null;

    return Api.fromPersistence({
      ...api,
      method: api.method as ApiMethod,
      status: api.status as ApiStatus,
    });
  }

  async findByCode(projectId: string, code: string): Promise<Api | null> {
    const api = await this.prisma.api.findFirst({
      where: { projectId, code },
    });

    if (!api) return null;

    return Api.fromPersistence({
      ...api,
      method: api.method as ApiMethod,
      status: api.status as ApiStatus,
    });
  }

  async findByProjectId(projectId: string): Promise<Api[]> {
    const apis = await this.prisma.api.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return apis.map(api => Api.fromPersistence({
      ...api,
      method: api.method as ApiMethod,
      status: api.status as ApiStatus,
    }));
  }

  async findByEntityId(entityId: string): Promise<Api[]> {
    const apis = await this.prisma.api.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
    });

    return apis.map(api => Api.fromPersistence({
      ...api,
      method: api.method as ApiMethod,
      status: api.status as ApiStatus,
    }));
  }

  async update(api: Api): Promise<Api> {
    const data = {
      name: api.name,
      code: api.code,
      path: api.path,
      method: api.method,
      description: api.description,
      requestConfig: api.requestConfig,
      responseConfig: api.responseConfig,
      queryConfig: api.queryConfig,
      authConfig: api.authConfig,
      version: api.version,
      status: api.status,
      updatedBy: api.updatedBy,
      updatedAt: api.updatedAt,
    };

    const updated = await this.prisma.api.update({
      where: { id: api.id },
      data,
    });

    return Api.fromPersistence({
      ...updated,
      method: updated.method as ApiMethod,
      status: updated.status as ApiStatus,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.api.delete({
      where: { id },
    });
  }

  async existsByCode(projectId: string, code: string, excludeId?: string): Promise<boolean> {
    const api = await this.prisma.api.findFirst({
      where: {
        projectId,
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!api;
  }

  async existsByPath(projectId: string, path: string, method: string, excludeId?: string): Promise<boolean> {
    const api = await this.prisma.api.findFirst({
      where: {
        projectId,
        path,
        method,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!api;
  }

  async findPaginated(
    projectId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<{
    apis: Api[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const where = {
      projectId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.method && { method: filters.method }),
      ...(filters?.entityId && { entityId: filters.entityId }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as any } },
          { code: { contains: filters.search, mode: 'insensitive' as any } },
          { path: { contains: filters.search, mode: 'insensitive' as any } },
          { description: { contains: filters.search, mode: 'insensitive' as any } },
        ],
      }),
    };

    const [apis, total] = await Promise.all([
      this.prisma.api.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.api.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      apis: apis.map(api => Api.fromPersistence({
        ...api,
        method: api.method as ApiMethod,
        status: api.status as ApiStatus,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findApisByPathPattern(projectId: string, pathPattern: string): Promise<Api[]> {
    const apis = await this.prisma.api.findMany({
      where: {
        projectId,
        path: { contains: pathPattern },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apis.map(api => Api.fromPersistence({
      ...api,
      method: api.method as ApiMethod,
      status: api.status as ApiStatus,
    }));
  }

  async findApisByMethod(projectId: string, method: string): Promise<Api[]> {
    const apis = await this.prisma.api.findMany({
      where: { projectId, method },
      orderBy: { createdAt: 'desc' },
    });

    return apis.map(api => Api.fromPersistence({
      ...api,
      method: api.method as ApiMethod,
      status: api.status as ApiStatus,
    }));
  }

  async findPublishedApis(projectId: string): Promise<Api[]> {
    const apis = await this.prisma.api.findMany({
      where: { 
        projectId, 
        status: ApiStatus.PUBLISHED 
      },
      orderBy: { createdAt: 'desc' },
    });

    return apis.map(api => Api.fromPersistence({
      ...api,
      method: api.method as ApiMethod,
      status: api.status as ApiStatus,
    }));
  }

  async countByStatus(projectId: string, status: string): Promise<number> {
    return await this.prisma.api.count({
      where: { projectId, status },
    });
  }

  async countByMethod(projectId: string, method: string): Promise<number> {
    return await this.prisma.api.count({
      where: { projectId, method },
    });
  }
}
