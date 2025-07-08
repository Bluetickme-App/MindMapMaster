// Direct test of multi-AI providers without going through Express routes
const { multiAIService } = require('./server/services/multi-ai-provider.js');

async function testProviders() {
  console.log('🧪 Testing Multi-AI Providers Directly...\n');

  const testMessage = "Hello! Please introduce yourself and mention which AI provider you are using.";
  
  // Test Claude (should save OpenAI tokens)
  console.log('🤖 Testing Claude Provider...');
  try {
    const claudeResponse = await multiAIService.generateResponse(
      'claude',
      testMessage,
      'You are a helpful AI assistant. Please introduce yourself and mention that you are powered by Claude.',
      'claude-sonnet-4-20250514'
    );
    console.log('✅ Claude Success:', claudeResponse.content.substring(0, 100) + '...');
    console.log('   Provider:', claudeResponse.provider);
    console.log('   Model:', claudeResponse.model);
    console.log('   Tokens:', claudeResponse.tokenUsage);
  } catch (error) {
    console.log('❌ Claude Failed:', error.message);
  }

  console.log('\n🤖 Testing Gemini Provider...');
  try {
    const geminiResponse = await multiAIService.generateResponse(
      'gemini',
      testMessage,
      'You are a helpful AI assistant. Please introduce yourself and mention that you are powered by Gemini.',
      'gemini-2.5-flash'
    );
    console.log('✅ Gemini Success:', geminiResponse.content.substring(0, 100) + '...');
    console.log('   Provider:', geminiResponse.provider);
    console.log('   Model:', geminiResponse.model);
    console.log('   Tokens:', geminiResponse.tokenUsage);
  } catch (error) {
    console.log('❌ Gemini Failed:', error.message);
  }

  console.log('\n🤖 Testing OpenAI Provider (should only use when necessary)...');
  try {
    const openaiResponse = await multiAIService.generateResponse(
      'openai',
      testMessage,
      'You are a helpful AI assistant. Please introduce yourself and mention that you are powered by OpenAI.',
      'gpt-4o'
    );
    console.log('✅ OpenAI Success:', openaiResponse.content.substring(0, 100) + '...');
    console.log('   Provider:', openaiResponse.provider);
    console.log('   Model:', openaiResponse.model);
    console.log('   Tokens:', openaiResponse.tokenUsage);
  } catch (error) {
    console.log('❌ OpenAI Failed:', error.message);
  }

  console.log('\n🎯 Provider Test Complete!');
}

testProviders().catch(console.error);