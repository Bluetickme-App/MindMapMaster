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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
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
      <Route path="/team-discussion" component={TeamShowcaseDiscussion} />
      <Route path="/test-generation" component={TestGenerationPage} />
      <Route path="/create-project" component={CreateProjectPage} />
      <Route path="/project-builder" component={ProjectBuilderPage} />
      <Route path="/welet" component={WeletLandingPage} />
      <Route path="/welet-properties" component={WeLet} />
      <Route path="/replit" component={ReplitClone} />
      <Route path="/replit-clone" component={ReplitClone} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
