/*
 * @Description: 简化的AMIS格式测试
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 02:30:00
 * @LastEditors: henry.xiukun
 */

const https = require('https');
const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            error: 'JSON解析失败',
          });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testAmisFormat() {
  console.log('🔍 AMIS格式快速测试\n');

  const tests = [
    {
      name: 'AMIS演示 - 数组数据',
      url: 'http://localhost:3000/api/v1/amis-demo/array',
    },
    {
      name: 'AMIS演示 - 分页数据',
      url: 'http://localhost:3000/api/v1/amis-demo/pagination',
    },
  ];

  for (const test of tests) {
    console.log(`测试: ${test.name}`);
    
    try {
      const result = await makeRequest(test.url);
      
      if (result.status === 200) {
        console.log('✅ 请求成功');
        
        if (result.data && typeof result.data === 'object') {
          console.log('📊 响应数据结构:');
          console.log(`   status: ${result.data.status}`);
          console.log(`   msg: "${result.data.msg}"`);
          
          if (result.data.data) {
            const dataKeys = Object.keys(result.data.data);
            console.log(`   data字段: [${dataKeys.join(', ')}]`);
            
            // 检查AMIS格式
            if (result.data.data.options) {
              console.log('✅ 使用了AMIS标准格式 (options)');
              if (Array.isArray(result.data.data.options)) {
                console.log(`   options数组长度: ${result.data.data.options.length}`);
              }
            } else if (result.data.data.items) {
              console.log('⚠️ 使用了旧格式 (items)');
              if (Array.isArray(result.data.data.items)) {
                console.log(`   items数组长度: ${result.data.data.items.length}`);
              }
            }
            
            // 检查分页字段
            if (result.data.data.page !== undefined) {
              console.log('✅ 使用了AMIS分页格式 (page)');
            } else if (result.data.data.current !== undefined) {
              console.log('⚠️ 使用了旧分页格式 (current)');
            }
            
            if (result.data.data.perPage !== undefined) {
              console.log('✅ 使用了AMIS分页格式 (perPage)');
            } else if (result.data.data.size !== undefined) {
              console.log('⚠️ 使用了旧分页格式 (size)');
            }
          }
        }
      } else {
        console.log(`❌ 请求失败，状态码: ${result.status}`);
      }
      
    } catch (error) {
      console.log(`❌ 请求错误: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🎯 测试完成！');
}

testAmisFormat().catch(console.error);
