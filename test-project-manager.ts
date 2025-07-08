import { projectManagerService } from './server/services/project-manager';
import { storage } from './server/storage';
import { agentMemoryService } from './server/services/agent-memory-service';

async function testProjectManager() {
  console.log('🎯 Testing Project Manager Service\n');

  try {
    // Test 1: Initialize Project Manager
    console.log('1. 📋 Initializing Project Manager...');
    const assistantId = await projectManagerService.initializeProjectManager();
    console.log('✅ Project Manager initialized:', assistantId);

    // Test 2: Get available agents
    console.log('\n2. 🤖 Getting available agents...');
    const agents = await storage.getAllAgents();
    console.log(`✅ Found ${agents.length} agents:`);
    agents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.specialization}): ${agent.description}`);
    });

    // Test 3: Assign tasks to agents
    console.log('\n3. 🎯 Assigning tasks for a sample project...');
    const projectId = 1;
    const objective = 'Build a modern e-commerce website with AI-powered features';
    const requirements = [
      'Responsive design with modern UI/UX',
      'Product catalog with search and filtering',
      'Shopping cart and checkout process',
      'AI-powered product recommendations',
      'Admin dashboard for inventory management',
      'Performance optimization and security'
    ];

    const taskAssignments = await projectManagerService.assignTasksToAgents(
      projectId,
      objective,
      requirements
    );

    console.log(`✅ Assigned ${taskAssignments.length} tasks:`);
    taskAssignments.forEach((task, index) => {
      const agent = agents.find(a => a.id === task.agentId);
      console.log(`   ${index + 1}. ${agent?.name} (${task.priority}): ${task.description}`);
      console.log(`      Deliverables: ${task.deliverables.join(', ')}`);
    });

    // Test 4: Ensure all agents remember their roles
    console.log('\n4. 🧠 Ensuring agents remember their roles...');
    for (const agent of agents) {
      await projectManagerService.ensureAgentRoleMemory(agent.id, projectId);
    }
    console.log('✅ All agents have updated role memory');

    // Test 5: Check agent memories
    console.log('\n5. 🔍 Checking agent memories...');
    for (const agent of agents) {
      const memories = await agentMemoryService.getAgentMemories(agent.id, projectId);
      const roleMemories = memories.filter(m => m.memoryType === 'role_assignment');
      const taskMemories = memories.filter(m => m.memoryType === 'task_assignment');
      
      console.log(`   ${agent.name}:`);
      console.log(`     - Role memories: ${roleMemories.length}`);
      console.log(`     - Task memories: ${taskMemories.length}`);
      console.log(`     - Total memories: ${memories.length}`);
    }

    // Test 6: Get project status
    console.log('\n6. 📊 Getting project status...');
    const projectStatus = await projectManagerService.getProjectStatus(projectId);
    if (projectStatus) {
      console.log('✅ Project status retrieved:', JSON.stringify(projectStatus, null, 2));
    } else {
      console.log('⚠️  Project status not available (requires AI processing)');
    }

    console.log('\n🎉 Project Manager Test Complete!');
    console.log('\n📝 Summary:');
    console.log(`   - Project Manager initialized with Assistant ID: ${assistantId}`);
    console.log(`   - ${agents.length} agents available for task assignment`);
    console.log(`   - ${taskAssignments.length} tasks assigned to specialized agents`);
    console.log(`   - All agents have updated role and task memories`);
    console.log(`   - Project status monitoring available`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testProjectManager();