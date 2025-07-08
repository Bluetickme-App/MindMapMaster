import fetch from 'node-fetch';

async function checkMessages() {
  try {
    const response = await fetch('http://localhost:5000/api/conversations/27/messages');
    const messages = await response.json();
    
    console.log('Total messages:', messages.length);
    
    const agentMessages = messages.filter(m => m.senderType === 'agent');
    console.log('Agent messages:', agentMessages.length);
    
    if (agentMessages.length > 0) {
      console.log('\nLatest agent message:');
      const latest = agentMessages[agentMessages.length - 1];
      console.log('From:', latest.senderId);
      console.log('Content preview:', latest.content.substring(0, 200) + '...');
    }
    
    const userMessages = messages.filter(m => m.senderType === 'user');
    if (userMessages.length > 0) {
      console.log('\nLatest user message:');
      const latest = userMessages[userMessages.length - 1];
      console.log('Content:', latest.content);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMessages();