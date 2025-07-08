// Test script to verify agents from all 3 providers work
const axios = require('axios');

async function testMultiProviderAgents() {
  try {
    console.log('🧪 Testing Multi-Provider Agent System...\n');
    
    // 1. Get all agents
    const agentsResponse = await axios.get('http://localhost:5000/api/agents');
    const agents = agentsResponse.data;
    
    console.log(`📋 Found ${agents.length} agents:`);
    agents.forEach(agent => {
      console.log(`  • ${agent.name} (${agent.type}) - Provider: ${agent.aiProvider || 'openai'}`);
    });
    
    // 2. Group agents by provider
    const providerGroups = {
      openai: agents.filter(a => (a.aiProvider || 'openai') === 'openai'),
      claude: agents.filter(a => a.aiProvider === 'claude'),
      gemini: agents.filter(a => a.aiProvider === 'gemini')
    };
    
    console.log('\n🔧 Provider Distribution:');
    console.log(`  OpenAI: ${providerGroups.openai.length} agents`);
    console.log(`  Claude: ${providerGroups.claude.length} agents`);
    console.log(`  Gemini: ${providerGroups.gemini.length} agents`);
    
    // 3. Create a test conversation with agents from all providers
    const testAgentIds = [
      providerGroups.openai[0]?.id,
      providerGroups.claude[0]?.id,
      providerGroups.gemini[0]?.id
    ].filter(Boolean);
    
    console.log(`\n🔗 Creating test conversation with agents: ${testAgentIds.join(', ')}`);
    
    const conversationResponse = await axios.post('http://localhost:5000/api/projects/1/team-conversation', {
      selectedAgentIds: testAgentIds
    });
    
    const conversationId = conversationResponse.data.conversationId;
    console.log(`✅ Test conversation created: ${conversationId}`);
    
    // 4. Test WebSocket connection and send a message
    console.log('\n📡 Testing WebSocket connection...');
    
    const WebSocket = require('ws');
    const ws = new WebSocket('ws://localhost:5000/ws?userId=1');
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      
      // Join conversation
      ws.send(JSON.stringify({
        type: 'join_conversation',
        conversationId,
        senderId: 1,
        senderType: 'user',
        timestamp: new Date()
      }));
      
      // Send test message after 1 second
      setTimeout(() => {
        console.log('📤 Sending test message...');
        ws.send(JSON.stringify({
          type: 'user_message',
          conversationId,
          senderId: 1,
          senderType: 'user',
          content: 'Hello! Can each AI provider please introduce themselves? This is a test to verify all providers are working.',
          timestamp: new Date()
        }));
      }, 1000);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`📨 WebSocket message: ${message.type} - ${message.content?.substring(0, 100)}...`);
      } catch (e) {
        console.log('📨 Non-JSON WebSocket message:', data.toString());
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
    
    // Close after 30 seconds
    setTimeout(() => {
      ws.close();
      console.log('\n🏁 Test completed');
      process.exit(0);
    }, 30000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMultiProviderAgents();