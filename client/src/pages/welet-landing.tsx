import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import PropertyListings from '@/components/property-listings';
import { 
  Home, 
  MessageCircle, 
  Shield, 
  Clock, 
  Users, 
  Building,
  Wrench,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Star,
  CheckCircle,
  Bot
} from 'lucide-react';

export default function WeletLandingPage() {
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: string; content: string}>>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isTyping) return;
    
    const messageToSend = chatMessage;
    
    // Add user message to history
    const userMessage = { role: 'user', content: messageToSend };
    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');
    setIsTyping(true);
    
    try {
      const response = await fetch('/api/welet/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          conversationHistory: chatHistory
        })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      // Add AI response to history
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="w-8 h-8 text-teal-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                WeLet Properties
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#properties" className="hover:text-teal-600 transition-colors">Properties</a>
              <a href="#services" className="hover:text-teal-600 transition-colors">Services</a>
              <a href="#about" className="hover:text-teal-600 transition-colors">About</a>
              <a href="#contact" className="hover:text-teal-600 transition-colors">Contact</a>
              <Button className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700">
                Tenant Portal
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-teal-100 text-teal-800">AI-Powered Property Management</Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to Effortless<br />Property Living
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience 24/7 AI-powered support, automated maintenance coordination, 
            and cutting-edge property management solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700">
              Browse Properties <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setShowChat(true)}>
              <MessageCircle className="mr-2 w-4 h-4" /> Chat with AI Assistant
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="services" className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Revolutionary Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <CardTitle>24/7 AI Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Our intelligent AI assistant handles tenant queries instantly, 
                  any time of day or night. From maintenance requests to account questions.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Automated Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Report a leak? Our AI automatically contacts verified plumbers, 
                  schedules repairs, and keeps you updated every step of the way.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Virtual Property Tours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Explore properties with immersive 360° virtual tours. 
                  View every detail from the comfort of your current home.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Chat Widget */}
      {showChat && (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white dark:bg-slate-800 rounded-lg shadow-2xl border flex flex-col z-50">
          <div className="p-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-6 h-6" />
              <span className="font-semibold">WeLet AI Assistant</span>
            </div>
            <button onClick={() => setShowChat(false)} className="hover:opacity-80">✕</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {chatHistory.length === 0 && (
              <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg mb-4">
                <p className="text-sm">Hello! I'm your 24/7 property assistant. I can help with:</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Viewing available properties</li>
                  <li>• Scheduling viewings</li>
                  <li>• Reporting maintenance issues (I can dispatch contractors immediately!)</li>
                  <li>• Answering tenancy questions</li>
                </ul>
                <p className="text-sm mt-2 font-semibold">How can I help you today?</p>
              </div>
            )}
            
            {/* Chat History */}
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="text-left mb-4">
                <div className="inline-block bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input 
                placeholder="Type your message..." 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                className="flex-1"
                disabled={isTyping}
              />
              <Button 
                className="bg-gradient-to-r from-teal-600 to-blue-600"
                onClick={handleSendMessage}
                disabled={!chatMessage.trim() || isTyping}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Property Listings */}
      <PropertyListings />

      {/* Statistics */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-4xl font-bold text-teal-600">500+</h3>
              <p className="text-gray-600 dark:text-gray-300">Properties Managed</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-blue-600">24/7</h3>
              <p className="text-gray-600 dark:text-gray-300">AI Support Available</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-purple-600">2 Hour</h3>
              <p className="text-gray-600 dark:text-gray-300">Average Response Time</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-pink-600">98%</h3>
              <p className="text-gray-600 dark:text-gray-300">Tenant Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8">Get in Touch</h2>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-teal-600" />
              <span>0800 123 4567</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-teal-600" />
              <span>hello@weletproperties.co.uk</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              <span>London, UK</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 WeLet Properties. All rights reserved. | Powered by cutting-edge AI technology</p>
        </div>
      </footer>
    </div>
  );
}