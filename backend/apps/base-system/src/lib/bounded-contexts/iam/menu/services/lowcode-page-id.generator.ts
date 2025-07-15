import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class LowcodePageIdGenerator {
  /**
   * 生成低代码页面ID
   * 格式: lowcode-{timestamp}-{random}
   * 例如: lowcode-1642567890123-a1b2c3
   */
  generate(): string {
    const timestamp = Date.now();
    const randomSuffix = randomBytes(3).toString('hex'); // 6位随机字符
    return `lowcode-${timestamp}-${randomSuffix}`;
  }

  /**
   * 根据菜单名称生成更友好的低代码页面ID
   * 格式: lowcode-{slug}-{timestamp}
   * 例如: lowcode-user-management-1642567890123
   */
  generateFromMenuName(menuName: string): string {
    const timestamp = Date.now();
    
    // 将菜单名称转换为URL友好的slug
    const slug = menuName
      .toLowerCase()
      .replace(/[\s\u4e00-\u9fff]+/g, '-') // 替换空格和中文字符为连字符
      .replace(/[^\w\-]/g, '') // 移除非字母数字和连字符的字符
      .replace(/\-+/g, '-') // 合并多个连字符
      .replace(/^\-|\-$/g, ''); // 移除开头和结尾的连字符
    
    // 如果slug为空或太短，使用默认前缀
    const finalSlug = slug.length >= 2 ? slug : 'page';
    
    return `lowcode-${finalSlug}-${timestamp}`;
  }

  /**
   * 验证低代码页面ID格式是否正确
   */
  isValidLowcodePageId(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }
    
    // 检查是否以 lowcode- 开头
    if (!id.startsWith('lowcode-')) {
      return false;
    }
    
    // 检查基本格式 (至少包含 lowcode- 前缀和一些内容)
    return id.length > 8 && /^lowcode-[\w\-]+$/.test(id);
  }

  /**
   * 从现有ID中提取时间戳（如果存在）
   */
  extractTimestamp(id: string): number | null {
    if (!this.isValidLowcodePageId(id)) {
      return null;
    }
    
    // 尝试从ID中提取时间戳
    const parts = id.split('-');
    for (const part of parts) {
      const timestamp = parseInt(part, 10);
      if (!isNaN(timestamp) && timestamp > 1000000000000) { // 合理的时间戳范围
        return timestamp;
      }
    }
    
    return null;
  }
}
