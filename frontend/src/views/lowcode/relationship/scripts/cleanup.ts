// 关系管理模块清理脚本
// 用于清理无用代码、优化性能和整理文件结构

import { promises as fs } from 'fs';
import path from 'path';

interface CleanupConfig {
  // 需要删除的文件
  filesToDelete: string[];
  // 需要清理的目录
  directoriesToClean: string[];
  // 需要检查的代码模式
  codePatterns: {
    pattern: RegExp;
    description: string;
  }[];
}

const CLEANUP_CONFIG: CleanupConfig = {
  filesToDelete: [
    // 删除旧版本的G6组件（如果存在）
    'src/views/lowcode/relationship/modules/g6-relationship-designer-old.vue',
    // 删除临时文件
    'src/views/lowcode/relationship/modules/*.tmp',
    'src/views/lowcode/relationship/modules/*.bak'
  ],
  
  directoriesToClean: [
    'src/views/lowcode/relationship/temp',
    'src/views/lowcode/relationship/backup'
  ],
  
  codePatterns: [
    {
      pattern: /\/\*\s*TODO:.*?\*\//g,
      description: '清理TODO注释'
    },
    {
      pattern: /console\.log\([^)]*\);?/g,
      description: '清理console.log语句'
    },
    {
      pattern: /\/\*\s*DEBUG:.*?\*\//g,
      description: '清理DEBUG注释'
    },
    {
      pattern: /\/\/\s*@ts-ignore/g,
      description: '清理@ts-ignore注释'
    }
  ]
};

class RelationshipModuleCleanup {
  private basePath: string;
  
  constructor(basePath: string = 'src/views/lowcode/relationship') {
    this.basePath = basePath;
  }
  
  // 主清理函数
  async cleanup(): Promise<void> {
    console.log('🧹 开始清理关系管理模块...');
    
    try {
      await this.deleteUnusedFiles();
      await this.cleanDirectories();
      await this.cleanCodePatterns();
      await this.optimizeImports();
      await this.generateCleanupReport();
      
      console.log('✅ 关系管理模块清理完成！');
    } catch (error) {
      console.error('❌ 清理过程中出现错误:', error);
      throw error;
    }
  }
  
  // 删除无用文件
  private async deleteUnusedFiles(): Promise<void> {
    console.log('🗑️  删除无用文件...');
    
    for (const filePattern of CLEANUP_CONFIG.filesToDelete) {
      try {
        const fullPath = path.join(this.basePath, filePattern);
        
        // 检查文件是否存在
        try {
          await fs.access(fullPath);
          await fs.unlink(fullPath);
          console.log(`   ✓ 已删除: ${filePattern}`);
        } catch (error) {
          // 文件不存在，跳过
          console.log(`   - 文件不存在: ${filePattern}`);
        }
      } catch (error) {
        console.warn(`   ⚠️  删除文件失败: ${filePattern}`, error);
      }
    }
  }
  
  // 清理目录
  private async cleanDirectories(): Promise<void> {
    console.log('📁 清理目录...');
    
    for (const dir of CLEANUP_CONFIG.directoriesToClean) {
      try {
        const fullPath = path.join(this.basePath, dir);
        
        try {
          await fs.access(fullPath);
          await fs.rmdir(fullPath, { recursive: true });
          console.log(`   ✓ 已清理目录: ${dir}`);
        } catch (error) {
          console.log(`   - 目录不存在: ${dir}`);
        }
      } catch (error) {
        console.warn(`   ⚠️  清理目录失败: ${dir}`, error);
      }
    }
  }
  
  // 清理代码模式
  private async cleanCodePatterns(): Promise<void> {
    console.log('🔍 清理代码模式...');
    
    const vueFiles = await this.findVueFiles();
    const tsFiles = await this.findTsFiles();
    const allFiles = [...vueFiles, ...tsFiles];
    
    for (const filePath of allFiles) {
      try {
        let content = await fs.readFile(filePath, 'utf-8');
        let modified = false;
        
        for (const { pattern, description } of CLEANUP_CONFIG.codePatterns) {
          const matches = content.match(pattern);
          if (matches && matches.length > 0) {
            content = content.replace(pattern, '');
            modified = true;
            console.log(`   ✓ ${description}: ${path.relative(this.basePath, filePath)} (${matches.length}处)`);
          }
        }
        
        if (modified) {
          // 清理多余的空行
          content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
          await fs.writeFile(filePath, content, 'utf-8');
        }
      } catch (error) {
        console.warn(`   ⚠️  处理文件失败: ${filePath}`, error);
      }
    }
  }
  
  // 优化导入语句
  private async optimizeImports(): Promise<void> {
    console.log('📦 优化导入语句...');
    
    const vueFiles = await this.findVueFiles();
    const tsFiles = await this.findTsFiles();
    const allFiles = [...vueFiles, ...tsFiles];
    
    for (const filePath of allFiles) {
      try {
        let content = await fs.readFile(filePath, 'utf-8');
        let modified = false;
        
        // 移除未使用的导入
        const importRegex = /import\s+{([^}]+)}\s+from\s+['"][^'"]+['"];?\n/g;
        const imports = content.match(importRegex);
        
        if (imports) {
          for (const importStatement of imports) {
            const importedItems = importStatement.match(/{([^}]+)}/)?.[1]
              ?.split(',')
              .map(item => item.trim())
              .filter(Boolean) || [];
            
            // 检查每个导入项是否在代码中使用
            const usedItems = importedItems.filter(item => {
              const itemName = item.split(' as ')[0].trim();
              const regex = new RegExp(`\\b${itemName}\\b`, 'g');
              const matches = content.match(regex);
              return matches && matches.length > 1; // 大于1是因为导入语句本身也会匹配
            });
            
            if (usedItems.length !== importedItems.length && usedItems.length > 0) {
              const newImportStatement = importStatement.replace(
                /{([^}]+)}/,
                `{ ${usedItems.join(', ')} }`
              );
              content = content.replace(importStatement, newImportStatement);
              modified = true;
              console.log(`   ✓ 优化导入: ${path.relative(this.basePath, filePath)}`);
            } else if (usedItems.length === 0) {
              content = content.replace(importStatement, '');
              modified = true;
              console.log(`   ✓ 移除未使用导入: ${path.relative(this.basePath, filePath)}`);
            }
          }
        }
        
        if (modified) {
          await fs.writeFile(filePath, content, 'utf-8');
        }
      } catch (error) {
        console.warn(`   ⚠️  优化导入失败: ${filePath}`, error);
      }
    }
  }
  
  // 生成清理报告
  private async generateCleanupReport(): Promise<void> {
    console.log('📊 生成清理报告...');
    
    const vueFiles = await this.findVueFiles();
    const tsFiles = await this.findTsFiles();
    const allFiles = [...vueFiles, ...tsFiles];
    
    let totalLines = 0;
    let totalSize = 0;
    const fileStats: Array<{ file: string; lines: number; size: number }> = [];
    
    for (const filePath of allFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const stats = await fs.stat(filePath);
        const lines = content.split('\n').length;
        
        totalLines += lines;
        totalSize += stats.size;
        
        fileStats.push({
          file: path.relative(this.basePath, filePath),
          lines,
          size: stats.size
        });
      } catch (error) {
        console.warn(`   ⚠️  统计文件失败: ${filePath}`, error);
      }
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: allFiles.length,
        totalLines,
        totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
        vueFiles: vueFiles.length,
        tsFiles: tsFiles.length
      },
      files: fileStats.sort((a, b) => b.size - a.size)
    };
    
    const reportPath = path.join(this.basePath, 'cleanup-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    
    console.log('📋 清理报告:');
    console.log(`   文件总数: ${report.summary.totalFiles}`);
    console.log(`   代码行数: ${report.summary.totalLines}`);
    console.log(`   总大小: ${report.summary.totalSize}`);
    console.log(`   Vue文件: ${report.summary.vueFiles}`);
    console.log(`   TS文件: ${report.summary.tsFiles}`);
    console.log(`   报告已保存: ${reportPath}`);
  }
  
  // 查找Vue文件
  private async findVueFiles(): Promise<string[]> {
    return this.findFilesByExtension('.vue');
  }
  
  // 查找TypeScript文件
  private async findTsFiles(): Promise<string[]> {
    return this.findFilesByExtension('.ts');
  }
  
  // 按扩展名查找文件
  private async findFilesByExtension(extension: string): Promise<string[]> {
    const files: string[] = [];
    
    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(extension)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`扫描目录失败: ${dir}`, error);
      }
    };
    
    await scanDirectory(this.basePath);
    return files;
  }
}

// 导出清理函数
export async function cleanupRelationshipModule(basePath?: string): Promise<void> {
  const cleanup = new RelationshipModuleCleanup(basePath);
  await cleanup.cleanup();
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanupRelationshipModule()
    .then(() => {
      console.log('🎉 清理完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 清理失败:', error);
      process.exit(1);
    });
}