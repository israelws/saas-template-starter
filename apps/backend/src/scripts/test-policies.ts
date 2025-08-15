/**
 * Manual testing script for the policy system
 * Run with: npm run script test-policies
 */

import axios from 'axios';
import { PolicyEvaluationContext, PolicyEffect, PolicyScope } from '@saas-template/shared';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Test scenarios
const testScenarios = [
  {
    name: 'Organization-scoped product access',
    description: 'User can only access products from their organization',
    context: {
      subject: {
        id: 'user-123',
        roles: ['user'],
        groups: [],
        attributes: {
          organizationId: 'org-456',
        },
      },
      resource: {
        type: 'product',
        id: 'prod-789',
        attributes: {
          organizationId: 'org-456', // Same org - should allow
        },
      },
      action: 'read',
      environment: {
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
        attributes: {},
      },
      organizationId: 'org-456',
    },
    expectedResult: 'allow',
  },
  {
    name: 'Cross-organization access denial',
    description: 'User cannot access products from different organization',
    context: {
      subject: {
        id: 'user-123',
        roles: ['user'],
        groups: [],
        attributes: {
          organizationId: 'org-456',
        },
      },
      resource: {
        type: 'product',
        id: 'prod-999',
        attributes: {
          organizationId: 'org-999', // Different org - should deny
        },
      },
      action: 'read',
      environment: {
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
        attributes: {},
      },
      organizationId: 'org-456',
    },
    expectedResult: 'deny',
  },
  {
    name: 'Personal document access',
    description: 'User has full access to their own documents',
    context: {
      subject: {
        id: 'user-123',
        roles: ['user'],
        groups: [],
        attributes: {
          id: 'user-123',
          organizationId: 'org-456',
        },
      },
      resource: {
        type: 'document',
        id: 'doc-111',
        attributes: {
          ownerId: 'user-123', // Owner matches - should allow
          organizationId: 'org-456',
        },
      },
      action: 'delete',
      environment: {
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
        attributes: {},
      },
      organizationId: 'org-456',
    },
    expectedResult: 'allow',
  },
  {
    name: 'Department-level access',
    description: 'User can access reports from their department',
    context: {
      subject: {
        id: 'user-123',
        roles: ['user'],
        groups: [],
        attributes: {
          organizationId: 'org-456',
          departmentId: 'dept-hr',
        },
      },
      resource: {
        type: 'report',
        id: 'report-222',
        attributes: {
          departmentId: 'dept-hr', // Same department - should allow
          organizationId: 'org-456',
        },
      },
      action: 'read',
      environment: {
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
        attributes: {},
      },
      organizationId: 'org-456',
    },
    expectedResult: 'allow',
  },
  {
    name: 'Therapist patient access',
    description: 'Therapist can only access their assigned patients',
    context: {
      subject: {
        id: 'therapist-123',
        roles: ['therapist'],
        groups: [],
        attributes: {
          organizationId: 'org-456',
          patientIds: ['patient-1', 'patient-2', 'patient-3'],
        },
      },
      resource: {
        type: 'patient',
        id: 'patient-2',
        attributes: {
          patientId: 'patient-2', // In therapist's patient list - should allow
          organizationId: 'org-456',
        },
      },
      action: 'update',
      environment: {
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
        attributes: {},
      },
      organizationId: 'org-456',
    },
    expectedResult: 'allow',
  },
];

// Test policy creation with resource attribute conditions
const testPolicyCreation = {
  name: 'Test Org Scoped Policy',
  description: 'Test policy with resource attribute conditions',
  scope: PolicyScope.ORGANIZATION,
  effect: PolicyEffect.ALLOW,
  priority: 50,
  subjects: {
    roles: ['user', 'manager'],
  },
  resources: {
    types: ['product', 'customer'],
    attributes: {
      organizationId: '${subject.organizationId}',
      status: 'active',
    },
  },
  actions: ['read', 'list', 'update'],
  metadata: {
    resourceRules: [
      {
        resource: 'product',
        actions: ['read', 'list', 'update'],
        attributeConditions: [
          {
            id: '1',
            attribute: 'organizationId',
            operator: 'equals',
            value: '${subject.organizationId}',
            type: 'string',
          },
          {
            id: '2',
            attribute: 'status',
            operator: 'equals',
            value: 'active',
            type: 'string',
          },
        ],
      },
      {
        resource: 'customer',
        actions: ['read', 'list'],
        attributeConditions: [
          {
            id: '3',
            attribute: 'organizationId',
            operator: 'equals',
            value: '${subject.organizationId}',
            type: 'string',
          },
        ],
      },
    ],
  },
};

async function testPolicyEvaluation(scenario: any) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`   ${scenario.description}`);

  try {
    const response = await api.post('/abac/policies/evaluate', scenario.context);
    const result = response.data;

    const passed =
      (result.allowed && scenario.expectedResult === 'allow') ||
      (!result.allowed && scenario.expectedResult === 'deny');

    console.log(`   Result: ${result.allowed ? '✅ ALLOWED' : '❌ DENIED'}`);
    console.log(`   Expected: ${scenario.expectedResult.toUpperCase()}`);
    console.log(`   Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

    if (result.reasons && result.reasons.length > 0) {
      console.log(`   Reasons: ${result.reasons.join(', ')}`);
    }

    return passed;
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function createTestPolicy() {
  console.log('\n📝 Creating test policy with resource attribute conditions...');

  try {
    const response = await api.post('/abac/policies', testPolicyCreation);
    console.log('   ✅ Policy created successfully');
    console.log(`   Policy ID: ${response.data.id}`);
    return response.data.id;
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function testPolicyRetrieval(policyId: string) {
  console.log('\n🔍 Retrieving created policy...');

  try {
    const response = await api.get(`/abac/policies/${policyId}`);
    const policy = response.data;

    // Check if resource attributes are properly stored
    const hasResourceAttributes =
      policy.resources?.attributes?.organizationId === '${subject.organizationId}';
    const hasMetadataRules = policy.metadata?.resourceRules?.length > 0;

    console.log('   ✅ Policy retrieved successfully');
    console.log(`   Has resource attributes: ${hasResourceAttributes ? '✅' : '❌'}`);
    console.log(`   Has metadata rules: ${hasMetadataRules ? '✅' : '❌'}`);

    return policy;
  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Policy System Test Suite');
  console.log('=====================================');

  if (!AUTH_TOKEN) {
    console.log('⚠️  WARNING: No AUTH_TOKEN provided. Tests may fail.');
    console.log('   Set AUTH_TOKEN environment variable with a valid JWT token.');
  }

  let passedTests = 0;
  let totalTests = 0;

  // Test policy creation
  const policyId = await createTestPolicy();
  if (policyId) {
    passedTests++;

    // Test policy retrieval
    const policy = await testPolicyRetrieval(policyId);
    if (policy) {
      passedTests++;
    }
  }
  totalTests += 2;

  // Test policy evaluations
  for (const scenario of testScenarios) {
    const passed = await testPolicyEvaluation(scenario);
    if (passed) passedTests++;
    totalTests++;
  }

  // Summary
  console.log('\n=====================================');
  console.log('📊 Test Summary');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the results above.');
  }
}

// Run tests
runAllTests().catch(console.error);
