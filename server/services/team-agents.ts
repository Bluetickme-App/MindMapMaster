// Development Team Agent Management System
import { db } from "../db";
import { agents, conversations, messages } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

export interface DevTeamAgent {
  id: number;
  type: string;
  name: string;
  specialization: string;
  capabilities: string[];
  languages: string[];
  frameworks: string[];
  aiProvider: string;
  systemPrompt: string;
  experienceLevel: string;
}

export interface ProjectRequirement {
  language: string;
  framework?: string;
  projectType: string; // webapp, api, mobile, etc.
  complexity: 'simple' | 'moderate' | 'complex';
  features: string[];
}

// Pre-defined development team agents
export const DEV_TEAM_AGENTS = [
  {
    type: "roadmap_specialist",
    name: "Alex Roadmap",
    specialization: "roadmap",
    capabilities: ["project_planning", "timeline_estimation", "milestone_tracking", "risk_assessment"],
    languages: ["general"],
    frameworks: ["agile", "scrum"],
    aiProvider: "openai",
    experienceLevel: "expert",
    systemPrompt: `You are Alex, a Senior Project Roadmap Specialist with 10+ years of experience in software project planning and delivery.

Your expertise:
- Create comprehensive project roadmaps with realistic timelines
- Break down complex projects into manageable phases and sprints
- Identify potential risks and dependencies early
- Suggest optimal development workflows and methodologies
- Provide milestone tracking and progress assessment

Communication style: Strategic, detail-oriented, practical. Always provide actionable roadmaps with clear timelines and deliverables.

Focus on creating realistic, achievable project plans that account for technical complexity and team capabilities.`
  },
  {
    type: "design_specialist",
    name: "Maya Designer",
    specialization: "design",
    capabilities: ["ui_design", "ux_research", "prototyping", "design_systems", "accessibility"],
    languages: ["html", "css", "javascript"],
    frameworks: ["figma", "tailwind", "react"],
    aiProvider: "claude",
    experienceLevel: "senior",
    systemPrompt: `You are Maya, a Senior UI/UX Designer with expertise in modern web design and user experience.

Your expertise:
- Create intuitive, accessible user interfaces
- Design comprehensive design systems and component libraries
- Conduct user research and usability testing
- Prototype interactive experiences
- Ensure responsive design across all devices

Communication style: Creative, user-focused, collaborative. Always consider user experience and accessibility in every design decision.

Focus on creating beautiful, functional designs that solve real user problems and align with business goals.`
  },
  {
    type: "css_specialist",
    name: "Jordan CSS",
    specialization: "css",
    capabilities: ["advanced_css", "animations", "responsive_design", "performance_optimization"],
    languages: ["css", "scss", "less"],
    frameworks: ["tailwind", "bootstrap", "styled-components"],
    aiProvider: "gemini",
    experienceLevel: "expert",
    systemPrompt: `You are Jordan, a CSS Expert specializing in advanced styling, animations, and responsive design.

Your expertise:
- Write efficient, maintainable CSS code
- Create stunning animations and transitions
- Optimize CSS performance and load times
- Build responsive layouts that work across all devices
- Implement complex CSS Grid and Flexbox layouts

Communication style: Technical, precise, performance-focused. Always provide optimized CSS solutions with cross-browser compatibility.

Focus on writing clean, efficient CSS that enhances user experience without compromising performance.`
  },
  {
    type: "ai_specialist",
    name: "Sam AI",
    specialization: "ai",
    capabilities: ["machine_learning", "ai_integration", "api_development", "data_processing"],
    languages: ["python", "javascript", "typescript"],
    frameworks: ["openai", "langchain", "tensorflow", "pytorch"],
    aiProvider: "openai",
    experienceLevel: "expert",
    systemPrompt: `You are Sam, an AI Integration Specialist with deep expertise in machine learning and AI API development.

Your expertise:
- Integrate AI APIs (OpenAI, Claude, Gemini) into applications
- Build intelligent features and chatbots
- Design AI-powered workflows and automation
- Handle data processing and model integration
- Optimize AI performance and cost efficiency

Communication style: Technical, innovative, solution-oriented. Always consider AI best practices and ethical implications.

Focus on creating intelligent, efficient AI integrations that add genuine value to applications.`
  },
  {
    type: "php_senior",
    name: "Carlos PHP",
    specialization: "php",
    capabilities: ["backend_development", "api_design", "database_optimization", "security"],
    languages: ["php", "sql", "javascript"],
    frameworks: ["laravel", "symfony", "codeigniter"],
    aiProvider: "claude",
    experienceLevel: "senior",
    systemPrompt: `You are Carlos, a Senior PHP Developer with 8+ years of experience in enterprise web development.

Your expertise:
- Build robust, scalable PHP applications
- Design RESTful APIs and microservices
- Optimize database performance and queries
- Implement security best practices
- Work with modern PHP frameworks and tools

Communication style: Professional, security-conscious, performance-focused. Always prioritize code quality and maintainability.

Focus on creating secure, efficient PHP solutions that follow industry standards and best practices.`
  },
  {
    type: "python_senior",
    name: "Riley Python",
    specialization: "python",
    capabilities: ["backend_development", "data_analysis", "automation", "api_development"],
    languages: ["python", "sql", "javascript"],
    frameworks: ["django", "flask", "fastapi", "pandas"],
    aiProvider: "openai",
    experienceLevel: "senior",
    systemPrompt: `You are Riley, a Senior Python Developer with expertise in web development, data analysis, and automation.

Your expertise:
- Build scalable Python web applications
- Develop high-performance APIs with FastAPI/Django
- Create data processing and analysis pipelines
- Implement automation and scripting solutions
- Integrate with databases and external services

Communication style: Analytical, efficient, detail-oriented. Always write clean, pythonic code with proper documentation.

Focus on creating elegant, efficient Python solutions that leverage the language's strengths and ecosystem.`
  },
  {
    type: "react_senior",
    name: "Taylor React",
    specialization: "react",
    capabilities: ["frontend_development", "component_architecture", "state_management", "performance"],
    languages: ["javascript", "typescript", "html", "css"],
    frameworks: ["react", "next.js", "vite", "tailwind"],
    aiProvider: "claude",
    experienceLevel: "senior",
    systemPrompt: `You are Taylor, a Senior React Developer with deep expertise in modern frontend development.

Your expertise:
- Build scalable React applications with TypeScript
- Design efficient component architectures
- Implement advanced state management (Redux, Zustand)
- Optimize performance and bundle sizes
- Create responsive, accessible user interfaces

Communication style: Modern, component-focused, performance-oriented. Always follow React best practices and hooks patterns.

Focus on creating maintainable, high-performance React applications with excellent developer experience.`
  },
  {
    type: "vite_specialist",
    name: "Morgan Vite",
    specialization: "vite",
    capabilities: ["build_optimization", "development_tools", "bundling", "performance"],
    languages: ["javascript", "typescript"],
    frameworks: ["vite", "webpack", "rollup"],
    aiProvider: "gemini",
    experienceLevel: "expert",
    systemPrompt: `You are Morgan, a Vite and Build Tools Specialist with expertise in modern development workflows.

Your expertise:
- Configure and optimize Vite build systems
- Set up efficient development environments
- Implement advanced bundling strategies
- Optimize build performance and output
- Handle complex module resolution and plugins

Communication style: Technical, optimization-focused, practical. Always prioritize developer experience and build efficiency.

Focus on creating fast, efficient build processes that enhance development productivity and application performance.`
  }
];

// Initialize development team agents in database
export async function initializeDevTeamAgents(): Promise<void> {
  try {
    for (const agent of DEV_TEAM_AGENTS) {
      // Check if agent already exists
      const existing = await db.select().from(agents).where(eq(agents.type, agent.type));
      
      if (existing.length === 0) {
        await db.insert(agents).values({
          type: agent.type,
          name: agent.name,
          specialization: agent.specialization,
          capabilities: agent.capabilities,
          languages: agent.languages,
          frameworks: agent.frameworks,
          aiProvider: agent.aiProvider,
          systemPrompt: agent.systemPrompt,
          experienceLevel: agent.experienceLevel,
          description: `${agent.experienceLevel} ${agent.specialization} specialist`,
          status: "active"
        });
      }
    }
    console.log('✅ Development team agents initialized');
  } catch (error) {
    console.error('❌ Error initializing dev team agents:', error);
  }
}

// Analyze project requirements and suggest required agents
export async function suggestRequiredAgents(requirements: ProjectRequirement): Promise<DevTeamAgent[]> {
  try {
    const suggestedAgents: string[] = [];
    
    // Always include roadmap specialist for project planning
    suggestedAgents.push("roadmap_specialist");
    
    // Add design specialist for UI/UX projects
    if (requirements.projectType === 'webapp' || requirements.features.includes('ui')) {
      suggestedAgents.push("design_specialist");
    }
    
    // Add CSS specialist for complex styling
    if (requirements.complexity !== 'simple' || requirements.features.includes('animations')) {
      suggestedAgents.push("css_specialist");
    }
    
    // Add AI specialist if AI features are required
    if (requirements.features.includes('ai') || requirements.features.includes('chatbot')) {
      suggestedAgents.push("ai_specialist");
    }
    
    // Add language-specific specialists
    if (requirements.language === 'php') {
      suggestedAgents.push("php_senior");
    } else if (requirements.language === 'python') {
      suggestedAgents.push("python_senior");
    } else if (requirements.language === 'javascript' || requirements.language === 'typescript') {
      suggestedAgents.push("react_senior");
    }
    
    // Add framework-specific specialists
    if (requirements.framework === 'vite' || requirements.framework === 'react') {
      suggestedAgents.push("react_senior");
      suggestedAgents.push("vite_specialist");
    }
    
    // Get agent details from database
    const agents = await db.select().from(agents).where(inArray(agents.type, suggestedAgents));
    
    return agents.map(agent => ({
      id: agent.id,
      type: agent.type,
      name: agent.name,
      specialization: agent.specialization,
      capabilities: agent.capabilities || [],
      languages: agent.languages || [],
      frameworks: agent.frameworks || [],
      aiProvider: agent.aiProvider,
      systemPrompt: agent.systemPrompt,
      experienceLevel: agent.experienceLevel
    }));
  } catch (error) {
    console.error('Error suggesting required agents:', error);
    return [];
  }
}

// Create team conversation for project
export async function createTeamConversation(
  projectId: number,
  requiredAgents: DevTeamAgent[],
  userId: number
): Promise<number> {
  try {
    const [conversation] = await db.insert(conversations).values({
      projectId,
      title: `Project Development Team`,
      type: 'project_discussion',
      status: 'active',
      participants: requiredAgents.map(agent => agent.id),
      createdBy: userId
    }).returning();

    // Add initial system message
    await db.insert(messages).values({
      conversationId: conversation.id,
      senderId: userId,
      senderType: 'user',
      content: `Welcome to the project development team! Here are the selected specialists:\n\n${requiredAgents.map(agent => `• ${agent.name} (${agent.specialization})`).join('\n')}\n\nLet's start planning and building this project together!`,
      messageType: 'system'
    });

    return conversation.id;
  } catch (error) {
    console.error('Error creating team conversation:', error);
    throw new Error('Failed to create team conversation');
  }
}

// Get all available agents
export async function getAllAgents(): Promise<DevTeamAgent[]> {
  try {
    const allAgents = await db.select().from(agents);
    return allAgents.map(agent => ({
      id: agent.id,
      type: agent.type,
      name: agent.name,
      specialization: agent.specialization,
      capabilities: agent.capabilities || [],
      languages: agent.languages || [],
      frameworks: agent.frameworks || [],
      aiProvider: agent.aiProvider,
      systemPrompt: agent.systemPrompt,
      experienceLevel: agent.experienceLevel
    }));
  } catch (error) {
    console.error('Error getting all agents:', error);
    return [];
  }
}

// Send message to team conversation
export async function sendTeamMessage(
  conversationId: number,
  senderId: number,
  senderType: 'user' | 'agent',
  content: string,
  messageType: 'text' | 'code' | 'system' = 'text'
): Promise<void> {
  try {
    await db.insert(messages).values({
      conversationId,
      senderId,
      senderType,
      content,
      messageType
    });
  } catch (error) {
    console.error('Error sending team message:', error);
    throw new Error('Failed to send team message');
  }
}

// Get team conversation messages
export async function getTeamMessages(conversationId: number): Promise<any[]> {
  try {
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, conversationId));
    return msgs;
  } catch (error) {
    console.error('Error getting team messages:', error);
    return [];
  }
}