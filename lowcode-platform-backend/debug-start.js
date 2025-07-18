#!/usr/bin/env node

// 调试启动脚本
console.log('🚀 开始启动低代码平台...');
console.log('📊 环境变量:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT);
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');

try {
  console.log('📦 加载模块...');
  require('dotenv').config();
  
  console.log('🔧 重新检查环境变量:');
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  PORT:', process.env.PORT);
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');
  
  console.log('🏗️ 启动应用...');
  require('./dist/main.js');
  
} catch (error) {
  console.error('❌ 启动失败:', error);
  console.error('📋 错误堆栈:', error.stack);
  process.exit(1);
}
