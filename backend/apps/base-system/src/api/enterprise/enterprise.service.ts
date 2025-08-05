import { Injectable } from '@nestjs/common';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { PrismaService } from '../../../../../libs/shared/prisma/src/prisma.service';

@Injectable()
export class EnterpriseService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建新的企业
   * @param createEnterpriseDto - 创建企业所需的数据传输对象
   * @returns {Promise<Enterprise>} 创建成功后的企业实体
   */
  async create(createEnterpriseDto: CreateEnterpriseDto) {
    return this.prisma.enterprise.create({
      data: createEnterpriseDto,
    });
  }

  /**
   * 查询所有企业列表
   * @returns {Promise<Enterprise[]>} 企业列表
   */
  async findAll() {
    return this.prisma.enterprise.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 根据 ID 查询单个企业
   * @param id - 企业的唯一标识符
   * @returns {Promise<Enterprise | null>} 企业实体，如果未找到则返回 null
   */
  async findOne(id: string) {
    return this.prisma.enterprise.findUnique({
      where: { id },
    });
  }

  /**
   * 更新企业信息
   * @param id - 企业的唯一标识符
   * @param updateEnterpriseDto - 更新企业所需的数据传输对象
   * @returns {Promise<Enterprise>} 更新后的企业实体
   */
  async update(id: string, updateEnterpriseDto: UpdateEnterpriseDto) {
    return this.prisma.enterprise.update({
      where: { id },
      data: updateEnterpriseDto,
    });
  }

  /**
   * 删除企业
   * @param id - 企业的唯一标识符
   * @returns {Promise<Enterprise>} 被删除的企业实体
   */
  async remove(id: string) {
    return this.prisma.enterprise.delete({
      where: { id },
    });
  }
}