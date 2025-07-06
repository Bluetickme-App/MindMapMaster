import { Octokit } from "octokit";

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
  updated_at: string;
}

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async getUserRepositories(): Promise<GitHubRepository[]> {
    try {
      const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
      });

      return data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        private: repo.private,
        updated_at: repo.updated_at,
      }));
    } catch (error) {
      console.error('GitHub API error:', error);
      throw new Error(`Failed to fetch repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        language: data.language,
        stargazers_count: data.stargazers_count,
        forks_count: data.forks_count,
        private: data.private,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error('GitHub API error:', error);
      throw new Error(`Failed to fetch repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createRepository(name: string, description?: string, isPrivate = false): Promise<GitHubRepository> {
    try {
      const { data } = await this.octokit.rest.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
      });

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        language: data.language,
        stargazers_count: data.stargazers_count,
        forks_count: data.forks_count,
        private: data.private,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error('GitHub API error:', error);
      throw new Error(`Failed to create repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      if ('content' in data) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      
      throw new Error('File content not found');
    } catch (error) {
      console.error('GitHub API error:', error);
      throw new Error(`Failed to fetch file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string
  ): Promise<void> {
    try {
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        sha,
      });
    } catch (error) {
      console.error('GitHub API error:', error);
      throw new Error(`Failed to update file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
