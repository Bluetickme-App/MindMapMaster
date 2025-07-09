import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  githubToken: text("github_token"),
  openaiApiKey: text("openai_api_key"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  language: text("language").notNull(),
  framework: text("framework"),
  status: text("status").notNull().default("active"), // active, paused, completed
  githubRepo: text("github_repo"),
  assistantId: text("assistant_id"), // OpenAI Assistant ID for this project
  threadId: text("thread_id"), // OpenAI Thread ID for conversation history
  lastModified: timestamp("last_modified").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const codeGenerations = pgTable("code_generations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id"),
  prompt: text("prompt").notNull(),
  language: text("language").notNull(),
  framework: text("framework"),
  generatedCode: text("generated_code").notNull(),
  aiProvider: text("ai_provider").notNull().default("openai"), // openai, claude, gemini
  createdAt: timestamp("created_at").defaultNow(),
});

// Project conversation history for all AI providers
export const projectConversations = pgTable("project_conversations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  aiProvider: text("ai_provider").notNull(), // openai, claude, gemini
  metadata: jsonb("metadata"), // Store additional context like code generated, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Project files storage
export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  content: text("content").notNull(),
  fileType: text("file_type").notNull(), // file, folder
  size: integer("size").default(0),
  lastModified: timestamp("last_modified").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const apiTests = pgTable("api_tests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  method: text("method").notNull(),
  endpoint: text("endpoint").notNull(),
  headers: jsonb("headers"),
  body: text("body"),
  response: text("response"),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const githubRepositories = pgTable("github_repositories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  repoId: integer("repo_id").notNull(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  description: text("description"),
  language: text("language"),
  stars: integer("stars").default(0),
  forks: integer("forks").default(0),
  visibility: text("visibility").notNull(), // public, private
  lastSync: timestamp("last_sync").defaultNow(),
});

// Multi-Agent System Tables
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // senior_developer, junior_developer, designer, devops, product_manager, code_reviewer
  name: text("name").notNull(),
  avatar: text("avatar"),
  description: text("description"),
  specialization: text("specialization").notNull(), // php, python, react, vite, css, roadmap, design, ai
  capabilities: text("capabilities").array(),
  personality: text("personality"), // communication style and traits
  status: text("status").notNull().default("active"), // active, busy, offline
  aiModel: text("ai_model").default("gpt-4o"),
  aiProvider: text("ai_provider").notNull().default("openai"), // openai, claude, gemini
  systemPrompt: text("system_prompt").notNull(),
  experienceLevel: text("experience_level").notNull().default("senior"), // junior, mid, senior, expert
  languages: text("languages").array().notNull().default([]), // programming languages
  frameworks: text("frameworks").array().notNull().default([]), // frameworks/tools
  assistantId: text("assistant_id"), // OpenAI Assistant ID for persistent memory
  threadId: text("thread_id"), // OpenAI Thread ID for this agent's main thread
  projectMemory: jsonb("project_memory"), // Project-specific memory and context
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  title: text("title").notNull(),
  type: text("type").notNull(), // project_discussion, code_review, design_review, general
  status: text("status").notNull().default("active"), // active, archived, closed
  participants: integer("participants").array(), // agent IDs
  createdBy: integer("created_by"), // user or agent ID
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderId: integer("sender_id").notNull(), // user or agent ID
  senderType: text("sender_type").notNull(), // user, agent
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"), // text, code, image, voice, file, system, web_search
  metadata: jsonb("metadata"), // code language, file info, voice duration, search results, etc
  attachments: jsonb("attachments"), // file paths, image URLs, voice file paths
  parentMessageId: integer("parent_message_id"), // for threading
  reactions: jsonb("reactions"), // emoji reactions
  timestamp: timestamp("timestamp").defaultNow(),
});

export const agentSessions = pgTable("agent_sessions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  conversationId: integer("conversation_id"),
  participants: integer("participants").array(), // agent IDs
  sessionType: text("session_type").notNull(), // collaboration, code_review, design_session, planning
  status: text("status").notNull().default("active"), // active, completed, paused
  agenda: text("agenda"),
  outcomes: text("outcomes").array(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
});

export const agentKnowledge = pgTable("agent_knowledge", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  projectId: integer("project_id"),
  knowledgeType: text("knowledge_type").notNull(), // code_pattern, design_principle, best_practice, project_context
  content: text("content").notNull(),
  tags: text("tags").array(),
  embedding: text("embedding"), // for vector search
  relevanceScore: integer("relevance_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent Memory System - tracks long-term memory for each agent
export const agentMemory = pgTable("agent_memory", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  projectId: integer("project_id"), // null for general memory
  memoryType: text("memory_type").notNull(), // project_context, user_preference, code_pattern, decision_history
  summary: text("summary").notNull(), // brief description of memory
  details: jsonb("details").notNull(), // detailed memory content
  importance: integer("importance").default(5), // 1-10 importance score
  lastAccessed: timestamp("last_accessed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent Collaboration History - tracks how agents work together
export const agentCollaborations = pgTable("agent_collaborations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(), // unique session identifier
  projectId: integer("project_id"),
  participantAgents: integer("participant_agents").array().notNull(), // array of agent IDs
  objective: text("objective").notNull(), // what they're working on
  phase: text("phase").notNull().default("planning"), // planning, implementation, review, completed
  decisions: jsonb("decisions").default('[]'), // array of decisions made
  outcomes: jsonb("outcomes").default('[]'), // array of outcomes
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  status: text("status").notNull().default("active"), // active, paused, completed
});

// Agent Communication Log - tracks agent-to-agent communication
export const agentCommunications = pgTable("agent_communications", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  fromAgentId: integer("from_agent_id").notNull(),
  toAgentId: integer("to_agent_id"), // null for broadcast messages
  messageType: text("message_type").notNull(), // suggestion, question, decision, update
  content: text("content").notNull(),
  context: jsonb("context"), // additional context data
  priority: integer("priority").default(5), // 1-10 priority level
  isProcessed: boolean("is_processed").default(false),
  responseRequired: boolean("response_required").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const collaborativeDocuments = pgTable("collaborative_documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  content: jsonb("content"), // rich document content
  documentType: text("document_type").notNull(), // code, design, requirements, architecture
  lastEditedBy: integer("last_edited_by"), // user or agent ID
  collaborators: integer("collaborators").array(),
  version: integer("version").default(1),
  isLocked: boolean("is_locked").default(false),
  lastModified: timestamp("last_modified").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const designAssets = pgTable("design_assets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  assetType: text("asset_type").notNull(), // wireframe, mockup, component, icon, color_palette
  fileUrl: text("file_url"),
  metadata: jsonb("metadata"), // dimensions, colors, fonts, etc
  designSystem: jsonb("design_system"), // tokens, variables
  createdBy: integer("created_by"), // user or agent ID
  tags: text("tags").array(),
  isApproved: boolean("is_approved").default(false),
  approvedBy: integer("approved_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workflowTasks = pgTable("workflow_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  conversationId: integer("conversation_id"),
  title: text("title").notNull(),
  description: text("description"),
  taskType: text("task_type").notNull(), // code_implementation, code_review, design_task, testing, deployment
  assignedTo: integer("assigned_to"), // agent ID
  dependencies: integer("dependencies").array(), // other task IDs
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  status: text("status").notNull().default("todo"), // todo, in_progress, review, completed, blocked
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// WeLet Properties Platform Tables
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // monthly rent in dollars
  location: text("location").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  parking: integer("parking").notNull(),
  size: integer("size").notNull(), // square feet
  type: text("type").notNull(), // apartment, house, condo, studio
  status: text("status").notNull().default("available"), // available, occupied, maintenance
  features: text("features").array().default('{}'), // amenities and features
  images: text("images").array().default('{}'), // property images
  virtualTourUrl: text("virtual_tour_url"),
  landlordId: integer("landlord_id"), // references users table
  rating: integer("rating").default(5), // 1-5 star rating
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  tenantId: integer("tenant_id"), // references users table
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // plumbing, electrical, hvac, appliances, etc.
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  status: text("status").notNull().default("pending"), // pending, in-progress, completed, cancelled
  assignedTo: text("assigned_to"), // contractor/maintenance person
  estimatedCost: integer("estimated_cost"),
  actualCost: integer("actual_cost"),
  dateCreated: timestamp("date_created").defaultNow(),
  dateAssigned: timestamp("date_assigned"),
  dateCompleted: timestamp("date_completed"),
  images: text("images").array().default('{}'), // photos of the issue
  notes: text("notes").array().default('{}'), // progress notes
});

export const propertyTenants = pgTable("property_tenants", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  tenantId: integer("tenant_id").notNull(), // references users table
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  monthlyRent: integer("monthly_rent").notNull(),
  depositAmount: integer("deposit_amount").notNull(),
  leaseTerms: text("lease_terms"),
  status: text("status").notNull().default("active"), // active, inactive, terminated
  emergencyContact: jsonb("emergency_contact"), // emergency contact details
  createdAt: timestamp("created_at").defaultNow(),
});

export const propertyApplications = pgTable("property_applications", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  applicantId: integer("applicant_id").notNull(), // references users table
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  applicationData: jsonb("application_data").notNull(), // application form data
  creditScore: integer("credit_score"),
  monthlyIncome: integer("monthly_income"),
  employmentStatus: text("employment_status"),
  references: jsonb("references"), // references data
  notes: text("notes"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by"), // landlord/property manager
});

export const propertyDocuments = pgTable("property_documents", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  tenantId: integer("tenant_id"), // null for property-level documents
  documentType: text("document_type").notNull(), // lease, inspection, certificate, etc.
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedBy: integer("uploaded_by"), // references users table
  isActive: boolean("is_active").default(true),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const propertyPayments = pgTable("property_payments", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  amount: integer("amount").notNull(), // amount in cents
  paymentType: text("payment_type").notNull(), // rent, deposit, fee, etc.
  paymentMethod: text("payment_method").notNull(), // credit_card, bank_transfer, cash, etc.
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  transactionId: text("transaction_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  lastModified: true,
});

export const insertCodeGenerationSchema = createInsertSchema(codeGenerations).omit({
  id: true,
  createdAt: true,
});

export const insertApiTestSchema = createInsertSchema(apiTests).omit({
  id: true,
  createdAt: true,
});

export const insertGithubRepositorySchema = createInsertSchema(githubRepositories).omit({
  id: true,
  lastSync: true,
});

// Multi-Agent Insert Schemas
export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
}).extend({
  lastActivity: z.date().optional()
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertAgentSessionSchema = createInsertSchema(agentSessions).omit({
  id: true,
  startTime: true,
});

export const insertAgentKnowledgeSchema = createInsertSchema(agentKnowledge).omit({
  id: true,
  createdAt: true,
});

export const insertCollaborativeDocumentSchema = createInsertSchema(collaborativeDocuments).omit({
  id: true,
  createdAt: true,
  lastModified: true,
});

export const insertDesignAssetSchema = createInsertSchema(designAssets).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowTaskSchema = createInsertSchema(workflowTasks).omit({
  id: true,
  createdAt: true,
});

// WeLet Properties Insert Schemas
export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({
  id: true,
  dateCreated: true,
});

export const insertPropertyTenantSchema = createInsertSchema(propertyTenants).omit({
  id: true,
  createdAt: true,
});

export const insertPropertyApplicationSchema = createInsertSchema(propertyApplications).omit({
  id: true,
  submittedAt: true,
});

export const insertPropertyDocumentSchema = createInsertSchema(propertyDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertPropertyPaymentSchema = createInsertSchema(propertyPayments).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type CodeGeneration = typeof codeGenerations.$inferSelect;
export type InsertCodeGeneration = z.infer<typeof insertCodeGenerationSchema>;

export type ApiTest = typeof apiTests.$inferSelect;
export type InsertApiTest = z.infer<typeof insertApiTestSchema>;

export type GithubRepository = typeof githubRepositories.$inferSelect;
export type InsertGithubRepository = z.infer<typeof insertGithubRepositorySchema>;

// Multi-Agent Types
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type AgentSession = typeof agentSessions.$inferSelect;
export type InsertAgentSession = z.infer<typeof insertAgentSessionSchema>;

export type AgentKnowledge = typeof agentKnowledge.$inferSelect;
export type InsertAgentKnowledge = z.infer<typeof insertAgentKnowledgeSchema>;

export type CollaborativeDocument = typeof collaborativeDocuments.$inferSelect;
export type InsertCollaborativeDocument = z.infer<typeof insertCollaborativeDocumentSchema>;

export type DesignAsset = typeof designAssets.$inferSelect;
export type InsertDesignAsset = z.infer<typeof insertDesignAssetSchema>;

export type WorkflowTask = typeof workflowTasks.$inferSelect;
export type InsertWorkflowTask = z.infer<typeof insertWorkflowTaskSchema>;

// WeLet Properties Types
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;

export type PropertyTenant = typeof propertyTenants.$inferSelect;
export type InsertPropertyTenant = z.infer<typeof insertPropertyTenantSchema>;

export type PropertyApplication = typeof propertyApplications.$inferSelect;
export type InsertPropertyApplication = z.infer<typeof insertPropertyApplicationSchema>;

export type PropertyDocument = typeof propertyDocuments.$inferSelect;
export type InsertPropertyDocument = z.infer<typeof insertPropertyDocumentSchema>;

export type PropertyPayment = typeof propertyPayments.$inferSelect;
export type InsertPropertyPayment = z.infer<typeof insertPropertyPaymentSchema>;

// Message Types for Real-time Communication
export interface WebSocketMessage {
  type: 'agent_message' | 'user_message' | 'system_notification' | 'typing_indicator' | 'agent_status_update' | 'join_conversation' | 'leave_conversation';
  conversationId: number;
  senderId: number;
  senderType: 'user' | 'agent';
  content?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AgentResponse {
  agentId: number;
  content: string;
  messageType: 'text' | 'code' | 'image' | 'file' | 'system';
  metadata?: Record<string, any>;
  confidence: number;
  reasoning?: string;
}
