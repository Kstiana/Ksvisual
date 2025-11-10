class StorageManager {
    constructor() {
        this.storageAvailable = this.checkStorage();
    }

    checkStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    set(key, value) {
        if (!this.storageAvailable) return false;
        
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
            return true;
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
            return false;
        }
    }

    get(key, defaultValue = null) {
        if (!this.storageAvailable) return defaultValue;
        
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Failed to read from localStorage:', e);
            return defaultValue;
        }
    }

    remove(key) {
        if (!this.storageAvailable) return false;
        
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('Failed to remove from localStorage:', e);
            return false;
        }
    }

    clear() {
        if (!this.storageAvailable) return false;
        
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.warn('Failed to clear localStorage:', e);
            return false;
        }
    }

    getFavorites() {
        return this.get('ksvisual_favorites', []);
    }

    setFavorites(favorites) {
        return this.set('ksvisual_favorites', favorites);
    }

    getTheme() {
        return this.get('ksvisual_theme', 'auto');
    }

    setTheme(theme) {
        return this.set('ksvisual_theme', theme);
    }

    getRecentSearches() {
        return this.get('ksvisual_recent_searches', []);
    }

    setRecentSearches(searches) {
        const limitedSearches = searches.slice(-10);
        return this.set('ksvisual_recent_searches', limitedSearches);
    }
}

if (typeof window !== 'undefined') {
    window.storageManager = new StorageManager();
}