// TripleA Clone - Interactive JavaScript Features
// Sam AI - Adding luxury fashion interactivity

class TripleAApp {
    constructor() {
        this.cart = [];
        this.isLoading = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAnimations();
        this.setupSearch();
        this.setupCart();
        this.setupNewsletter();
        this.lazyLoadImages();
        console.log('TripleA Luxury Fashion App initialized');
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation interactions
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', this.handleNavigation.bind(this));
        });

        // Search functionality
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', this.toggleSearch.bind(this));
        }

        // Cart interactions
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', this.toggleCart.bind(this));
        }

        // CTA Button
        const ctaButton = document.querySelector('.cta-button');
        if (ctaButton) {
            ctaButton.addEventListener('click', this.handleCTAClick.bind(this));
        }

        // Product interactions
        this.setupProductInteractions();

        // Newsletter form
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', this.handleNewsletterSubmit.bind(this));
        }

        // Mobile menu toggle
        this.setupMobileMenu();

        // Scroll effects
        window.addEventListener('scroll', this.handleScroll.bind(this));
    }

    // Navigation Handler
    handleNavigation(e) {
        e.preventDefault();
        const target = e.target.getAttribute('href');
        
        if (target.startsWith('#')) {
            this.smoothScrollTo(target);
        } else {
            this.showComingSoon(`${e.target.textContent} collection`);
        }
    }

    // Smooth Scrolling
    smoothScrollTo(target) {
        const element = document.querySelector(target);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    // Search Functionality
    setupSearch() {
        this.searchOverlay = this.createSearchOverlay();
        document.body.appendChild(this.searchOverlay);
    }

    createSearchOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'search-overlay';
        overlay.innerHTML = `
            <div class="search-container">
                <button class="search-close">&times;</button>
                <input type="text" class="search-input" placeholder="Search luxury fashion...">
                <div class="search-suggestions">
                    <div class="suggestion">Women's Designer Bags</div>
                    <div class="suggestion">Men's Luxury Watches</div>
                    <div class="suggestion">Designer Shoes</div>
                    <div class="suggestion">Beauty Products</div>
                </div>
            </div>
        `;

        // Search overlay styles
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: flex-start;
            padding-top: 10vh;
        `;

        // Add search interactions
        const closeBtn = overlay.querySelector('.search-close');
        const searchInput = overlay.querySelector('.search-input');
        
        closeBtn.addEventListener('click', () => this.toggleSearch());
        searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
        
        return overlay;
    }

    toggleSearch() {
        const isVisible = this.searchOverlay.style.display === 'flex';
        this.searchOverlay.style.display = isVisible ? 'none' : 'flex';
        
        if (!isVisible) {
            const searchInput = this.searchOverlay.querySelector('.search-input');
            setTimeout(() => searchInput.focus(), 100);
        }
    }

    handleSearchInput(e) {
        const query = e.target.value.toLowerCase();
        console.log('Searching for:', query);
        // In a real app, this would trigger an API call
        this.showSearchResults(query);
    }

    showSearchResults(query) {
        if (query.length > 2) {
            const suggestions = this.searchOverlay.querySelector('.search-suggestions');
            suggestions.innerHTML = `
                <div class="suggestion">Designer ${query}</div>
                <div class="suggestion">Luxury ${query} Collection</div>
                <div class="suggestion">Premium ${query}</div>
            `;
        }
    }

    // Cart Functionality
    setupCart() {
        this.cartOverlay = this.createCartOverlay();
        document.body.appendChild(this.cartOverlay);
    }

    createCartOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'cart-overlay';
        overlay.innerHTML = `
            <div class="cart-container">
                <div class="cart-header">
                    <h3>Shopping Cart</h3>
                    <button class="cart-close">&times;</button>
                </div>
                <div class="cart-items">
                    <p class="empty-cart">Your cart is empty</p>
                </div>
                <div class="cart-footer">
                    <div class="cart-total">Total: $0.00</div>
                    <button class="checkout-btn">Checkout</button>
                </div>
            </div>
        `;

        overlay.style.cssText = `
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100%;
            background: white;
            z-index: 10000;
            transition: right 0.3s ease;
            box-shadow: -5px 0 15px rgba(0,0,0,0.1);
        `;

        const closeBtn = overlay.querySelector('.cart-close');
        closeBtn.addEventListener('click', () => this.toggleCart());

        return overlay;
    }

    toggleCart() {
        const isVisible = this.cartOverlay.style.right === '0px';
        this.cartOverlay.style.right = isVisible ? '-400px' : '0px';
    }

    // Product Interactions
    setupProductInteractions() {
        const productCards = document.querySelectorAll('.product-card, .category-card');
        
        productCards.forEach(card => {
            card.addEventListener('click', () => {
                this.handleProductClick(card);
            });

            // Add hover effects
            card.addEventListener('mouseenter', () => {
                this.addProductHoverEffect(card);
            });
        });
    }

    handleProductClick(card) {
        const productName = card.querySelector('.product-name, h4')?.textContent || 'Luxury Item';
        this.showProductModal(productName);
    }

    showProductModal(productName) {
        const modal = document.createElement('div');
        modal.className = 'product-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <h2>${productName}</h2>
                <div class="modal-image">Product Image</div>
                <p>Experience luxury fashion at its finest with this exclusive ${productName}.</p>
                <div class="modal-actions">
                    <button class="add-to-cart-btn">Add to Cart - $2,999</button>
                    <button class="wishlist-btn">♡ Add to Wishlist</button>
                </div>
            </div>
        `;

        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10001;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    addProductHoverEffect(card) {
        // Add dynamic pricing effect
        const priceElement = card.querySelector('.product-price');
        if (priceElement && !card.dataset.animated) {
            card.dataset.animated = 'true';
            
            setTimeout(() => {
                priceElement.style.color = '#d4af37';
                priceElement.style.fontWeight = 'bold';
            }, 300);

            card.addEventListener('mouseleave', () => {
                priceElement.style.color = '';
                priceElement.style.fontWeight = '';
                card.dataset.animated = '';
            });
        }
    }

    // CTA Button Handler
    handleCTAClick() {
        this.showLoadingEffect();
        
        setTimeout(() => {
            this.scrollToFeaturedProducts();
        }, 800);
    }

    showLoadingEffect() {
        const ctaButton = document.querySelector('.cta-button');
        const originalText = ctaButton.textContent;
        
        ctaButton.textContent = 'Loading...';
        ctaButton.disabled = true;
        
        setTimeout(() => {
            ctaButton.textContent = originalText;
            ctaButton.disabled = false;
        }, 800);
    }

    scrollToFeaturedProducts() {
        const featuredSection = document.querySelector('.featured-products');
        if (featuredSection) {
            featuredSection.scrollIntoView({
                behavior: 'smooth'
            });
        }
    }

    // Newsletter Functionality
    handleNewsletterSubmit(e) {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        
        if (this.validateEmail(email)) {
            this.showSuccessMessage('Thank you for subscribing to TripleA!');
            e.target.reset();
        } else {
            this.showErrorMessage('Please enter a valid email address.');
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Mobile Menu
    setupMobileMenu() {
        const navContainer = document.querySelector('.nav-container');
        
        // Create mobile menu button
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = '☰';
        mobileMenuBtn.style.cssText = `
            display: none;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
        `;

        navContainer.appendChild(mobileMenuBtn);

        // Mobile menu functionality
        mobileMenuBtn.addEventListener('click', () => {
            const navMenu = document.querySelector('.nav-menu');
            navMenu.classList.toggle('mobile-active');
        });

        // Show mobile menu button on small screens
        this.checkMobileView();
        window.addEventListener('resize', () => this.checkMobileView());
    }

    checkMobileView() {
        const mobileBtn = document.querySelector('.mobile-menu-btn');
        const navMenu = document.querySelector('.nav-menu');
        
        if (window.innerWidth <= 768) {
            mobileBtn.style.display = 'block';
            navMenu.style.display = navMenu.classList.contains('mobile-active') ? 'flex' : 'none';
        } else {
            mobileBtn.style.display = 'none';
            navMenu.style.display = 'flex';
        }
    }

    // Scroll Effects
    handleScroll() {
        const header = document.querySelector('.main-header');
        
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255,255,255,0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = '#ffffff';
            header.style.backdropFilter = 'none';
        }
    }

    // Animations
    setupAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animatedElements = document.querySelectorAll('.category-card, .product-card, .section-title');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // Lazy Loading
    lazyLoadImages() {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    // In a real app, this would load actual images
                    console.log('Loading image for:', img.className);
                    imageObserver.unobserve(img);
                }
            });
        });

        const placeholderImages = document.querySelectorAll('.product-image, .category-image, .hero-image');
        placeholderImages.forEach(img => imageObserver.observe(img));
    }

    // Utility Methods
    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }

    showErrorMessage(message) {
        this.showToast(message, 'error');
    }

    showComingSoon(feature) {
        this.showToast(`${feature} coming soon!`, 'info');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 4px;
            z-index: 10002;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tripleAApp = new TripleAApp();
});

// Additional luxury fashion features
const LuxuryFeatures = {
    // Virtual styling assistant
    virtualStylist() {
        console.log('Virtual Stylist feature activated');
    },

    // Personal shopper booking
    personalShopper() {
        console.log('Personal Shopper booking system');
    },

    // Exclusive member perks
    memberPerks() {
        console.log('Member exclusive features');
    },

    // Live chat with fashion consultants
    fashionConsultant() {
        console.log('Fashion consultant chat initiated');
    }
};

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TripleAApp, LuxuryFeatures };
}