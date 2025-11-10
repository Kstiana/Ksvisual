class ScrollAnimations {
    constructor(options = {}) {
        this.options = {
            animatedElements: '.scroll-reveal',
            animatedLeft: '.scroll-reveal-left',
            animatedRight: '.scroll-reveal-right',
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
            staggerDelay: 100,
            ...options
        };
        
        this.observer = null;
        this.animatedCount = 0;
        
        setTimeout(() => {
            this.init();
        }, 0);
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            this.fallbackAnimations();
            return;
        }

        this.setupObserver();
        this.observeElements();
        this.setupScrollHandler();
    }

    setupObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: this.options.rootMargin,
            threshold: this.options.threshold
        });
    }

    observeElements() {
        const selectors = [
            this.options.animatedElements,
            this.options.animatedLeft,
            this.options.animatedRight
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element, index) => {
                element.style.setProperty('--animation-delay', `${index * 0.1}s`);
                this.observer.observe(element);
            });
        });
    }

    animateElement(element) {
        element.classList.add('revealed');
        this.animatedCount++;

        element.dispatchEvent(new CustomEvent('scrollReveal', {
            bubbles: true
        }));

        if (element.classList.contains('scroll-reveal-left')) {
            this.animateFromLeft(element);
        } else if (element.classList.contains('scroll-reveal-right')) {
            this.animateFromRight(element);
        } else {
            this.animateFromBottom(element);
        }
    }

    animateFromBottom(element) {
    }

    animateFromLeft(element) {
    }

    animateFromRight(element) {
    }

    setupScrollHandler() {
        const throttledScroll = window.utils?.throttle?.(() => {
            this.handleScrollAnimations();
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
            this.handleScrollAnimations();
        }, 16);

        window.addEventListener('scroll', throttledScroll);
    }

    handleScrollAnimations() {
        this.animateProgressBars();
        this.animateCounters();
        this.animateParallax();
    }

    animateProgressBars() {
        const progressBars = document.querySelectorAll('.progress-fill');
        progressBars.forEach(bar => {
            const rect = bar.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight && rect.bottom >= 0;
            
            if (isInViewport && !bar.hasAttribute('data-animated')) {
                const width = bar.getAttribute('data-width') || '100%';
                bar.style.width = width;
                bar.setAttribute('data-animated', 'true');
            }
        });
    }

    animateCounters() {
        const counters = document.querySelectorAll('.stat-number, .count-up');
        counters.forEach(counter => {
            const rect = counter.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight && rect.bottom >= 0;
            
            if (isInViewport && !counter.hasAttribute('data-animated')) {
                this.animateCounter(counter);
                counter.setAttribute('data-animated', 'true');
            }
        });
    }

    animateCounter(counter) {
        const originalText = counter.textContent;
        const target = parseInt(originalText) || parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            counter.textContent = Math.round(current).toLocaleString() + '+';
        }, 16);
    }

    animateParallax() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        const scrollY = window.scrollY;

        parallaxElements.forEach(element => {
            const speed = parseFloat(element.getAttribute('data-parallax')) || 0.5;
            const yPos = -(scrollY * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }

    fallbackAnimations() {
        const animatedElements = document.querySelectorAll([
            this.options.animatedElements,
            this.options.animatedLeft,
            this.options.animatedRight
        ].join(','));

        animatedElements.forEach(element => {
            element.classList.add('revealed');
        });

        const counters = document.querySelectorAll('.stat-number, .count-up');
        counters.forEach(counter => {
            this.animateCounter(counter);
        });
    }

    addElements(elements) {
        if (!this.observer) return;

        elements.forEach(element => {
            this.observer.observe(element);
        });
    }

    animateImmediately(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            this.animateElement(element);
        });
    }

    reset() {
        const revealedElements = document.querySelectorAll('.revealed');
        revealedElements.forEach(element => {
            element.classList.remove('revealed');
            if (this.observer) {
                this.observer.observe(element);
            }
        });

        const counters = document.querySelectorAll('[data-animated]');
        counters.forEach(counter => {
            counter.removeAttribute('data-animated');
        });
    }

    getAnimatedCount() {
        return this.animatedCount;
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        window.removeEventListener('scroll', this.boundScrollHandler);
    }
}

if (typeof window !== 'undefined') {
    window.ScrollAnimations = ScrollAnimations;
}