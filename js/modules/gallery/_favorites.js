class FavoritesManager {
    constructor(options = {}) {
        this.options = {
            favoriteButton: '.gallery-item-favorite',
            favoriteToggle: '#favorites-toggle',
            favoritesSidebar: '#favorites-sidebar',
            favoritesOverlay: '#favorites-overlay',
            favoritesClose: '#favorites-close',
            favoritesGrid: '#favorites-grid',
            favoritesEmpty: '#favorites-empty',
            favoritesCount: '#favorites-count',
            storageKey: 'ksvisual_favorites',
            ...options
        };
        
        this.favorites = new Set();
        this.isSidebarOpen = false;
        
        setTimeout(() => {
            this.init();
        }, 100);
    }

    init() {
        this.loadFavorites();
        this.setupEventListeners();
        this.updateUI();
    }

    loadFavorites() {
        const stored = window.storageManager?.getFavorites() || [];
        this.favorites = new Set(stored);
    }

    saveFavorites() {
        if (window.storageManager) {
            window.storageManager.setFavorites(Array.from(this.favorites));
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const favoriteBtn = e.target.closest(this.options.favoriteButton);
            if (favoriteBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFavorite(favoriteBtn);
            }
        });

        const favoritesToggle = document.querySelector(this.options.favoriteToggle);
        if (favoritesToggle) {
            favoritesToggle.addEventListener('click', () => this.toggleSidebar());
        }

        const favoritesClose = document.querySelector(this.options.favoritesClose);
        if (favoritesClose) {
            favoritesClose.addEventListener('click', () => this.closeSidebar());
        }

        const favoritesOverlay = document.querySelector(this.options.favoritesOverlay);
        if (favoritesOverlay) {
            favoritesOverlay.addEventListener('click', () => this.closeSidebar());
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSidebarOpen) {
                this.closeSidebar();
            }
        });
    }

    toggleFavorite(button) {
        const imageId = this.getImageIdFromButton(button);
        if (!imageId) return;

        const wasFavorite = this.favorites.has(imageId);
        
        if (wasFavorite) {
            this.favorites.delete(imageId);
        } else {
            this.favorites.add(imageId);
        }

        this.updateButtonState(button, !wasFavorite);
        this.updateUI();
        this.saveFavorites();

        this.showSimpleToast(!wasFavorite ? 'Added to favorites' : 'Removed from favorites');
    }

    getImageIdFromButton(button) {
        return button.closest('.gallery-item')?.getAttribute('data-id');
    }

    updateButtonState(button, isFavorite) {
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
            button.classList.toggle('active', isFavorite);
        }
    }

    updateUI() {
        this.updateFavoritesCount();
        this.updateAllFavoriteButtons();
    }

    updateFavoritesCount() {
        const countElement = document.querySelector(this.options.favoritesCount);
        if (countElement) {
            countElement.textContent = this.favorites.size;
            countElement.style.display = this.favorites.size > 0 ? 'block' : 'none';
        }
    }

    updateAllFavoriteButtons() {
        const favoriteButtons = document.querySelectorAll(this.options.favoriteButton);
        favoriteButtons.forEach(button => {
            const imageId = this.getImageIdFromButton(button);
            if (imageId) {
                this.updateButtonState(button, this.favorites.has(imageId));
            }
        });
    }

    showSimpleToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 99999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }

    toggleSidebar() {
        this.isSidebarOpen ? this.closeSidebar() : this.openSidebar();
    }

    openSidebar() {
        const sidebar = document.querySelector(this.options.favoritesSidebar);
        const overlay = document.querySelector(this.options.favoritesOverlay);
        
        if (sidebar && overlay) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            this.isSidebarOpen = true;
            document.body.style.overflow = 'hidden';
            this.updateFavoritesSidebar();
        }
    }

    closeSidebar() {
        const sidebar = document.querySelector(this.options.favoritesSidebar);
        const overlay = document.querySelector(this.options.favoritesOverlay);
        
        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            this.isSidebarOpen = false;
            document.body.style.overflow = '';
        }
    }

    updateFavoritesSidebar() {
        const favoritesGrid = document.querySelector(this.options.favoritesGrid);
        const favoritesEmpty = document.querySelector(this.options.favoritesEmpty);
        
        if (!favoritesGrid || !favoritesEmpty) return;

        if (this.favorites.size === 0) {
            favoritesGrid.style.display = 'none';
            favoritesEmpty.style.display = 'block';
            return;
        }

        favoritesGrid.style.display = 'grid';
        favoritesEmpty.style.display = 'none';
        favoritesGrid.innerHTML = '';

        this.favorites.forEach(imageId => {
            const galleryItem = document.querySelector(`[data-id="${imageId}"]`);
            if (galleryItem) {
                const clone = galleryItem.cloneNode(true);
                const favoriteBtn = clone.querySelector(this.options.favoriteButton);
                if (favoriteBtn) {
                    this.updateButtonState(favoriteBtn, true);
                }
                favoritesGrid.appendChild(clone);
            }
        });
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

window.FavoritesManager = FavoritesManager;
