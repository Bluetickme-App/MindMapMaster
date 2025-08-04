import { storage } from "../storage";

interface DemoStep {
  agentId: number;
  agentName: string;
  fileName: string;
  action: string;
  content: string;
  updateType: "thinking" | "partial" | "complete" | "error";
  delayMs: number;
}

export class LiveDemoOrchestrator {
  private static instance: LiveDemoOrchestrator;
  private isRunning = false;
  private sessionId = "";
  private steps: DemoStep[] = [];

  static getInstance(): LiveDemoOrchestrator {
    if (!LiveDemoOrchestrator.instance) {
      LiveDemoOrchestrator.instance = new LiveDemoOrchestrator();
    }
    return LiveDemoOrchestrator.instance;
  }

  async startGymBuddyDemo(): Promise<{
    sessionId: string;
    totalSteps: number;
  }> {
    if (this.isRunning) {
      throw new Error("Demo already running");
    }

    this.sessionId = `gym-buddy-${Date.now()}`;
    this.isRunning = true;

    // Get agents from database
    const agents = await storage.getAllAgents();
    const mayaDesigner = agents.find((a) => a.name.includes("Maya")) || {
      id: 3,
      name: "Maya Designer",
    };
    const samDeveloper = agents.find((a) => a.name.includes("Sam")) || {
      id: 2,
      name: "Sam Developer",
    };
    const jordanCSS = agents.find((a) => a.name.includes("Jordan")) || {
      id: 4,
      name: "Jordan CSS",
    };

    // Define the demo steps
    this.steps = [
      {
        agentId: mayaDesigner.id,
        agentName: mayaDesigner.name,
        fileName: "index.html",
        action: "Analyzing current HTML structure...",
        content:
          "Reviewing the basic gym buddy finder layout and identifying improvement opportunities.",
        updateType: "thinking",
        delayMs: 2000,
      },
      {
        agentId: mayaDesigner.id,
        agentName: mayaDesigner.name,
        fileName: "index.html",
        action: "Adding modern responsive layout",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gym Buddy Finder - Connect with Workout Partners</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 min-h-screen">`,
        updateType: "partial",
        delayMs: 3000,
      },
      {
        agentId: jordanCSS.id,
        agentName: jordanCSS.name,
        fileName: "styles.css",
        action: "Creating modern CSS animations and responsive design",
        content: `/* Gym Buddy Finder - Modern Styling */
.hero-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-hover {
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.card-hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeInUp {
  animation: fadeInUp 0.6s ease-out;
}`,
        updateType: "complete",
        delayMs: 4000,
      },
      {
        agentId: samDeveloper.id,
        agentName: samDeveloper.name,
        fileName: "app.js",
        action: "Implementing interactive functionality",
        content: `// Gym Buddy Finder - Interactive Features
class GymBuddyFinder {
  constructor() {
    this.users = [];
    this.filters = { location: '', workoutType: '', experience: '' };
    this.init();
  }

  init() {
    this.loadMockUsers();
    this.setupEventListeners();
    this.renderUserCards();
  }

  loadMockUsers() {
    this.users = [
      {
        id: 1,
        name: "Alex Chen",
        age: 28,
        location: "Downtown Gym",
        workoutType: "Strength Training",
        experience: "Advanced",
        bio: "Looking for a consistent workout partner for morning sessions",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
      },
      {
        id: 2,
        name: "Sarah Johnson",
        age: 25,
        location: "Crossfit Central",
        workoutType: "CrossFit",
        experience: "Intermediate",
        bio: "CrossFit enthusiast seeking motivation and friendly competition",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
      }
    ];
  }`,
        updateType: "partial",
        delayMs: 5000,
      },
      {
        agentId: samDeveloper.id,
        agentName: samDeveloper.name,
        fileName: "app.js",
        action: "Adding search and filter functionality",
        content: `  setupEventListeners() {
    // Search functionality
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      this.searchUsers(e.target.value);
    });

    // Filter functionality
    document.querySelectorAll('.filter-select').forEach(select => {
      select.addEventListener('change', (e) => {
        this.updateFilter(e.target.name, e.target.value);
        this.filterUsers();
      });
    });

    // Match button functionality
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('match-btn')) {
        this.sendMatchRequest(e.target.dataset.userId);
      }
    });
  }

  searchUsers(query) {
    const filtered = this.users.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.workoutType.toLowerCase().includes(query.toLowerCase()) ||
      user.location.toLowerCase().includes(query.toLowerCase())
    );
    this.renderUserCards(filtered);
  }`,
        updateType: "complete",
        delayMs: 4500,
      },
      {
        agentId: mayaDesigner.id,
        agentName: mayaDesigner.name,
        fileName: "index.html",
        action: "Adding user interface components",
        content: `    <!-- Navigation -->
    <nav class="bg-white/10 backdrop-blur-md shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <h1 class="text-2xl font-bold text-white">💪 Gym Buddy Finder</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                        Sign Up
                    </button>
                    <button class="border border-white text-white px-4 py-2 rounded-lg hover:bg-white/10">
                        Login
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-gradient py-20">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <h2 class="text-5xl font-bold text-white mb-6 animate-fadeInUp">
                Find Your Perfect Workout Partner
            </h2>
            <p class="text-xl text-blue-100 mb-8 animate-fadeInUp" style="animation-delay: 0.2s">
                Connect with like-minded fitness enthusiasts in your area
            </p>
            <div class="flex justify-center animate-fadeInUp" style="animation-delay: 0.4s">
                <input 
                    id="searchInput"
                    type="text" 
                    placeholder="Search by name, workout type, or location..."
                    class="w-96 px-6 py-3 rounded-l-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-r-lg">
                    Search
                </button>
            </div>
        </div>
    </section>`,
        updateType: "complete",
        delayMs: 6000,
      },
      {
        agentId: jordanCSS.id,
        agentName: jordanCSS.name,
        fileName: "styles.css",
        action: "Adding responsive mobile design",
        content: `/* Mobile Responsive Design */
@media (max-width: 768px) {
  .hero-gradient h2 {
    font-size: 2.5rem;
  }
  
  .search-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .search-container input {
    width: 100%;
    border-radius: 0.5rem;
  }
  
  .search-container button {
    width: 100%;
    border-radius: 0.5rem;
  }
  
  .user-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* User Card Animations */
.user-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.user-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.match-btn {
  background: linear-gradient(45deg, #10b981, #059669);
  transition: all 0.2s ease;
}

.match-btn:hover {
  background: linear-gradient(45deg, #059669, #047857);
  transform: scale(1.05);
}`,
        updateType: "complete",
        delayMs: 3500,
      },
      {
        agentId: samDeveloper.id,
        agentName: samDeveloper.name,
        fileName: "app.js",
        action: "Implementing user profiles and matching logic",
        content: `  renderUserCards(usersToRender = this.users) {
    const container = document.getElementById('userContainer');
    if (!container) return;

    container.innerHTML = usersToRender.map(user => \`
      <div class="user-card animate-fadeInUp">
        <div class="flex items-center mb-4">
          <img src="${user.avatar}" alt="${user.name}" class="w-16 h-16 rounded-full mr-4">
          <div>
            <h3 class="text-xl font-bold text-white">${user.name}</h3>
            <p class="text-blue-200">${user.age} years old</p>
          </div>
        </div>
        <div class="space-y-2 mb-4">
          <p class="text-white"><span class="font-semibold">Location:</span> ${user.location}</p>
          <p class="text-white"><span class="font-semibold">Workout:</span> ${user.workoutType}</p>
          <p class="text-white"><span class="font-semibold">Level:</span> ${user.experience}</p>
          <p class="text-blue-100 text-sm mt-3">${user.bio}</p>
        </div>
        <button 
          class="match-btn w-full py-2 px-4 rounded-lg text-white font-semibold"
          data-user-id="${user.id}"
        >
          Send Match Request
        </button>
      </div>
    \`).join('');
  }

  sendMatchRequest(userId) {
    const user = this.users.find(u => u.id == userId);
    if (user) {
      // Simulate match request
      setTimeout(() => {
        alert(\`Match request sent to \${user.name}! 🎉\`);
      }, 500);
    }
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new GymBuddyFinder();
});`,
        updateType: "complete",
        delayMs: 7000,
      },
      {
        agentId: mayaDesigner.id,
        agentName: mayaDesigner.name,
        fileName: "index.html",
        action: "Finalizing the complete user interface",
        content: `    <!-- Filters Section -->
    <section class="py-8 bg-white/5">
        <div class="max-w-7xl mx-auto px-4">
            <div class="flex flex-wrap justify-center gap-4">
                <select name="location" class="filter-select px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20">
                    <option value="">All Locations</option>
                    <option value="Downtown Gym">Downtown Gym</option>
                    <option value="Crossfit Central">Crossfit Central</option>
                    <option value="24/7 Fitness">24/7 Fitness</option>
                </select>
                <select name="workoutType" class="filter-select px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20">
                    <option value="">All Workouts</option>
                    <option value="Strength Training">Strength Training</option>
                    <option value="CrossFit">CrossFit</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Yoga">Yoga</option>
                </select>
                <select name="experience" class="filter-select px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20">
                    <option value="">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </select>
            </div>
        </div>
    </section>

    <!-- User Profiles Grid -->
    <section class="py-12">
        <div class="max-w-7xl mx-auto px-4">
            <h3 class="text-3xl font-bold text-white text-center mb-8">Available Workout Partners</h3>
            <div id="userContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 user-grid">
                <!-- User cards will be populated by JavaScript -->
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-black/20 py-8 mt-16">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <p class="text-blue-200">© 2025 Gym Buddy Finder. Built with ❤️ for fitness enthusiasts.</p>
        </div>
    </footer>

    <script src="app.js"></script>
</body>
</html>`,
        updateType: "complete",
        delayMs: 5000,
      },
    ];

    // Start executing the demo steps
    this.executeDemo();

    return {
      sessionId: this.sessionId,
      totalSteps: this.steps.length,
    };
  }

  private async executeDemo() {
    const globalWebSocketManager = (global as any).webSocketManager;

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];

      // Wait for the specified delay
      await new Promise((resolve) => setTimeout(resolve, step.delayMs));

      if (!this.isRunning) break; // Check if demo was stopped

      // Broadcast the step via WebSocket
      if (
        globalWebSocketManager &&
        typeof globalWebSocketManager.broadcastToAll === "function"
      ) {
        globalWebSocketManager.broadcastToAll({
          type: "liveUpdate",
          conversationId: 0,
          senderId: step.agentId,
          senderType: "agent",
          content: JSON.stringify({
            sessionId: this.sessionId,
            fileName: step.fileName,
            content: step.content,
            agentName: step.agentName,
            updateType: step.updateType,
            timestamp: new Date().toISOString(),
            action: step.action,
            stepNumber: i + 1,
            totalSteps: this.steps.length,
            progress: (((i + 1) / this.steps.length) * 100).toFixed(1),
          }),
          timestamp: new Date(),
        });
      }
    }

    // Demo completed
    if (this.isRunning) {
      setTimeout(() => {
        if (
          globalWebSocketManager &&
          typeof globalWebSocketManager.broadcastToAll === "function"
        ) {
          globalWebSocketManager.broadcastToAll({
            type: "liveUpdate",
            conversationId: 0,
            senderId: 0,
            senderType: "system",
            content: JSON.stringify({
              sessionId: this.sessionId,
              fileName: "DEMO_COMPLETE",
              content:
                "🎉 Gym Buddy Finder transformation complete! The basic HTML has been transformed into a modern, responsive web application with interactive features.",
              agentName: "System",
              updateType: "complete",
              timestamp: new Date().toISOString(),
              action: "Demo completed successfully",
              stepNumber: this.steps.length + 1,
              totalSteps: this.steps.length + 1,
              progress: "100.0",
            }),
            timestamp: new Date(),
          });
        }
        this.isRunning = false;
      }, 2000);
    }
  }

  stopDemo() {
    this.isRunning = false;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      sessionId: this.sessionId,
      totalSteps: this.steps.length,
    };
  }
}
