import type { FormItemRule } from 'naive-ui';
import { $t } from '@/locales';

/** create required form rule */
export function createRequiredFormRule(message?: string): FormItemRule {
  return {
    required: true,
    message: message || $t('form.required')
  };
}

/** create confirm password rule */
export function createConfirmPwdRule(pwd: string): FormItemRule {
  return {
    required: true,
    message: $t('page.login.pwdForm.confirmPwd'),
    validator: (rule, value) => {
      if (!value || value !== pwd) {
        return new Error($t('form.confirmPwd.invalid'));
      }
      return true;
    }
  };
}

/** create email rule */
export function createEmailRule(): FormItemRule {
  return {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: $t('form.email.invalid'),
    trigger: ['input', 'blur']
  };
}

/** create phone rule */
export function createPhoneRule(): FormItemRule {
  return {
    pattern: /^1[3-9]\d{9}$/,
    message: $t('form.phone.invalid'),
    trigger: ['input', 'blur']
  };
}

/** create url rule */
export function createUrlRule(): FormItemRule {
  return {
    pattern: /^https?:\/\/.+/,
    message: $t('form.url.invalid'),
    trigger: ['input', 'blur']
  };
}

/** create number rule */
export function createNumberRule(): FormItemRule {
  return {
    type: 'number',
    message: $t('form.number.invalid'),
    trigger: ['input', 'blur']
  };
}

/** create integer rule */
export function createIntegerRule(): FormItemRule {
  return {
    pattern: /^\d+$/,
    message: $t('form.integer.invalid'),
    trigger: ['input', 'blur']
  };
}

/** create positive number rule */
export function createPositiveNumberRule(): FormItemRule {
  return {
    validator: (rule, value) => {
      if (value && Number(value) <= 0) {
        return new Error($t('form.positiveNumber.invalid'));
      }
      return true;
    },
    trigger: ['input', 'blur']
  };
}

/** create length rule */
export function createLengthRule(min: number, max: number): FormItemRule {
  return {
    min,
    max,
    message: $t('form.length.invalid', { min, max }),
    trigger: ['input', 'blur']
  };
}

/** create custom rule */
export function createCustomRule(
  validator: (rule: FormItemRule, value: any) => boolean | Error | Promise<boolean | Error>,
  message?: string
): FormItemRule {
  return {
    validator,
    message: message || $t('form.invalid'),
    trigger: ['input', 'blur']
  };
}
