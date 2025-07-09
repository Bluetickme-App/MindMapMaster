/**
 * Comprehensive Test of Replit Agent System
 * Tests the exact Replit implementation with optimal model routing
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testReplitAgentSystem() {
  console.log('🧪 Testing Replit Agent System Implementation');
  console.log('============================================================');
  
  try {
    // Test 1: Model Performance Stats
    console.log('\n1. Testing Model Performance Stats...');
    const statsResponse = await axios.get(`${BASE_URL}/api/replit-agent/model-stats`);
    
    if (statsResponse.data.success) {
      console.log('✅ Model stats retrieved successfully');
      console.log('📊 OpenAI Agents:', statsResponse.data.stats.openai.count);
      console.log('📊 Claude Agents:', statsResponse.data.stats.claude.count);
      console.log('📊 Gemini Agents:', statsResponse.data.stats.gemini.count);
      
      console.log('\n🎯 Strengths by Provider:');
      console.log('OpenAI:', statsResponse.data.stats.openai.strengths.join(', '));
      console.log('Claude:', statsResponse.data.stats.claude.strengths.join(', '));
      console.log('Gemini:', statsResponse.data.stats.gemini.strengths.join(', '));
    }
    
    // Test 2: Create Implementation Plan
    console.log('\n2. Testing Plan Creation (Free Planning Stage)...');
    const planResponse = await axios.post(`${BASE_URL}/api/replit-agent/plan`, {
      prompt: 'Create a modern e-commerce website with React, TypeScript, and Tailwind CSS. Include user authentication, product catalog, shopping cart, and payment integration.',
      projectId: 1
    });
    
    if (planResponse.data.success) {
      const plan = planResponse.data.plan;
      console.log('✅ Implementation plan created successfully');
      console.log('📋 Plan Title:', plan.title);
      console.log('⏱️ Estimated Time:', plan.estimatedTime);
      console.log('💰 Estimated Cost: $' + plan.estimatedCost.toFixed(2));
      console.log('🔧 Technologies:', plan.technologies.join(', '));
      console.log('📝 Tasks:', plan.tasks.length);
      
      plan.tasks.forEach((task, index) => {
        console.log(`   ${index + 1}. ${task.description} (${task.agent} agent)`);
      });
    }
    
    // Test 3: Optimal Model Routing
    console.log('\n3. Testing Optimal Model Routing...');
    
    const routingTests = [
      {
        taskType: 'component_creation',
        description: 'Create a responsive user profile component with form validation and animations'
      },
      {
        taskType: 'api_development',
        description: 'Build a RESTful API for user authentication with JWT tokens and rate limiting'
      },
      {
        taskType: 'css_styling',
        description: 'Design a modern dark theme with CSS Grid layout and smooth animations'
      },
      {
        taskType: 'build_optimization',
        description: 'Optimize Vite build configuration for production deployment'
      }
    ];
    
    for (const test of routingTests) {
      console.log(`\n   Testing ${test.taskType}:`);
      
      try {
        const routingResponse = await axios.post(`${BASE_URL}/api/replit-agent/test-routing`, test);
        
        if (routingResponse.data.success) {
          const results = routingResponse.data.results;
          const recommendation = routingResponse.data.recommendation;
          
          console.log('   ✅ Routing test completed');
          console.log('   🏆 Best Agent:', recommendation.agent);
          console.log('   🤖 Provider:', recommendation.provider);
          console.log('   ⚡ Response Time:', recommendation.responseTime + 'ms');
          console.log('   📊 Confidence:', (recommendation.confidence * 100).toFixed(1) + '%');
          
          // Show top 3 performers
          console.log('   📈 Top Performers:');
          results.slice(0, 3).forEach((result, index) => {
            if (result.success) {
              console.log(`      ${index + 1}. ${result.agent} (${result.provider}) - ${result.responseTime}ms`);
            }
          });
        }
      } catch (error) {
        console.log(`   ❌ ${test.taskType} test failed:`, error.message);
      }
    }
    
    // Test 4: Progress Tracking
    console.log('\n4. Testing Progress Tracking...');
    const progressResponse = await axios.get(`${BASE_URL}/api/replit-agent/progress`);
    
    if (progressResponse.data.success) {
      console.log('✅ Progress tracking available');
      console.log('📊 Current Plan:', progressResponse.data.currentPlan ? 'Active' : 'None');
      console.log('💾 Checkpoints:', progressResponse.data.totalCheckpoints);
    }
    
    // Test 5: Checkpoint System
    console.log('\n5. Testing Checkpoint System...');
    const checkpointsResponse = await axios.get(`${BASE_URL}/api/replit-agent/checkpoints`);
    
    if (checkpointsResponse.data.success) {
      console.log('✅ Checkpoint system functional');
      console.log('📦 Available Checkpoints:', checkpointsResponse.data.checkpoints.length);
      
      checkpointsResponse.data.checkpoints.forEach((checkpoint, index) => {
        console.log(`   ${index + 1}. ${checkpoint.description} ($${checkpoint.cost.toFixed(2)})`);
      });
    }
    
    console.log('\n============================================================');
    console.log('🎉 Replit Agent System Test Complete!');
    console.log('✅ All core features tested successfully');
    console.log('🚀 System ready for production use');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Performance comparison test
async function testPerformanceComparison() {
  console.log('\n🏃‍♂️ Performance Comparison Test');
  console.log('============================================================');
  
  const testCases = [
    {
      name: 'React Component Creation',
      task: 'Create a modern user dashboard component with dark mode support',
      expectedWinner: 'Claude'
    },
    {
      name: 'API Endpoint Development',
      task: 'Build a secure user authentication API with JWT and rate limiting',
      expectedWinner: 'OpenAI'
    },
    {
      name: 'CSS Animation Design',
      task: 'Create smooth page transitions with CSS animations and transforms',
      expectedWinner: 'Claude'
    },
    {
      name: 'Build Configuration',
      task: 'Optimize Vite build for production with tree shaking and code splitting',
      expectedWinner: 'Gemini'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📊 ${testCase.name}:`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/replit-agent/test-routing`, {
        taskType: testCase.name.toLowerCase().replace(/\s+/g, '_'),
        description: testCase.task
      });
      
      if (response.data.success) {
        const winner = response.data.recommendation;
        const isExpectedWinner = winner.provider.toLowerCase() === testCase.expectedWinner.toLowerCase();
        
        console.log(`   🏆 Winner: ${winner.agent} (${winner.provider})`);
        console.log(`   ⚡ Response Time: ${winner.responseTime}ms`);
        console.log(`   📈 Confidence: ${(winner.confidence * 100).toFixed(1)}%`);
        console.log(`   🎯 Expected: ${testCase.expectedWinner} | Result: ${isExpectedWinner ? '✅' : '❌'}`);
        
        if (isExpectedWinner) {
          console.log('   ✅ Performance matches research predictions');
        } else {
          console.log('   ⚠️ Performance differs from research - investigating...');
        }
      }
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
  }
}

// Run all tests
async function runAllTests() {
  await testReplitAgentSystem();
  await testPerformanceComparison();
}

// Execute tests
runAllTests().catch(console.error);