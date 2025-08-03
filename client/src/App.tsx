import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import CollaborationDashboard from "@/pages/collaboration";
import TeamAgentsPage from "@/pages/team-agents";
import GeneratePage from "@/pages/generate";
import DebugPage from "@/pages/debug";
import GitHubPage from "@/pages/github";
import DocsPage from "@/pages/docs";
import DeployPage from "@/pages/deploy";
import TestingPage from "@/pages/testing";
import SettingsPage from "@/pages/settings";
import WorkspacePage from "@/pages/workspace";
import ShowcaseWebsite from "@/pages/showcase-website";
import TeamShowcaseDiscussion from "@/pages/team-showcase-discussion";
import TestGenerationPage from "@/pages/test-generation";
import CreateProjectPage from "@/pages/create-project";
import ProjectBuilderPage from "@/pages/project-builder";
import WeletLandingPage from "@/pages/welet-landing";
import WeLet from "@/pages/WeLet";
import ReplitClone from "@/pages/replit-clone";
import ExtensionsPage from "@/pages/extensions";
import ReplitAIEnhanced from "@/pages/replit-ai-enhanced";
import ReplitSimple from "@/pages/replit-simple";
import ReplitWorkspaceClone from "@/pages/replit-workspace-clone";
import AgentRoadmapFlow from "@/pages/agent-roadmap-flow";
import StreamlinedProjectCreation from "@/pages/streamlined-project-creation";
import SimpleProjectCreation from "@/pages/simple-project-creation";
import MultiAISDKDemo from "@/pages/multi-ai-sdk-demo";
import ProjectManagerChat from "@/pages/project-manager-chat";
import AdvancedCollaboration from "@/pages/advanced-collaboration";
import CreateStreamlined from "@/pages/create-streamlined";
import DevUrls from "@/pages/DevUrls";
import CodexEnhanced from "@/pages/CodexEnhanced";
import ClaudeSDK from "@/pages/ClaudeSDK";
import VibeCodeAgents from "@/pages/VideoCodeAgents";
import SimpleCodeGenerator from "@/pages/SimpleCodeGenerator";
import EnhancedCollaboration from "@/pages/enhanced-collaboration";
import ReplitWorkspace from "@/pages/replit-workspace";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/collaboration" component={CollaborationDashboard} />
      <Route path="/team-agents" component={TeamAgentsPage} />
      <Route path="/generate" component={GeneratePage} />
      <Route path="/debug" component={DebugPage} />
      <Route path="/github" component={GitHubPage} />
      <Route path="/docs" component={DocsPage} />
      <Route path="/deploy" component={DeployPage} />
      <Route path="/testing" component={TestingPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/workspace" component={WorkspacePage} />
      <Route path="/showcase" component={ShowcaseWebsite} />
      <Route path="/team-discussion">
        {() => <TeamShowcaseDiscussion conversationId="" onBack={() => {}} />}
      </Route>
      <Route path="/test-generation" component={TestGenerationPage} />
      <Route path="/create-project" component={CreateProjectPage} />
      <Route path="/project-builder" component={ProjectBuilderPage} />
      <Route path="/welet" component={WeletLandingPage} />
      <Route path="/welet-properties" component={WeLet} />
      <Route path="/replit" component={ReplitClone} />
      <Route path="/replit-clone" component={ReplitClone} />
      <Route path="/extensions" component={ExtensionsPage} />
      <Route path="/replit-ai-enhanced" component={ReplitAIEnhanced} />
      <Route path="/replit-simple" component={ReplitSimple} />
      <Route path="/replit-workspace-clone" component={ReplitWorkspaceClone} />
      <Route path="/agent-roadmap-flow" component={AgentRoadmapFlow} />
      <Route path="/create-streamlined" component={CreateStreamlined} />
      <Route path="/create-simple" component={SimpleProjectCreation} />
      <Route path="/multi-ai-sdk-demo" component={MultiAISDKDemo} />
      <Route path="/project-manager" component={ProjectManagerChat} />
      <Route path="/advanced-collaboration" component={AdvancedCollaboration} />
      <Route path="/dev-urls" component={DevUrls} />
      <Route path="/codex-enhanced" component={CodexEnhanced} />
      <Route path="/claude-sdk" component={ClaudeSDK} />
      <Route path="/vibe-code-agents" component={VibeCodeAgents} />
      <Route path="/simple-generator" component={SimpleCodeGenerator} />
      <Route path="/enhanced-collaboration" component={EnhancedCollaboration} />
      <Route path="/replit-workspace" component={ReplitWorkspace} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
