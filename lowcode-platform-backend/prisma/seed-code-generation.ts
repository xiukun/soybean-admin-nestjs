import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 开始代码生成器菜单数据初始化...');

  try {
    // 检查是否已经存在代码生成器菜单
    const existingMenu = await prisma.sys_menu.findFirst({
      where: { route_name: 'lowcode_code-generation' }
    });

    if (existingMenu) {
      console.log('📋 代码生成器菜单已存在，跳过初始化');
      return;
    }

    // 获取低代码平台父菜单
    let lowcodeParentMenu = await prisma.sys_menu.findFirst({
      where: { route_name: 'lowcode' }
    });

    // 如果不存在低代码平台父菜单，创建它
    if (!lowcodeParentMenu) {
      console.log('📁 创建低代码平台父菜单...');
      lowcodeParentMenu = await prisma.sys_menu.create({
        data: {
          menu_type: 'directory',
          menu_name: '低代码平台',
          icon_type: 1,
          icon: 'mdi:code-braces',
          route_name: 'lowcode',
          route_path: '/lowcode',
          component: 'layout.base',
          status: 'ENABLED',
          pid: 0,
          sequence: 100,
          i18n_key: 'route.lowcode',
          keep_alive: false,
          constant: false,
          created_by: 'system',
          created_at: new Date(),
        }
      });
      console.log('✅ 低代码平台父菜单创建完成');
    }

    // 创建代码生成器相关菜单
    console.log('📝 创建代码生成器菜单...');

    const codeGenerationMenus = [
      {
        menu_type: 'menu' as const,
        menu_name: '代码生成器',
        icon_type: 1,
        icon: 'mdi:code-tags',
        route_name: 'lowcode_code-generation',
        route_path: '/lowcode/code-generation',
        component: 'view.lowcode_code-generation',
        status: 'ENABLED' as const,
        pid: lowcodeParentMenu.id,
        sequence: 10,
        i18n_key: 'route.lowcode_code-generation',
        keep_alive: true,
        constant: false,
        created_by: 'system',
        created_at: new Date(),
      },
      {
        menu_type: 'menu' as const,
        menu_name: '目标项目管理',
        icon_type: 1,
        icon: 'mdi:folder-cog',
        route_name: 'lowcode_target-project',
        route_path: '/lowcode/target-project',
        component: 'view.lowcode_target_project',
        status: 'ENABLED' as const,
        pid: lowcodeParentMenu.id,
        sequence: 11,
        i18n_key: 'route.lowcode_target-project',
        keep_alive: true,
        constant: false,
        created_by: 'system',
        created_at: new Date(),
      }
    ];

    // 批量创建菜单
    for (const menuData of codeGenerationMenus) {
      const menu = await prisma.sys_menu.create({
        data: menuData
      });
      console.log(`✅ 菜单创建完成: ${menu.menu_name}`);
    }

    // 获取管理员角色
    let adminRole = await prisma.sys_role.findFirst({
      where: { role_code: 'admin' }
    });

    // 如果不存在管理员角色，创建它
    if (!adminRole) {
      console.log('👤 创建管理员角色...');
      adminRole = await prisma.sys_role.create({
        data: {
          id: 'admin-role-001',
          role_name: '管理员',
          role_code: 'admin',
          role_desc: '系统管理员角色',
          status: 'ENABLED',
          created_by: 'system',
          created_at: new Date(),
        }
      });
      console.log('✅ 管理员角色创建完成');
    }

    // 为管理员角色分配菜单权限
    console.log('🔐 分配菜单权限...');
    const allCodeGenerationMenus = await prisma.sys_menu.findMany({
      where: {
        OR: [
          { route_name: 'lowcode' },
          { route_name: 'lowcode_code-generation' },
          { route_name: 'lowcode_target-project' }
        ]
      }
    });

    for (const menu of allCodeGenerationMenus) {
      // 检查权限是否已存在
      const existingPermission = await prisma.sys_role_menu.findFirst({
        where: {
          role_id: adminRole.id,
          menu_id: menu.id,
          domain: 'default'
        }
      });

      if (!existingPermission) {
        await prisma.sys_role_menu.create({
          data: {
            role_id: adminRole.id,
            menu_id: menu.id,
            domain: 'default'
          }
        });
        console.log(`✅ 权限分配完成: ${menu.menu_name}`);
      }
    }

    // 创建低代码页面配置（如果需要）
    console.log('📄 创建低代码页面配置...');
    
    const codeGenerationPageConfig = {
      type: 'page',
      title: '代码生成器',
      subTitle: '从实体定义生成完整的业务代码',
      body: [
        {
          type: 'tabs',
          tabs: [
            {
              title: '代码生成',
              body: [
                {
                  type: 'form',
                  title: '代码生成配置',
                  api: {
                    method: 'post',
                    url: '/api/v1/code-generation/generate'
                  },
                  body: [
                    {
                      type: 'select',
                      name: 'entityIds',
                      label: '选择实体',
                      multiple: true,
                      required: true,
                      source: {
                        method: 'get',
                        url: '/api/v1/entities?size=100'
                      }
                    },
                    {
                      type: 'select',
                      name: 'targetProject',
                      label: '目标项目',
                      required: true,
                      value: 'amis-lowcode-backend',
                      source: {
                        method: 'get',
                        url: '/api/v1/target-projects'
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    // 创建代码生成器页面配置
    const codeGenerationPage = await prisma.sys_lowcode_page.upsert({
      where: { id: 'code-generation-page' },
      update: {
        page_name: '代码生成器',
        page_config: codeGenerationPageConfig,
        updated_at: new Date(),
        updated_by: 'system',
      },
      create: {
        id: 'code-generation-page',
        page_name: '代码生成器',
        page_code: 'code-generation',
        page_type: 'form',
        page_config: codeGenerationPageConfig,
        status: 'ENABLED',
        created_by: 'system',
        created_at: new Date(),
      }
    });

    console.log('✅ 代码生成器页面配置创建完成');

    // 创建目标项目管理页面配置
    const targetProjectPageConfig = {
      type: 'page',
      title: '目标项目管理',
      body: [
        {
          type: 'crud',
          api: {
            method: 'get',
            url: '/api/v1/target-projects'
          },
          columns: [
            { name: 'displayName', label: '项目名称', type: 'text' },
            { name: 'name', label: '项目标识', type: 'text' },
            { name: 'type', label: '项目类型', type: 'text' },
            { name: 'framework', label: '框架', type: 'text' },
            { name: 'status', label: '状态', type: 'text' }
          ]
        }
      ]
    };

    const targetProjectPage = await prisma.sys_lowcode_page.upsert({
      where: { id: 'target-project-page' },
      update: {
        page_name: '目标项目管理',
        page_config: targetProjectPageConfig,
        updated_at: new Date(),
        updated_by: 'system',
      },
      create: {
        id: 'target-project-page',
        page_name: '目标项目管理',
        page_code: 'target-project',
        page_type: 'crud',
        page_config: targetProjectPageConfig,
        status: 'ENABLED',
        created_by: 'system',
        created_at: new Date(),
      }
    });

    console.log('✅ 目标项目管理页面配置创建完成');

    console.log('🎉 代码生成器菜单数据初始化完成！');

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
