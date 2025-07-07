import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Wand2, 
  Bug, 
  Github, 
  Book, 
  Rocket, 
  FlaskConical,
  Settings,
  Code,
  Monitor
} from "lucide-react";

const navigationItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/workspace", icon: Monitor, label: "Workspace" },
  { href: "/generate", icon: Wand2, label: "Code Generation" },
  { href: "/debug", icon: Bug, label: "Debug Assistant" },
  { href: "/github", icon: Github, label: "GitHub Integration" },
  { href: "/docs", icon: Book, label: "Documentation" },
  { href: "/deploy", icon: Rocket, label: "Deployment" },
  { href: "/testing", icon: FlaskConical, label: "API Testing" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="w-64 bg-surface border-r border-slate-700 flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Code className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">CodeCraft</h1>
            <p className="text-xs text-slate-400">AI Development Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  isActive 
                    ? 'bg-primary/10 border border-primary/20 text-primary' 
                    : 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.name ? getInitials(user.name) : 'JD'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-100">
              {user?.name || 'John Developer'}
            </p>
            <p className="text-xs text-slate-400">
              {user?.email || 'john@example.com'}
            </p>
          </div>
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
