import type { Directive } from 'vue';
import { useAuthStore } from '@/store/modules/auth';

/**
 * v-button-auth
 * - value: string | string[]  (button code or codes)
 *
 * Strategy: no permission => remove element (HIDE)
 */
export const buttonAuthDirective: Directive = {
  mounted(el, binding) {
    const auth = useAuthStore();

    const value = binding.value as string | string[] | undefined;

    if (!value) return;

    // 1) 静态路由 super 角色：直接放行
    if (auth.isStaticSuper) return;

    const required = Array.isArray(value) ? value : [value];
    const owned = auth.userInfo.buttons || [];

    // 2) fail-open：当 buttons 为空（未下发/接口失败/尚未刷新）时，默认不隐藏，保证可操作性
    if (!owned.length) return;

    const pass = required.some((code) => owned.includes(code));

    if (!pass) {
      el.parentNode?.removeChild(el);
    }
  },
};
