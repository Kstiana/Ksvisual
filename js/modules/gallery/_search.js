class GallerySearch {
    constructor(options = {}) {
        this.options = {
            searchInput: '#search-input',
            searchButton: '#search-button',
            clearButton: '#search-clear',
            suggestionsContainer: '#search-suggestions',
            recentSearchesKey: 'ksvisual_recent_searches',
            maxRecentSearches: 10,
            minCharsForSuggestions: 2,
            ...options
        };
        
        this.recentSearches = [];
        this.allTags = [];
        this.allCategories = [];
        this.allTitles = [];
    setTimeout(() => {
        this.init();
    }, 0);
    }

    async init() {
        await this.loadSearchData();
        this.setupSearchInput();
        this.setupRecentSearches();
        this.loadRecentSearches();
    }

    async loadSearchData() {
        try {
       
            if (window.galleryData) {
                this.processGalleryData(window.galleryData);
            } else {
                const response = await fetch('data.json');
                const data = await response.json();
                this.processGalleryData(data);
                window.galleryData = data; 
            }
        } catch (error) {
            console.warn('Failed to load search data:', error);
        }
    }

    processGalleryData(data) {
        const allTags = new Set();
        const allCategories = new Set();
        const allTitles = new Set();

        data.images?.forEach(image => {
           
            image.tags?.forEach(tag => allTags.add(tag.toLowerCase()));

            if (image.category) {
                allCategories.add(image.category);
            }

            if (image.title) {
                allTitles.add(image.title);
            }
        });

        this.allTags = Array.from(allTags);
        this.allCategories = Array.from(allCategories);
        this.allTitles = Array.from(allTitles);
    }

    setupSearchInput() {
        const searchInput = document.querySelector(this.options.searchInput);
        const clearButton = document.querySelector(this.options.clearButton);
        const suggestionsContainer = document.querySelector(this.options.suggestionsContainer);

        if (!searchInput) return;

        const debouncedInput = window.utils?.debounce?.(() => {
            this.handleInput(searchInput.value);
        }, 300) || ((fn, delay) => {
            let timeout;
            return function() {
                clearTimeout(timeout);
                timeout = setTimeout(fn, delay);
            };
        })(() => {
            this.handleInput(searchInput.value);
        }, 300);

        searchInput.addEventListener('input', debouncedInput);

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length >= this.options.minCharsForSuggestions) {
                this.showSuggestions(searchInput.value);
            } else {
                this.showRecentSearches();
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            this.handleKeyNavigation(e);
        });

        if (clearButton) {
            clearButton.addEventListener('click', () => {
                searchInput.value = '';
                this.hideSuggestions();
                this.updateClearButton();
                this.handleInput('');
            });

            this.updateClearButton();
        }

        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && 
                !suggestionsContainer?.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    handleInput(query) {
        this.updateClearButton();
        
        if (query.length >= this.options.minCharsForSuggestions) {
            this.showSuggestions(query);
        } else if (query.length === 0) {
            this.showRecentSearches();
        } else {
            this.hideSuggestions();
        }
    }

    updateClearButton() {
        const searchInput = document.querySelector(this.options.searchInput);
        const clearButton = document.querySelector(this.options.clearButton);
        
        if (clearButton) {
            const isVisible = searchInput.value.length > 0;
            clearButton.classList.toggle('visible', isVisible);
        }
    }

    showSuggestions(query) {
        const suggestions = this.generateSuggestions(query);
        const suggestionsContainer = document.querySelector(this.options.suggestionsContainer);
        
        if (!suggestionsContainer || suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        suggestionsContainer.innerHTML = this.renderSuggestions(suggestions, query);
        suggestionsContainer.classList.add('active');

        this.setupSuggestionClickHandlers();
    }

    generateSuggestions(query) {
        const suggestions = [];
        const queryLower = query.toLowerCase();

        const tagMatches = this.allTags
            .filter(tag => tag.includes(queryLower))
            .slice(0, 5)
            .map(tag => ({
                type: 'tag',
                text: tag,
                display: `#${tag}`
            }));

        const categoryMatches = this.allCategories
            .filter(category => category.toLowerCase().includes(queryLower))
            .slice(0, 3)
            .map(category => ({
                type: 'category',
                text: category,
                display: this.formatCategoryName(category)
            }));

        const titleMatches = this.allTitles
            .filter(title => title.toLowerCase().includes(queryLower))
            .slice(0, 3)
            .map(title => ({
                type: 'title',
                text: title,
                display: title
            }));

        suggestions.push(...tagMatches, ...categoryMatches, ...titleMatches);
        
        return suggestions.slice(0, 8); 
    }

    renderSuggestions(suggestions, query) {
        if (suggestions.length === 0) {
            return `
                <div class="search-suggestion">
                    <span class="suggestion-text">No results for "${query}"</span>
                </div>
            `;
        }

        return suggestions.map(suggestion => `
            <div class="search-suggestion" data-type="${suggestion.type}" data-value="${suggestion.text}">
                <span class="suggestion-text">${suggestion.display}</span>
                <span class="suggestion-type ${suggestion.type}">${suggestion.type}</span>
            </div>
        `).join('');
    }

    setupSuggestionClickHandlers() {
        const suggestions = document.querySelectorAll('.search-suggestion');
        let activeIndex = -1;

        suggestions.forEach((suggestion, index) => {
            suggestion.addEventListener('click', () => {
                this.selectSuggestion(suggestion);
            });

            suggestion.addEventListener('mouseenter', () => {
                this.setActiveSuggestion(activeIndex, false);
                activeIndex = index;
                this.setActiveSuggestion(activeIndex, true);
            });
        });

        activeIndex = -1;
    }

    setActiveSuggestion(index, isActive) {
        const suggestions = document.querySelectorAll('.search-suggestion');
        if (suggestions[index]) {
            suggestions[index].classList.toggle('active', isActive);
        }
    }

    handleKeyNavigation(e) {
        const suggestions = document.querySelectorAll('.search-suggestion');
        let activeIndex = Array.from(suggestions).findIndex(s => s.classList.contains('active'));

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                activeIndex = (activeIndex + 1) % suggestions.length;
                this.setActiveSuggestion(activeIndex, true);
                if (activeIndex === 0) {
                    this.setActiveSuggestion(suggestions.length - 1, false);
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                activeIndex = activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1;
                this.setActiveSuggestion(activeIndex, true);
                if (activeIndex === suggestions.length - 1) {
                    this.setActiveSuggestion(0, false);
                }
                break;

            case 'Enter':
                e.preventDefault();
                const activeSuggestion = document.querySelector('.search-suggestion.active');
                if (activeSuggestion) {
                    this.selectSuggestion(activeSuggestion);
                } else {
                    this.performSearch();
                }
                break;

            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }

    selectSuggestion(suggestion) {
        const type = suggestion.getAttribute('data-type');
        const value = suggestion.getAttribute('data-value');
        const searchInput = document.querySelector(this.options.searchInput);

        if (searchInput) {
            searchInput.value = value;
            this.hideSuggestions();
            this.performSearch();
            this.addToRecentSearches(value);
        }
    }

    performSearch() {
        const searchInput = document.querySelector(this.options.searchInput);
        const query = searchInput?.value.trim() || '';

        document.dispatchEvent(new CustomEvent('gallerySearch', {
            detail: { query }
        }));

        this.hideSuggestions();

        if (query) {
            this.addToRecentSearches(query);
        }
    }

    setupRecentSearches() {
        const suggestionsContainer = document.querySelector(this.options.suggestionsContainer);
        if (!suggestionsContainer) return;

   
    }

    loadRecentSearches() {
        this.recentSearches = window.storageManager?.getRecentSearches() || [];
    }

    showRecentSearches() {
        if (this.recentSearches.length === 0) return;

        const suggestionsContainer = document.querySelector(this.options.suggestionsContainer);
        if (!suggestionsContainer) return;

        const html = `
            <div class="search-suggestion-header">
                <span>Recent Searches</span>
                <button class="clear-recent" id="clear-recent-searches">Clear</button>
            </div>
            ${this.recentSearches.map(term => `
                <div class="search-suggestion recent-search" data-value="${term}">
                    <span class="suggestion-text">${term}</span>
                    <button class="recent-search-remove" data-term="${term}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('')}
        `;

        suggestionsContainer.innerHTML = html;
        suggestionsContainer.classList.add('active');

        const clearButton = document.getElementById('clear-recent-searches');
        if (clearButton) {
            clearButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearRecentSearches();
            });
        }

        document.querySelectorAll('.recent-search-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const term = button.getAttribute('data-term');
                this.removeRecentSearch(term);
            });
        });

        document.querySelectorAll('.recent-search').forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const term = suggestion.getAttribute('data-value');
                const searchInput = document.querySelector(this.options.searchInput);
                if (searchInput) {
                    searchInput.value = term;
                    this.performSearch();
                }
            });
        });
    }

    addToRecentSearches(term) {
        if (!term.trim()) return;

        this.recentSearches = this.recentSearches.filter(t => t !== term);

        this.recentSearches.unshift(term);

        this.recentSearches = this.recentSearches.slice(0, this.options.maxRecentSearches);

        if (window.storageManager) {
            window.storageManager.setRecentSearches(this.recentSearches);
        }
    }

    removeRecentSearch(term) {
        this.recentSearches = this.recentSearches.filter(t => t !== term);
        
        if (window.storageManager) {
            window.storageManager.setRecentSearches(this.recentSearches);
        }
        
        this.showRecentSearches();
    }

    clearRecentSearches() {
        this.recentSearches = [];
        
        if (window.storageManager) {
            window.storageManager.setRecentSearches([]);
        }
        
        this.hideSuggestions();
    }

    hideSuggestions() {
        const suggestionsContainer = document.querySelector(this.options.suggestionsContainer);
        if (suggestionsContainer) {
            suggestionsContainer.classList.remove('active');
        }
    }

    formatCategoryName(category) {
        const names = {
            landscapes: 'Landscapes',
            wildlife: 'Wildlife',
            travel: 'Travel',
            street: 'Street'
        };
        return names[category] || category;
    }

    setSearchQuery(query) {
        const searchInput = document.querySelector(this.options.searchInput);
        if (searchInput) {
            searchInput.value = query;
            this.performSearch();
        }
    }

    destroy() {

        const searchInput = document.querySelector(this.options.searchInput);
        if (searchInput) {
            searchInput.replaceWith(searchInput.cloneNode(true));
        }
        
        this.hideSuggestions();
    }
}

if (typeof window !== 'undefined') {
    window.GallerySearch = GallerySearch;
}
