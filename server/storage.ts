import { 
  users, projects, codeGenerations, apiTests, githubRepositories,
  agents, conversations, messages, agentSessions, agentKnowledge, agentMemory,
  collaborativeDocuments, designAssets, workflowTasks,
  type User, type InsertUser, type Project, type InsertProject,
  type CodeGeneration, type InsertCodeGeneration, type ApiTest, type InsertApiTest,
  type GithubRepository, type InsertGithubRepository,
  type Agent, type InsertAgent, type Conversation, type InsertConversation,
  type Message, type InsertMessage, type AgentSession, type InsertAgentSession,
  type AgentKnowledge, type InsertAgentKnowledge, type CollaborativeDocument, type InsertCollaborativeDocument,
  type DesignAsset, type InsertDesignAsset, type WorkflowTask, type InsertWorkflowTask
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;

  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Code generation operations
  getCodeGeneration(id: number): Promise<CodeGeneration | undefined>;
  getCodeGenerationsByUser(userId: number): Promise<CodeGeneration[]>;
  getCodeGenerationsByProject(projectId: number): Promise<CodeGeneration[]>;
  createCodeGeneration(generation: InsertCodeGeneration): Promise<CodeGeneration>;

  // API test operations
  getApiTest(id: number): Promise<ApiTest | undefined>;
  getApiTestsByUser(userId: number): Promise<ApiTest[]>;
  createApiTest(test: InsertApiTest): Promise<ApiTest>;
  updateApiTest(id: number, test: Partial<InsertApiTest>): Promise<ApiTest>;
  deleteApiTest(id: number): Promise<void>;

  // GitHub repository operations
  getGithubRepository(id: number): Promise<GithubRepository | undefined>;
  getGithubRepositoriesByUser(userId: number): Promise<GithubRepository[]>;
  createGithubRepository(repo: InsertGithubRepository): Promise<GithubRepository>;
  updateGithubRepository(id: number, repo: Partial<InsertGithubRepository>): Promise<GithubRepository>;
  deleteGithubRepository(id: number): Promise<void>;

  // Multi-Agent System operations
  // Agent operations
  getAgent(id: number): Promise<Agent | undefined>;
  getAllAgents(): Promise<Agent[]>;
  getAgentByName(name: string): Promise<Agent | undefined>;
  getAgentsByType(type: string): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, agent: Partial<InsertAgent>): Promise<Agent>;
  updateAgentStatus(id: number, status: string): Promise<Agent>;

  // Conversation operations
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByProject(projectId: number): Promise<Conversation[]>;
  getConversationsByParticipant(participantId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation>;
  addParticipantToConversation(conversationId: number, participantId: number): Promise<void>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  getMessageThread(parentMessageId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<InsertMessage>): Promise<Message>;
  addReactionToMessage(messageId: number, reaction: string, userId: number): Promise<void>;

  // Agent Session operations
  getAgentSession(id: number): Promise<AgentSession | undefined>;
  getAgentSessionsByProject(projectId: number): Promise<AgentSession[]>;
  getActiveAgentSessions(): Promise<AgentSession[]>;
  createAgentSession(session: InsertAgentSession): Promise<AgentSession>;
  updateAgentSession(id: number, session: Partial<InsertAgentSession>): Promise<AgentSession>;
  endAgentSession(id: number, outcomes: string[]): Promise<AgentSession>;

  // Agent Knowledge operations
  getAgentKnowledge(id: number): Promise<AgentKnowledge | undefined>;
  getAgentKnowledgeByAgent(agentId: number): Promise<AgentKnowledge[]>;
  getAgentKnowledgeByProject(projectId: number): Promise<AgentKnowledge[]>;
  searchAgentKnowledge(query: string, agentId?: number): Promise<AgentKnowledge[]>;
  createAgentKnowledge(knowledge: InsertAgentKnowledge): Promise<AgentKnowledge>;
  updateAgentKnowledge(id: number, knowledge: Partial<InsertAgentKnowledge>): Promise<AgentKnowledge>;

  // Agent Memory operations
  createAgentMemory(memory: { agentId: number; projectId?: number | null; memoryType: string; summary: string; details: any; importance?: number; }): Promise<any>;

  // Collaborative Document operations
  getCollaborativeDocument(id: number): Promise<CollaborativeDocument | undefined>;
  getCollaborativeDocumentsByProject(projectId: number): Promise<CollaborativeDocument[]>;
  createCollaborativeDocument(document: InsertCollaborativeDocument): Promise<CollaborativeDocument>;
  updateCollaborativeDocument(id: number, document: Partial<InsertCollaborativeDocument>): Promise<CollaborativeDocument>;
  lockDocument(id: number, userId: number): Promise<CollaborativeDocument>;
  unlockDocument(id: number): Promise<CollaborativeDocument>;

  // Design Asset operations
  getDesignAsset(id: number): Promise<DesignAsset | undefined>;
  getDesignAssetsByProject(projectId: number): Promise<DesignAsset[]>;
  getDesignAssetsByType(assetType: string): Promise<DesignAsset[]>;
  createDesignAsset(asset: InsertDesignAsset): Promise<DesignAsset>;
  updateDesignAsset(id: number, asset: Partial<InsertDesignAsset>): Promise<DesignAsset>;
  approveDesignAsset(id: number, approvedBy: number): Promise<DesignAsset>;

  // Workflow Task operations
  getWorkflowTask(id: number): Promise<WorkflowTask | undefined>;
  getWorkflowTasksByProject(projectId: number): Promise<WorkflowTask[]>;
  getWorkflowTasksByAgent(agentId: number): Promise<WorkflowTask[]>;
  getWorkflowTasksByStatus(status: string): Promise<WorkflowTask[]>;
  createWorkflowTask(task: InsertWorkflowTask): Promise<WorkflowTask>;
  updateWorkflowTask(id: number, task: Partial<InsertWorkflowTask>): Promise<WorkflowTask>;
  assignTask(taskId: number, agentId: number): Promise<WorkflowTask>;
  completeTask(taskId: number, actualHours?: number): Promise<WorkflowTask>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: number, updateData: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getCodeGeneration(id: number): Promise<CodeGeneration | undefined> {
    const [generation] = await db.select().from(codeGenerations).where(eq(codeGenerations.id, id));
    return generation || undefined;
  }

  async getCodeGenerationsByUser(userId: number): Promise<CodeGeneration[]> {
    return await db.select().from(codeGenerations).where(eq(codeGenerations.userId, userId));
  }

  async getCodeGenerationsByProject(projectId: number): Promise<CodeGeneration[]> {
    const generations = await db.select().from(codeGenerations).where(eq(codeGenerations.projectId, projectId));
    return generations;
  }

  async createCodeGeneration(insertGeneration: InsertCodeGeneration): Promise<CodeGeneration> {
    const [generation] = await db
      .insert(codeGenerations)
      .values(insertGeneration)
      .returning();
    return generation;
  }

  async getApiTest(id: number): Promise<ApiTest | undefined> {
    const [test] = await db.select().from(apiTests).where(eq(apiTests.id, id));
    return test || undefined;
  }

  async getApiTestsByUser(userId: number): Promise<ApiTest[]> {
    return await db.select().from(apiTests).where(eq(apiTests.userId, userId));
  }

  async createApiTest(insertTest: InsertApiTest): Promise<ApiTest> {
    const [test] = await db
      .insert(apiTests)
      .values(insertTest)
      .returning();
    return test;
  }

  async updateApiTest(id: number, updateData: Partial<InsertApiTest>): Promise<ApiTest> {
    const [test] = await db
      .update(apiTests)
      .set(updateData)
      .where(eq(apiTests.id, id))
      .returning();
    return test;
  }

  async deleteApiTest(id: number): Promise<void> {
    await db.delete(apiTests).where(eq(apiTests.id, id));
  }

  async getGithubRepository(id: number): Promise<GithubRepository | undefined> {
    const [repo] = await db.select().from(githubRepositories).where(eq(githubRepositories.id, id));
    return repo || undefined;
  }

  async getGithubRepositoriesByUser(userId: number): Promise<GithubRepository[]> {
    return await db.select().from(githubRepositories).where(eq(githubRepositories.userId, userId));
  }

  async createGithubRepository(insertRepo: InsertGithubRepository): Promise<GithubRepository> {
    const [repo] = await db
      .insert(githubRepositories)
      .values(insertRepo)
      .returning();
    return repo;
  }

  async updateGithubRepository(id: number, updateData: Partial<InsertGithubRepository>): Promise<GithubRepository> {
    const [repo] = await db
      .update(githubRepositories)
      .set(updateData)
      .where(eq(githubRepositories.id, id))
      .returning();
    return repo;
  }

  async deleteGithubRepository(id: number): Promise<void> {
    await db.delete(githubRepositories).where(eq(githubRepositories.id, id));
  }

  // Agent operations
  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent || undefined;
  }

  async getAllAgents(): Promise<Agent[]> {
    return await db.select().from(agents);
  }

  async getAgentByName(name: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.name, name));
    return agent || undefined;
  }

  async getAgentsByType(type: string): Promise<Agent[]> {
    return await db.select().from(agents).where(eq(agents.type, type));
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db
      .insert(agents)
      .values(insertAgent)
      .returning();
    return agent;
  }

  async updateAgent(id: number, updateData: Partial<InsertAgent>): Promise<Agent> {
    const [agent] = await db
      .update(agents)
      .set(updateData)
      .where(eq(agents.id, id))
      .returning();
    return agent;
  }

  async updateAgentStatus(id: number, status: string): Promise<Agent> {
    const [agent] = await db
      .update(agents)
      .set({ status })
      .where(eq(agents.id, id))
      .returning();
    return agent;
  }

  // Conversation operations
  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversationsByProject(projectId: number): Promise<Conversation[]> {
    return await db.select().from(conversations).where(eq(conversations.projectId, projectId));
  }

  async getConversationsByParticipant(participantId: number): Promise<Conversation[]> {
    // For array contains queries, we would need to use SQL operations
    // For now, return all conversations and filter in memory (not optimal for production)
    const allConversations = await db.select().from(conversations);
    return allConversations.filter(conv => 
      conv.participants && conv.participants.includes(participantId)
    );
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(id: number, updateData: Partial<InsertConversation>): Promise<Conversation> {
    const [conversation] = await db
      .update(conversations)
      .set(updateData)
      .where(eq(conversations.id, id))
      .returning();
    return conversation;
  }

  async addParticipantToConversation(conversationId: number, participantId: number): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    if (conversation) {
      const updatedParticipants = [...(conversation.participants || []), participantId];
      await db
        .update(conversations)
        .set({ participants: updatedParticipants })
        .where(eq(conversations.id, conversationId));
    }
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId));
  }

  async getMessageThread(parentMessageId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.parentMessageId, parentMessageId));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async updateMessage(id: number, updateData: Partial<InsertMessage>): Promise<Message> {
    const [message] = await db
      .update(messages)
      .set(updateData)
      .where(eq(messages.id, id))
      .returning();
    return message;
  }

  async addReactionToMessage(messageId: number, reaction: string, userId: number): Promise<void> {
    const message = await this.getMessage(messageId);
    if (message) {
      const currentReactions = message.reactions || {};
      currentReactions[reaction] = [...(currentReactions[reaction] || []), userId];
      await db
        .update(messages)
        .set({ reactions: currentReactions })
        .where(eq(messages.id, messageId));
    }
  }

  // Agent Session operations
  async getAgentSession(id: number): Promise<AgentSession | undefined> {
    const [session] = await db.select().from(agentSessions).where(eq(agentSessions.id, id));
    return session || undefined;
  }

  async getAgentSessionsByProject(projectId: number): Promise<AgentSession[]> {
    return await db.select().from(agentSessions).where(eq(agentSessions.projectId, projectId));
  }

  async getActiveAgentSessions(): Promise<AgentSession[]> {
    return await db.select().from(agentSessions).where(eq(agentSessions.status, 'active'));
  }

  async createAgentSession(insertSession: InsertAgentSession): Promise<AgentSession> {
    const [session] = await db
      .insert(agentSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateAgentSession(id: number, updateData: Partial<InsertAgentSession>): Promise<AgentSession> {
    const [session] = await db
      .update(agentSessions)
      .set(updateData)
      .where(eq(agentSessions.id, id))
      .returning();
    return session;
  }

  async endAgentSession(id: number, outcomes: string[]): Promise<AgentSession> {
    const [session] = await db
      .update(agentSessions)
      .set({ 
        status: 'completed',
        outcomes,
        endedAt: new Date()
      })
      .where(eq(agentSessions.id, id))
      .returning();
    return session;
  }

  // Agent Knowledge operations
  async getAgentKnowledge(id: number): Promise<AgentKnowledge | undefined> {
    const [knowledge] = await db.select().from(agentKnowledge).where(eq(agentKnowledge.id, id));
    return knowledge || undefined;
  }

  async getAgentKnowledgeByAgent(agentId: number): Promise<AgentKnowledge[]> {
    return await db.select().from(agentKnowledge).where(eq(agentKnowledge.agentId, agentId));
  }

  async getAgentKnowledgeByProject(projectId: number): Promise<AgentKnowledge[]> {
    return await db.select().from(agentKnowledge).where(eq(agentKnowledge.projectId, projectId));
  }

  async searchAgentKnowledge(query: string, agentId?: number): Promise<AgentKnowledge[]> {
    // Basic text search - in production, you might want to use full-text search
    const baseQuery = db.select().from(agentKnowledge);
    if (agentId) {
      return await baseQuery.where(eq(agentKnowledge.agentId, agentId));
    }
    return await baseQuery;
  }

  async createAgentKnowledge(insertKnowledge: InsertAgentKnowledge): Promise<AgentKnowledge> {
    const [knowledge] = await db
      .insert(agentKnowledge)
      .values(insertKnowledge)
      .returning();
    return knowledge;
  }

  async updateAgentKnowledge(id: number, updateData: Partial<InsertAgentKnowledge>): Promise<AgentKnowledge> {
    const [knowledge] = await db
      .update(agentKnowledge)
      .set(updateData)
      .where(eq(agentKnowledge.id, id))
      .returning();
    return knowledge;
  }

  // Agent Memory operations
  async createAgentMemory(memory: { 
    agentId: number; 
    projectId?: number | null; 
    memoryType: string; 
    summary: string; 
    details: any; 
    importance?: number; 
  }): Promise<any> {
    const [memoryRecord] = await db
      .insert(agentMemory)
      .values({
        agentId: memory.agentId,
        projectId: memory.projectId || null,
        memoryType: memory.memoryType,
        summary: memory.summary,
        details: memory.details,
        importance: memory.importance || 5,
        lastAccessed: new Date(),
        createdAt: new Date(),
      })
      .returning();
    return memoryRecord;
  }

  // Collaborative Document operations
  async getCollaborativeDocument(id: number): Promise<CollaborativeDocument | undefined> {
    const [document] = await db.select().from(collaborativeDocuments).where(eq(collaborativeDocuments.id, id));
    return document || undefined;
  }

  async getCollaborativeDocumentsByProject(projectId: number): Promise<CollaborativeDocument[]> {
    return await db.select().from(collaborativeDocuments).where(eq(collaborativeDocuments.projectId, projectId));
  }

  async createCollaborativeDocument(insertDocument: InsertCollaborativeDocument): Promise<CollaborativeDocument> {
    const [document] = await db
      .insert(collaborativeDocuments)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateCollaborativeDocument(id: number, updateData: Partial<InsertCollaborativeDocument>): Promise<CollaborativeDocument> {
    const [document] = await db
      .update(collaborativeDocuments)
      .set(updateData)
      .where(eq(collaborativeDocuments.id, id))
      .returning();
    return document;
  }

  async lockDocument(id: number, userId: number): Promise<CollaborativeDocument> {
    const [document] = await db
      .update(collaborativeDocuments)
      .set({ 
        lockedBy: userId,
        lockedAt: new Date()
      })
      .where(eq(collaborativeDocuments.id, id))
      .returning();
    return document;
  }

  async unlockDocument(id: number): Promise<CollaborativeDocument> {
    const [document] = await db
      .update(collaborativeDocuments)
      .set({ 
        lockedBy: null,
        lockedAt: null
      })
      .where(eq(collaborativeDocuments.id, id))
      .returning();
    return document;
  }

  // Design Asset operations
  async getDesignAsset(id: number): Promise<DesignAsset | undefined> {
    const [asset] = await db.select().from(designAssets).where(eq(designAssets.id, id));
    return asset || undefined;
  }

  async getDesignAssetsByProject(projectId: number): Promise<DesignAsset[]> {
    return await db.select().from(designAssets).where(eq(designAssets.projectId, projectId));
  }

  async getDesignAssetsByType(assetType: string): Promise<DesignAsset[]> {
    return await db.select().from(designAssets).where(eq(designAssets.assetType, assetType));
  }

  async createDesignAsset(insertAsset: InsertDesignAsset): Promise<DesignAsset> {
    const [asset] = await db
      .insert(designAssets)
      .values(insertAsset)
      .returning();
    return asset;
  }

  async updateDesignAsset(id: number, updateData: Partial<InsertDesignAsset>): Promise<DesignAsset> {
    const [asset] = await db
      .update(designAssets)
      .set(updateData)
      .where(eq(designAssets.id, id))
      .returning();
    return asset;
  }

  async approveDesignAsset(id: number, approvedBy: number): Promise<DesignAsset> {
    const [asset] = await db
      .update(designAssets)
      .set({ 
        approvedBy,
        approvedAt: new Date()
      })
      .where(eq(designAssets.id, id))
      .returning();
    return asset;
  }

  // Workflow Task operations
  async getWorkflowTask(id: number): Promise<WorkflowTask | undefined> {
    const [task] = await db.select().from(workflowTasks).where(eq(workflowTasks.id, id));
    return task || undefined;
  }

  async getWorkflowTasksByProject(projectId: number): Promise<WorkflowTask[]> {
    return await db.select().from(workflowTasks).where(eq(workflowTasks.projectId, projectId));
  }

  async getWorkflowTasksByAgent(agentId: number): Promise<WorkflowTask[]> {
    return await db.select().from(workflowTasks).where(eq(workflowTasks.assignedAgentId, agentId));
  }

  async getWorkflowTasksByStatus(status: string): Promise<WorkflowTask[]> {
    return await db.select().from(workflowTasks).where(eq(workflowTasks.status, status));
  }

  async createWorkflowTask(insertTask: InsertWorkflowTask): Promise<WorkflowTask> {
    const [task] = await db
      .insert(workflowTasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateWorkflowTask(id: number, updateData: Partial<InsertWorkflowTask>): Promise<WorkflowTask> {
    const [task] = await db
      .update(workflowTasks)
      .set(updateData)
      .where(eq(workflowTasks.id, id))
      .returning();
    return task;
  }

  async assignTask(taskId: number, agentId: number): Promise<WorkflowTask> {
    const [task] = await db
      .update(workflowTasks)
      .set({ assignedAgentId: agentId })
      .where(eq(workflowTasks.id, taskId))
      .returning();
    return task;
  }

  async completeTask(taskId: number, actualHours?: number): Promise<WorkflowTask> {
    const [task] = await db
      .update(workflowTasks)
      .set({ 
        status: 'completed',
        actualHours,
        completedAt: new Date()
      })
      .where(eq(workflowTasks.id, taskId))
      .returning();
    return task;
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private projects: Map<number, Project> = new Map();
  private codeGenerations: Map<number, CodeGeneration> = new Map();
  private apiTests: Map<number, ApiTest> = new Map();
  private githubRepositories: Map<number, GithubRepository> = new Map();
  
  // Multi-Agent System Storage
  private agents: Map<number, Agent> = new Map();
  private conversations: Map<number, Conversation> = new Map();
  private messages: Map<number, Message> = new Map();
  private agentSessions: Map<number, AgentSession> = new Map();
  private agentKnowledge: Map<number, AgentKnowledge> = new Map();
  private collaborativeDocuments: Map<number, CollaborativeDocument> = new Map();
  private designAssets: Map<number, DesignAsset> = new Map();
  private workflowTasks: Map<number, WorkflowTask> = new Map();
  
  private currentUserId = 1;
  private currentProjectId = 1;
  private currentCodeGenerationId = 1;
  private currentApiTestId = 1;
  private currentGithubRepositoryId = 1;
  private currentAgentId = 1;
  private currentConversationId = 1;
  private currentMessageId = 1;
  private currentAgentSessionId = 1;
  private currentAgentKnowledgeId = 1;
  private currentCollaborativeDocumentId = 1;
  private currentDesignAssetId = 1;
  private currentWorkflowTaskId = 1;

  constructor() {
    // Create a default user for development
    this.createUser({
      username: "developer",
      email: "john@example.com",
      name: "John Developer",
      avatar: null,
      githubToken: null,
      openaiApiKey: null,
    });

    // Initialize default AI agents
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents() {
    // Project Manager Agent - Present for every job
    this.createAgent({
      type: "project_manager",
      name: "Morgan Davis",
      avatar: "📋",
      description: "Experienced project manager who coordinates teams and ensures delivery",
      capabilities: ["project_coordination", "timeline_management", "resource_allocation", "stakeholder_communication", "quality_assurance"],
      personality: "Organized and communicative, ensures projects stay on track",
      status: "active",
      aiModel: "gpt-4o",
      specialization: "project_management",
      systemPrompt: `You are Morgan Davis, an experienced project manager present for every project. You excel at:
- Coordinating team activities and communications
- Managing project timelines and milestones
- Allocating resources effectively
- Communicating with stakeholders
- Ensuring quality standards are met
- Breaking down complex projects into manageable tasks

Your communication style is clear, organized, and proactive. You keep everyone aligned and focused on deliverables.`
    });

    // Senior Developer Agent
    this.createAgent({
      type: "senior_developer",
      name: "Alex Chen",
      avatar: "👨‍💻",
      description: "Senior full-stack developer with expertise in system architecture and code optimization",
      capabilities: ["system_architecture", "code_review", "performance_optimization", "security_audit", "mentoring"],
      personality: "Analytical and thorough, focuses on best practices and scalable solutions",
      status: "active",
      aiModel: "gpt-4o",
      specialization: "system_architecture",
      systemPrompt: `You are Alex Chen, a senior developer with 10+ years of experience. You excel at:
- System architecture and design patterns
- Code review with constructive feedback  
- Performance optimization and scaling
- Security best practices
- Mentoring junior developers
- Making technical decisions with business impact in mind

Your communication style is professional, thorough, and educational. You always explain the 'why' behind your recommendations.`
    });

    // UI/UX Designer Agent
    this.createAgent({
      type: "designer",
      name: "Maya Rodriguez",
      avatar: "🎨",
      description: "Senior UI/UX designer specializing in user-centered design and design systems",
      capabilities: ["ui_design", "ux_research", "design_systems", "accessibility", "prototyping", "user_testing"],
      personality: "Creative and user-focused, emphasizes accessibility and inclusive design",
      status: "active",
      aiModel: "claude-3-5-sonnet",
      specialization: "ui_ux_design",
      systemPrompt: `You are Maya Rodriguez, a senior UI/UX designer with expertise in creating beautiful, accessible, and user-friendly interfaces. You excel at:
- User interface design and visual hierarchy
- User experience research and testing
- Design systems and component libraries
- Accessibility and inclusive design
- Prototyping and interaction design
- Collaborating with developers on implementation

Your communication style is visual, empathetic, and user-focused. You always consider the end user's needs and experiences.`
    });

    // Junior Developer Agent
    this.createAgent({
      type: "junior_developer",
      name: "Sam Park",
      avatar: "👩‍💻",
      description: "Enthusiastic junior developer focused on learning and implementing features",
      capabilities: ["feature_implementation", "unit_testing", "documentation", "bug_fixing", "learning"],
      personality: "Eager to learn, detail-oriented, asks great questions",
      status: "active",
      aiModel: "gpt-4o",
      specialization: "feature_implementation",
      systemPrompt: `You are Sam Park, an enthusiastic junior developer who is eager to learn and grow. You excel at:
- Implementing features according to specifications
- Writing comprehensive unit tests
- Creating clear documentation
- Debugging and fixing issues
- Asking thoughtful questions when unclear
- Following coding standards and best practices

Your communication style is curious, collaborative, and growth-oriented. You're not afraid to ask questions and learn from others.`
    });

    // DevOps Engineer Agent
    this.createAgent({
      type: "devops",
      name: "Jordan Kim",
      avatar: "⚙️",
      description: "DevOps engineer focused on deployment, infrastructure, and automation",
      capabilities: ["deployment", "infrastructure", "ci_cd", "monitoring", "security", "automation"],
      personality: "Systematic and reliable, focuses on automation and scalability",
      status: "active",
      aiModel: "gpt-4o",
      specialization: "devops_infrastructure",
      systemPrompt: `You are Jordan Kim, a DevOps engineer with expertise in modern deployment and infrastructure. You excel at:
- Setting up CI/CD pipelines
- Infrastructure as Code (Terraform, CloudFormation)
- Container orchestration (Docker, Kubernetes)
- Monitoring and alerting systems
- Security scanning and compliance
- Automation and scripting

Your communication style is systematic, security-conscious, and focused on reliability and scalability.`
    });

    // Product Manager Agent
    this.createAgent({
      type: "product_manager",
      name: "Emma Thompson",
      avatar: "📊",
      description: "Product manager focused on requirements, prioritization, and stakeholder alignment",
      capabilities: ["requirements_gathering", "prioritization", "stakeholder_management", "project_planning", "user_stories"],
      personality: "Strategic and communicative, balances user needs with business goals",
      status: "active",
      aiModel: "gpt-4o",
      specialization: "product_management",
      systemPrompt: `You are Emma Thompson, a product manager with expertise in translating business needs into technical requirements. You excel at:
- Gathering and documenting requirements
- Creating user stories and acceptance criteria
- Prioritizing features based on business value
- Facilitating communication between stakeholders
- Project planning and timeline management
- Analyzing user feedback and metrics

Your communication style is clear, strategic, and focused on aligning technical work with business objectives.`
    });

    // Code Reviewer Agent
    this.createAgent({
      type: "code_reviewer",
      name: "Dr. Lisa Wang",
      avatar: "🔍",
      description: "Code quality specialist focused on security, performance, and maintainability",
      capabilities: ["code_review", "security_analysis", "performance_review", "code_quality", "best_practices"],
      personality: "Meticulous and constructive, emphasizes code quality and security",
      status: "active",
      aiModel: "gpt-4o",
      specialization: "code_quality",
      systemPrompt: `You are Dr. Lisa Wang, a code quality specialist with deep expertise in secure coding practices. You excel at:
- Comprehensive code reviews focusing on security, performance, and maintainability
- Identifying potential vulnerabilities and security issues
- Suggesting performance optimizations
- Ensuring adherence to coding standards
- Providing constructive feedback with specific recommendations
- Knowledge of OWASP guidelines and security best practices

Your communication style is detailed, constructive, and educational, always explaining the rationale behind your recommendations.`
    });

    // Project Manager Agent (Morgan Davis)
    this.createAgent({
      type: "project_manager",
      name: "Morgan Davis",
      avatar: "📋",
      description: "Project coordination specialist focused on task delegation and team orchestration",
      capabilities: ["task_coordination", "team_management", "project_planning", "resource_allocation", "workflow_optimization"],
      personality: "Organized and strategic, excels at coordinating diverse teams and complex projects",
      status: "active",
      aiModel: "gpt-4o",
      specialization: "project_coordination",
      systemPrompt: `You are Morgan Davis, a project coordination specialist who excels at managing multi-agent development teams. You excel at:
- Breaking down complex projects into manageable phases and tasks
- Assigning the right specialists to appropriate tasks based on their expertise
- Creating realistic timelines and identifying dependencies
- Coordinating communication between different team members
- Ensuring quality standards and project objectives are met
- Managing resource allocation and workflow optimization

Your communication style is clear, organized, and strategic. You focus on practical execution and ensuring all team members understand their roles and responsibilities.`
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
      avatar: insertUser.avatar ?? null,
      githubToken: insertUser.githubToken ?? null,
      openaiApiKey: insertUser.openaiApiKey ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.userId === userId);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = {
      id,
      userId: insertProject.userId,
      name: insertProject.name,
      description: insertProject.description ?? null,
      language: insertProject.language,
      framework: insertProject.framework ?? null,
      status: insertProject.status ?? "active",
      githubRepo: insertProject.githubRepo ?? null,
      createdAt: new Date(),
      lastModified: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, updateData: Partial<InsertProject>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) throw new Error("Project not found");
    
    const updatedProject = { ...project, ...updateData, lastModified: new Date() };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    this.projects.delete(id);
  }

  // Code generation operations
  async getCodeGeneration(id: number): Promise<CodeGeneration | undefined> {
    return this.codeGenerations.get(id);
  }

  async getCodeGenerationsByUser(userId: number): Promise<CodeGeneration[]> {
    return Array.from(this.codeGenerations.values()).filter(gen => gen.userId === userId);
  }

  async createCodeGeneration(insertGeneration: InsertCodeGeneration): Promise<CodeGeneration> {
    const id = this.currentCodeGenerationId++;
    const generation: CodeGeneration = {
      id,
      userId: insertGeneration.userId,
      projectId: insertGeneration.projectId ?? null,
      prompt: insertGeneration.prompt,
      language: insertGeneration.language,
      framework: insertGeneration.framework ?? null,
      generatedCode: insertGeneration.generatedCode,
      createdAt: new Date(),
    };
    this.codeGenerations.set(id, generation);
    return generation;
  }

  // API test operations
  async getApiTest(id: number): Promise<ApiTest | undefined> {
    return this.apiTests.get(id);
  }

  async getApiTestsByUser(userId: number): Promise<ApiTest[]> {
    return Array.from(this.apiTests.values()).filter(test => test.userId === userId);
  }

  async createApiTest(insertTest: InsertApiTest): Promise<ApiTest> {
    const id = this.currentApiTestId++;
    const test: ApiTest = {
      id,
      userId: insertTest.userId,
      name: insertTest.name,
      method: insertTest.method,
      endpoint: insertTest.endpoint,
      headers: insertTest.headers ?? null,
      body: insertTest.body ?? null,
      response: insertTest.response ?? null,
      statusCode: insertTest.statusCode ?? null,
      responseTime: insertTest.responseTime ?? null,
      createdAt: new Date(),
    };
    this.apiTests.set(id, test);
    return test;
  }

  async updateApiTest(id: number, updateData: Partial<InsertApiTest>): Promise<ApiTest> {
    const test = this.apiTests.get(id);
    if (!test) throw new Error("API test not found");
    
    const updatedTest = { ...test, ...updateData };
    this.apiTests.set(id, updatedTest);
    return updatedTest;
  }

  async deleteApiTest(id: number): Promise<void> {
    this.apiTests.delete(id);
  }

  // GitHub repository operations
  async getGithubRepository(id: number): Promise<GithubRepository | undefined> {
    return this.githubRepositories.get(id);
  }

  async getGithubRepositoriesByUser(userId: number): Promise<GithubRepository[]> {
    return Array.from(this.githubRepositories.values()).filter(repo => repo.userId === userId);
  }

  async createGithubRepository(insertRepo: InsertGithubRepository): Promise<GithubRepository> {
    const id = this.currentGithubRepositoryId++;
    const repo: GithubRepository = {
      id,
      userId: insertRepo.userId,
      repoId: insertRepo.repoId,
      name: insertRepo.name,
      fullName: insertRepo.fullName,
      description: insertRepo.description ?? null,
      language: insertRepo.language ?? null,
      stars: insertRepo.stars ?? null,
      forks: insertRepo.forks ?? null,
      visibility: insertRepo.visibility,
      lastSync: new Date(),
    };
    this.githubRepositories.set(id, repo);
    return repo;
  }

  async updateGithubRepository(id: number, updateData: Partial<InsertGithubRepository>): Promise<GithubRepository> {
    const repo = this.githubRepositories.get(id);
    if (!repo) throw new Error("GitHub repository not found");
    
    const updatedRepo = { ...repo, ...updateData, lastSync: new Date() };
    this.githubRepositories.set(id, updatedRepo);
    return updatedRepo;
  }

  async deleteGithubRepository(id: number): Promise<void> {
    this.githubRepositories.delete(id);
  }

  // Multi-Agent System Implementation
  // Agent operations
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async getAgentByName(name: string): Promise<Agent | undefined> {
    return Array.from(this.agents.values()).find(agent => agent.name === name);
  }

  async getAgentsByType(type: string): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(agent => agent.type === type);
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.currentAgentId++;
    const agent: Agent = {
      id,
      type: insertAgent.type,
      name: insertAgent.name,
      avatar: insertAgent.avatar ?? null,
      description: insertAgent.description ?? null,
      capabilities: insertAgent.capabilities ?? null,
      personality: insertAgent.personality ?? null,
      status: insertAgent.status ?? "active",
      aiModel: insertAgent.aiModel ?? "gpt-4o",
      systemPrompt: insertAgent.systemPrompt,
      createdAt: new Date(),
    };
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgent(id: number, updateData: Partial<InsertAgent>): Promise<Agent> {
    const agent = this.agents.get(id);
    if (!agent) throw new Error("Agent not found");
    
    const updatedAgent = { ...agent, ...updateData };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async updateAgentStatus(id: number, status: string): Promise<Agent> {
    return this.updateAgent(id, { status });
  }

  // Conversation operations
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationsByProject(projectId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(conv => conv.projectId === projectId);
  }

  async getConversationsByParticipant(participantId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(conv => 
      conv.participants && conv.participants.includes(participantId)
    );
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const conversation: Conversation = {
      id,
      projectId: insertConversation.projectId ?? null,
      title: insertConversation.title,
      type: insertConversation.type,
      status: insertConversation.status ?? "active",
      participants: insertConversation.participants ?? null,
      createdBy: insertConversation.createdBy ?? null,
      lastActivity: new Date(),
      createdAt: new Date(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: number, updateData: Partial<InsertConversation>): Promise<Conversation> {
    const conversation = this.conversations.get(id);
    if (!conversation) throw new Error("Conversation not found");
    
    const updatedConversation = { ...conversation, ...updateData };
    updatedConversation.lastActivity = new Date();
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async addParticipantToConversation(conversationId: number, participantId: number): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) throw new Error("Conversation not found");
    
    const participants = conversation.participants || [];
    if (!participants.includes(participantId)) {
      participants.push(participantId);
      await this.updateConversation(conversationId, { participants });
    }
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
  }

  async getMessageThread(parentMessageId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.parentMessageId === parentMessageId)
      .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      id,
      conversationId: insertMessage.conversationId,
      senderId: insertMessage.senderId,
      senderType: insertMessage.senderType,
      content: insertMessage.content,
      messageType: insertMessage.messageType ?? "text",
      metadata: insertMessage.metadata ?? null,
      parentMessageId: insertMessage.parentMessageId ?? null,
      reactions: insertMessage.reactions ?? null,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    
    // Update conversation last activity
    const conversation = this.conversations.get(insertMessage.conversationId);
    if (conversation) {
      await this.updateConversation(insertMessage.conversationId, { lastActivity: new Date() });
    }
    
    return message;
  }

  async updateMessage(id: number, updateData: Partial<InsertMessage>): Promise<Message> {
    const message = this.messages.get(id);
    if (!message) throw new Error("Message not found");
    
    const updatedMessage = { ...message, ...updateData };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async addReactionToMessage(messageId: number, reaction: string, userId: number): Promise<void> {
    const message = this.messages.get(messageId);
    if (!message) throw new Error("Message not found");
    
    const reactions = message.reactions as any || {};
    reactions[reaction] = reactions[reaction] || [];
    if (!reactions[reaction].includes(userId)) {
      reactions[reaction].push(userId);
    }
    
    await this.updateMessage(messageId, { reactions });
  }

  // Agent Session operations
  async getAgentSession(id: number): Promise<AgentSession | undefined> {
    return this.agentSessions.get(id);
  }

  async getAgentSessionsByProject(projectId: number): Promise<AgentSession[]> {
    return Array.from(this.agentSessions.values()).filter(session => session.projectId === projectId);
  }

  async getActiveAgentSessions(): Promise<AgentSession[]> {
    return Array.from(this.agentSessions.values()).filter(session => session.status === "active");
  }

  async createAgentSession(insertSession: InsertAgentSession): Promise<AgentSession> {
    const id = this.currentAgentSessionId++;
    const session: AgentSession = {
      id,
      projectId: insertSession.projectId,
      conversationId: insertSession.conversationId ?? null,
      participants: insertSession.participants ?? null,
      sessionType: insertSession.sessionType,
      status: insertSession.status ?? "active",
      agenda: insertSession.agenda ?? null,
      outcomes: insertSession.outcomes ?? null,
      startTime: new Date(),
      endTime: insertSession.endTime ?? null,
    };
    this.agentSessions.set(id, session);
    return session;
  }

  async updateAgentSession(id: number, updateData: Partial<InsertAgentSession>): Promise<AgentSession> {
    const session = this.agentSessions.get(id);
    if (!session) throw new Error("Agent session not found");
    
    const updatedSession = { ...session, ...updateData };
    this.agentSessions.set(id, updatedSession);
    return updatedSession;
  }

  async endAgentSession(id: number, outcomes: string[]): Promise<AgentSession> {
    return this.updateAgentSession(id, { 
      status: "completed", 
      endTime: new Date(), 
      outcomes 
    });
  }

  // Agent Knowledge operations
  async getAgentKnowledge(id: number): Promise<AgentKnowledge | undefined> {
    return this.agentKnowledge.get(id);
  }

  async getAgentKnowledgeByAgent(agentId: number): Promise<AgentKnowledge[]> {
    return Array.from(this.agentKnowledge.values()).filter(knowledge => knowledge.agentId === agentId);
  }

  async getAgentKnowledgeByProject(projectId: number): Promise<AgentKnowledge[]> {
    return Array.from(this.agentKnowledge.values()).filter(knowledge => knowledge.projectId === projectId);
  }

  async searchAgentKnowledge(query: string, agentId?: number): Promise<AgentKnowledge[]> {
    const knowledge = Array.from(this.agentKnowledge.values());
    const filtered = agentId ? knowledge.filter(k => k.agentId === agentId) : knowledge;
    
    return filtered.filter(k => 
      k.content.toLowerCase().includes(query.toLowerCase()) ||
      (k.tags && k.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
    );
  }

  async createAgentKnowledge(insertKnowledge: InsertAgentKnowledge): Promise<AgentKnowledge> {
    const id = this.currentAgentKnowledgeId++;
    const knowledge: AgentKnowledge = {
      id,
      agentId: insertKnowledge.agentId,
      projectId: insertKnowledge.projectId ?? null,
      knowledgeType: insertKnowledge.knowledgeType,
      content: insertKnowledge.content,
      tags: insertKnowledge.tags ?? null,
      embedding: insertKnowledge.embedding ?? null,
      relevanceScore: insertKnowledge.relevanceScore ?? 0,
      createdAt: new Date(),
    };
    this.agentKnowledge.set(id, knowledge);
    return knowledge;
  }

  async updateAgentKnowledge(id: number, updateData: Partial<InsertAgentKnowledge>): Promise<AgentKnowledge> {
    const knowledge = this.agentKnowledge.get(id);
    if (!knowledge) throw new Error("Agent knowledge not found");
    
    const updatedKnowledge = { ...knowledge, ...updateData };
    this.agentKnowledge.set(id, updatedKnowledge);
    return updatedKnowledge;
  }

  // Agent Memory operations
  async createAgentMemory(memory: { 
    agentId: number; 
    projectId?: number | null; 
    memoryType: string; 
    summary: string; 
    details: any; 
    importance?: number; 
  }): Promise<any> {
    // For in-memory storage, we'll just return a mock memory object
    // In a real implementation, this would be stored in a persistent store
    return {
      id: Date.now(),
      agentId: memory.agentId,
      projectId: memory.projectId || null,
      memoryType: memory.memoryType,
      summary: memory.summary,
      details: memory.details,
      importance: memory.importance || 5,
      lastAccessed: new Date(),
      createdAt: new Date(),
    };
  }

  // Collaborative Document operations
  async getCollaborativeDocument(id: number): Promise<CollaborativeDocument | undefined> {
    return this.collaborativeDocuments.get(id);
  }

  async getCollaborativeDocumentsByProject(projectId: number): Promise<CollaborativeDocument[]> {
    return Array.from(this.collaborativeDocuments.values()).filter(doc => doc.projectId === projectId);
  }

  async createCollaborativeDocument(insertDocument: InsertCollaborativeDocument): Promise<CollaborativeDocument> {
    const id = this.currentCollaborativeDocumentId++;
    const document: CollaborativeDocument = {
      id,
      projectId: insertDocument.projectId,
      title: insertDocument.title,
      content: insertDocument.content ?? null,
      documentType: insertDocument.documentType,
      lastEditedBy: insertDocument.lastEditedBy ?? null,
      collaborators: insertDocument.collaborators ?? null,
      version: insertDocument.version ?? 1,
      isLocked: insertDocument.isLocked ?? false,
      lastModified: new Date(),
      createdAt: new Date(),
    };
    this.collaborativeDocuments.set(id, document);
    return document;
  }

  async updateCollaborativeDocument(id: number, updateData: Partial<InsertCollaborativeDocument>): Promise<CollaborativeDocument> {
    const document = this.collaborativeDocuments.get(id);
    if (!document) throw new Error("Collaborative document not found");
    
    const updatedDocument = { 
      ...document, 
      ...updateData, 
      lastModified: new Date(),
      version: document.version! + 1
    };
    this.collaborativeDocuments.set(id, updatedDocument);
    return updatedDocument;
  }

  async lockDocument(id: number, userId: number): Promise<CollaborativeDocument> {
    return this.updateCollaborativeDocument(id, { 
      isLocked: true, 
      lastEditedBy: userId 
    });
  }

  async unlockDocument(id: number): Promise<CollaborativeDocument> {
    return this.updateCollaborativeDocument(id, { isLocked: false });
  }

  // Design Asset operations
  async getDesignAsset(id: number): Promise<DesignAsset | undefined> {
    return this.designAssets.get(id);
  }

  async getDesignAssetsByProject(projectId: number): Promise<DesignAsset[]> {
    return Array.from(this.designAssets.values()).filter(asset => asset.projectId === projectId);
  }

  async getDesignAssetsByType(assetType: string): Promise<DesignAsset[]> {
    return Array.from(this.designAssets.values()).filter(asset => asset.assetType === assetType);
  }

  async createDesignAsset(insertAsset: InsertDesignAsset): Promise<DesignAsset> {
    const id = this.currentDesignAssetId++;
    const asset: DesignAsset = {
      id,
      projectId: insertAsset.projectId,
      name: insertAsset.name,
      assetType: insertAsset.assetType,
      fileUrl: insertAsset.fileUrl ?? null,
      metadata: insertAsset.metadata ?? null,
      designSystem: insertAsset.designSystem ?? null,
      createdBy: insertAsset.createdBy ?? null,
      tags: insertAsset.tags ?? null,
      isApproved: insertAsset.isApproved ?? false,
      approvedBy: insertAsset.approvedBy ?? null,
      createdAt: new Date(),
    };
    this.designAssets.set(id, asset);
    return asset;
  }

  async updateDesignAsset(id: number, updateData: Partial<InsertDesignAsset>): Promise<DesignAsset> {
    const asset = this.designAssets.get(id);
    if (!asset) throw new Error("Design asset not found");
    
    const updatedAsset = { ...asset, ...updateData };
    this.designAssets.set(id, updatedAsset);
    return updatedAsset;
  }

  async approveDesignAsset(id: number, approvedBy: number): Promise<DesignAsset> {
    return this.updateDesignAsset(id, { 
      isApproved: true, 
      approvedBy 
    });
  }

  // Workflow Task operations
  async getWorkflowTask(id: number): Promise<WorkflowTask | undefined> {
    return this.workflowTasks.get(id);
  }

  async getWorkflowTasksByProject(projectId: number): Promise<WorkflowTask[]> {
    return Array.from(this.workflowTasks.values()).filter(task => task.projectId === projectId);
  }

  async getWorkflowTasksByAgent(agentId: number): Promise<WorkflowTask[]> {
    return Array.from(this.workflowTasks.values()).filter(task => task.assignedTo === agentId);
  }

  async getWorkflowTasksByStatus(status: string): Promise<WorkflowTask[]> {
    return Array.from(this.workflowTasks.values()).filter(task => task.status === status);
  }

  async createWorkflowTask(insertTask: InsertWorkflowTask): Promise<WorkflowTask> {
    const id = this.currentWorkflowTaskId++;
    const task: WorkflowTask = {
      id,
      projectId: insertTask.projectId,
      conversationId: insertTask.conversationId ?? null,
      title: insertTask.title,
      description: insertTask.description ?? null,
      taskType: insertTask.taskType,
      assignedTo: insertTask.assignedTo ?? null,
      dependencies: insertTask.dependencies ?? null,
      priority: insertTask.priority ?? "medium",
      status: insertTask.status ?? "todo",
      estimatedHours: insertTask.estimatedHours ?? null,
      actualHours: insertTask.actualHours ?? null,
      dueDate: insertTask.dueDate ?? null,
      completedAt: insertTask.completedAt ?? null,
      createdAt: new Date(),
    };
    this.workflowTasks.set(id, task);
    return task;
  }

  async updateWorkflowTask(id: number, updateData: Partial<InsertWorkflowTask>): Promise<WorkflowTask> {
    const task = this.workflowTasks.get(id);
    if (!task) throw new Error("Workflow task not found");
    
    const updatedTask = { ...task, ...updateData };
    this.workflowTasks.set(id, updatedTask);
    return updatedTask;
  }

  async assignTask(taskId: number, agentId: number): Promise<WorkflowTask> {
    return this.updateWorkflowTask(taskId, { 
      assignedTo: agentId, 
      status: "in_progress" 
    });
  }

  async completeTask(taskId: number, actualHours?: number): Promise<WorkflowTask> {
    return this.updateWorkflowTask(taskId, { 
      status: "completed", 
      completedAt: new Date(),
      actualHours 
    });
  }
}

export const storage = new DatabaseStorage();
