import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { ApiConfigRepository } from '@lib/bounded-contexts/api-config/domain/api-config.repository';
import { ApiConfig, ApiMethod, ApiStatus } from '@lib/bounded-contexts/api-config/domain/api-config.model';

@Injectable()
export class ApiConfigPrismaRepository implements ApiConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(apiConfig: ApiConfig): Promise<ApiConfig> {
    const data = {
      id: apiConfig.id,
      projectId: apiConfig.projectId,
      name: apiConfig.name,
      code: apiConfig.code,
      description: apiConfig.description,
      method: apiConfig.method,
      path: apiConfig.path,
      entityId: apiConfig.entityId,
      parameters: apiConfig.parameters as any,
      responses: apiConfig.responses as any,
      security: apiConfig.security as any,
      config: apiConfig.config as any,
      status: apiConfig.status,
      version: apiConfig.version,
      createdBy: apiConfig.createdBy,
      createdAt: apiConfig.createdAt,
    };

    const saved = await this.prisma.apiConfig.create({ data });
    return ApiConfig.fromPersistence({
      ...saved,
      method: saved.method as ApiMethod,
      status: saved.status as ApiStatus,
      parameters: saved.parameters as any[],
      responses: saved.responses as any[],
      security: saved.security as any,
      config: saved.config as any,
    });
  }

  async findById(id: string): Promise<ApiConfig | null> {
    const apiConfig = await this.prisma.apiConfig.findUnique({
      where: { id },
    });

    if (!apiConfig) return null;

    return ApiConfig.fromPersistence({
      ...apiConfig,
      method: apiConfig.method as ApiMethod,
      status: apiConfig.status as ApiStatus,
      parameters: apiConfig.parameters as any[],
      responses: apiConfig.responses as any[],
      security: apiConfig.security as any,
      config: apiConfig.config as any,
    });
  }

  async update(apiConfig: ApiConfig): Promise<ApiConfig> {
    const data = {
      name: apiConfig.name,
      description: apiConfig.description,
      path: apiConfig.path,
      parameters: apiConfig.parameters as any,
      responses: apiConfig.responses as any,
      security: apiConfig.security as any,
      config: apiConfig.config as any,
      status: apiConfig.status,
      updatedBy: apiConfig.updatedBy,
      updatedAt: apiConfig.updatedAt,
    };

    const updated = await this.prisma.apiConfig.update({
      where: { id: apiConfig.id },
      data,
    });

    return ApiConfig.fromPersistence({
      ...updated,
      method: updated.method as ApiMethod,
      status: updated.status as ApiStatus,
      parameters: updated.parameters as any[],
      responses: updated.responses as any[],
      security: updated.security as any,
      config: updated.config as any,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.apiConfig.delete({
      where: { id },
    });
  }

  async findByProjectId(projectId: string): Promise<ApiConfig[]> {
    const apiConfigs = await this.prisma.apiConfig.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return apiConfigs.map(apiConfig => ApiConfig.fromPersistence({
      ...apiConfig,
      method: apiConfig.method as ApiMethod,
      status: apiConfig.status as ApiStatus,
      parameters: apiConfig.parameters as any[],
      responses: apiConfig.responses as any[],
      security: apiConfig.security as any,
      config: apiConfig.config as any,
    }));
  }

  async findByCode(projectId: string, code: string): Promise<ApiConfig | null> {
    const apiConfig = await this.prisma.apiConfig.findFirst({
      where: { projectId, code },
    });

    if (!apiConfig) return null;

    return ApiConfig.fromPersistence({
      ...apiConfig,
      method: apiConfig.method as ApiMethod,
      status: apiConfig.status as ApiStatus,
      parameters: apiConfig.parameters as any[],
      responses: apiConfig.responses as any[],
      security: apiConfig.security as any,
      config: apiConfig.config as any,
    });
  }

  async findByPath(projectId: string, method: string, path: string): Promise<ApiConfig | null> {
    const apiConfig = await this.prisma.apiConfig.findFirst({
      where: { projectId, method, path },
    });

    if (!apiConfig) return null;

    return ApiConfig.fromPersistence({
      ...apiConfig,
      method: apiConfig.method as ApiMethod,
      status: apiConfig.status as ApiStatus,
      parameters: apiConfig.parameters as any[],
      responses: apiConfig.responses as any[],
      security: apiConfig.security as any,
      config: apiConfig.config as any,
    });
  }

  async findByEntityId(entityId: string): Promise<ApiConfig[]> {
    const apiConfigs = await this.prisma.apiConfig.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
    });

    return apiConfigs.map(apiConfig => ApiConfig.fromPersistence({
      ...apiConfig,
      method: apiConfig.method as ApiMethod,
      status: apiConfig.status as ApiStatus,
      parameters: apiConfig.parameters as any[],
      responses: apiConfig.responses as any[],
      security: apiConfig.security as any,
      config: apiConfig.config as any,
    }));
  }

  async findPaginated(
    projectId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<{
    apiConfigs: ApiConfig[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const where = {
      projectId,
      ...(filters?.method && { method: filters.method }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.entityId && { entityId: filters.entityId }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as any } },
          { code: { contains: filters.search, mode: 'insensitive' as any } },
          { description: { contains: filters.search, mode: 'insensitive' as any } },
          { path: { contains: filters.search, mode: 'insensitive' as any } },
        ],
      }),
    };

    const [apiConfigs, total] = await Promise.all([
      this.prisma.apiConfig.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.apiConfig.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      apiConfigs: apiConfigs.map(apiConfig => ApiConfig.fromPersistence({
        ...apiConfig,
        method: apiConfig.method as ApiMethod,
        status: apiConfig.status as ApiStatus,
        parameters: apiConfig.parameters as any[],
        responses: apiConfig.responses as any[],
        security: apiConfig.security as any,
        config: apiConfig.config as any,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async existsByCode(projectId: string, code: string, excludeId?: string): Promise<boolean> {
    const apiConfig = await this.prisma.apiConfig.findFirst({
      where: {
        projectId,
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!apiConfig;
  }

  async existsByPath(
    projectId: string,
    method: string,
    path: string,
    excludeId?: string
  ): Promise<boolean> {
    const apiConfig = await this.prisma.apiConfig.findFirst({
      where: {
        projectId,
        method,
        path,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!apiConfig;
  }

  async countByProjectId(projectId: string): Promise<number> {
    return await this.prisma.apiConfig.count({
      where: { projectId },
    });
  }

  async countByStatus(projectId: string, status: string): Promise<number> {
    return await this.prisma.apiConfig.count({
      where: { projectId, status },
    });
  }

  async countByMethod(projectId: string, method: string): Promise<number> {
    return await this.prisma.apiConfig.count({
      where: { projectId, method },
    });
  }

  async findByIds(ids: string[]): Promise<ApiConfig[]> {
    const apiConfigs = await this.prisma.apiConfig.findMany({
      where: { id: { in: ids } },
    });

    return apiConfigs.map(apiConfig => ApiConfig.fromPersistence({
      ...apiConfig,
      method: apiConfig.method as ApiMethod,
      status: apiConfig.status as ApiStatus,
      parameters: apiConfig.parameters as any[],
      responses: apiConfig.responses as any[],
      security: apiConfig.security as any,
      config: apiConfig.config as any,
    }));
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await this.prisma.apiConfig.deleteMany({
      where: { projectId },
    });
  }

  async deleteByEntityId(entityId: string): Promise<void> {
    await this.prisma.apiConfig.deleteMany({
      where: { entityId },
    });
  }

  async findVersions(projectId: string, code: string): Promise<ApiConfig[]> {
    const apiConfigs = await this.prisma.apiConfig.findMany({
      where: { projectId, code },
      orderBy: { version: 'desc' },
    });

    return apiConfigs.map(apiConfig => ApiConfig.fromPersistence({
      ...apiConfig,
      method: apiConfig.method as ApiMethod,
      status: apiConfig.status as ApiStatus,
      parameters: apiConfig.parameters as any[],
      responses: apiConfig.responses as any[],
      security: apiConfig.security as any,
      config: apiConfig.config as any,
    }));
  }

  async findLatestVersion(projectId: string, code: string): Promise<ApiConfig | null> {
    const apiConfig = await this.prisma.apiConfig.findFirst({
      where: { projectId, code },
      orderBy: { version: 'desc' },
    });

    if (!apiConfig) return null;

    return ApiConfig.fromPersistence({
      ...apiConfig,
      method: apiConfig.method as ApiMethod,
      status: apiConfig.status as ApiStatus,
      parameters: apiConfig.parameters as any[],
      responses: apiConfig.responses as any[],
      security: apiConfig.security as any,
      config: apiConfig.config as any,
    });
  }

  async findPublishedApis(projectId: string): Promise<ApiConfig[]> {
    const apiConfigs = await this.prisma.apiConfig.findMany({
      where: { projectId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    });

    return apiConfigs.map(apiConfig => ApiConfig.fromPersistence({
      ...apiConfig,
      method: apiConfig.method as ApiMethod,
      status: apiConfig.status as ApiStatus,
      parameters: apiConfig.parameters as any[],
      responses: apiConfig.responses as any[],
      security: apiConfig.security as any,
      config: apiConfig.config as any,
    }));
  }

  async findDraftApis(projectId: string): Promise<ApiConfig[]> {
    const apiConfigs = await this.prisma.apiConfig.findMany({
      where: { projectId, status: 'DRAFT' },
      orderBy: { createdAt: 'desc' },
    });

    return apiConfigs.map(apiConfig => ApiConfig.fromPersistence({
      ...apiConfig,
      method: apiConfig.method as ApiMethod,
      status: apiConfig.status as ApiStatus,
      parameters: apiConfig.parameters as any[],
      responses: apiConfig.responses as any[],
      security: apiConfig.security as any,
      config: apiConfig.config as any,
    }));
  }
}
