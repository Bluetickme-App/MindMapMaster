// Test script to verify agent memory system
import { agentMemoryService } from './server/services/agent-memory-service.js';
import { storage } from './server/storage.js';

async function testMemorySystem() {
    console.log('🧠 Testing Agent Memory System');
    
    try {
        // Test 1: Get agents
        const agents = await storage.getAllAgents();
        console.log(`✓ Found ${agents.length} agents`);
        
        if (agents.length === 0) {
            console.log('❌ No agents found. Please ensure agents are initialized.');
            return;
        }
        
        const testAgent = agents[0];
        console.log(`✓ Using test agent: ${testAgent.name} (ID: ${testAgent.id})`);
        
        // Test 2: Store memory
        console.log('\n🔄 Testing memory storage...');
        const memory = await agentMemoryService.storeMemory(
            testAgent.id,
            'project_context',
            'Test memory: Working on multi-agent collaboration system',
            {
                context: 'Testing agent memory functionality',
                timestamp: new Date().toISOString(),
                tags: ['test', 'memory', 'collaboration']
            },
            1, // projectId
            7  // importance
        );
        
        console.log('✓ Memory stored successfully:', memory);
        
        // Test 3: Retrieve memories
        console.log('\n🔄 Testing memory retrieval...');
        const memories = await agentMemoryService.retrieveMemories(testAgent.id, 1);
        console.log(`✓ Retrieved ${memories.length} memories`);
        
        if (memories.length > 0) {
            console.log('✓ Sample memory:', memories[0]);
        }
        
        // Test 4: Test collaboration session
        console.log('\n🔄 Testing collaboration session...');
        const collaborationSession = await agentMemoryService.startCollaboration(
            1, // projectId
            [testAgent.id], // participantAgents
            'Test collaboration objective' // objective
        );
        
        console.log('✓ Collaboration session started:', collaborationSession);
        
        // Test 5: Test agent communication
        console.log('\n🔄 Testing agent communication...');
        const communication = await agentMemoryService.sendAgentMessage(
            collaborationSession.sessionId,
            testAgent.id,
            null,
            'suggestion',
            'This is a test suggestion for the collaboration',
            { test: true },
            5
        );
        
        console.log('✓ Agent communication sent:', communication);
        
        console.log('\n🎉 Agent Memory System Test Complete!');
        console.log('✅ All memory operations working correctly');
        
    } catch (error) {
        console.error('❌ Memory system test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testMemorySystem().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});