#!/usr/bin/env node

import axios from 'axios';
const baseURL = 'http://localhost:5000';

// Test Claude 4.0 Sonnet-level agent capabilities
async function testClaudeAgents() {
  console.log('🧪 Testing Claude 4.0 Sonnet-level Agent Capabilities');
  console.log('=' .repeat(60));

  try {
    // Test 1: Get all available agents
    console.log('\n1. Testing Agent Discovery...');
    const agentsResponse = await axios.get(`${baseURL}/api/agents`);
    const agents = agentsResponse.data;
    
    console.log(`✅ Found ${agents.length} agents:`);
    agents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.specialization}) - ${agent.aiProvider || 'openai'}`);
    });

    // Test 2: Find a Claude agent for advanced testing
    const claudeAgent = agents.find(agent => agent.aiProvider === 'claude');
    const openAIAgent = agents.find(agent => agent.aiProvider === 'openai');
    
    if (claudeAgent) {
      console.log(`\n2. Testing Claude Agent: ${claudeAgent.name}`);
      await testAgentReasoning(claudeAgent);
    } else {
      console.log('\n2. No Claude agents found, testing OpenAI agent with enhanced capabilities');
      if (openAIAgent) {
        await testAgentReasoning(openAIAgent);
      }
    }

    // Test 3: Test multi-agent collaboration
    console.log('\n3. Testing Multi-Agent Collaboration...');
    await testMultiAgentCollaboration(agents);

    // Test 4: Test memory and context awareness
    console.log('\n4. Testing Memory and Context Awareness...');
    await testMemorySystem(agents[0]);

    // Test 5: Test chain of thought reasoning
    console.log('\n5. Testing Chain of Thought Reasoning...');
    await testChainOfThought(agents[0]);

    console.log('\n✅ All Claude 4.0 Sonnet-level tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

async function testAgentReasoning(agent) {
  console.log(`\n   Testing advanced reasoning with ${agent.name}...`);
  
  // Create a conversation
  const conversationResponse = await axios.post(`${baseURL}/api/conversations`, {
    title: `Claude Reasoning Test - ${agent.name}`,
    type: 'project_discussion',
    participants: [agent.id]
  });
  
  const conversationId = conversationResponse.data.id;
  
  // Test complex reasoning task
  const complexQuery = `I need to build a secure authentication system for a React app. 
  Can you analyze the security requirements, suggest a complete architecture, 
  and provide step-by-step implementation guidance? Consider OAuth2, JWT tokens, 
  session management, and potential security vulnerabilities.`;
  
  const messageResponse = await axios.post(`${baseURL}/api/conversations/${conversationId}/messages`, {
    content: complexQuery,
    senderType: 'user',
    senderId: 1
  });
  
  console.log(`   📝 Sent complex reasoning query to ${agent.name}`);
  
  // Wait for agent response
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Get messages to see the response
  const messagesResponse = await axios.get(`${baseURL}/api/conversations/${conversationId}/messages`);
  const messages = messagesResponse.data;
  
  const agentResponse = messages.find(msg => msg.senderId === agent.id);
  
  if (agentResponse) {
    console.log(`   ✅ ${agent.name} provided detailed response (${agentResponse.content.length} chars)`);
    console.log(`   📊 Response preview: "${agentResponse.content.substring(0, 200)}..."`);
    
    // Analyze response quality
    const hasStructuredThinking = agentResponse.content.includes('step') || 
                                  agentResponse.content.includes('Step') ||
                                  agentResponse.content.includes('1.') ||
                                  agentResponse.content.includes('First');
    
    const hasSecurityConsiderations = agentResponse.content.toLowerCase().includes('security') ||
                                     agentResponse.content.toLowerCase().includes('vulnerability');
    
    const hasTechnicalDepth = agentResponse.content.length > 500;
    
    console.log(`   📈 Analysis: Structured thinking: ${hasStructuredThinking ? '✅' : '❌'}`);
    console.log(`   📈 Analysis: Security awareness: ${hasSecurityConsiderations ? '✅' : '❌'}`);
    console.log(`   📈 Analysis: Technical depth: ${hasTechnicalDepth ? '✅' : '❌'}`);
  } else {
    console.log(`   ❌ No response from ${agent.name}`);
  }
}

async function testMultiAgentCollaboration(agents) {
  console.log('\n   Testing multi-agent collaboration...');
  
  // Create team conversation with multiple agents
  const teamResponse = await axios.post(`${baseURL}/api/conversations`, {
    title: 'Team Collaboration Test',
    type: 'team_discussion',
    participants: agents.slice(0, 3).map(agent => agent.id) // First 3 agents
  });
  
  const conversationId = teamResponse.data.id;
  
  // Send a collaborative task
  const teamQuery = `Team, I need to build a modern e-commerce platform. 
  Can you collaborate to create a comprehensive plan? I need:
  - System architecture recommendations
  - UI/UX design guidelines  
  - Security considerations
  - Performance optimization strategies`;
  
  await axios.post(`${baseURL}/api/conversations/${conversationId}/messages`, {
    content: teamQuery,
    senderType: 'user',
    senderId: 1
  });
  
  console.log('   📝 Sent team collaboration task');
  
  // Wait for multiple agent responses
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  // Check responses
  const messagesResponse = await axios.get(`${baseURL}/api/conversations/${conversationId}/messages`);
  const messages = messagesResponse.data;
  
  const agentResponses = messages.filter(msg => msg.senderType === 'agent');
  
  console.log(`   ✅ Received ${agentResponses.length} agent responses`);
  agentResponses.forEach(response => {
    const agent = agents.find(a => a.id === response.senderId);
    console.log(`   - ${agent?.name || 'Unknown'}: ${response.content.substring(0, 100)}...`);
  });
}

async function testMemorySystem(agent) {
  console.log(`\n   Testing memory system with ${agent.name}...`);
  
  // Create a conversation
  const conversationResponse = await axios.post(`${baseURL}/api/conversations`, {
    title: 'Memory Test Conversation',
    type: 'project_discussion',
    participants: [agent.id]
  });
  
  const conversationId = conversationResponse.data.id;
  
  // First interaction - establish context
  await axios.post(`${baseURL}/api/conversations/${conversationId}/messages`, {
    content: 'I am working on a project called "TaskFlow" - a task management system built with React and Node.js.',
    senderType: 'user',
    senderId: 1
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Second interaction - test memory recall
  await axios.post(`${baseURL}/api/conversations/${conversationId}/messages`, {
    content: 'Can you remind me what project we were discussing and suggest improvements?',
    senderType: 'user',
    senderId: 1
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check if agent remembered the context
  const messagesResponse = await axios.get(`${baseURL}/api/conversations/${conversationId}/messages`);
  const messages = messagesResponse.data;
  
  const lastAgentResponse = messages.filter(msg => msg.senderId === agent.id).pop();
  
  if (lastAgentResponse) {
    const rememberedProject = lastAgentResponse.content.toLowerCase().includes('taskflow') ||
                             lastAgentResponse.content.toLowerCase().includes('task management');
    
    console.log(`   📊 Memory recall: ${rememberedProject ? '✅ Remembered project context' : '❌ Lost context'}`);
    console.log(`   📝 Response: "${lastAgentResponse.content.substring(0, 150)}..."`);
  }
}

async function testChainOfThought(agent) {
  console.log(`\n   Testing chain of thought reasoning with ${agent.name}...`);
  
  // Create a conversation
  const conversationResponse = await axios.post(`${baseURL}/api/conversations`, {
    title: 'Chain of Thought Test',
    type: 'project_discussion',
    participants: [agent.id]
  });
  
  const conversationId = conversationResponse.data.id;
  
  // Complex problem requiring step-by-step thinking
  const problemQuery = `I have a performance issue in my React app. The component tree is re-rendering 
  excessively, causing lag. The app has nested components, Redux state management, and API calls. 
  Can you diagnose the issue and provide a solution? Please walk me through your thinking process.`;
  
  await axios.post(`${baseURL}/api/conversations/${conversationId}/messages`, {
    content: problemQuery,
    senderType: 'user',
    senderId: 1
  });
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Analyze the response for step-by-step thinking
  const messagesResponse = await axios.get(`${baseURL}/api/conversations/${conversationId}/messages`);
  const messages = messagesResponse.data;
  
  const agentResponse = messages.find(msg => msg.senderId === agent.id);
  
  if (agentResponse) {
    const hasSteps = (agentResponse.content.match(/step|Step|1\.|2\.|3\.|first|second|third|next|then|finally/gi) || []).length > 3;
    const hasAnalysis = agentResponse.content.toLowerCase().includes('analyze') || 
                       agentResponse.content.toLowerCase().includes('consider') ||
                       agentResponse.content.toLowerCase().includes('examine');
    
    console.log(`   📊 Chain of thought: ${hasSteps ? '✅ Structured thinking' : '❌ Unstructured'}`);
    console.log(`   📊 Analysis approach: ${hasAnalysis ? '✅ Analytical' : '❌ Direct answer'}`);
    console.log(`   📝 Response length: ${agentResponse.content.length} characters`);
  }
}

// Run the tests
testClaudeAgents().catch(console.error);

export { testClaudeAgents };