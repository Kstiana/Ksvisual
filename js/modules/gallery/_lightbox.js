class Lightbox {
    constructor(options = {}) {
        this.options = {
            lightbox: '#lightbox',
            lightboxImage: '#lightbox-image',
            lightboxTitle: '#lightbox-title',
            lightboxCaption: '#lightbox-caption',
            lightboxLocation: '#lightbox-location',
            lightboxDate: '#lightbox-date',
            lightboxCamera: '#lightbox-camera',
            lightboxSettings: '#lightbox-settings',
            lightboxTags: '#lightbox-tags',
            lightboxClose: '#lightbox-close',
            lightboxPrev: '#lightbox-prev',
            lightboxNext: '#lightbox-next',
            lightboxDownload: '#lightbox-download',
            lightboxShare: '#lightbox-share',
            lightboxFullscreen: '#lightbox-fullscreen',
            galleryItems: '.gallery-item',
            ...options
        };
        
        this.currentIndex = -1;
        this.images = [];
        this.isOpen = false;
        this.isFullscreen = false;
        this.boundKeyHandler = this.handleKeyboard.bind(this);
        
        setTimeout(() => {
            this.init();
        }, 0);
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
    }
    
    refresh() {
        this.collectImages();
    }

    cacheElements() {
        this.elements = {};
        
        Object.keys(this.options).forEach(key => {
            const selector = this.options[key];
            this.elements[key] = document.querySelector(selector);
        });
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.gallery-item-favorite')) return;
            
            const galleryItem = e.target.closest(this.options.galleryItems);
            if (galleryItem) {
                e.preventDefault();
                this.openFromGalleryItem(galleryItem);
            }
        });

        if (this.elements.lightboxClose) {
            this.elements.lightboxClose.addEventListener('click', () => this.close());
        }

        if (this.elements.lightboxPrev) {
            this.elements.lightboxPrev.addEventListener('click', () => this.previous());
        }

        if (this.elements.lightboxNext) {
            this.elements.lightboxNext.addEventListener('click', () => this.next());
        }

        if (this.elements.lightboxDownload) {
            this.elements.lightboxDownload.addEventListener('click', () => this.downloadImage());
        }

        if (this.elements.lightboxShare) {
            this.elements.lightboxShare.addEventListener('click', () => this.shareImage());
        }

        if (this.elements.lightboxFullscreen) {
            this.elements.lightboxFullscreen.addEventListener('click', () => this.toggleFullscreen());
        }

        document.addEventListener('keydown', this.boundKeyHandler);

        document.addEventListener('openLightbox', (e) => {
            const imageId = e.detail.imageId;
            this.openFromImageId(imageId);
        });

        this.setupTouchEvents();

        if (this.elements.lightbox) {
            this.elements.lightbox.addEventListener('click', (e) => {
                if (e.target === this.elements.lightbox) {
                    this.close();
                }
            });
        }
    }

    setupTouchEvents() {
        if (!this.elements.lightboxImage) return;

        let touchStartX = 0;
        let touchStartY = 0;

        this.elements.lightboxImage.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        this.elements.lightboxImage.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;

            if (Math.abs(diffX) > 50 && Math.abs(diffY) < 100) {
                if (diffX > 0) {
                    this.next();
                } else {
                    this.previous();
                }
            }
        });
    }

    collectImages() {
        const galleryItems = document.querySelectorAll(this.options.galleryItems);
        this.images = Array.from(galleryItems).map(item => this.extractImageData(item));
    }

    extractImageData(galleryItem) {
        return {
            id: galleryItem.getAttribute('data-id'),
            src: galleryItem.getAttribute('data-src') || 
                 galleryItem.querySelector('img')?.getAttribute('data-src') || 
                 galleryItem.querySelector('img')?.src,
            
            title: galleryItem.getAttribute('data-title') || 'Untitled',
            caption: galleryItem.getAttribute('data-caption') || '',
            location: galleryItem.getAttribute('data-location') || '',
            date: galleryItem.getAttribute('data-date') || '',
            camera: galleryItem.getAttribute('data-camera') || '',
            settings: galleryItem.getAttribute('data-settings') || '',
            tags: galleryItem.getAttribute('data-tags') ? 
                 galleryItem.getAttribute('data-tags').split(',') : []
        };
    }

    openFromGalleryItem(galleryItem) {
        const imageId = galleryItem.getAttribute('data-id');
        this.openFromImageId(imageId);
    }

    openFromImageId(imageId) {
        const index = this.images.findIndex(img => img.id === imageId);
        if (index !== -1) {
            this.open(index);
        }
    }

    open(index) {
        if (index < 0 || index >= this.images.length) return;

        this.currentIndex = index;
        this.isOpen = true;
        
        this.showLightbox();
        this.loadImage(this.images[index]);
        this.updateNavigation();
        this.disableBodyScroll();

        document.dispatchEvent(new CustomEvent('lightboxOpen', {
            detail: { image: this.images[index] }
        }));
    }

    showLightbox() {
        if (this.elements.lightbox) {
            this.elements.lightbox.classList.add('active');

            setTimeout(() => {
                this.elements.lightbox.focus();
            }, 100);
        }
    }

    async loadImage(image) {
        if (!this.elements.lightboxImage) return;

        this.showLoading();

        try {
            await this.preloadImage(image.src);

            this.elements.lightboxImage.src = image.src;
            this.elements.lightboxImage.alt = image.title;

            this.updateImageInfo(image);
 
            this.hideLoading();
            
        } catch (error) {
            console.error('Failed to load image:', error);
            this.showError();
        }
    }

    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    updateImageInfo(image) {
        if (this.elements.lightboxTitle) {
            this.elements.lightboxTitle.textContent = image.title;
        }

        if (this.elements.lightboxCaption) {
            this.elements.lightboxCaption.textContent = image.caption;
            this.elements.lightboxCaption.style.display = image.caption ? 'block' : 'none';
        }

        if (this.elements.lightboxLocation) {
            this.elements.lightboxLocation.textContent = image.location;
            this.elements.lightboxLocation.style.display = image.location ? 'block' : 'none';
        }

        if (this.elements.lightboxDate) {
            this.elements.lightboxDate.textContent = this.formatDate(image.date);
            this.elements.lightboxDate.style.display = image.date ? 'block' : 'none';
        }

        if (this.elements.lightboxCamera) {
            this.elements.lightboxCamera.textContent = image.camera;
            this.elements.lightboxCamera.style.display = image.camera ? 'block' : 'none';
        }

        if (this.elements.lightboxSettings) {
            this.elements.lightboxSettings.textContent = image.settings;
            this.elements.lightboxSettings.style.display = image.settings ? 'block' : 'none';
        }

        if (this.elements.lightboxTags) {
            this.updateTags(image.tags);
        }
    }

    updateTags(tags) {
        if (!this.elements.lightboxTags) return;

        this.elements.lightboxTags.innerHTML = tags.map(tag => 
            `<span class="lightbox-tag">${tag.trim()}</span>`
        ).join('');
    }

    showLoading() {
        if (this.elements.lightboxImage) {
            this.elements.lightboxImage.style.opacity = '0';
        }
        
        const loader = this.elements.lightbox?.querySelector('.lightbox-loader');
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.elements.lightboxImage) {
            this.elements.lightboxImage.style.opacity = '1';
        }
        
        const loader = this.elements.lightbox?.querySelector('.lightbox-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showError() {
        this.hideLoading();
    }

    updateNavigation() {
        if (this.elements.lightboxPrev) {
            this.elements.lightboxPrev.disabled = this.currentIndex === 0;
        }

        if (this.elements.lightboxNext) {
            this.elements.lightboxNext.disabled = this.currentIndex === this.images.length - 1;
        }
    }

    previous() {
        if (this.currentIndex > 0) {
            this.open(this.currentIndex - 1);
        }
    }

    next() {
        if (this.currentIndex < this.images.length - 1) {
            this.open(this.currentIndex + 1);
        }
    }

    toggleFullscreen() {
        if (!this.elements.lightbox) return;

        this.isFullscreen = !this.isFullscreen;
        
        if (this.isFullscreen) {
            this.elements.lightbox.classList.add('fullscreen');
            document.documentElement.requestFullscreen?.();
        } else {
            this.elements.lightbox.classList.remove('fullscreen');
            if (document.fullscreenElement) {
                document.exitFullscreen?.();
            }
            this.isFullscreen = false;
        }
    }

    async downloadImage() {
        const currentImage = this.images[this.currentIndex];
        if (!currentImage) return;

        try {
            const response = await fetch(currentImage.src);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentImage.title || 'image'}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            if (typeof window.showToast === 'function') {
                window.showToast('Image downloaded successfully', 'success');
            }
        } catch (error) {
            console.error('Download failed:', error);
            if (typeof window.showToast === 'function') {
                window.showToast('Download failed', 'error');
            }
        }
    }

    async shareImage() {
        const currentImage = this.images[this.currentIndex];
        if (!currentImage) return;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: currentImage.title,
                    text: currentImage.caption,
                    url: window.location.href 
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share failed:', error);
                }
            }
        } else {
            this.showShareFallback();
        }
    }

    showShareFallback() {
        if (typeof window.showToast === 'function') {
            window.showToast('Share functionality not available', 'info');
        }
    }

    handleKeyboard(e) {
        if (!this.isOpen) return;

        switch (e.key) {
            case 'Escape':
                this.close();
                break;
            case 'ArrowLeft':
                this.previous();
                break;
            case 'ArrowRight':
                this.next();
                break;
        }
    }

    close() {
        this.isOpen = false;
        
        if (this.elements.lightbox) {
            this.elements.lightbox.classList.remove('active');
        }
        
        this.enableBodyScroll();

        if (this.isFullscreen) {
            this.elements.lightbox?.classList.remove('fullscreen');
            if (document.fullscreenElement) {
                document.exitFullscreen?.();
            }
            this.isFullscreen = false;
        }

        document.dispatchEvent(new CustomEvent('lightboxClose'));
    }

    disableBodyScroll() {
        document.body.style.overflow = 'hidden';
    }

    enableBodyScroll() {
        document.body.style.overflow = '';
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    addImages(newImages) {
        this.images.push(...newImages);
    }

    refreshImages() {
        this.collectImages();
    }

    destroy() {
        this.close();
        document.removeEventListener('keydown', this.boundKeyHandler);
    }
}

if (typeof window !== 'undefined') {
    window.Lightbox = Lightbox;
}