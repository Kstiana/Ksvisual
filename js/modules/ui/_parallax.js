class Parallax {
    constructor(options = {}) {
        this.options = {
            elements: '[data-parallax]',
            intensity: 0.5,
            smoothness: 0.1,
            ...options
        };
        
        this.elements = [];
        this.rafId = null;
        this.scrollY = 0;
        this.targetScrollY = 0;
        
        setTimeout(() => {
            this.init();
        }, 0);
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.startAnimation();
    }

    cacheElements() {
        const parallaxElements = document.querySelectorAll(this.options.elements);
        this.elements = Array.from(parallaxElements).map(element => ({
            element,
            intensity: parseFloat(element.getAttribute('data-parallax')) || this.options.intensity,
            smoothness: parseFloat(element.getAttribute('data-smoothness')) || this.options.smoothness,
            currentY: 0,
            targetY: 0
        }));
    }

    setupEventListeners() {
        const throttledScroll = window.utils?.throttle?.(() => {
            this.targetScrollY = window.scrollY;
        }, 16) || ((fn, limit) => {
            let inThrottle;
            return function() {
                if (!inThrottle) {
                    fn();
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        })(() => {
            this.targetScrollY = window.scrollY;
        }, 16);

        window.addEventListener('scroll', throttledScroll);
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.disable();
        }
    }

    startAnimation() {
        const animate = () => {
            this.scrollY += (this.targetScrollY - this.scrollY) * 0.1;

            this.elements.forEach(item => {
                this.updateElement(item);
            });

            this.rafId = requestAnimationFrame(animate);
        };

        animate();
    }

    updateElement(item) {
        const { element, intensity, smoothness } = item;
        const rect = element.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const distanceFromCenter = elementCenter - viewportCenter;
        
        item.targetY = distanceFromCenter * intensity * -1;
        item.currentY += (item.targetY - item.currentY) * smoothness;
        element.style.transform = `translateY(${item.currentY}px)`;
    }

    handleResize() {
        this.elements.forEach(item => {
            item.currentY = 0;
            item.targetY = 0;
            item.element.style.transform = 'translateY(0px)';
        });
    }

    addElements(newElements) {
        const elements = Array.isArray(newElements) ? newElements : [newElements];
        
        elements.forEach(element => {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }
            
            if (element && !this.elements.find(item => item.element === element)) {
                this.elements.push({
                    element,
                    intensity: parseFloat(element.getAttribute('data-parallax')) || this.options.intensity,
                    smoothness: parseFloat(element.getAttribute('data-smoothness')) || this.options.smoothness,
                    currentY: 0,
                    targetY: 0
                });
            }
        });
    }

    removeElements(elementsToRemove) {
        const elements = Array.isArray(elementsToRemove) ? elementsToRemove : [elementsToRemove];
        
        this.elements = this.elements.filter(item => {
            const shouldRemove = elements.some(element => 
                item.element === element || item.element.matches?.(element)
            );
            
            if (shouldRemove) {
                item.element.style.transform = '';
            }
            
            return !shouldRemove;
        });
    }

    enable() {
        if (this.rafId === null) {
            this.startAnimation();
        }
        
        this.elements.forEach(item => {
            item.element.style.willChange = 'transform';
        });
    }

    disable() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        this.elements.forEach(item => {
            item.element.style.transform = '';
            item.element.style.willChange = '';
        });
    }

    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }

    getElements() {
        return this.elements.map(item => item.element);
    }

    destroy() {
        this.disable();
        
        window.removeEventListener('scroll', this.boundScrollHandler);
        window.removeEventListener('resize', this.boundResizeHandler);
        
        this.elements.forEach(item => {
            item.element.style.transform = '';
        });
        
        this.elements = [];
    }
}

if (typeof window !== 'undefined') {
    window.Parallax = Parallax;
}