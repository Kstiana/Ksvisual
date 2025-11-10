class BackToTop {
    constructor(options = {}) {
        this.options = {
            button: '#back-to-top',
            visibleClass: 'visible',
            scrollThreshold: 300,
            ...options
        };
        
        this.isVisible = false;
        setTimeout(() => {
            this.init();
        }, 0);
    }

    init() {
        this.setupEventListeners();
        this.checkScrollPosition();
    }

    setupEventListeners() {
        const button = document.querySelector(this.options.button);
        if (!button) return;

        button.addEventListener('click', () => this.scrollToTop());

        window.addEventListener('scroll', () => {
            this.checkScrollPosition();
        });
    }

    checkScrollPosition() {
        const scrollY = window.scrollY;
        const button = document.querySelector(this.options.button);
        
        if (!button) return;

        if (scrollY > this.options.scrollThreshold && !this.isVisible) {
            this.showButton();
        } else if (scrollY <= this.options.scrollThreshold && this.isVisible) {
            this.hideButton();
        }
    }

    showButton() {
        const button = document.querySelector(this.options.button);
        if (button) {
            button.classList.add(this.options.visibleClass);
            this.isVisible = true;
        }
    }

    hideButton() {
        const button = document.querySelector(this.options.button);
        if (button) {
            button.classList.remove(this.options.visibleClass);
            this.isVisible = false;
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    destroy() {
        this.hideButton();
        window.removeEventListener('scroll', this.checkScrollPosition);
    }
}

if (typeof window !== 'undefined') {
    window.BackToTop = BackToTop;
}
