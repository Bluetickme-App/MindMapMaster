import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Home, Users, Settings, Briefcase, MessageSquare, Star, 
  Code, Palette, Database, Rocket, Globe, ArrowRight,
  CheckCircle, Clock, TrendingUp, Award, Zap
} from "lucide-react";

const navigation = [
  { name: "Home", icon: Home, id: "home" },
  { name: "About", icon: Users, id: "about" },
  { name: "Services", icon: Briefcase, id: "services" },
  { name: "Portfolio", icon: Star, id: "portfolio" },
  { name: "Contact", icon: MessageSquare, id: "contact" }
];

const agents = [
  {
    id: 1,
    name: "Alex Senior",
    role: "Senior Developer",
    avatar: "AS",
    specialty: "System Architecture",
    experience: "8+ years",
    projects: 156,
    rating: 4.9,
    status: "online",
    provider: "OpenAI GPT-4o"
  },
  {
    id: 2,
    name: "Maya Designer",
    role: "UI/UX Designer",
    avatar: "MD",
    specialty: "Design Systems",
    experience: "6+ years", 
    projects: 203,
    rating: 4.8,
    status: "online",
    provider: "Claude Sonnet"
  },
  {
    id: 3,
    name: "Jordan DevOps",
    role: "DevOps Engineer",
    avatar: "JD",
    specialty: "Cloud Infrastructure",
    experience: "5+ years",
    projects: 98,
    rating: 4.7,
    status: "online",
    provider: "Gemini Pro"
  },
  {
    id: 4,
    name: "Riley PM",
    role: "Product Manager",
    avatar: "RP",
    specialty: "Project Strategy",
    experience: "7+ years",
    projects: 134,
    rating: 4.9,
    status: "online",
    provider: "OpenAI GPT-4o"
  }
];

const services = [
  {
    icon: Code,
    title: "Full-Stack Development",
    description: "Complete web applications with modern frameworks and technologies",
    features: ["React/Next.js", "Node.js/Express", "Database Design", "API Development"]
  },
  {
    icon: Palette,
    title: "UI/UX Design",
    description: "Beautiful, intuitive interfaces that users love to interact with",
    features: ["Design Systems", "Prototyping", "User Research", "Accessibility"]
  },
  {
    icon: Database,
    title: "Cloud Solutions",
    description: "Scalable infrastructure and deployment strategies",
    features: ["AWS/Azure", "CI/CD Pipelines", "Monitoring", "Security"]
  },
  {
    icon: Rocket,
    title: "AI Integration",
    description: "Smart features powered by cutting-edge AI technology",
    features: ["Machine Learning", "Natural Language", "Computer Vision", "Automation"]
  }
];

const portfolioProjects = [
  {
    id: 1,
    title: "E-Commerce Platform",
    description: "Modern shopping experience with real-time features",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop",
    tech: ["React", "Node.js", "PostgreSQL", "Stripe"],
    status: "Completed",
    client: "RetailCorp"
  },
  {
    id: 2,
    title: "Healthcare Dashboard",
    description: "Patient management system with analytics",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=250&fit=crop",
    tech: ["Vue.js", "Python", "MongoDB", "Chart.js"],
    status: "In Progress",
    client: "MedTech Solutions"
  },
  {
    id: 3,
    title: "Financial Analytics",
    description: "Real-time trading dashboard with AI insights",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop",
    tech: ["Angular", "C#", "Redis", "TensorFlow"],
    status: "Completed",
    client: "FinanceHub"
  }
];

export default function ShowcaseWebsite() {
  const [activeSection, setActiveSection] = useState("home");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DevTeam Pro</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Home Section */}
      <section id="home" className="pt-16 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Elite Development
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                {" "}Team
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              We're a team of passionate developers, designers, and strategists who craft 
              exceptional digital experiences using cutting-edge AI technology and modern development practices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => scrollToSection("services")}
              >
                View Our Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => scrollToSection("portfolio")}
              >
                See Our Work
              </Button>
            </div>
          </div>

          {/* Team Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">500+</div>
              <div className="text-slate-400">Projects Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">98%</div>
              <div className="text-slate-400">Client Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-slate-400">Support Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">5+</div>
              <div className="text-slate-400">Years Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Meet Our Team</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Our diverse team of experts brings together years of experience in modern web development,
              AI integration, and user experience design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {agents.map((agent) => (
              <Card key={agent.id} className="bg-slate-900/50 border-slate-700 hover:border-blue-500/50 transition-colors">
                <CardHeader className="text-center">
                  <div className="relative">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg">
                        {agent.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
                      agent.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                  </div>
                  <CardTitle className="text-white">{agent.name}</CardTitle>
                  <p className="text-blue-400">{agent.role}</p>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                    {agent.provider}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Specialty:</span>
                      <span className="text-slate-300">{agent.specialty}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Experience:</span>
                      <span className="text-slate-300">{agent.experience}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Projects:</span>
                      <span className="text-slate-300">{agent.projects}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Rating:</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-slate-300 ml-1">{agent.rating}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Services</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              From concept to deployment, we provide comprehensive development services
              tailored to your business needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="bg-slate-900/50 border-slate-700 hover:border-blue-500/50 transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <service.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">{service.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 mb-6">{service.description}</p>
                  <div className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center text-sm text-slate-400">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Portfolio</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Explore some of our recent projects that showcase our expertise
              and commitment to excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portfolioProjects.map((project) => (
              <Card key={project.id} className="bg-slate-900/50 border-slate-700 hover:border-blue-500/50 transition-colors overflow-hidden group">
                <div className="relative">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge variant={project.status === 'Completed' ? 'secondary' : 'outline'}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-white">{project.title}</CardTitle>
                  <p className="text-slate-400 text-sm">Client: {project.client}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech, techIndex) => (
                      <Badge key={techIndex} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Get In Touch</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Ready to start your next project? Let's discuss how we can help
              bring your vision to life.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Send us a message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Name
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Message
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="Tell us about your project..."
                      rows={6}
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Why Choose Us?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Award className="w-5 h-5 text-blue-500 mt-1" />
                    <div>
                      <h4 className="text-white font-semibold">Proven Excellence</h4>
                      <p className="text-slate-400 text-sm">98% client satisfaction rate with 500+ completed projects</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-purple-500 mt-1" />
                    <div>
                      <h4 className="text-white font-semibold">AI-Powered Development</h4>
                      <p className="text-slate-400 text-sm">Cutting-edge AI integration for smarter, faster solutions</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <h4 className="text-white font-semibold">Scalable Solutions</h4>
                      <p className="text-slate-400 text-sm">Built for growth with modern, maintainable architecture</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-yellow-500 mt-1" />
                    <div>
                      <h4 className="text-white font-semibold">24/7 Support</h4>
                      <p className="text-slate-400 text-sm">Round-the-clock assistance for all your needs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0">
                <CardContent className="p-6 text-center">
                  <h3 className="text-white font-bold text-xl mb-2">Ready to Start?</h3>
                  <p className="text-blue-100 mb-4">Let's build something amazing together</p>
                  <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                    Schedule a Call
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DevTeam Pro</span>
            </div>
            <p className="text-slate-400 mb-4">
              Elite development team powered by AI technology
            </p>
            <div className="flex justify-center space-x-6 text-slate-400">
              <span>© 2025 DevTeam Pro. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}