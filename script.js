// WeLet Properties - Advanced Interactive JavaScript

// Global Variables
let currentProperties = [];
let isLoading = false;
let currentFilters = {};
let chatMessages = [];
let propertySearchTimeout;

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Remove loading screen
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => loadingScreen.remove(), 500);
        }
    }, 2000);

    // Initialize all components
    initializeNavigation();
    initializeScrollAnimations();
    initializeCounters();
    initializePropertySearch();
    initializeFilters();
    initializeChatSystem();
    initializeContactForm();
    loadFeaturedProperties();
    initializeAnalytics();
    
    // Add scroll event listener for navbar
    window.addEventListener('scroll', handleScroll);
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
}

// Navigation System
function initializeNavigation() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Hamburger menu toggle
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Close mobile menu
                hamburger?.classList.remove('active');
                navMenu?.classList.remove('active');
            }
        });
    });
}

// Scroll Handling
function handleScroll() {
    const navbar = document.getElementById('navbar');
    const scrolled = window.scrollY > 50;
    
    if (navbar) {
        navbar.classList.toggle('scrolled', scrolled);
    }
    
    // Update active navigation link
    updateActiveNavLink();
    
    // Trigger scroll animations
    animateOnScroll();
}

function updateActiveNavLink() {
    const sections = ['home', 'properties', 'services', 'ai-support', 'analytics', 'contact'];
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = 'home';
    
    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
                current = sectionId;
            }
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Scroll Animations
function initializeScrollAnimations() {
    const elements = document.querySelectorAll('.stat-item, .capability, .service-card, .property-card, .analytics-card');
    
    elements.forEach(element => {
        element.classList.add('animate-on-scroll');
    });
}

function animateOnScroll() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    
    elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        if (rect.top < windowHeight - 100) {
            element.classList.add('animated');
        }
    });
}

// Counter Animations
function initializeCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    let countersStarted = false;
    
    function startCounters() {
        if (countersStarted) return;
        countersStarted = true;
        
        counters.forEach(counter => {
            const target = parseFloat(counter.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                
                if (target % 1 === 0) {
                    counter.textContent = Math.floor(current);
                } else {
                    counter.textContent = current.toFixed(1);
                }
            }, 16);
        });
    }
    
    // Check if counters are in view
    function checkCounters() {
        const heroStats = document.querySelector('.hero-stats');
        if (heroStats) {
            const rect = heroStats.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                startCounters();
            }
        }
    }
    
    window.addEventListener('scroll', checkCounters);
    checkCounters(); // Check on load
}

// Property Search System
function initializePropertySearch() {
    const locationInput = document.getElementById('locationInput');
    const propertyType = document.getElementById('propertyType');
    const budgetInput = document.getElementById('budgetInput');
    const bedrooms = document.getElementById('bedrooms');
    
    // Location autocomplete
    if (locationInput) {
        locationInput.addEventListener('input', debounce(handleLocationSearch, 300));
    }
    
    // Real-time search
    [propertyType, budgetInput, bedrooms].forEach(element => {
        if (element) {
            element.addEventListener('change', updateSearch);
        }
    });
}

function handleLocationSearch(e) {
    const query = e.target.value;
    if (query.length < 3) return;
    
    // Simulate location suggestions
    const suggestions = [
        'Canary Wharf, London',
        'Richmond, London',
        'Shoreditch, London',
        'Kensington, London',
        'Chelsea, London',
        'Mayfair, London'
    ].filter(location => 
        location.toLowerCase().includes(query.toLowerCase())
    );
    
    showLocationSuggestions(suggestions);
}

function showLocationSuggestions(suggestions) {
    const suggestionsEl = document.getElementById('locationSuggestions');
    if (!suggestionsEl) return;
    
    if (suggestions.length === 0) {
        suggestionsEl.style.display = 'none';
        return;
    }
    
    suggestionsEl.innerHTML = suggestions.map(suggestion => 
        `<div class="suggestion-item" onclick="selectLocation('${suggestion}')">${suggestion}</div>`
    ).join('');
    
    suggestionsEl.style.display = 'block';
}

function selectLocation(location) {
    const locationInput = document.getElementById('locationInput');
    const suggestionsEl = document.getElementById('locationSuggestions');
    
    if (locationInput) locationInput.value = location;
    if (suggestionsEl) suggestionsEl.style.display = 'none';
    
    updateSearch();
}

function updateSearch() {
    const filters = {
        location: document.getElementById('locationInput')?.value || '',
        type: document.getElementById('propertyType')?.value || '',
        budget: document.getElementById('budgetInput')?.value || '',
        bedrooms: document.getElementById('bedrooms')?.value || ''
    };
    
    currentFilters = filters;
    loadFeaturedProperties();
}

function searchProperties() {
    updateSearch();
    scrollToSection('properties');
}

// Filter System
function initializeFilters() {
    const filterTags = document.querySelectorAll('.filter-tag');
    const viewButtons = document.querySelectorAll('.view-btn');
    const sortSelect = document.getElementById('sortProperties');
    
    // Filter tags
    filterTags.forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('active');
            updateSearch();
        });
    });
    
    // View toggle
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            togglePropertyView(btn.dataset.view);
        });
    });
    
    // Sort dropdown
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            sortProperties(sortSelect.value);
        });
    }
}

function togglePropertyView(view) {
    const propertiesGrid = document.getElementById('propertiesGrid');
    if (!propertiesGrid) return;
    
    if (view === 'list') {
        propertiesGrid.classList.add('list-view');
    } else {
        propertiesGrid.classList.remove('list-view');
    }
}

function sortProperties(sortBy) {
    // Sort logic would be implemented here
    console.log('Sorting by:', sortBy);
    loadFeaturedProperties();
}

// Property Loading System
function loadFeaturedProperties() {
    const propertiesGrid = document.getElementById('propertiesGrid');
    if (!propertiesGrid) return;
    
    // Show loading state
    propertiesGrid.innerHTML = '<div class="loading-properties">Loading properties...</div>';
    
    // Simulate API call
    setTimeout(() => {
        const properties = generatePropertyData();
        displayProperties(properties);
    }, 1000);
}

function generatePropertyData() {
    const propertyTypes = ['Luxury Apartment', 'Modern House', 'Designer Studio', 'Penthouse', 'Townhouse'];
    const locations = ['Canary Wharf', 'Richmond', 'Shoreditch', 'Kensington', 'Chelsea', 'Mayfair'];
    const images = [
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    ];
    
    const properties = [];
    
    for (let i = 0; i < 6; i++) {
        properties.push({
            id: i + 1,
            name: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
            location: locations[Math.floor(Math.random() * locations.length)] + ', London',
            price: Math.floor(Math.random() * 3000) + 1500,
            beds: Math.floor(Math.random() * 4) + 1,
            baths: Math.floor(Math.random() * 3) + 1,
            sqft: Math.floor(Math.random() * 2000) + 800,
            image: images[Math.floor(Math.random() * images.length)],
            badges: generateBadges(),
            featured: i < 3
        });
    }
    
    return properties;
}

function generateBadges() {
    const allBadges = ['Featured', 'Virtual Tour', 'New', 'AI Managed', 'Available'];
    const numBadges = Math.floor(Math.random() * 3) + 1;
    const selectedBadges = [];
    
    for (let i = 0; i < numBadges; i++) {
        const randomBadge = allBadges[Math.floor(Math.random() * allBadges.length)];
        if (!selectedBadges.includes(randomBadge)) {
            selectedBadges.push(randomBadge);
        }
    }
    
    return selectedBadges;
}

function displayProperties(properties) {
    const propertiesGrid = document.getElementById('propertiesGrid');
    if (!propertiesGrid) return;
    
    propertiesGrid.innerHTML = properties.map(property => createPropertyCard(property)).join('');
    
    // Add scroll animations to new cards
    const newCards = propertiesGrid.querySelectorAll('.property-card');
    newCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-on-scroll');
    });
    
    animateOnScroll();
}

function createPropertyCard(property) {
    const badgesHTML = property.badges.map(badge => 
        `<span class="badge ${badge.toLowerCase().replace(' ', '-')}">${badge}</span>`
    ).join('');
    
    return `
        <div class="property-card" data-property-id="${property.id}">
            <div class="property-image">
                <img src="${property.image}" alt="${property.name}" loading="lazy">
                <div class="property-badges">
                    ${badgesHTML}
                </div>
                <button class="virtual-tour-btn" onclick="startVirtualTour(${property.id})">
                    <i class="fas fa-vr-cardboard"></i>
                    360° Tour
                </button>
            </div>
            <div class="property-info">
                <h3>${property.name}</h3>
                <p class="property-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${property.location}
                </p>
                <div class="property-features">
                    <span><i class="fas fa-bed"></i> ${property.beds} Bed${property.beds > 1 ? 's' : ''}</span>
                    <span><i class="fas fa-bath"></i> ${property.baths} Bath${property.baths > 1 ? 's' : ''}</span>
                    <span><i class="fas fa-ruler-combined"></i> ${property.sqft.toLocaleString()} sq ft</span>
                </div>
                <div class="property-price">£${property.price.toLocaleString()}/month</div>
                <button class="property-cta" onclick="viewPropertyDetails(${property.id})">
                    View Details
                </button>
            </div>
        </div>
    `;
}

function loadMoreProperties() {
    const moreProperties = generatePropertyData();
    const propertiesGrid = document.getElementById('propertiesGrid');
    
    if (propertiesGrid) {
        const newCardsHTML = moreProperties.map(property => createPropertyCard(property)).join('');
        propertiesGrid.insertAdjacentHTML('beforeend', newCardsHTML);
        
        // Animate new cards
        const allCards = propertiesGrid.querySelectorAll('.property-card');
        const newCards = Array.from(allCards).slice(-moreProperties.length);
        
        newCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-on-scroll');
        });
        
        animateOnScroll();
    }
}

function startVirtualTour(propertyId) {
    // Simulate virtual tour launch
    showNotification('Virtual tour starting...', 'info');
    console.log('Starting virtual tour for property:', propertyId);
}

function viewPropertyDetails(propertyId) {
    // Simulate property details view
    showNotification('Loading property details...', 'info');
    console.log('Viewing details for property:', propertyId);
}

// Chat System
function initializeChatSystem() {
    const chatInput = document.getElementById('chatInput');
    const demoInput = document.getElementById('demoInput');
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    if (demoInput) {
        demoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendDemoMessage();
            }
        });
    }
    
    // Initialize demo chat messages
    initializeDemoChat();
}

function initializeDemoChat() {
    const demoMessages = [
        { type: 'ai', content: 'Hello! I\'m your AI assistant. How can I help you today?', time: '9:30 AM' },
        { type: 'user', content: 'My heating isn\'t working properly', time: '9:31 AM' },
        { type: 'ai', content: 'I\'ve detected a heating issue at your property. I\'m dispatching a certified technician who can arrive within 2 hours. You\'ll receive updates via SMS.', time: '9:31 AM' }
    ];
    
    chatMessages = demoMessages;
    displayChatMessages();
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput || !chatInput.value.trim()) return;
    
    const message = chatInput.value.trim();
    chatInput.value = '';
    
    // Add user message
    addChatMessage('user', message);
    
    // Simulate AI response
    setTimeout(() => {
        const response = generateAIResponse(message);
        addChatMessage('ai', response);
    }, 1000);
}

function sendQuickMessage(type) {
    let message = '';
    switch(type) {
        case 'heating issue':
            message = 'My heating isn\'t working properly';
            break;
        case 'maintenance request':
            message = 'I need to schedule maintenance';
            break;
        case 'lease inquiry':
            message = 'I have questions about my lease';
            break;
    }
    
    if (message) {
        addChatMessage('user', message);
        setTimeout(() => {
            const response = generateAIResponse(message);
            addChatMessage('ai', response);
        }, 1000);
    }
}

function addChatMessage(type, content) {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    chatMessages.push({ type, content, time });
    displayChatMessages();
}

function displayChatMessages() {
    const chatMessagesEl = document.getElementById('chatMessages');
    if (!chatMessagesEl) return;
    
    chatMessagesEl.innerHTML = chatMessages.map(msg => `
        <div class="message ${msg.type}-message">
            <div class="message-content">${msg.content}</div>
            <div class="message-time">${msg.time}</div>
        </div>
    `).join('');
    
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function generateAIResponse(userMessage) {
    const responses = {
        'heating': 'I\'ve detected a heating issue at your property. I\'m dispatching a certified technician who can arrive within 2 hours. You\'ll receive updates via SMS.',
        'maintenance': 'I can help you schedule maintenance. What type of maintenance do you need? I\'ll find the best available technician for you.',
        'lease': 'I\'d be happy to help with lease questions. What specific information do you need? I have access to all your lease documents.',
        'default': 'Thank you for your message. I\'m processing your request and will provide you with the best solution. Is there anything specific I can help you with?'
    };
    
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('heat')) return responses.heating;
    if (lowerMessage.includes('maintenance')) return responses.maintenance;
    if (lowerMessage.includes('lease')) return responses.lease;
    
    return responses.default;
}

// Demo Chat Modal
function openAIDemo() {
    const modal = document.getElementById('aiChatModal');
    if (modal) {
        modal.classList.add('active');
        initializeDemoMessages();
    }
}

function closeAIDemo() {
    const modal = document.getElementById('aiChatModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function initializeDemoMessages() {
    const demoMessages = document.getElementById('demoMessages');
    if (!demoMessages) return;
    
    const messages = [
        { type: 'ai', content: 'Hello! I\'m WeLet\'s AI assistant. Try asking me about property management, maintenance, or tenant services.' },
        { type: 'ai', content: 'You can ask me things like "Schedule maintenance" or "What\'s my rent due date?"' }
    ];
    
    demoMessages.innerHTML = messages.map(msg => `
        <div class="demo-message ${msg.type}-message">
            <div class="message-content">${msg.content}</div>
        </div>
    `).join('');
}

function sendDemoMessage() {
    const demoInput = document.getElementById('demoInput');
    const demoMessages = document.getElementById('demoMessages');
    
    if (!demoInput || !demoMessages || !demoInput.value.trim()) return;
    
    const message = demoInput.value.trim();
    demoInput.value = '';
    
    // Add user message
    const userMessageEl = document.createElement('div');
    userMessageEl.className = 'demo-message user-message';
    userMessageEl.innerHTML = `<div class="message-content">${message}</div>`;
    demoMessages.appendChild(userMessageEl);
    
    // Simulate AI response
    setTimeout(() => {
        const response = generateAIResponse(message);
        const aiMessageEl = document.createElement('div');
        aiMessageEl.className = 'demo-message ai-message';
        aiMessageEl.innerHTML = `<div class="message-content">${response}</div>`;
        demoMessages.appendChild(aiMessageEl);
        
        demoMessages.scrollTop = demoMessages.scrollHeight;
    }, 1000);
    
    demoMessages.scrollTop = demoMessages.scrollHeight;
}

// Contact Form
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Show loading state
    const submitBtn = e.target.querySelector('.form-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    // Simulate form submission
    setTimeout(() => {
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
        showNotification('Thank you! We\'ll be in touch soon.', 'success');
        
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            e.target.reset();
        }, 2000);
    }, 2000);
}

// Analytics Dashboard
function initializeAnalytics() {
    // Initialize charts would go here
    // For demo purposes, we'll just show static data
    updateAnalyticsData();
}

function updateAnalyticsData() {
    // This would connect to real analytics APIs
    console.log('Analytics data updated');
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const offsetTop = element.offsetTop - 80;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

function handleResize() {
    // Handle responsive behavior
    const navMenu = document.getElementById('nav-menu');
    const hamburger = document.getElementById('hamburger');
    
    if (window.innerWidth > 768) {
        navMenu?.classList.remove('active');
        hamburger?.classList.remove('active');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="closeNotification(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function closeNotification(btn) {
    const notification = btn.closest('.notification');
    if (notification) {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }
}

// Demo Functions
function startDemo() {
    showNotification('Demo starting - exploring AI-powered features...', 'info');
    
    setTimeout(() => {
        scrollToSection('ai-support');
    }, 1000);
}

// Global Event Listeners
document.addEventListener('click', (e) => {
    // Close dropdowns when clicking outside
    if (!e.target.closest('.search-group')) {
        const suggestions = document.getElementById('locationSuggestions');
        if (suggestions) suggestions.style.display = 'none';
    }
    
    // Close modal when clicking outside
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Performance Optimization
if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
}

// Service Worker Registration (for PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export functions for global access
window.WeLet = {
    searchProperties,
    selectLocation,
    startVirtualTour,
    viewPropertyDetails,
    sendMessage,
    sendQuickMessage,
    openAIDemo,
    closeAIDemo,
    sendDemoMessage,
    startDemo,
    scrollToSection,
    loadMoreProperties
};