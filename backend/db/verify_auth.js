const http = require('http');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper function to make HTTP requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: headers
    }, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        let parsed = responseData;
        try {
          parsed = JSON.parse(responseData);
        } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          body: parsed
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(data);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Auth Endpoints Verification Tests ---');

  try {
    // 1. Admin Login (Should succeed)
    console.log('\n[Test 1] Attempting Admin login with seeded credentials...');
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'admin@apartment.com',
      password: 'AdminPass123!'
    });
    console.log('Status:', adminLogin.statusCode);
    console.log('Body:', adminLogin.body);
    if (adminLogin.statusCode !== 200 || !adminLogin.body.token) {
      throw new Error('Admin login failed');
    }
    const adminToken = adminLogin.body.token;

    // 2. Homeowner Login (Should succeed)
    console.log('\n[Test 2] Attempting Homeowner login with seeded credentials...');
    const ownerLoginSeeded = await request('POST', '/api/auth/login', {
      email: 'homeowner@apartment.com',
      password: 'OwnerPass123!'
    });
    console.log('Status:', ownerLoginSeeded.statusCode);
    if (ownerLoginSeeded.statusCode !== 200 || !ownerLoginSeeded.body.token) {
      throw new Error('Seeded Homeowner login failed');
    }
    const ownerSeededToken = ownerLoginSeeded.body.token;
    const ownerSeededId = ownerLoginSeeded.body.user.id;

    // 3. Register a New Homeowner (Should go to pending status)
    console.log('\n[Test 3] Registering new Homeowner...');
    const regOwner = await request('POST', '/api/auth/register', {
      email: 'newowner@apartment.com',
      password: 'NewOwnerPass123!',
      role: 'homeowner'
    });
    console.log('Status:', regOwner.statusCode);
    console.log('Body:', regOwner.body);
    if (regOwner.statusCode !== 201) {
      throw new Error('New homeowner registration failed');
    }
    const newOwnerId = regOwner.body.userId;

    // 4. Try Login as Pending Homeowner (Should get 403 Forbidden)
    console.log('\n[Test 4] Logging in as pending Homeowner (Expected: 403)...');
    const pendingLogin = await request('POST', '/api/auth/login', {
      email: 'newowner@apartment.com',
      password: 'NewOwnerPass123!'
    });
    console.log('Status:', pendingLogin.statusCode);
    console.log('Body:', pendingLogin.body);
    if (pendingLogin.statusCode !== 403) {
      throw new Error('Allowed login for pending user!');
    }

    // 5. Admin Approves New Homeowner
    console.log('\n[Test 5] Admin approving new Homeowner...');
    const approveOwner = await request('POST', '/api/auth/approve', {
      userId: newOwnerId,
      action: 'approve'
    }, adminToken);
    console.log('Status:', approveOwner.statusCode);
    console.log('Body:', approveOwner.body);
    if (approveOwner.statusCode !== 200) {
      throw new Error('Admin failed to approve Homeowner');
    }

    // 6. Login as Approved Homeowner (Should succeed now)
    console.log('\n[Test 6] Logging in as approved Homeowner...');
    const approvedLogin = await request('POST', '/api/auth/login', {
      email: 'newowner@apartment.com',
      password: 'NewOwnerPass123!'
    });
    console.log('Status:', approvedLogin.statusCode);
    if (approvedLogin.statusCode !== 200 || !approvedLogin.body.token) {
      throw new Error('Approved Homeowner login failed');
    }
    const approvedOwnerToken = approvedLogin.body.token;
    const approvedOwnerId = approvedLogin.body.user.id;

    // 7. Register a Tenant (under approvedOwnerId)
    console.log('\n[Test 7] Registering new Tenant under the newly approved Homeowner...');
    const regTenant = await request('POST', '/api/auth/register', {
      email: 'newtenant@apartment.com',
      password: 'TenantPass123!',
      role: 'tenant',
      owner_id: approvedOwnerId
    });
    console.log('Status:', regTenant.statusCode);
    console.log('Body:', regTenant.body);
    if (regTenant.statusCode !== 201) {
      throw new Error('Tenant registration failed');
    }
    const tenantId = regTenant.body.userId;

    // 8. Try login as Tenant (Expected: 403 pending)
    console.log('\n[Test 8] Logging in as pending Tenant (Expected: 403)...');
    const tenantPendingLogin = await request('POST', '/api/auth/login', {
      email: 'newtenant@apartment.com',
      password: 'TenantPass123!'
    });
    console.log('Status:', tenantPendingLogin.statusCode);
    if (tenantPendingLogin.statusCode !== 403) {
      throw new Error('Allowed login for pending Tenant!');
    }

    // 9. Homeowner gets pending approvals (should see the tenant)
    console.log('\n[Test 9] Homeowner getting pending approvals...');
    const pendingListOwner = await request('GET', '/api/auth/pending-approvals', null, approvedOwnerToken);
    console.log('Status:', pendingListOwner.statusCode);
    console.log('Body:', pendingListOwner.body);
    if (pendingListOwner.statusCode !== 200 || pendingListOwner.body.tenants.length === 0) {
      throw new Error('Homeowner could not retrieve pending tenant');
    }

    // 10. Homeowner Approves Tenant (owner_approved becomes 1, status remains pending)
    console.log('\n[Test 10] Homeowner approving Tenant...');
    const approveTenantByOwner = await request('POST', '/api/auth/approve', {
      userId: tenantId,
      action: 'approve'
    }, approvedOwnerToken);
    console.log('Status:', approveTenantByOwner.statusCode);
    console.log('Body:', approveTenantByOwner.body);
    if (approveTenantByOwner.statusCode !== 200) {
      throw new Error('Homeowner failed to approve tenant');
    }

    // 11. Admin gets pending approvals (should see the tenant now since owner_approved = 1)
    console.log('\n[Test 11] Admin getting pending approvals (should contain tenant)...');
    const pendingListAdmin = await request('GET', '/api/auth/pending-approvals', null, adminToken);
    console.log('Status:', pendingListAdmin.statusCode);
    console.log('Body (tenants):', pendingListAdmin.body.tenants);
    if (pendingListAdmin.statusCode !== 200 || pendingListAdmin.body.tenants.length === 0) {
      throw new Error('Admin could not see homeowner-approved tenant');
    }

    // 12. Admin Approves Tenant
    console.log('\n[Test 12] Admin approving Tenant...');
    const approveTenantByAdmin = await request('POST', '/api/auth/approve', {
      userId: tenantId,
      action: 'approve'
    }, adminToken);
    console.log('Status:', approveTenantByAdmin.statusCode);
    console.log('Body:', approveTenantByAdmin.body);
    if (approveTenantByAdmin.statusCode !== 200) {
      throw new Error('Admin failed to approve tenant');
    }

    // 13. Tenant login (should succeed now)
    console.log('\n[Test 13] Logging in as approved Tenant...');
    const tenantLogin = await request('POST', '/api/auth/login', {
      email: 'newtenant@apartment.com',
      password: 'TenantPass123!'
    });
    console.log('Status:', tenantLogin.statusCode);
    if (tenantLogin.statusCode !== 200 || !tenantLogin.body.token) {
      throw new Error('Approved tenant login failed');
    }

    console.log('\n--- ALL AUTHENTICATION FLOW TESTS PASSED SUCCESSFULLY! ---');
    process.exit(0);
  } catch (error) {
    console.error('\nVerification failed:', error.message);
    process.exit(1);
  }
}

runTests();
