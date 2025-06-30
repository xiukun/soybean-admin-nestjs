import { defineConfig } from '@soybeanjs/eslint-config';

export default defineConfig(
  { vue: true, unocss: true },
  {
    rules: {
      'vue/multi-word-component-names': [
        'warn',
        {
          ignores: ['index', 'App', 'Register', '[id]', '[url]']
        }
      ],
      'vue/component-name-in-template-casing': [
        'warn',
        'PascalCase',
        {
          registeredComponentsOnly: false,
          ignores: ['/^icon-/']
        }
      ],
      'vue/no-v-model-argument': 'off',
      'unocss/order-attributify': 'off',
      'no-plusplus': 'off',
      'no-underscore-dangle': 'off',
      'no-param-reassign': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off'
    }
  }
);
