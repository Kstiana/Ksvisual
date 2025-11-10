class DarkMode {
    constructor(options = {}) {
        this.options = {
            toggleButton: '#theme-toggle',
            themeAttribute: 'data-theme',
            storageKey: 'ksvisual_theme',
            ...options
        };
        
        this.currentTheme = 'auto';
        this.supportedThemes = ['light', 'dark', 'high-contrast'];
        
        setTimeout(() => {
            this.init();
        }, 0);
    }

    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.applyTheme();
    }

    loadTheme() {
        this.currentTheme = window.storageManager?.getTheme() || 'auto';
    }

    setupEventListeners() {
        const toggleButton = document.querySelector(this.options.toggleButton);
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleTheme());
        }

        if (window.matchMedia) {
            this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.mediaQuery.addEventListener('change', (e) => {
                if (this.currentTheme === 'auto') {
                    this.applyTheme();
                }
            });
        }
    }

    toggleTheme() {
        if (this.currentTheme === 'light') {
            this.setTheme('dark');
        } else if (this.currentTheme === 'dark') {
            this.setTheme('high-contrast');
        } else if (this.currentTheme === 'high-contrast') {
            this.setTheme('auto');
        } else {
            this.setTheme('light');
        }
    }

    setTheme(theme) {
        if (!this.supportedThemes.includes(theme) && theme !== 'auto') {
            return;
        }

        this.currentTheme = theme;
        this.saveTheme();
        this.applyTheme();
        this.updateToggleButton();
    }

    applyTheme() {
        const themeToApply = this.getEffectiveTheme();
        document.documentElement.setAttribute(this.options.themeAttribute, themeToApply);
    }

    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            return this.getSystemTheme();
        }
        return this.currentTheme;
    }

    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    updateToggleButton() {
        const toggleButton = document.querySelector(this.options.toggleButton);
        if (!toggleButton) return;

        const icon = toggleButton.querySelector('i');
        if (!icon) return;

        const effectiveTheme = this.getEffectiveTheme();
        
        if (effectiveTheme === 'dark') {
            icon.className = 'fas fa-sun';
            toggleButton.setAttribute('aria-label', 'Switch to light mode');
        } else if (effectiveTheme === 'high-contrast') {
            icon.className = 'fas fa-accessibility';
            toggleButton.setAttribute('aria-label', 'Switch to auto theme');
        } else {
            icon.className = 'fas fa-moon';
            toggleButton.setAttribute('aria-label', 'Switch to dark mode');
        }
    }

    saveTheme() {
        if (window.storageManager) {
            window.storageManager.setTheme(this.currentTheme);
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getComputedTheme() {
        return this.getEffectiveTheme();
    }

    isDarkMode() {
        return this.getEffectiveTheme() === 'dark';
    }

    destroy() {
        if (this.mediaQuery) {
            this.mediaQuery.removeEventListener('change', this.boundMediaHandler);
        }
    }
}

if (typeof window !== 'undefined') {
    window.DarkMode = DarkMode;
}
