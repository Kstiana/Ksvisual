class LazyLoader {
    constructor() {
        this.observer = null;
        this.observedElements = new Set();
        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            this.fallbackLazyLoad();
            return;
        }

        this.setupObserver();
        this.observeExistingElements();
    }

    setupObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadElement(entry.target);
                    this.observer.unobserve(entry.target);
                    this.observedElements.delete(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });
    }

    observeExistingElements() {
        const lazyElements = document.querySelectorAll('[data-lazy]');
        lazyElements.forEach(element => {
            this.observeElement(element);
        });
    }

    observeElement(element) {
        if (!this.observer || this.observedElements.has(element)) return;

        this.observer.observe(element);
        this.observedElements.add(element);
    }

    loadElement(element) {
        const src = element.getAttribute('data-src');
        const srcset = element.getAttribute('data-srcset');
        const background = element.getAttribute('data-bg');

        if (src && element.tagName === 'IMG') {
            this.loadImage(element, src, srcset);
        } else if (background) {
            this.loadBackground(element, background);
        }

        element.removeAttribute('data-lazy');
        element.removeAttribute('data-src');
        element.removeAttribute('data-srcset');
        element.removeAttribute('data-bg');

        element.dispatchEvent(new CustomEvent('lazyloaded', {
            bubbles: true
        }));
    }

    loadImage(imgElement, src, srcset) {
        imgElement.classList.add('lazy-loading');

        const image = new Image();
        
        image.onload = () => {
            imgElement.src = src;
            if (srcset) imgElement.srcset = srcset;
            imgElement.classList.remove('lazy-loading');
            imgElement.classList.add('lazy-loaded');
        };

        image.onerror = () => {
            imgElement.classList.remove('lazy-loading');
            imgElement.classList.add('lazy-error');
            if (typeof window.errorHandler !== 'undefined') {
                window.errorHandler.handleImageError(imgElement);
            }
        };

        image.src = src;
    }

    loadBackground(element, backgroundUrl) {
        element.classList.add('lazy-loading');

        const image = new Image();
        
        image.onload = () => {
            element.style.backgroundImage = `url(${backgroundUrl})`;
            element.classList.remove('lazy-loading');
            element.classList.add('lazy-loaded');
        };

        image.onerror = () => {
            element.classList.remove('lazy-loading');
            element.classList.add('lazy-error');
        };

        image.src = backgroundUrl;
    }

    fallbackLazyLoad() {
        const lazyElements = document.querySelectorAll('[data-lazy]');
        
        const loadAll = () => {
            lazyElements.forEach(element => {
                this.loadElement(element);
            });
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadAll);
        } else {
            loadAll();
        }
    }

    addLazyElements(elements) {
        if (!this.observer) return;

        elements.forEach(element => {
            this.observeElement(element);
        });
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observedElements.clear();
        }
    }
}

if (typeof window !== 'undefined') {
    window.lazyLoader = new LazyLoader();
}