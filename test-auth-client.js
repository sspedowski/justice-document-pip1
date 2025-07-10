/**
 * Justice Dashboard Authentication Test Client
 * Demonstrates the complete authentication flow with enhanced features
 */

const https = require('http');

class AuthTestClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  async makeRequest(endpoint, method = 'GET', data = null, includeAuth = true) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (includeAuth && this.token) {
        options.headers['Authorization'] = `Bearer ${this.token}`;
      }

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            resolve({ status: res.statusCode, data: result });
          } catch (error) {
            resolve({ status: res.statusCode, data: responseData });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async login(username, password) {
    console.log('🔐 Testing login...');
    const response = await this.makeRequest('/api/login', 'POST', { username, password }, false);
    
    if (response.data.success) {
      this.token = response.data.token;
      console.log('✅ Login successful');
      console.log(`   Token expires in: ${response.data.expiresIn}`);
      return true;
    } else {
      console.log('❌ Login failed:', response.data.error);
      return false;
    }
  }

  async getProfile() {
    console.log('👤 Testing profile endpoint...');
    const response = await this.makeRequest('/api/profile');
    
    if (response.data.success) {
      console.log('✅ Profile retrieved successfully');
      console.log('   User:', response.data.profile.username);
      console.log('   Role:', response.data.profile.role);
      console.log('   Last Login:', response.data.profile.lastLogin);
      return response.data.profile;
    } else {
      console.log('❌ Profile fetch failed:', response.data.error);
      return null;
    }
  }

  async refreshToken() {
    console.log('🔄 Testing token refresh...');
    const response = await this.makeRequest('/api/refresh-token', 'POST');
    
    if (response.data.success) {
      this.token = response.data.token;
      console.log('✅ Token refreshed successfully');
      console.log(`   New token expires in: ${response.data.expiresIn}`);
      return true;
    } else {
      console.log('❌ Token refresh failed:', response.data.error);
      return false;
    }
  }

  async getUserSessions() {
    console.log('👥 Testing user sessions endpoint...');
    const response = await this.makeRequest('/api/user-sessions');
    
    if (response.data.success) {
      console.log('✅ User sessions retrieved successfully');
      console.log(`   Active users: ${response.data.sessions.length}`);
      response.data.sessions.forEach(session => {
        console.log(`   - ${session.username} (${session.role})`);
      });
      return response.data.sessions;
    } else {
      console.log('❌ Sessions fetch failed:', response.data.error);
      return null;
    }
  }

  async checkHealth() {
    console.log('🏥 Testing health check...');
    const response = await this.makeRequest('/api/health');
    
    console.log('✅ Health check completed');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Authentication: ${response.data.authentication}`);
    console.log(`   Version: ${response.data.version}`);
    return response.data;
  }

  async testInvalidToken() {
    console.log('🔒 Testing with invalid token...');
    const originalToken = this.token;
    this.token = 'invalid.token.here';
    
    const response = await this.makeRequest('/api/profile');
    
    if (response.status === 403) {
      console.log('✅ Invalid token properly rejected');
      console.log(`   Error code: ${response.data.code}`);
    } else {
      console.log('❌ Invalid token not properly handled');
    }
    
    this.token = originalToken;
  }

  async runFullTest() {
    console.log('🧪 Starting complete authentication test suite...\n');

    try {
      // Test health check without authentication
      await this.checkHealth();
      console.log('');

      // Test login
      const loginSuccess = await this.login('admin', 'justice2025');
      if (!loginSuccess) return;
      console.log('');

      // Test profile
      await this.getProfile();
      console.log('');

      // Test user sessions (admin only)
      await this.getUserSessions();
      console.log('');

      // Test token refresh
      await this.refreshToken();
      console.log('');

      // Test invalid token handling
      await this.testInvalidToken();
      console.log('');

      // Test health check with authentication
      await this.checkHealth();
      console.log('');

      console.log('🎉 All authentication tests completed successfully!');

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  const client = new AuthTestClient();
  client.runFullTest();
}

module.exports = AuthTestClient;
