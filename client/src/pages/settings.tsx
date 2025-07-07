import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Check, X, Key, Settings, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ApiKeyStatus {
  provider: string;
  configured: boolean;
  valid: boolean;
  lastTested?: string;
  errorMessage?: string;
}

interface ApiKeyData {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  githubToken?: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<ApiKeyData>({});

  // Fetch API key status
  const { data: apiKeyStatus, isLoading } = useQuery<ApiKeyStatus[]>({
    queryKey: ['/api/settings/api-keys/status'],
  });

  // Fetch current user settings
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
  });

  // Update API keys mutation
  const updateApiKeys = useMutation({
    mutationFn: async (data: ApiKeyData) => {
      return await apiRequest(`/api/settings/api-keys`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "API keys updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/api-keys/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update API keys",
        variant: "destructive",
      });
    },
  });

  // Test API key mutation
  const testApiKey = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      return await apiRequest(`/api/settings/api-keys/test`, {
        method: 'POST',
        body: JSON.stringify({ provider, apiKey }),
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: `${variables.provider} API key is valid`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/api-keys/status'] });
    },
    onError: (error: any, variables) => {
      toast({
        title: "Error",
        description: `${variables.provider} API key test failed: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleToggleVisibility = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleInputChange = (provider: string, value: string) => {
    setFormData(prev => ({ ...prev, [provider]: value }));
  };

  const handleSaveKeys = () => {
    updateApiKeys.mutate(formData);
  };

  const handleTestKey = (provider: string) => {
    const keyMapping: Record<string, string> = {
      openai: 'openaiApiKey',
      anthropic: 'anthropicApiKey',
      gemini: 'geminiApiKey',
      github: 'githubToken',
    };
    
    const apiKey = formData[keyMapping[provider] as keyof ApiKeyData];
    if (apiKey) {
      testApiKey.mutate({ provider, apiKey });
    }
  };

  const renderApiKeyField = (
    provider: string,
    label: string,
    description: string,
    placeholder: string,
    formField: keyof ApiKeyData
  ) => {
    const status = apiKeyStatus?.find(s => s.provider === provider);
    const isVisible = showKeys[provider];
    const currentValue = formData[formField] || '';

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor={provider} className="text-sm font-medium">
              {label}
            </Label>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center space-x-2">
            {status && (
              <Badge variant={status.valid ? "default" : status.configured ? "secondary" : "outline"}>
                {status.valid ? (
                  <><Check className="w-3 h-3 mr-1" /> Valid</>
                ) : status.configured ? (
                  <><X className="w-3 h-3 mr-1" /> Invalid</>
                ) : (
                  <><Key className="w-3 h-3 mr-1" /> Not Set</>
                )}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="relative">
          <Input
            id={provider}
            type={isVisible ? "text" : "password"}
            placeholder={placeholder}
            value={currentValue}
            onChange={(e) => handleInputChange(formField, e.target.value)}
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleToggleVisibility(provider)}
              className="h-8 w-8 p-0"
            >
              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleTestKey(provider)}
              disabled={!currentValue || testApiKey.isPending}
              className="h-8 w-8 p-0"
            >
              <Zap className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {status?.errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{status.errorMessage}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your API keys and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider API Keys</CardTitle>
              <CardDescription>
                Configure your API keys for different AI providers to enable code generation and analysis features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderApiKeyField(
                'openai',
                'OpenAI API Key',
                'Required for GPT-4o code generation and analysis',
                'sk-...',
                'openaiApiKey'
              )}
              
              {renderApiKeyField(
                'anthropic',
                'Anthropic API Key',
                'Required for Claude Sonnet-4 advanced reasoning',
                'sk-ant-...',
                'anthropicApiKey'
              )}
              
              {renderApiKeyField(
                'gemini',
                'Google Gemini API Key',
                'Required for Gemini Pro/Flash multi-modal capabilities',
                'AI...',
                'geminiApiKey'
              )}
              
              {renderApiKeyField(
                'github',
                'GitHub Personal Access Token',
                'Required for repository integration and management',
                'ghp_...',
                'githubToken'
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={handleSaveKeys}
              disabled={updateApiKeys.isPending}
            >
              {updateApiKeys.isPending ? 'Saving...' : 'Save API Keys'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>
                Customize your development environment and workflow preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={userData?.username || ''}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={userData?.email || ''}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                
                <Alert>
                  <AlertDescription>
                    Additional preferences and customization options will be added in future updates.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}