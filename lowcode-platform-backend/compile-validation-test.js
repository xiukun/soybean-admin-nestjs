#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 编译验证测试脚本
 * 验证生成的代码是否能够正确编译
 */

class CompileValidationTester {
  constructor() {
    this.amisBackendPath = path.join(__dirname, '../amis-lowcode-backend');
  }

  async runCompileValidation() {
    console.log('\n🔍 开始编译验证测试...\n');

    const tasks = [
      { name: '检查TypeScript配置', method: 'checkTypeScriptConfig' },
      { name: '更新Prisma客户端', method: 'updatePrismaClient' },
      { name: '运行TypeScript编译检查', method: 'runTypeScriptCheck' },
      { name: '分析编译错误', method: 'analyzeCompileErrors' },
      { name: '生成修复建议', method: 'generateFixSuggestions' }
    ];

    const results = [];
    for (const task of tasks) {
      console.log(`📝 ${task.name}...`);
      try {
        const result = await this[task.method]();
        console.log(`✅ ${task.name} 成功`);
        results.push({ task: task.name, success: true, result });
      } catch (error) {
        console.log(`❌ ${task.name} 失败: ${error.message}`);
        results.push({ task: task.name, success: false, error: error.message });
      }
    }

    return results;
  }

  async checkTypeScriptConfig() {
    const tsconfigPath = path.join(this.amisBackendPath, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      throw new Error('tsconfig.json 文件不存在');
    }

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    console.log('  📋 TypeScript配置检查通过');
    return { configExists: true, config: tsconfig };
  }

  async updatePrismaClient() {
    return new Promise((resolve, reject) => {
      console.log('  🔄 正在更新Prisma客户端...');
      
      const prismaGenerate = spawn('npx', ['prisma', 'generate'], {
        cwd: this.amisBackendPath,
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      prismaGenerate.stdout.on('data', (data) => {
        output += data.toString();
      });

      prismaGenerate.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      prismaGenerate.on('close', (code) => {
        if (code === 0) {
          console.log('  ✅ Prisma客户端更新成功');
          resolve({ success: true, output });
        } else {
          console.log('  ⚠️ Prisma客户端更新有警告，但继续执行');
          console.log('  输出:', output);
          console.log('  错误:', errorOutput);
          resolve({ success: false, output, error: errorOutput });
        }
      });

      prismaGenerate.on('error', (error) => {
        reject(new Error(`Prisma生成失败: ${error.message}`));
      });
    });
  }

  async runTypeScriptCheck() {
    return new Promise((resolve, reject) => {
      console.log('  🔍 正在运行TypeScript编译检查...');
      
      const tscCheck = spawn('npx', ['tsc', '--noEmit', '--skipLibCheck'], {
        cwd: this.amisBackendPath,
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      tscCheck.stdout.on('data', (data) => {
        output += data.toString();
      });

      tscCheck.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      tscCheck.on('close', (code) => {
        const result = {
          success: code === 0,
          output,
          errorOutput,
          exitCode: code
        };

        if (code === 0) {
          console.log('  ✅ TypeScript编译检查通过');
        } else {
          console.log('  ❌ TypeScript编译检查发现错误');
        }

        resolve(result);
      });

      tscCheck.on('error', (error) => {
        reject(new Error(`TypeScript检查失败: ${error.message}`));
      });
    });
  }

  async analyzeCompileErrors(compileResult) {
    if (!compileResult || compileResult.success) {
      return { hasErrors: false, errors: [] };
    }

    const errorOutput = compileResult.errorOutput || '';
    const errors = this.parseTypeScriptErrors(errorOutput);
    
    console.log(`  📊 发现 ${errors.length} 个编译错误`);
    
    return {
      hasErrors: errors.length > 0,
      errors,
      totalErrors: errors.length
    };
  }

  parseTypeScriptErrors(errorOutput) {
    const errors = [];
    const lines = errorOutput.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 匹配TypeScript错误格式: file.ts(line,col): error TSxxxx: message
      const errorMatch = line.match(/^(.+\.ts)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
      
      if (errorMatch) {
        const [, file, line, column, code, message] = errorMatch;
        errors.push({
          file: file.replace(this.amisBackendPath + '/', ''),
          line: parseInt(line),
          column: parseInt(column),
          code,
          message,
          severity: 'error'
        });
      }
    }
    
    return errors;
  }

  async generateFixSuggestions(errors) {
    if (!errors || !errors.hasErrors) {
      return { suggestions: [] };
    }

    const suggestions = [];
    
    for (const error of errors.errors) {
      const suggestion = this.generateErrorSuggestion(error);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    console.log(`  💡 生成了 ${suggestions.length} 个修复建议`);
    
    return { suggestions };
  }

  generateErrorSuggestion(error) {
    const { code, message, file } = error;
    
    // 常见错误的修复建议
    const fixSuggestions = {
      'TS2307': {
        title: '模块未找到',
        description: '检查import路径是否正确，确保被引用的文件存在',
        actions: [
          '检查文件路径是否正确',
          '确保被引用的模块已创建',
          '检查相对路径是否正确'
        ]
      },
      'TS2339': {
        title: '属性不存在',
        description: '尝试访问不存在的属性或方法',
        actions: [
          '检查属性名是否拼写正确',
          '确保对象类型定义包含该属性',
          '检查Prisma模型是否已更新'
        ]
      },
      'TS2322': {
        title: '类型不匹配',
        description: '赋值的类型与期望的类型不匹配',
        actions: [
          '检查变量类型定义',
          '确保赋值类型正确',
          '考虑使用类型断言或类型转换'
        ]
      }
    };

    const suggestion = fixSuggestions[code];
    if (suggestion) {
      return {
        error,
        ...suggestion,
        file
      };
    }

    return {
      error,
      title: '编译错误',
      description: message,
      actions: ['请检查代码语法和类型定义'],
      file
    };
  }

  printSummary(results) {
    console.log('\n📊 编译验证结果汇总:');
    console.log('='.repeat(60));
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${failureCount}`);
    
    // 查找编译检查结果
    const compileResult = results.find(r => r.task === '运行TypeScript编译检查');
    const errorAnalysis = results.find(r => r.task === '分析编译错误');
    const suggestions = results.find(r => r.task === '生成修复建议');
    
    if (compileResult && !compileResult.success) {
      console.log('\n❌ 编译错误详情:');
      if (errorAnalysis && errorAnalysis.result && errorAnalysis.result.errors) {
        errorAnalysis.result.errors.forEach((error, index) => {
          console.log(`\n  ${index + 1}. ${error.file}:${error.line}:${error.column}`);
          console.log(`     错误码: ${error.code}`);
          console.log(`     消息: ${error.message}`);
        });
      }
      
      if (suggestions && suggestions.result && suggestions.result.suggestions) {
        console.log('\n💡 修复建议:');
        suggestions.result.suggestions.forEach((suggestion, index) => {
          console.log(`\n  ${index + 1}. ${suggestion.title} (${suggestion.file})`);
          console.log(`     描述: ${suggestion.description}`);
          console.log(`     建议操作:`);
          suggestion.actions.forEach(action => {
            console.log(`       - ${action}`);
          });
        });
      }
    } else if (compileResult && compileResult.success) {
      console.log('\n✅ 所有生成的代码编译通过！');
    }
    
    console.log('\n✨ 编译验证完成!');
  }
}

// 运行验证
async function main() {
  const tester = new CompileValidationTester();
  const results = await tester.runCompileValidation();
  tester.printSummary(results);
  
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}
