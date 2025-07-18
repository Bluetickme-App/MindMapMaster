// TripleA Luxury Fashion - Replit-Level Premium JavaScript

class TripleALuxury {
    constructor() {
        this.init();
        this.setupAnimations();
        this.setupInteractions();
        this.setupParallax();
        this.setupLazyLoading();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupNavigation();
            this.setupHero();
            this.setupProducts();
            this.setupNewsletter();
            this.setupScrollEffects();
            this.setupPreloader();
            this.setupCursor();
        });
    }

    setupPreloader() {
        const preloader = document.createElement('div');
        preloader.className = 'preloader';
        preloader.innerHTML = `
            <div class="preloader-content">
                <div class="luxury-logo">
                    <h1>TripleA</h1>
                    <div class="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        document.body.prepend(preloader);

        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.style.opacity = '0';
                setTimeout(() => preloader.remove(), 500);
            }, 1000);
        });
    }

    setupCursor() {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);

        const cursorDot = document.createElement('div');
        cursorDot.className = 'cursor-dot';
        document.body.appendChild(cursorDot);

        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            
            setTimeout(() => {
                cursorDot.style.left = e.clientX + 'px';
                cursorDot.style.top = e.clientY + 'px';
            }, 100);
        });

        // Cursor interactions
        const interactiveElements = document.querySelectorAll('a, button, .product-card, .category-card');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('cursor-hover');
                cursorDot.classList.add('cursor-hover');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('cursor-hover');
                cursorDot.classList.remove('cursor-hover');
            });
        });
    }

    setupNavigation() {
        const header = document.querySelector('.main-header');
        const navToggle = document.createElement('button');
        navToggle.className = 'nav-toggle';
        navToggle.innerHTML = '<span></span><span></span><span></span>';
        
        // Scroll effects
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        // Smooth navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add search functionality
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', this.openSearch);
        }
    }

    setupHero() {
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const ctaButton = document.querySelector('.cta-button');
        
        // Typing animation for hero title
        if (heroTitle) {
            this.typeWriter(heroTitle, heroTitle.textContent, 50);
        }

        // Parallax hero background
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const hero = document.querySelector('.hero');
            if (hero) {
                hero.style.transform = `translateY(${scrolled * 0.5}px)`;
            }
        });

        // CTA button interaction
        if (ctaButton) {
            ctaButton.addEventListener('click', () => {
                this.showShopModal();
            });
        }
    }

    typeWriter(element, text, speed) {
        element.textContent = '';
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
    }

    setupProducts() {
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) return;

        // Generate luxury products
        const products = [
            {
                brand: 'VALENTINO',
                name: 'Rockstud Leather Handbag',
                price: '$2,899',
                image: 'luxury-bag.jpg',
                category: 'Handbags'
            },
            {
                brand: 'CHANEL',
                name: 'Classic Quilted Jacket',
                price: '$4,650',
                image: 'chanel-jacket.jpg',
                category: 'Outerwear'
            },
            {
                brand: 'HERMÈS',
                name: 'Silk Twill Scarf',
                price: '$425',
                image: 'hermes-scarf.jpg',
                category: 'Accessories'
            },
            {
                brand: 'SAINT LAURENT',
                name: 'Wyatt Harness Boots',
                price: '$1,295',
                image: 'ysl-boots.jpg',
                category: 'Footwear'
            },
            {
                brand: 'GUCCI',
                name: 'GG Marmont Shoulder Bag',
                price: '$2,100',
                image: 'gucci-bag.jpg',
                category: 'Handbags'
            },
            {
                brand: 'PRADA',
                name: 'Re-Edition 2005 Bag',
                price: '$1,750',
                image: 'prada-bag.jpg',
                category: 'Handbags'
            }
        ];

        productGrid.innerHTML = products.map(product => `
            <div class="product-card interactive-element" data-category="${product.category}">
                <div class="product-image">
                    <div class="product-overlay">
                        <button class="quick-view-btn">Quick View</button>
                        <button class="add-to-cart-btn">Add to Cart</button>
                    </div>
                    <div class="product-badge">New</div>
                </div>
                <div class="product-info">
                    <h5 class="product-brand">${product.brand}</h5>
                    <p class="product-name">${product.name}</p>
                    <p class="product-price">${product.price}</p>
                    <div class="product-rating">
                        <span class="stars">★★★★★</span>
                        <span class="rating-count">(127)</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Product interactions
        this.setupProductInteractions();
    }

    setupProductInteractions() {
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', (e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Quick view functionality
        document.querySelectorAll('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showQuickView(e.target.closest('.product-card'));
            });
        });

        // Add to cart functionality
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addToCart(e.target.closest('.product-card'));
            });
        });
    }

    setupNewsletter() {
        const form = document.querySelector('.newsletter-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]').value;
            
            if (this.validateEmail(email)) {
                this.showSuccessMessage('Thank you for subscribing to TripleA Luxury!');
                form.reset();
            } else {
                this.showErrorMessage('Please enter a valid email address.');
            }
        });
    }

    setupScrollEffects() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements
        document.querySelectorAll('.category-card, .product-card, .section-title').forEach(el => {
            observer.observe(el);
        });
    }

    setupAnimations() {
        // GSAP-like animations using CSS and vanilla JS
        this.animateCounters();
        this.setupParticles();
    }

    animateCounters() {
        const counters = document.querySelectorAll('[data-count]');
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            let current = 0;
            const increment = target / 100;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current);
                }
            }, 20);
        });
    }

    setupParticles() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(212, 175, 55, 0.3);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float ${3 + Math.random() * 4}s infinite linear;
            `;
            hero.appendChild(particle);
        }
    }

    setupInteractions() {
        // Shopping cart
        this.cart = JSON.parse(localStorage.getItem('tripleaCart') || '[]');
        this.updateCartCount();

        // Wishlist
        this.wishlist = JSON.parse(localStorage.getItem('tripleaWishlist') || '[]');
    }

    setupParallax() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            // Parallax for hero section
            const hero = document.querySelector('.hero');
            if (hero) {
                hero.style.transform = `translateY(${scrolled * 0.3}px)`;
            }

            // Parallax for category images
            document.querySelectorAll('.category-image').forEach((img, index) => {
                const speed = 0.1 + (index * 0.05);
                img.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }

    setupLazyLoading() {
        const lazyImages = document.querySelectorAll('.lazy-load');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-load');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // Utility methods
    showQuickView(productCard) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="quick-view-modal">
                <button class="close-modal">&times;</button>
                <div class="modal-content">
                    <div class="modal-image">
                        <div class="product-image-large">Product Image</div>
                    </div>
                    <div class="modal-details">
                        <h3>${productCard.querySelector('.product-name').textContent}</h3>
                        <p class="brand">${productCard.querySelector('.product-brand').textContent}</p>
                        <p class="price">${productCard.querySelector('.product-price').textContent}</p>
                        <div class="size-selector">
                            <label>Size:</label>
                            <select>
                                <option>XS</option>
                                <option>S</option>
                                <option>M</option>
                                <option>L</option>
                                <option>XL</option>
                            </select>
                        </div>
                        <button class="add-to-cart-large">Add to Cart</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    addToCart(productCard) {
        const product = {
            id: Date.now(),
            brand: productCard.querySelector('.product-brand').textContent,
            name: productCard.querySelector('.product-name').textContent,
            price: productCard.querySelector('.product-price').textContent,
            quantity: 1
        };

        this.cart.push(product);
        localStorage.setItem('tripleaCart', JSON.stringify(this.cart));
        this.updateCartCount();
        this.showSuccessMessage('Added to cart!');
    }

    updateCartCount() {
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            cartBtn.setAttribute('data-count', this.cart.length);
        }
    }

    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showErrorMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    openSearch() {
        const searchModal = document.createElement('div');
        searchModal.className = 'search-modal';
        searchModal.innerHTML = `
            <div class="search-container">
                <input type="text" placeholder="Search luxury fashion..." class="search-input">
                <button class="search-close">&times;</button>
                <div class="search-suggestions">
                    <div class="suggestion">Handbags</div>
                    <div class="suggestion">Dresses</div>
                    <div class="suggestion">Shoes</div>
                    <div class="suggestion">Accessories</div>
                </div>
            </div>
        `;

        document.body.appendChild(searchModal);
        searchModal.querySelector('.search-input').focus();
        
        searchModal.querySelector('.search-close').addEventListener('click', () => {
            searchModal.remove();
        });
    }

    showShopModal() {
        const modal = document.createElement('div');
        modal.className = 'shop-modal';
        modal.innerHTML = `
            <div class="shop-modal-content">
                <h2>Explore TripleA Collections</h2>
                <div class="collection-grid">
                    <div class="collection-item">
                        <h3>Women's Fashion</h3>
                        <p>Discover luxury pieces</p>
                    </div>
                    <div class="collection-item">
                        <h3>Men's Fashion</h3>
                        <p>Sophisticated style</p>
                    </div>
                    <div class="collection-item">
                        <h3>Accessories</h3>
                        <p>Perfect finishing touches</p>
                    </div>
                </div>
                <button class="close-shop-modal">Close</button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('.close-shop-modal').addEventListener('click', () => {
            modal.remove();
        });
    }
}

// Initialize the luxury experience
const tripleA = new TripleALuxury();

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TripleALuxury;
}