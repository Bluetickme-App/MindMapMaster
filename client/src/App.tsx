import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import GeneratePage from "@/pages/generate";
import GitHubPage from "@/pages/github";
import SimpleProjectCreation from "@/pages/simple-project-creation";
import EnhancedCollaboration from "@/pages/enhanced-collaboration";
import DevUrls from "@/pages/DevUrls";
import SimpleCodeGenerator from "@/pages/SimpleCodeGenerator";
import ReplitWorkspaceClone from "@/pages/replit-workspace-clone";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/generate" component={GeneratePage} />
      <Route path="/github" component={GitHubPage} />
      <Route path="/create-simple" component={SimpleProjectCreation} />
      <Route path="/enhanced-collaboration" component={EnhancedCollaboration} />
      <Route path="/dev-urls" component={DevUrls} />
      <Route path="/simple-generator" component={SimpleCodeGenerator} />
      <Route path="/workspace" component={ReplitWorkspaceClone} />
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
