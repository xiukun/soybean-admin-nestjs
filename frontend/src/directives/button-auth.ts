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
    // 通过环境变量控制是否启用按钮权限隐藏
    const enabled = import.meta.env.VITE_ENABLE_BUTTON_AUTH === 'Y';
    if (!enabled) return;

    const auth = useAuthStore();

    const value = binding.value as string | string[] | undefined;
    if (!value) return;

    // 静态路由 super 角色：直接放行
    if (auth.isStaticSuper) return;

    const required = Array.isArray(value) ? value : [value];
    const owned = auth.userInfo.buttons || [];

    // fail-open：当 buttons 为空时默认不隐藏，避免锁死
    if (!owned.length) return;

    const pass = required.some((code) => owned.includes(code));
    if (!pass) {
      el.parentNode?.removeChild(el);
    }
  },
};
