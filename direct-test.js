// Direct test of multi-provider system
import { multiAIService } from './server/services/multi-ai-provider.js';

console.log('🧪 Testing Direct Multi-Provider System...');

async function testProviders() {
  const testPrompt = "Hello! Please introduce yourself and tell me which AI provider you are using.";
  
  console.log('\n📤 Testing OpenAI...');
  try {
    const openaiResponse = await multiAIService.generateResponse(
      'openai',
      testPrompt,
      'You are a helpful AI assistant.',
      'gpt-4o'
    );
    console.log('✅ OpenAI:', openaiResponse.content.substring(0, 100) + '...');
  } catch (error) {
    console.error('❌ OpenAI error:', error.message);
  }

  console.log('\n📤 Testing Claude...');
  try {
    const claudeResponse = await multiAIService.generateResponse(
      'claude',
      testPrompt,
      'You are a helpful AI assistant.',
      'claude-sonnet-4-20250514'
    );
    console.log('✅ Claude:', claudeResponse.content.substring(0, 100) + '...');
  } catch (error) {
    console.error('❌ Claude error:', error.message);
  }

  console.log('\n📤 Testing Gemini...');
  try {
    const geminiResponse = await multiAIService.generateResponse(
      'gemini',
      testPrompt,
      'You are a helpful AI assistant.',
      'gemini-2.5-flash'
    );
    console.log('✅ Gemini:', geminiResponse.content.substring(0, 100) + '...');
  } catch (error) {
    console.error('❌ Gemini error:', error.message);
  }
}

testProviders();