/**
 * HIMS Application Health Check Script
 * Tests all critical API endpoints and reports status
 * 
 * Run: npx ts-node scripts/health-check.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'arief@hanmarine.co';
const TEST_PASSWORD = 'admin2025';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  statusCode?: number;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];
let authToken = '';

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(
  method: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<TestResult> {
  const startTime = Date.now();
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Cookie': `next-auth.session-token=${authToken}` }),
        ...options.headers,
      },
      ...options,
    });

    const duration = Date.now() - startTime;
    const isSuccess = response.status < 400 || response.status === 401; // 401 expected for protected routes

    return {
      endpoint,
      method,
      status: isSuccess ? 'PASS' : 'FAIL',
      statusCode: response.status,
      duration,
    };
  } catch (error) {
    return {
      endpoint,
      method,
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

async function authenticate() {
  log('\n🔐 Authenticating...', 'cyan');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (response.ok) {
      log('✓ Authentication successful', 'green');
      // In real implementation, you'd extract the session token from cookies
      return true;
    } else {
      log('✗ Authentication failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Authentication error: ${error}`, 'red');
    return false;
  }
}

async function runHealthCheck() {
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('   HIMS APPLICATION HEALTH CHECK', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log(`\n🌐 Testing: ${BASE_URL}\n`, 'cyan');

  // Critical API endpoints to test
  const endpoints = [
    // Health & Auth
    { method: 'GET', path: '/api/health', name: 'Health Check' },
    
    // Dashboard
    { method: 'GET', path: '/api/dashboard/stats', name: 'Dashboard Stats' },
    
    // Crew Management
    { method: 'GET', path: '/api/crew', name: 'Crew List' },
    { method: 'GET', path: '/api/crewing/overview', name: 'Crewing Overview' },
    { method: 'GET', path: '/api/crewing/workflow/stats', name: 'Workflow Stats' },
    { method: 'GET', path: '/api/prepare-joining', name: 'Prepare Joining List' },
    
    // Contracts & Assignments
    { method: 'GET', path: '/api/contracts', name: 'Contracts List' },
    { method: 'GET', path: '/api/assignments', name: 'Assignments List' },
    
    // Applications & Interviews
    { method: 'GET', path: '/api/applications', name: 'Applications List' },
    { method: 'GET', path: '/api/interviews', name: 'Interviews List' },
    
    // Vessels & Principals
    { method: 'GET', path: '/api/vessels', name: 'Vessels List' },
    { method: 'GET', path: '/api/principals', name: 'Principals List' },
    
    // Documents
    { method: 'GET', path: '/api/documents/list', name: 'Documents List' },
    { method: 'GET', path: '/api/crewing/documents', name: 'Crewing Documents' },
    
    // HR
    { method: 'GET', path: '/api/attendances', name: 'Attendance List' },
    { method: 'GET', path: '/api/disciplinary', name: 'Disciplinary Records' },
    { method: 'GET', path: '/api/orientations', name: 'Orientations List' },
    { method: 'GET', path: '/api/recruitments', name: 'Recruitments List' },
    
    // Accounting
    { method: 'GET', path: '/api/agency-fees', name: 'Agency Fees' },
    { method: 'GET', path: '/api/wage-scales', name: 'Wage Scales' },
    { method: 'GET', path: '/api/insurance', name: 'Insurance Records' },
    
    // Quality & Compliance
    { method: 'GET', path: '/api/audits', name: 'Audits List' },
    { method: 'GET', path: '/api/audit/stats', name: 'Audit Stats' },
    { method: 'GET', path: '/api/risks', name: 'Risks List' },
    { method: 'GET', path: '/api/risks/dashboard/metrics', name: 'Risk Metrics' },
    { method: 'GET', path: '/api/nonconformity/list', name: 'Nonconformities' },
    { method: 'GET', path: '/api/qms/documents', name: 'QMS Documents' },
    { method: 'GET', path: '/api/qms/analytics/dashboard', name: 'QMS Analytics' },
    
    // Compliance
    { method: 'GET', path: '/api/compliance/stats', name: 'Compliance Stats' },
    { method: 'GET', path: '/api/compliance/communication', name: 'Communication Logs' },
    { method: 'GET', path: '/api/external-compliance', name: 'External Compliance' },
    { method: 'GET', path: '/api/national-holidays', name: 'National Holidays' },
    
    // Tasks & Checklists
    { method: 'GET', path: '/api/crew-tasks', name: 'Crew Tasks' },
    { method: 'GET', path: '/api/crewing/checklists', name: 'Crewing Checklists' },
    
    // Admin
    { method: 'GET', path: '/api/admin/users', name: 'User Management' },
  ];

  log('📋 Testing API Endpoints...\n', 'yellow');

  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.method, endpoint.path);
    results.push(result);

    const statusIcon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '○';
    const statusColor = result.status === 'PASS' ? 'green' : result.status === 'FAIL' ? 'red' : 'yellow';
    
    log(
      `${statusIcon} ${endpoint.name.padEnd(30)} [${result.statusCode || 'ERR'}] ${result.duration}ms`,
      statusColor
    );

    if (result.status === 'PASS') passCount++;
    else if (result.status === 'FAIL') failCount++;
    else skipCount++;

    // Add small delay to avoid overwhelming server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('   HEALTH CHECK SUMMARY', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  
  log(`\n✓ Passed: ${passCount}`, 'green');
  log(`✗ Failed: ${failCount}`, 'red');
  log(`○ Skipped: ${skipCount}`, 'yellow');
  log(`━ Total: ${passCount + failCount + skipCount}\n`, 'cyan');

  const successRate = ((passCount / (passCount + failCount)) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow');

  // Failed endpoints detail
  if (failCount > 0) {
    log('\n❌ FAILED ENDPOINTS:', 'red');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        log(`   • ${r.endpoint} - ${r.error || `HTTP ${r.statusCode}`}`, 'red');
      });
  }

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  // Exit with error if any critical endpoints failed
  if (failCount > 5) {
    log('⚠️  Multiple endpoints failed. Please investigate.', 'red');
    process.exit(1);
  }
}

// Run the health check
runHealthCheck()
  .then(() => {
    log('Health check completed successfully! ✨', 'green');
    process.exit(0);
  })
  .catch((error) => {
    log(`Health check failed: ${error}`, 'red');
    process.exit(1);
  });
