#!/usr/bin/env node
/**
 * Justice Dashboard API Test Suite
 * Tests both OpenAI and Wolfram Alpha integrations
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAPI(name, url, options = {}) {
  console.log(`\n🧪 Testing ${name}...`);
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name} - SUCCESS`);
      console.log(`📄 Response preview:`, JSON.stringify(data, null, 2).substring(0, 300) + '...');
      return true;
    } else {
      console.log(`❌ ${name} - FAILED (${response.status})`);
      console.log(`📄 Error:`, data);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} - FAILED`);
    console.log(`📄 Error:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Justice Dashboard API Test Suite');
  console.log('=' .repeat(50));

  const results = [];

  // Test 1: Health Check
  results.push(await testAPI('Health Check', `${BASE_URL}/api/health`));

  // Test 2: Wolfram Alpha LLM API
  const wolframQuery = {
    query: "calculate duration between January 15, 2023 and March 20, 2023"
  };
  results.push(await testAPI(
    'Wolfram Alpha LLM API', 
    `${BASE_URL}/api/wolfram-test`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wolframQuery)
    }
  ));

  // Test 3: OpenAI Case Thread Creation
  const threadData = {
    childName: "Test Case",
    caseType: "Family Law - API Test"
  };
  results.push(await testAPI(
    'OpenAI Case Thread Creation', 
    `${BASE_URL}/api/case/create-thread`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(threadData)
    }
  ));

  // Test 4: Batch Wolfram Analysis
  const batchQueries = [
    "timeline from 2020 to 2025",
    "legal working days between January 1, 2024 and December 31, 2024",
    "statistical analysis of 3 court hearings over 6 months"
  ];
  results.push(await testAPI(
    'Batch Wolfram Analysis', 
    `${BASE_URL}/api/batch-analyze`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries: batchQueries, analysisType: 'legal-timeline' })
    }
  ));

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! Justice Dashboard APIs are fully operational.');
    console.log('\n🔗 Access the test interface at: http://localhost:5173/api-test.html');
    console.log('🔗 Backend API running at: http://localhost:3000');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

// Run the tests
runTests().catch(console.error);
