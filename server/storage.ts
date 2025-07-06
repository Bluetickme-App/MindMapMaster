import { 
  users, projects, codeGenerations, apiTests, githubRepositories,
  type User, type InsertUser, type Project, type InsertProject,
  type CodeGeneration, type InsertCodeGeneration, type ApiTest, type InsertApiTest,
  type GithubRepository, type InsertGithubRepository
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private projects: Map<number, Project> = new Map();
  private codeGenerations: Map<number, CodeGeneration> = new Map();
  private apiTests: Map<number, ApiTest> = new Map();
  private githubRepositories: Map<number, GithubRepository> = new Map();
  
  private currentUserId = 1;
  private currentProjectId = 1;
  private currentCodeGenerationId = 1;
  private currentApiTestId = 1;
  private currentGithubRepositoryId = 1;

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
}

export const storage = new MemStorage();
