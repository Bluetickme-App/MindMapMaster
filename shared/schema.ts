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
