import type { FormItemRule } from 'naive-ui';

/**
 * Create a required form rule
 *
 * @param message - The error message
 */
export function createRequiredFormRule(message: string): FormItemRule {
  return {
    required: true,
    message
  };
}
