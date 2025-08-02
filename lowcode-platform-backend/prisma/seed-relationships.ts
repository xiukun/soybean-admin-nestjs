import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createRelationshipTestData() {
  console.log('🔗 开始创建关系管理测试数据...');

  try {
    // 检查演示项目是否存在
    let demoProject = await prisma.project.findUnique({
      where: { id: 'demo-project-1' }
    });

    if (!demoProject) {
      console.log('📁 创建演示项目...');
      demoProject = await prisma.project.create({
        data: {
          id: 'demo-project-1',
          name: '演示项目',
          code: 'demo-project-1',
          description: '用于演示和测试的项目',
          version: '1.0.0',
          config: {
            database: { type: 'postgresql', host: 'localhost', port: 5432 },
            api: { baseUrl: '/api/v1', prefix: 'demo' }
          },
          status: 'ACTIVE',
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
    }

    // 创建示例实体
    console.log('🏗️ 创建示例实体...');
    const entities = [
      {
        id: 'demo-entity-user',
        projectId: demoProject.id,
        name: '用户',
        code: 'User',
        tableName: 'demo_users',
        description: '用户实体，包含基本的用户信息',
        category: '用户管理',
        config: { displayName: '用户', icon: 'user', color: '#1890ff' },
        status: 'ACTIVE',
        createdBy: 'system',
      },
      {
        id: 'demo-entity-role',
        projectId: demoProject.id,
        name: '角色',
        code: 'Role',
        tableName: 'demo_roles',
        description: '角色实体，用于权限管理',
        category: '权限管理',
        config: { displayName: '角色', icon: 'crown', color: '#52c41a' },
        status: 'ACTIVE',
        createdBy: 'system',
      },
      {
        id: 'demo-entity-department',
        projectId: demoProject.id,
        name: '部门',
        code: 'Department',
        tableName: 'demo_departments',
        description: '部门实体，用于组织架构管理',
        category: '组织管理',
        config: { displayName: '部门', icon: 'apartment', color: '#722ed1' },
        status: 'ACTIVE',
        createdBy: 'system',
      },
      {
        id: 'demo-entity-project',
        projectId: demoProject.id,
        name: '项目',
        code: 'Project',
        tableName: 'demo_projects',
        description: '项目实体，用于项目管理',
        category: '项目管理',
        config: { displayName: '项目', icon: 'project', color: '#fa8c16' },
        status: 'ACTIVE',
        createdBy: 'system',
      }
    ];

    for (const entity of entities) {
      await prisma.entity.upsert({
        where: { id: entity.id },
        update: {
          name: entity.name,
          code: entity.code,
          tableName: entity.tableName,
          description: entity.description,
          category: entity.category,
          config: entity.config,
          status: entity.status,
          updatedAt: new Date(),
        },
        create: {
          ...entity,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // 创建示例字段
    console.log('📋 创建示例字段...');
    const fields = [
      // 用户实体字段
      {
        id: 'field-user-id',
        entityId: 'demo-entity-user',
        name: 'ID',
        code: 'id',
        type: 'UUID',
        length: null,
        nullable: false,
        uniqueConstraint: true,
        primaryKey: true,
        comment: '用户唯一标识',
        sortOrder: 1,
        createdBy: 'system',
      },
      {
        id: 'field-user-department-id',
        entityId: 'demo-entity-user',
        name: '部门ID',
        code: 'departmentId',
        type: 'UUID',
        length: null,
        nullable: true,
        uniqueConstraint: false,
        primaryKey: false,
        comment: '所属部门ID',
        sortOrder: 2,
        createdBy: 'system',
      },
      // 角色实体字段
      {
        id: 'field-role-id',
        entityId: 'demo-entity-role',
        name: 'ID',
        code: 'id',
        type: 'UUID',
        length: null,
        nullable: false,
        uniqueConstraint: true,
        primaryKey: true,
        comment: '角色唯一标识',
        sortOrder: 1,
        createdBy: 'system',
      },
      // 部门实体字段
      {
        id: 'field-department-id',
        entityId: 'demo-entity-department',
        name: 'ID',
        code: 'id',
        type: 'UUID',
        length: null,
        nullable: false,
        uniqueConstraint: true,
        primaryKey: true,
        comment: '部门唯一标识',
        sortOrder: 1,
        createdBy: 'system',
      },
      {
        id: 'field-department-parent-id',
        entityId: 'demo-entity-department',
        name: '上级部门ID',
        code: 'parentId',
        type: 'UUID',
        length: null,
        nullable: true,
        uniqueConstraint: false,
        primaryKey: false,
        comment: '上级部门ID',
        sortOrder: 2,
        createdBy: 'system',
      },
      // 项目实体字段
      {
        id: 'field-project-id',
        entityId: 'demo-entity-project',
        name: 'ID',
        code: 'id',
        type: 'UUID',
        length: null,
        nullable: false,
        uniqueConstraint: true,
        primaryKey: true,
        comment: '项目唯一标识',
        sortOrder: 1,
        createdBy: 'system',
      },
      {
        id: 'field-project-owner-id',
        entityId: 'demo-entity-project',
        name: '项目负责人ID',
        code: 'ownerId',
        type: 'UUID',
        length: null,
        nullable: true,
        uniqueConstraint: false,
        primaryKey: false,
        comment: '项目负责人ID',
        sortOrder: 2,
        createdBy: 'system',
      }
    ];

    for (const field of fields) {
      await prisma.field.upsert({
        where: { id: field.id },
        update: {
          name: field.name,
          code: field.code,
          type: field.type,
          length: field.length,
          nullable: field.nullable,
          uniqueConstraint: field.uniqueConstraint,
          primaryKey: field.primaryKey,
          comment: field.comment,
          sortOrder: field.sortOrder,
          updatedAt: new Date(),
        },
        create: {
          ...field,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // 创建关系数据
    console.log('🔗 创建示例关系...');
    const relations = [
      {
        id: 'relation-user-department',
        projectId: demoProject.id,
        name: '用户部门关系',
        code: 'user-department',
        description: '用户与部门的多对一关系',
        type: 'MANY_TO_ONE',
        sourceEntityId: 'demo-entity-user',
        sourceFieldId: 'field-user-department-id',
        targetEntityId: 'demo-entity-department',
        targetFieldId: 'field-department-id',
        foreignKeyName: 'fk_user_department',
        onDelete: 'SET_NULL',
        onUpdate: 'CASCADE',
        config: {
          displayName: '用户部门关系',
          description: '一个部门可以有多个用户，一个用户只能属于一个部门'
        },
        status: 'ACTIVE',
        indexed: true,
        createdBy: 'system',
      },
      {
        id: 'relation-department-parent',
        projectId: demoProject.id,
        name: '部门层级关系',
        code: 'department-parent',
        description: '部门与上级部门的自关联关系',
        type: 'MANY_TO_ONE',
        sourceEntityId: 'demo-entity-department',
        sourceFieldId: 'field-department-parent-id',
        targetEntityId: 'demo-entity-department',
        targetFieldId: 'field-department-id',
        foreignKeyName: 'fk_department_parent',
        onDelete: 'SET_NULL',
        onUpdate: 'CASCADE',
        config: {
          displayName: '部门层级关系',
          description: '部门的树形结构关系，支持多级部门'
        },
        status: 'ACTIVE',
        indexed: true,
        createdBy: 'system',
      },
      {
        id: 'relation-project-owner',
        projectId: demoProject.id,
        name: '项目负责人关系',
        code: 'project-owner',
        description: '项目与负责人的多对一关系',
        type: 'MANY_TO_ONE',
        sourceEntityId: 'demo-entity-project',
        sourceFieldId: 'field-project-owner-id',
        targetEntityId: 'demo-entity-user',
        targetFieldId: 'field-user-id',
        foreignKeyName: 'fk_project_owner',
        onDelete: 'SET_NULL',
        onUpdate: 'CASCADE',
        config: {
          displayName: '项目负责人关系',
          description: '一个用户可以负责多个项目，一个项目只有一个负责人'
        },
        status: 'ACTIVE',
        indexed: true,
        createdBy: 'system',
      }
    ];

    for (const relation of relations) {
      await prisma.relation.upsert({
        where: { id: relation.id },
        update: {
          name: relation.name,
          code: relation.code,
          description: relation.description,
          type: relation.type,
          sourceEntityId: relation.sourceEntityId,
          sourceFieldId: relation.sourceFieldId,
          targetEntityId: relation.targetEntityId,
          targetFieldId: relation.targetFieldId,
          foreignKeyName: relation.foreignKeyName,
          onDelete: relation.onDelete,
          onUpdate: relation.onUpdate,
          config: relation.config,
          status: relation.status,
          indexed: relation.indexed,
          updatedAt: new Date(),
        },
        create: {
          ...relation,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // 统计数据
    const entityCount = await prisma.entity.count({ where: { projectId: demoProject.id } });
    const fieldCount = await prisma.field.count({ 
      where: { entity: { projectId: demoProject.id } } 
    });
    const relationCount = await prisma.relation.count({ where: { projectId: demoProject.id } });

    console.log('📊 关系管理测试数据统计:');
    console.log(`   项目: ${demoProject.name}`);
    console.log(`   实体数量: ${entityCount}`);
    console.log(`   字段数量: ${fieldCount}`);
    console.log(`   关系数量: ${relationCount}`);

    console.log('🎉 关系管理测试数据创建完成!');

  } catch (error) {
    console.error('❌ 关系管理测试数据创建失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createRelationshipTestData()
    .catch((e) => {
      console.error('❌ 脚本执行失败:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { createRelationshipTestData };