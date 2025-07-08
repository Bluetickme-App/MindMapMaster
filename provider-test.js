// Quick test of individual providers
const testProviders = async () => {
  const tests = [
    { provider: 'openai', url: 'http://localhost:5000/api/test-multi-provider' },
    { provider: 'claude', url: 'http://localhost:5000/api/test-multi-provider' },
    { provider: 'gemini', url: 'http://localhost:5000/api/test-multi-provider' }
  ];

  for (const test of tests) {
    try {
      const response = await fetch(test.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Hello! I'm testing the ${test.provider} integration.`,
          providers: [test.provider]
        })
      });
      
      const result = await response.json();
      console.log(`\n${test.provider.toUpperCase()} Test:`, result);
    } catch (error) {
      console.error(`${test.provider} failed:`, error.message);
    }
  }
};

testProviders();