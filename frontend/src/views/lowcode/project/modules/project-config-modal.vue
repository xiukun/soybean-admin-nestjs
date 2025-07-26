<template>
  <NModal v-model:show="modalVisible" preset="card" style="width: 800px" :title="modalTitle">
    <div class="project-config-modal">
      <NTabs v-model:value="activeTab" type="line" animated>
        <!-- 基础配置 -->
        <NTabPane name="basic" :tab="$t('page.lowcode.project.config.basic')">
          <NForm ref="basicFormRef" :model="configForm.basic" :rules="basicRules" label-placement="left" label-width="120px">
            <NFormItem :label="$t('page.lowcode.project.config.projectName')" path="name">
              <NInput v-model:value="configForm.basic.name" :placeholder="$t('page.lowcode.project.config.projectNamePlaceholder')" />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.projectCode')" path="code">
              <NInput v-model:value="configForm.basic.code" :placeholder="$t('page.lowcode.project.config.projectCodePlaceholder')" disabled />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.description')" path="description">
              <NInput 
                v-model:value="configForm.basic.description" 
                type="textarea" 
                :rows="3"
                :placeholder="$t('page.lowcode.project.config.descriptionPlaceholder')" 
              />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.version')" path="version">
              <NInput v-model:value="configForm.basic.version" :placeholder="$t('page.lowcode.project.config.versionPlaceholder')" />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.author')" path="author">
              <NInput v-model:value="configForm.basic.author" :placeholder="$t('page.lowcode.project.config.authorPlaceholder')" />
            </NFormItem>
          </NForm>
        </NTabPane>

        <!-- 技术栈配置 -->
        <NTabPane name="tech" :tab="$t('page.lowcode.project.config.techStack')">
          <NForm ref="techFormRef" :model="configForm.tech" label-placement="left" label-width="120px">
            <NFormItem :label="$t('page.lowcode.project.config.backend')">
              <NSelect 
                v-model:value="configForm.tech.backend" 
                :options="backendOptions" 
                :placeholder="$t('page.lowcode.project.config.selectBackend')"
              />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.frontend')">
              <NSelect 
                v-model:value="configForm.tech.frontend" 
                :options="frontendOptions" 
                :placeholder="$t('page.lowcode.project.config.selectFrontend')"
              />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.database')">
              <NSelect 
                v-model:value="configForm.tech.database" 
                :options="databaseOptions" 
                :placeholder="$t('page.lowcode.project.config.selectDatabase')"
              />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.orm')">
              <NSelect 
                v-model:value="configForm.tech.orm" 
                :options="ormOptions" 
                :placeholder="$t('page.lowcode.project.config.selectOrm')"
              />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.additionalLibs')">
              <NSelect 
                v-model:value="configForm.tech.additionalLibs" 
                :options="libOptions" 
                multiple
                :placeholder="$t('page.lowcode.project.config.selectLibs')"
              />
            </NFormItem>
          </NForm>
        </NTabPane>

        <!-- 代码生成配置 -->
        <NTabPane name="generation" :tab="$t('page.lowcode.project.config.codeGeneration')">
          <NForm ref="generationFormRef" :model="configForm.generation" label-placement="left" label-width="120px">
            <NFormItem :label="$t('page.lowcode.project.config.outputPath')">
              <NInput v-model:value="configForm.generation.outputPath" :placeholder="$t('page.lowcode.project.config.outputPathPlaceholder')" />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.packageName')">
              <NInput v-model:value="configForm.generation.packageName" :placeholder="$t('page.lowcode.project.config.packageNamePlaceholder')" />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.apiPrefix')">
              <NInput v-model:value="configForm.generation.apiPrefix" :placeholder="$t('page.lowcode.project.config.apiPrefixPlaceholder')" />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.generateOptions')">
              <NCheckboxGroup v-model:value="configForm.generation.options">
                <NSpace vertical>
                  <NCheckbox value="controller">{{ $t('page.lowcode.project.config.generateController') }}</NCheckbox>
                  <NCheckbox value="service">{{ $t('page.lowcode.project.config.generateService') }}</NCheckbox>
                  <NCheckbox value="repository">{{ $t('page.lowcode.project.config.generateRepository') }}</NCheckbox>
                  <NCheckbox value="dto">{{ $t('page.lowcode.project.config.generateDto') }}</NCheckbox>
                  <NCheckbox value="entity">{{ $t('page.lowcode.project.config.generateEntity') }}</NCheckbox>
                  <NCheckbox value="frontend">{{ $t('page.lowcode.project.config.generateFrontend') }}</NCheckbox>
                  <NCheckbox value="tests">{{ $t('page.lowcode.project.config.generateTests') }}</NCheckbox>
                  <NCheckbox value="docs">{{ $t('page.lowcode.project.config.generateDocs') }}</NCheckbox>
                </NSpace>
              </NCheckboxGroup>
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.codeStyle')">
              <NRadioGroup v-model:value="configForm.generation.codeStyle">
                <NSpace>
                  <NRadio value="camelCase">camelCase</NRadio>
                  <NRadio value="snake_case">snake_case</NRadio>
                  <NRadio value="kebab-case">kebab-case</NRadio>
                </NSpace>
              </NRadioGroup>
            </NFormItem>
          </NForm>
        </NTabPane>

        <!-- 数据库配置 -->
        <NTabPane name="database" :tab="$t('page.lowcode.project.config.database')">
          <NForm ref="databaseFormRef" :model="configForm.database" label-placement="left" label-width="120px">
            <NFormItem :label="$t('page.lowcode.project.config.dbType')">
              <NSelect 
                v-model:value="configForm.database.type" 
                :options="databaseOptions" 
                :placeholder="$t('page.lowcode.project.config.selectDbType')"
              />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.dbHost')">
              <NInput v-model:value="configForm.database.host" :placeholder="$t('page.lowcode.project.config.dbHostPlaceholder')" />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.dbPort')">
              <NInputNumber v-model:value="configForm.database.port" :placeholder="$t('page.lowcode.project.config.dbPortPlaceholder')" style="width: 100%" />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.dbName')">
              <NInput v-model:value="configForm.database.name" :placeholder="$t('page.lowcode.project.config.dbNamePlaceholder')" />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.dbUsername')">
              <NInput v-model:value="configForm.database.username" :placeholder="$t('page.lowcode.project.config.dbUsernamePlaceholder')" />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.dbPassword')">
              <NInput 
                v-model:value="configForm.database.password" 
                type="password" 
                show-password-on="click"
                :placeholder="$t('page.lowcode.project.config.dbPasswordPlaceholder')" 
              />
            </NFormItem>
            
            <NFormItem>
              <NSpace>
                <NButton @click="testConnection" :loading="testingConnection">
                  {{ $t('page.lowcode.project.config.testConnection') }}
                </NButton>
                <NText v-if="connectionStatus" :type="connectionStatus.type">
                  {{ connectionStatus.message }}
                </NText>
              </NSpace>
            </NFormItem>
          </NForm>
        </NTabPane>

        <!-- 高级配置 -->
        <NTabPane name="advanced" :tab="$t('page.lowcode.project.config.advanced')">
          <NForm ref="advancedFormRef" :model="configForm.advanced" label-placement="left" label-width="120px">
            <NFormItem :label="$t('page.lowcode.project.config.enableCache')">
              <NSwitch v-model:value="configForm.advanced.enableCache" />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.enableLogging')">
              <NSwitch v-model:value="configForm.advanced.enableLogging" />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.enableAuth')">
              <NSwitch v-model:value="configForm.advanced.enableAuth" />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.enableSwagger')">
              <NSwitch v-model:value="configForm.advanced.enableSwagger" />
            </NFormItem>
            
            <NFormItem :label="$t('page.lowcode.project.config.customConfig')">
              <NInput 
                v-model:value="configForm.advanced.customConfig" 
                type="textarea" 
                :rows="6"
                :placeholder="$t('page.lowcode.project.config.customConfigPlaceholder')" 
              />
            </NFormItem>
          </NForm>
        </NTabPane>
      </NTabs>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleCancel">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="saving" @click="handleSave">
          {{ $t('page.lowcode.common.actions.save') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import type { FormInst, FormRules } from 'naive-ui';
import { $t } from '@/locales';
import { useMessage } from '@/hooks/common/message';
// import { fetchUpdateProjectConfig, fetchTestDatabaseConnection } from '@/service/api';

defineOptions({
  name: 'ProjectConfigModal'
});

interface Props {
  visible: boolean;
  project: any;
}

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'saved'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const activeTab = ref('basic');
const saving = ref(false);
const testingConnection = ref(false);
const connectionStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null);

// 表单引用
const basicFormRef = ref<FormInst | null>(null);
const techFormRef = ref<FormInst | null>(null);
const generationFormRef = ref<FormInst | null>(null);
const databaseFormRef = ref<FormInst | null>(null);
const advancedFormRef = ref<FormInst | null>(null);

// 表单数据
const configForm = reactive({
  basic: {
    name: '',
    code: '',
    description: '',
    version: '1.0.0',
    author: ''
  },
  tech: {
    backend: 'nestjs',
    frontend: 'vue3',
    database: 'mysql',
    orm: 'typeorm',
    additionalLibs: []
  },
  generation: {
    outputPath: './generated',
    packageName: 'com.example',
    apiPrefix: '/api/v1',
    options: ['controller', 'service', 'repository', 'dto', 'entity'],
    codeStyle: 'camelCase'
  },
  database: {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    name: '',
    username: '',
    password: ''
  },
  advanced: {
    enableCache: true,
    enableLogging: true,
    enableAuth: false,
    enableSwagger: true,
    customConfig: ''
  }
});

// 消息提示
const { createMessage } = useMessage();

// 计算属性
const modalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const modalTitle = computed(() => {
  return props.project ? 
    $t('page.lowcode.project.config.title', { name: props.project.name }) : 
    $t('page.lowcode.project.config.title', { name: '' });
});

// 选项数据
const backendOptions = [
  { label: 'NestJS', value: 'nestjs' },
  { label: 'Express', value: 'express' },
  { label: 'Koa', value: 'koa' },
  { label: 'Spring Boot', value: 'springboot' },
  { label: 'Django', value: 'django' },
  { label: 'FastAPI', value: 'fastapi' }
];

const frontendOptions = [
  { label: 'Vue 3', value: 'vue3' },
  { label: 'React', value: 'react' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' }
];

const databaseOptions = [
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'SQLite', value: 'sqlite' },
  { label: 'MongoDB', value: 'mongodb' },
  { label: 'Redis', value: 'redis' }
];

const ormOptions = [
  { label: 'TypeORM', value: 'typeorm' },
  { label: 'Prisma', value: 'prisma' },
  { label: 'Sequelize', value: 'sequelize' },
  { label: 'Mongoose', value: 'mongoose' }
];

const libOptions = [
  { label: 'JWT', value: 'jwt' },
  { label: 'Passport', value: 'passport' },
  { label: 'Multer', value: 'multer' },
  { label: 'Socket.IO', value: 'socketio' },
  { label: 'Bull', value: 'bull' },
  { label: 'Nodemailer', value: 'nodemailer' }
];

// 表单验证规则
const basicRules: FormRules = {
  name: [
    { required: true, message: $t('page.lowcode.project.config.nameRequired'), trigger: 'blur' }
  ],
  code: [
    { required: true, message: $t('page.lowcode.project.config.codeRequired'), trigger: 'blur' }
  ]
};

// 方法
const initForm = () => {
  if (props.project) {
    // 基础信息
    configForm.basic.name = props.project.name || '';
    configForm.basic.code = props.project.code || '';
    configForm.basic.description = props.project.description || '';
    configForm.basic.version = props.project.version || '1.0.0';
    configForm.basic.author = props.project.author || '';

    // 配置信息
    if (props.project.config) {
      Object.assign(configForm.tech, props.project.config.tech || {});
      Object.assign(configForm.generation, props.project.config.generation || {});
      Object.assign(configForm.database, props.project.config.database || {});
      Object.assign(configForm.advanced, props.project.config.advanced || {});
    }
  }
};

const testConnection = async () => {
  testingConnection.value = true;
  connectionStatus.value = null;
  
  try {
    const { data } = await fetchTestDatabaseConnection(configForm.database);
    if (data.status === 0) {
      connectionStatus.value = {
        type: 'success',
        message: $t('page.lowcode.project.config.connectionSuccess')
      };
    } else {
      connectionStatus.value = {
        type: 'error',
        message: data.msg || $t('page.lowcode.project.config.connectionFailed')
      };
    }
  } catch (error) {
    connectionStatus.value = {
      type: 'error',
      message: $t('page.lowcode.project.config.connectionError')
    };
  } finally {
    testingConnection.value = false;
  }
};

const handleSave = async () => {
  // 验证所有表单
  const forms = [basicFormRef.value, techFormRef.value, generationFormRef.value, databaseFormRef.value, advancedFormRef.value];
  
  try {
    await Promise.all(forms.map(form => form?.validate()));
  } catch (error) {
    createMessage.error($t('page.lowcode.project.config.validationError'));
    return;
  }

  saving.value = true;
  
  try {
    const configData = {
      ...configForm.basic,
      config: {
        tech: configForm.tech,
        generation: configForm.generation,
        database: configForm.database,
        advanced: configForm.advanced
      }
    };

    const { data } = await fetchUpdateProjectConfig(props.project.id, configData);
    
    if (data.status === 0) {
      createMessage.success($t('page.lowcode.project.config.saveSuccess'));
      emit('saved');
      modalVisible.value = false;
    } else {
      createMessage.error(data.msg || $t('page.lowcode.project.config.saveError'));
    }
  } catch (error) {
    createMessage.error($t('page.lowcode.project.config.saveError'));
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  modalVisible.value = false;
};

// 监听项目变化，初始化表单
watch(() => props.project, initForm, { immediate: true });

// 监听模态框显示状态
watch(modalVisible, (visible) => {
  if (visible) {
    activeTab.value = 'basic';
    connectionStatus.value = null;
    initForm();
  }
});
</script>

<style scoped>
.project-config-modal {
  max-height: 600px;
  overflow-y: auto;
}

:deep(.n-form-item-label) {
  font-weight: 500;
}

:deep(.n-tabs-pane) {
  padding-top: 16px;
}
</style>
