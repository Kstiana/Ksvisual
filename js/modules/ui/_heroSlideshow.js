class HeroSlideshow {
    constructor() {
        this.slideshow = document.querySelector('.hero-slideshow');
        this.slides = document.querySelectorAll('.hero-slide');
        this.indicators = document.querySelectorAll('.slide-indicator');
        this.prevBtn = document.querySelector('.slide-prev');
        this.nextBtn = document.querySelector('.slide-next');
        
        this.currentSlide = 0;
        this.slideInterval = null;
        
        this.init();
    }
    
    init() {
        if (this.slides.length <= 1) return;
        
        this.startAutoSlide();
        this.setupEventListeners();
    }
    
    startAutoSlide() {
        this.slideInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    }
    
    setupEventListeners() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                this.prevSlide();
                this.resetAutoSlide();
            });
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                this.nextSlide();
                this.resetAutoSlide();
            });
        }
        
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.goToSlide(index);
                this.resetAutoSlide();
            });
        });
        
        
        this.slideshow.addEventListener('mouseenter', () => {
            clearInterval(this.slideInterval);
        });
        
        this.slideshow.addEventListener('mouseleave', () => {
            this.startAutoSlide();
        });
    }
    
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.updateSlides();
    }
    
    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.updateSlides();
    }
    
    goToSlide(index) {
        this.currentSlide = index;
        this.updateSlides();
    }
    
    updateSlides() {
        this.slides.forEach(slide => slide.classList.remove('active'));
        this.indicators.forEach(indicator => indicator.classList.remove('active'));
        
        this.slides[this.currentSlide].classList.add('active');
        this.indicators[this.currentSlide].classList.add('active');
    }
    
    resetAutoSlide() {
        clearInterval(this.slideInterval);
        this.startAutoSlide();
    }
    
    destroy() {
        clearInterval(this.slideInterval);
    }
}
