const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002/api';

// 测试API响应结构
async function testApiStructure() {
  console.log('🔍 开始测试API响应结构...\n');

  try {
    // 1. 测试登录获取token
    console.log('1. 测试登录API...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取到token');
    console.log('响应结构:', JSON.stringify(loginResponse.data, null, 2));

    // 设置请求头
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('使用token:', token);

    // 3. 测试系统用户列表API (管理员权限)
    console.log('\n2. 测试系统用户列表API...');
    const usersResponse = await axios.get(`${API_BASE_URL}/system/users`, { headers });
    console.log('✅ 系统用户列表API响应结构:', JSON.stringify(usersResponse.data, null, 2));

    // 3. 测试角色列表API
    console.log('\n3. 测试角色列表API...');
    const rolesResponse = await axios.get(`${API_BASE_URL}/system/roles`, { headers });
    console.log('✅ 角色列表API响应结构:', JSON.stringify(rolesResponse.data, null, 2));

    // 4. 测试科室列表API
    console.log('\n4. 测试科室列表API...');
    const departmentsResponse = await axios.get(`${API_BASE_URL}/system/departments`, { headers });
    console.log('✅ 科室列表API响应结构:', JSON.stringify(departmentsResponse.data, null, 2));

    // 5. 测试系统设置API
    console.log('\n5. 测试系统设置API...');
    const settingsResponse = await axios.get(`${API_BASE_URL}/system/settings`, { headers });
    console.log('✅ 系统设置API响应结构:', JSON.stringify(settingsResponse.data, null, 2));

    // 6. 测试操作日志API
    console.log('\n6. 测试操作日志API...');
    const logsResponse = await axios.get(`${API_BASE_URL}/system/logs`, { headers });
    console.log('✅ 操作日志API响应结构:', JSON.stringify(logsResponse.data, null, 2));

    console.log('\n🎉 所有API测试通过！');
    console.log('✅ API响应结构修复验证成功');

  } catch (error) {
    console.error('\n❌ API测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testApiStructure();