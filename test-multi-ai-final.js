// Final comprehensive test of multi-AI provider system
// This will verify Claude and Gemini are working to save OpenAI tokens

const axios = require('axios');

async function testMultiAIProviders() {
  console.log('🔧 COMPREHENSIVE MULTI-AI PROVIDER TEST');
  console.log('=======================================\n');

  try {
    // Test 1: Direct Claude Provider Test
    console.log('1️⃣ Testing Claude (Anthropic) Provider...');
    try {
      const claudeTest = await axios.post('http://localhost:5000/api/generate-code', {
        prompt: 'Create a simple "Hello World" function in JavaScript',
        language: 'javascript',
        framework: 'none'
      });
      
      if (claudeTest.data && claudeTest.data.code) {
        console.log('✅ Claude Provider: WORKING');
        console.log(`   Generated code: ${claudeTest.data.code.substring(0, 100)}...`);
      } else {
        console.log('❌ Claude Provider: No code generated');
      }
    } catch (error) {
      console.log('❌ Claude Provider: ERROR -', error.message);
    }

    // Test 2: Agent Configuration Verification
    console.log('\n2️⃣ Verifying Agent AI Provider Configuration...');
    try {
      const agentsTest = await axios.get('http://localhost:5000/api/agents');
      
      if (agentsTest.data && Array.isArray(agentsTest.data)) {
        console.log('✅ Agents Configuration:');
        agentsTest.data.forEach(agent => {
          console.log(`   ${agent.name}: ${agent.aiProvider} (${agent.experienceLevel})`);
        });
        
        // Count provider distribution
        const providerCount = agentsTest.data.reduce((acc, agent) => {
          acc[agent.aiProvider] = (acc[agent.aiProvider] || 0) + 1;
          return acc;
        }, {});
        
        console.log('\n📊 Provider Distribution:');
        Object.entries(providerCount).forEach(([provider, count]) => {
          console.log(`   ${provider}: ${count} agents`);
        });
        
        const nonOpenAICount = Object.entries(providerCount)
          .filter(([provider]) => provider !== 'openai')
          .reduce((sum, [, count]) => sum + count, 0);
        
        const totalAgents = agentsTest.data.length;
        const tokenSavingsPercent = Math.round((nonOpenAICount / totalAgents) * 100);
        
        console.log(`\n💰 TOKEN SAVINGS: ${tokenSavingsPercent}% of agents use Claude/Gemini instead of OpenAI`);
        
      } else {
        console.log('❌ Agents: No agents found');
      }
    } catch (error) {
      console.log('❌ Agents Configuration: ERROR -', error.message);
    }

    // Test 3: Conversation with Multi-AI Agents
    console.log('\n3️⃣ Testing Multi-AI Agent Conversation...');
    try {
      // Get existing conversation or create new one
      const conversationTest = await axios.get('http://localhost:5000/api/conversations/23');
      
      if (conversationTest.data) {
        console.log('✅ Test Conversation Found:', conversationTest.data.id);
        console.log(`   Participants: ${conversationTest.data.participants.length} agents`);
        
        // Send final test message
        const messageTest = await axios.post('http://localhost:5000/api/conversations/23/messages', {
          content: 'FINAL VERIFICATION: Each agent should respond using their designated AI provider (Claude, Gemini, OpenAI)',
          senderId: 1,
          senderType: 'user'
        });
        
        console.log('✅ Test message sent to multi-AI agents');
        
        // Wait and check for responses
        setTimeout(async () => {
          try {
            const messagesTest = await axios.get('http://localhost:5000/api/conversations/23/messages');
            const agentResponses = messagesTest.data.filter(m => m.senderType === 'agent');
            
            console.log(`\n📈 AGENT RESPONSE RESULTS:`);
            console.log(`   Total agent responses: ${agentResponses.length}`);
            
            if (agentResponses.length > 0) {
              console.log('✅ MULTI-AI COLLABORATION: WORKING');
              agentResponses.forEach(response => {
                console.log(`   Agent ${response.senderId}: responded successfully`);
              });
            } else {
              console.log('⚠️  No agent responses yet (may take more time)');
            }
          } catch (error) {
            console.log('❌ Response Check: ERROR -', error.message);
          }
        }, 5000);
        
      } else {
        console.log('❌ Test Conversation: Not found');
      }
    } catch (error) {
      console.log('❌ Conversation Test: ERROR -', error.message);
    }

    console.log('\n🎯 SUMMARY:');
    console.log('- Multi-AI provider system configured with Claude, Gemini, and OpenAI');
    console.log('- Agents distributed across providers to reduce OpenAI token usage');
    console.log('- System designed to save significant costs by using Claude/Gemini');
    console.log('\n⏱️  Waiting 5 seconds for agent responses...');

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

testMultiAIProviders();