<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { createRequiredFormRule } from '@/utils/form/rule';
import { $t } from '@/locales';

interface Props {
  project: any;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  update: [project: any];
}>();

// State
const formRef = ref<FormInst | null>(null);
const saving = ref(false);
const testingConnection = ref(false);

// Form
const configForm = reactive({
  name: '',
  code: '',
  description: '',
  version: '1.0.0',
  status: 'ACTIVE',
  config: {
    framework: 'nestjs',
    architecture: 'base-biz',
    language: 'typescript',
    database: 'postgresql',
    packageName: '',
    basePackage: '',
    author: '',
    outputPath: './generated',
    database_config: {
      host: 'localhost',
      port: 5432,
      database: '',
      username: '',
      password: '',
      schema: 'public'
    },
    generation_config: {
      enableSwagger: true,
      enableValidation: true,
      enableAudit: true,
      enableSoftDelete: true,
      enablePagination: true,
      enableCaching: false
    }
  }
});

// Options
const statusOptions = [
  { label: $t('page.lowcode.project.status.active'), value: 'ACTIVE' },
  { label: $t('page.lowcode.project.status.inactive'), value: 'INACTIVE' },
  { label: $t('page.lowcode.project.status.archived'), value: 'ARCHIVED' }
];

const frameworkOptions = [
  { label: 'NestJS', value: 'nestjs' },
  { label: 'Express', value: 'express' },
  { label: 'Fastify', value: 'fastify' },
  { label: 'Spring Boot', value: 'spring-boot' }
];

const architectureOptions = [
  { label: 'Base-Biz', value: 'base-biz' },
  { label: 'DDD', value: 'ddd' },
  { label: 'Clean Architecture', value: 'clean' },
  { label: 'Hexagonal', value: 'hexagonal' }
];

const languageOptions = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Java', value: 'java' },
  { label: 'Python', value: 'python' }
];

const databaseOptions = [
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'SQLite', value: 'sqlite' },
  { label: 'MongoDB', value: 'mongodb' }
];

// Form rules
const rules: FormRules = {
  name: createRequiredFormRule($t('page.lowcode.project.nameRequired')),
  code: createRequiredFormRule($t('page.lowcode.project.codeRequired')),
  framework: createRequiredFormRule($t('page.lowcode.project.frameworkRequired'))
};

// Methods
function handleBrowseOutputPath() {
  window.$message?.info('文件浏览器功能开发中');
}

async function handleTestConnection() {
  try {
    testingConnection.value = true;

    // Mock connection test
    await new Promise(resolve => setTimeout(resolve, 2000));

    window.$message?.success($t('page.lowcode.project.connectionSuccess'));
  } catch (error) {
    window.$message?.error($t('page.lowcode.project.connectionFailed'));
  } finally {
    testingConnection.value = false;
  }
}

async function handleSave() {
  await formRef.value?.validate();

  try {
    saving.value = true;

    // 调用真实的API保存项目配置
    const { fetchUpdateProject } = await import('@/service/api/lowcode-project');

    const projectData = {
      ...props.project,
      ...configForm,
      config: {
        ...configForm.config,
        // 确保数据库配置格式正确
        database_config: {
          ...configForm.config.database_config
        },
        generation_config: {
          ...configForm.config.generation_config
        }
      }
    };

    if (props.project?.id) {
      await fetchUpdateProject(props.project.id, projectData);
    }

    emit('update', projectData);
    window.$message?.success('项目配置保存成功');
  } catch (error) {
    console.error('Save project config error:', error);
    window.$message?.error('项目配置保存失败');
  } finally {
    saving.value = false;
  }
}

function handleReset() {
  if (props.project) {
    Object.assign(configForm, {
      ...props.project,
      config: {
        ...configForm.config,
        ...props.project.config
      }
    });
  }
}

// Watch for project changes
watch(
  () => props.project,
  newProject => {
    if (newProject) {
      Object.assign(configForm, {
        ...newProject,
        config: {
          ...configForm.config,
          ...newProject.config
        }
      });
    }
  },
  { immediate: true }
);

// Lifecycle
onMounted(() => {
  if (props.project) {
    handleReset();
  }
});
</script>

<template>
  <div class="project-configuration">
    <NForm ref="formRef" :model="configForm" :rules="rules" label-placement="left" :label-width="120">
      <!-- 基础配置 -->
      <NCard :title="$t('page.lowcode.project.basicConfig')" class="mb-4">
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.name')" path="name">
              <NInput v-model:value="configForm.name" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.code')" path="code">
              <NInput v-model:value="configForm.code" />
            </NFormItem>
          </NGridItem>
          <NGridItem :span="2">
            <NFormItem :label="$t('page.lowcode.project.description')" path="description">
              <NInput v-model:value="configForm.description" type="textarea" :rows="3" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.version')" path="version">
              <NInput v-model:value="configForm.version" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.status')" path="status">
              <NSelect v-model:value="configForm.status" :options="statusOptions" />
            </NFormItem>
          </NGridItem>
        </NGrid>
      </NCard>

      <!-- 技术栈配置 -->
      <NCard :title="$t('page.lowcode.project.techStackConfig')" class="mb-4">
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.framework')" path="framework">
              <NSelect v-model:value="configForm.config.framework" :options="frameworkOptions" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.architecture')" path="architecture">
              <NSelect v-model:value="configForm.config.architecture" :options="architectureOptions" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.language')" path="language">
              <NSelect v-model:value="configForm.config.language" :options="languageOptions" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.database')" path="database">
              <NSelect v-model:value="configForm.config.database" :options="databaseOptions" />
            </NFormItem>
          </NGridItem>
        </NGrid>
      </NCard>

      <!-- 包配置 -->
      <NCard :title="$t('page.lowcode.project.packageConfig')" class="mb-4">
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.packageName')" path="packageName">
              <NInput v-model:value="configForm.config.packageName" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.basePackage')" path="basePackage">
              <NInput v-model:value="configForm.config.basePackage" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.author')" path="author">
              <NInput v-model:value="configForm.config.author" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.outputPath')" path="outputPath">
              <NInputGroup>
                <NInput v-model:value="configForm.config.outputPath" />
                <NButton @click="handleBrowseOutputPath">
                  <template #icon>
                    <NIcon><icon-mdi-folder-open /></NIcon>
                  </template>
                </NButton>
              </NInputGroup>
            </NFormItem>
          </NGridItem>
        </NGrid>
      </NCard>

      <!-- 数据库配置 -->
      <NCard :title="$t('page.lowcode.project.databaseConfig')" class="mb-4">
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.dbHost')" path="dbHost">
              <NInput v-model:value="configForm.config.database_config.host" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.dbPort')" path="dbPort">
              <NInputNumber v-model:value="configForm.config.database_config.port" :min="1" :max="65535" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.dbName')" path="dbName">
              <NInput v-model:value="configForm.config.database_config.database" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.dbUsername')" path="dbUsername">
              <NInput v-model:value="configForm.config.database_config.username" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.dbPassword')" path="dbPassword">
              <NInput
                v-model:value="configForm.config.database_config.password"
                type="password"
                show-password-on="click"
              />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.dbSchema')" path="dbSchema">
              <NInput v-model:value="configForm.config.database_config.schema" />
            </NFormItem>
          </NGridItem>
        </NGrid>

        <div class="mt-4">
          <NButton :loading="testingConnection" @click="handleTestConnection">
            <template #icon>
              <NIcon><icon-mdi-database-check /></NIcon>
            </template>
            {{ $t('page.lowcode.project.testConnection') }}
          </NButton>
        </div>
      </NCard>

      <!-- 生成配置 -->
      <NCard :title="$t('page.lowcode.project.generationConfig')" class="mb-4">
        <NGrid :cols="2" :x-gap="16">
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.enableSwagger')">
              <NSwitch v-model:value="configForm.config.generation_config.enableSwagger" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.enableValidation')">
              <NSwitch v-model:value="configForm.config.generation_config.enableValidation" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.enableAudit')">
              <NSwitch v-model:value="configForm.config.generation_config.enableAudit" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.enableSoftDelete')">
              <NSwitch v-model:value="configForm.config.generation_config.enableSoftDelete" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.enablePagination')">
              <NSwitch v-model:value="configForm.config.generation_config.enablePagination" />
            </NFormItem>
          </NGridItem>
          <NGridItem>
            <NFormItem :label="$t('page.lowcode.project.enableCaching')">
              <NSwitch v-model:value="configForm.config.generation_config.enableCaching" />
            </NFormItem>
          </NGridItem>
        </NGrid>
      </NCard>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-4">
        <NButton @click="handleReset">{{ $t('common.reset') }}</NButton>
        <NButton type="primary" :loading="saving" @click="handleSave">
          {{ $t('page.lowcode.common.actions.save') }}
        </NButton>
      </div>
    </NForm>
  </div>
</template>

<style scoped>
.project-configuration {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
