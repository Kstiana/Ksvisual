// Main JavaScript file - Initializes all modules
class PhotographyPortfolio {
    constructor() {
        this.modules = {};
        this.init();
    }

    async init() {
        try {
            this.setupGlobalEvents();
            
            await this.initUtils();
            
            this.initUI();
            
            this.initGallery();
            
            this.initForms();
            
            await this.loadInitialData();
            
        } catch (error) {
            console.error('Failed to initialize portfolio:', error);
        }
    }

    async initUtils() {
        console.log('✅ Utilities confirmed loaded via script tags');
    }

    initUI() {
        if (typeof DarkMode !== 'undefined') {
            this.modules.darkMode = new DarkMode();
        }

        if (typeof MobileMenu !== 'undefined') {
            this.modules.mobileMenu = new MobileMenu();
            this.modules.mobileMenu.updateActiveNavLink();
            this.modules.mobileMenu.setupSmoothScrolling();
        }

        if (typeof BackToTop !== 'undefined') {
            this.modules.backToTop = new BackToTop();
        }

        if (typeof ScrollAnimations !== 'undefined') {
            this.modules.scrollAnimations = new ScrollAnimations();
        }

        if (typeof Parallax !== 'undefined' && document.querySelector('[data-parallax]')) {
            this.modules.parallax = new Parallax();
        }
        
        if (typeof HeroSlideshow !== 'undefined' && document.querySelector('.hero-slideshow')) {
            this.modules.heroSlideshow = new HeroSlideshow();
        }
    }
    
    setupGlobalEvents() {
        this.setupToastSystem();
        this.registerServiceWorker();
    }

    initGallery() {
        const galleryContainer = document.getElementById('gallery-grid');

        if (galleryContainer) {
            if (typeof GalleryFilter !== 'undefined') {
                this.modules.galleryFilter = new GalleryFilter(galleryContainer);
            }

            if (typeof GallerySearch !== 'undefined') {
                this.modules.gallerySearch = new GallerySearch();
            }

            if (typeof FavoritesManager !== 'undefined') {
                this.modules.favorites = new FavoritesManager();
            }

            if (typeof Lightbox !== 'undefined') {
                this.modules.lightbox = new Lightbox();
            }
        }
    }
    
    initForms() {
        const contactForm = document.getElementById('contact-form');
        if (contactForm && typeof ContactForm !== 'undefined') {
            this.modules.contactForm = new ContactForm();
        }

        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            this.setupNewsletterForm(newsletterForm);
        }
    }

    setupNewsletterForm(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = form.querySelector('input[type="email"]');
            const email = emailInput?.value.trim();
            
            if (!email || !this.isValidEmail(email)) {
                window.showToast('Please enter a valid email address.', 'error');
                return;
            }

            window.showToast('Thank you for subscribing!', 'success');
            form.reset();
        });
    }

    setupToastSystem() {
        window.showToast = (message, type = 'info', duration = 5000) => {
            let toastContainer = document.getElementById('toast');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.id = 'toast';
                toastContainer.className = 'toast';
                document.body.appendChild(toastContainer);
            }

            const toast = document.createElement('div');
            toast.className = `toast-container toast-${type}`;
            toast.innerHTML = `
                <div class="toast-header">
                    <div class="toast-icon">
                        <i class="fas fa-${this.getToastIcon(type)}"></i>
                    </div>
                    <h4 class="toast-title">${this.getToastTitle(type)}</h4>
                    <button class="toast-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="toast-body">
                    <p class="toast-message">${message}</p>
                </div>
                <div class="toast-progress">
                    <div class="toast-progress-bar"></div>
                </div>
            `;

            toastContainer.appendChild(toast);
            toast.classList.add('active');

            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => {
                this.removeToast(toast);
            });
            
            const autoRemove = setTimeout(() => {
                this.removeToast(toast);
            }, duration);

            const progressBar = toast.querySelector('.toast-progress-bar');
            if (progressBar) {
                progressBar.style.animationDuration = `${duration}ms`;
            }

            toast.addEventListener('mouseenter', () => {
                clearTimeout(autoRemove);
                if (progressBar) {
                    progressBar.style.animationPlayState = 'paused';
                }
            });

            toast.addEventListener('mouseleave', () => {
                setTimeout(() => {
                    this.removeToast(toast);
                }, duration);
                if (progressBar) {
                    progressBar.style.animationPlayState = 'running';
                }
            });

            return toast;
        };
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getToastTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || 'Information';
    }

    removeToast(toast) {
        toast.classList.remove('active');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            window.showToast('New version available! Refresh to update.', 'info');
                        }
                    });
                });
                
            } catch (error) {
                console.warn('ServiceWorker registration failed:', error);
            }
        }
    }

    async loadInitialData() {
        const isGalleryPage = window.location.pathname.includes('gallery.html') || 
                             document.getElementById('gallery-grid');
        
        if (isGalleryPage) {
            await this.loadGalleryData();
        }

        const featuredGallery = document.getElementById('featured-gallery');
        if (featuredGallery) {
            await this.loadFeaturedImages();
        }
    }

    async loadGalleryData() {
        try {
            this.showLoadingState();
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const response = await fetch('data.json');
            const data = await response.json();
            
            window.galleryData = data;
            
            this.hideLoadingState();
            this.renderGalleryItems(data.images);
            
        } catch (error) {
            console.error('Failed to load gallery data:', error);
            this.hideLoadingState();
            window.showToast('Failed to load gallery images', 'error');
        }
    }

    showLoadingState() {
        const loadingState = document.getElementById('loading-state');
        const galleryGrid = document.getElementById('gallery-grid');
        const emptyState = document.getElementById('empty-state');
        
        if (loadingState) {
            this.generateSkeletonCards();
            loadingState.style.display = 'block';
        }
        if (galleryGrid) galleryGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
    }

    hideLoadingState() {
        const loadingState = document.getElementById('loading-state');
        const galleryGrid = document.getElementById('gallery-grid');
        
        if (loadingState) loadingState.style.display = 'none';
        if (galleryGrid) galleryGrid.style.display = 'grid';
    }

    generateSkeletonCards() {
        const skeletonGrid = document.querySelector('.skeleton-grid');
        if (!skeletonGrid) return;
        
        skeletonGrid.innerHTML = '';
        
        for (let i = 0; i < 12; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'skeleton-gallery-item';
            skeletonCard.innerHTML = `
                <div class="skeleton-gallery-image skeleton"></div>
                <div class="skeleton-gallery-content">
                    <div class="skeleton-text skeleton"></div>
                    <div class="skeleton-text skeleton-text-sm skeleton"></div>
                    <div class="skeleton-text skeleton-text-sm skeleton" style="width: 70%;"></div>
                </div>
            `;
            skeletonGrid.appendChild(skeletonCard);
        }
    }

    renderGalleryItems(images) {
        const galleryContainer = document.getElementById('gallery-grid');
        if (!galleryContainer) return;

        galleryContainer.style.opacity = '0';

        const fragment = document.createDocumentFragment();
        
        images.forEach(image => {
            const item = this.createGalleryItem(image);
            fragment.appendChild(item);
        });

        galleryContainer.appendChild(fragment);
        
        if (this.modules.lightbox) {
            this.modules.lightbox.refresh();
        }
        
        if (this.modules.galleryFilter) {
            this.modules.galleryFilter.refreshFilters();
        }
        
        if (window.lazyLoader) {
            const lazyImages = fragment.querySelectorAll('[data-lazy]');
            window.lazyLoader.addLazyElements(lazyImages);
        }
        
        setTimeout(() => {
            galleryContainer.style.opacity = '1';
        }, 100);
        
        this.hideLoadingState();
    }

    createGalleryItem(image, hideFavoriteButton = false) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.setAttribute('data-id', image.id);
        item.setAttribute('data-src', image.src);
        item.setAttribute('data-category', image.category);
        item.setAttribute('data-tags', image.tags.join(','));
        item.setAttribute('data-title', image.title);
        item.setAttribute('data-caption', image.caption);
        item.setAttribute('data-location', image.location);
        item.setAttribute('data-date', image.date);
        item.setAttribute('data-camera', image.camera);
        item.setAttribute('data-settings', image.settings);
        
        item.innerHTML = `
            <div class="gallery-item-image">
                <img src="${image.src}" 
                    alt="${image.title}" 
                    class="gallery-image"
                    loading="lazy">
                <div class="gallery-item-overlay">
                    <div class="gallery-item-content">
                        <h3 class="gallery-item-title">${image.title}</h3>
                        <div class="gallery-item-meta">
                            <span class="gallery-item-location">
                                <i class="fas fa-map-marker-alt"></i>
                                ${image.location}
                            </span>
                            <span class="gallery-item-date">
                                <i class="fas fa-calendar"></i>
                                ${new Date(image.date).toLocaleDateString()}
                            </span>
                        </div>
                        ${!hideFavoriteButton ? `
                        <div class="gallery-item-actions">
                            <button class="gallery-item-favorite" data-image-id="${image.id}">
                                <i class="far fa-heart"></i>
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="gallery-item-category">${image.category}</div>
            </div>
        `;

        return item;
    }

    async loadFeaturedImages() {
        try {
            const featuredGallery = document.getElementById('featured-gallery');
            if (!featuredGallery) return;

            await new Promise(resolve => setTimeout(resolve, 1500));

            const response = await fetch('data.json');
            const data = await response.json();
            
            const featuredImages = data.images.filter(img => img.featured).slice(0, 6);
            
            featuredGallery.innerHTML = '';
            this.renderFeaturedImages(featuredImages);
            
        } catch (error) {
            console.error('Failed to load featured images:', error);
            const featuredGallery = document.getElementById('featured-gallery');
            if (featuredGallery) {
                featuredGallery.innerHTML = '<p>Failed to load featured images</p>';
            }
        }
    }

    renderFeaturedImages(images) {
        const featuredGallery = document.getElementById('featured-gallery');
        if (!featuredGallery) return;

        const fragment = document.createDocumentFragment();
        
        images.forEach(image => {
            const item = this.createGalleryItem(image, true);
            fragment.appendChild(item);
        });

        featuredGallery.appendChild(fragment);
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getModule(name) {
        return this.modules[name];
    }

    destroy() {
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        this.modules = {};
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.portfolio = new PhotographyPortfolio();
        }, 100);
    });
} else {
    setTimeout(() => {
        window.portfolio = new PhotographyPortfolio();
    }, 100);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhotographyPortfolio;
}