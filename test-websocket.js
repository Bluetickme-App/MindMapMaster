import WebSocket from 'ws';

// Test WebSocket connection and agent responses
const ws = new WebSocket('ws://localhost:5000/ws?userId=1');

ws.on('open', function open() {
  console.log('✅ WebSocket connected');
  
  // Join the conversation
  ws.send(JSON.stringify({
    type: 'join_conversation',
    conversationId: 18, // Use the conversation ID from the API response
    senderId: 1,
    senderType: 'user',
    timestamp: new Date()
  }));
  
  // Send a test message after 2 seconds
  setTimeout(() => {
    console.log('📤 Sending test message to all AI providers...');
    ws.send(JSON.stringify({
      type: 'user_message',
      conversationId: 18,
      senderId: 1,
      senderType: 'user',
      content: 'Hello! This is a test to verify all AI providers are working. Can each agent please:\n\n1. Introduce yourself with your name and specialty\n2. Mention which AI provider you use (OpenAI, Claude, or Gemini)\n3. Share one quick tip from your area of expertise\n\nThis will help verify that all 3 AI providers are responding correctly!',
      timestamp: new Date()
    }));
  }, 2000);
});

ws.on('message', function message(data) {
  try {
    const msg = JSON.parse(data.toString());
    console.log(`📨 ${msg.type}: ${msg.senderType} - ${msg.content?.substring(0, 100)}...`);
  } catch (e) {
    console.log('📨 Raw message:', data.toString());
  }
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err);
});

ws.on('close', function close() {
  console.log('🔌 WebSocket disconnected');
});

// Close after 60 seconds
setTimeout(() => {
  ws.close();
  process.exit(0);
}, 60000);