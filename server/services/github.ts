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

  async getAuthenticatedUser(): Promise<{
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string;
  }> {
    try {
      const { data } = await this.octokit.rest.users.getAuthenticated();
      return {
        id: data.id,
        login: data.login,
        name: data.name,
        email: data.email,
        avatar_url: data.avatar_url,
      };
    } catch (error) {
      console.error('GitHub user API error:', error);
      throw new Error(`Failed to get authenticated user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBranches(owner: string, repo: string): Promise<Array<{
    name: string;
    commit: { sha: string; url: string };
    protected: boolean;
  }>> {
    try {
      const { data } = await this.octokit.rest.repos.listBranches({
        owner,
        repo,
      });

      return data.map(branch => ({
        name: branch.name,
        commit: {
          sha: branch.commit.sha,
          url: branch.commit.url,
        },
        protected: branch.protected,
      }));
    } catch (error) {
      console.error('GitHub branches API error:', error);
      throw new Error(`Failed to fetch branches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      if ('content' in data && data.type === 'file') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      
      throw new Error('File content not found');
    } catch (error) {
      console.error('GitHub API error:', error);
      throw new Error(`Failed to fetch file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string = 'main',
    sha?: string
  ): Promise<{
    commit: { sha: string; url: string };
    content: { sha: string; html_url: string };
  }> {
    try {
      const { data } = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
        sha,
      });

      return {
        commit: {
          sha: data.commit.sha,
          url: data.commit.html_url,
        },
        content: {
          sha: data.content?.sha || '',
          html_url: data.content?.html_url || '',
        },
      };
    } catch (error) {
      console.error('GitHub API error:', error);
      throw new Error(`Failed to create/update file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createBranch(owner: string, repo: string, branchName: string, fromBranch: string = 'main'): Promise<void> {
    try {
      // Get the SHA of the base branch
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${fromBranch}`,
      });

      // Create new branch
      await this.octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha,
      });
    } catch (error) {
      console.error('GitHub API error:', error);
      throw new Error(`Failed to create branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    head: string,
    base: string = 'main',
    body?: string
  ): Promise<{
    number: number;
    html_url: string;
    state: string;
  }> {
    try {
      const { data } = await this.octokit.rest.pulls.create({
        owner,
        repo,
        title,
        head,
        base,
        body,
      });

      return {
        number: data.number,
        html_url: data.html_url,
        state: data.state,
      };
    } catch (error) {
      console.error('GitHub API error:', error);
      throw new Error(`Failed to create pull request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRepositoryTree(owner: string, repo: string, sha: string = 'main'): Promise<Array<{
    path: string;
    mode: string;
    type: string;
    sha: string;
    size?: number;
    url: string;
  }>> {
    try {
      const { data } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: sha,
        recursive: 'true',
      });

      return data.tree.map(item => ({
        path: item.path || '',
        mode: item.mode || '',
        type: item.type || '',
        sha: item.sha || '',
        size: item.size,
        url: item.url || '',
      }));
    } catch (error) {
      console.error('GitHub API error:', error);
      throw new Error(`Failed to get repository tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
