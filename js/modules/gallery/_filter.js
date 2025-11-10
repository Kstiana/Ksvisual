class GalleryFilter {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? 
            document.querySelector(container) : container;
        this.options = {
            filterButtons: '.filter-btn',
            activeClass: 'active',
            itemsSelector: '.gallery-item',
            categoryAttribute: 'data-category',
            tagAttribute: 'data-tags',
            searchInput: '#search-input',
            ...options
        };
        
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.activeFilters = new Set();
        
        this.init();
    }

    refreshFilters() {
        this.applyFilters();
    }

    init() {
        if (!this.container) {
            console.warn('Gallery filter container not found');
            return;
        }

        this.setupFilterButtons();
        this.setupSearch();
        this.setupURLParams();
        this.updateActiveFiltersDisplay();
    }

    setupFilterButtons() {
        const filterButtons = document.querySelectorAll(this.options.filterButtons);
        
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleFilterClick(button);
            });
        });
    }

    handleFilterClick(button) {
        const filter = button.getAttribute('data-filter');

        document.querySelectorAll(this.options.filterButtons).forEach(btn => {
            btn.classList.remove(this.options.activeClass);
        });
        button.classList.add(this.options.activeClass);

        this.currentFilter = filter;

        this.updateURL();

        this.applyFilters();
    }

    setupSearch() {
        const searchInput = document.querySelector(this.options.searchInput);
        if (!searchInput) return;

        const debouncedSearch = window.utils?.debounce?.(() => {
            this.currentSearch = searchInput.value.trim().toLowerCase();
            this.updateURL();
            this.applyFilters();
        }, 300) || ((fn, delay) => {
            let timeout;
            return function() {
                clearTimeout(timeout);
                timeout = setTimeout(fn, delay);
            };
        })(() => {
            this.currentSearch = searchInput.value.trim().toLowerCase();
            this.updateURL();
            this.applyFilters();
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);

        const clearButton = searchInput.parentNode.querySelector('.search-clear');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                searchInput.value = '';
                this.currentSearch = '';
                this.updateURL();
                this.applyFilters();
            });
        }
    }

    setupURLParams() {
        const urlParams = new URLSearchParams(window.location.search);

        const urlFilter = urlParams.get('category');
        if (urlFilter) {
            this.currentFilter = urlFilter;
            this.activateFilterButton(urlFilter);
        }

        const urlSearch = urlParams.get('search');
        if (urlSearch) {
            this.currentSearch = urlSearch.toLowerCase();
            const searchInput = document.querySelector(this.options.searchInput);
            if (searchInput) {
                searchInput.value = urlSearch;
            }
        }

        this.setupResetFiltersButton();
    }

    setupResetFiltersButton() {
        const resetButton = document.getElementById('reset-filters');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    activateFilterButton(filter) {
        const button = document.querySelector(`${this.options.filterButtons}[data-filter="${filter}"]`);
        if (button) {
            document.querySelectorAll(this.options.filterButtons).forEach(btn => {
                btn.classList.remove(this.options.activeClass);
            });
            button.classList.add(this.options.activeClass);
        }
    }

    applyFilters() {
        const items = this.container.querySelectorAll(this.options.itemsSelector);
        let visibleCount = 0;

        items.forEach(item => {
            const matchesFilter = this.matchesFilter(item);
            const matchesSearch = this.matchesSearch(item);

            if (matchesFilter && matchesSearch) {
                item.style.display = '';
                visibleCount++;
                this.animateItemIn(item);
            } else {
                item.style.display = 'none';
            }
        });

        this.updateResultsCount(visibleCount);
        this.toggleEmptyState(visibleCount === 0);

        this.container.dispatchEvent(new CustomEvent('filterApplied', {
            detail: {
                filter: this.currentFilter,
                search: this.currentSearch,
                visibleCount: visibleCount
            }
        }));
    }

    matchesFilter(item) {
        if (this.currentFilter === 'all') return true;
        
        const category = item.getAttribute(this.options.categoryAttribute);
        return category === this.currentFilter;
    }

    matchesSearch(item) {
        if (!this.currentSearch) return true;

        const searchableText = this.getSearchableText(item);
        return searchableText.toLowerCase().includes(this.currentSearch);
    }

    getSearchableText(item) {
        const title = item.getAttribute('data-title') || '';
        const description = item.getAttribute('data-description') || '';
        const tags = item.getAttribute('data-tags') || '';
        const location = item.getAttribute('data-location') || '';
        const camera = item.getAttribute('data-camera') || '';

        return `${title} ${description} ${tags} ${location} ${camera}`;
    }

    animateItemIn(item) {
        item.style.animation = 'none';
        setTimeout(() => {
            item.style.animation = 'fadeInUp 0.6s ease-out';
        }, 10);
    }

    updateResultsCount(count) {
        const totalCount = this.container.querySelectorAll(this.options.itemsSelector).length;
        const countElement = document.getElementById('visible-count');
        const totalElement = document.getElementById('total-count');

        if (countElement) countElement.textContent = count;
        if (totalElement) totalElement.textContent = totalCount;
    }

    toggleEmptyState(isEmpty) {
        const emptyState = document.getElementById('empty-state');
        const galleryGrid = document.getElementById('gallery-grid');
        
        if (emptyState && galleryGrid) {
            if (isEmpty) {
                emptyState.style.display = 'block';
                galleryGrid.style.display = 'none';
            } else {
                emptyState.style.display = 'none';
                galleryGrid.style.display = 'grid';
            }
        }
    }

    updateActiveFiltersDisplay() {
        const activeFiltersContainer = document.getElementById('active-filter-tags');
        const clearFiltersButton = document.getElementById('clear-filters');
        const activeFiltersSection = document.getElementById('active-filters');
        
        if (!activeFiltersContainer) return;

        activeFiltersContainer.innerHTML = '';

        if (this.currentFilter !== 'all') {
            const filterTag = this.createFilterTag(this.currentFilter, 'category');
            activeFiltersContainer.appendChild(filterTag);
        }

        if (this.currentSearch) {
            const searchTag = this.createFilterTag(this.currentSearch, 'search');
            activeFiltersContainer.appendChild(searchTag);
        }

        if (activeFiltersSection) {
            activeFiltersSection.style.display = 
                (this.currentFilter !== 'all' || this.currentSearch) ? 'flex' : 'none';
        }

        if (clearFiltersButton) {
            clearFiltersButton.replaceWith(clearFiltersButton.cloneNode(true));
            const newClearButton = document.getElementById('clear-filters');
            newClearButton.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    createFilterTag(value, type) {
        const tag = document.createElement('div');
        tag.className = 'active-filter-tag';
        
        let displayText = value;
        if (type === 'category') {
            displayText = this.formatCategoryName(value);
        }

        tag.innerHTML = `
            <span>${displayText}</span>
            <button class="active-filter-tag-remove" data-type="${type}" data-value="${value}">
                <i class="fas fa-times"></i>
            </button>
        `;

        const removeButton = tag.querySelector('.active-filter-tag-remove');
        removeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeFilter(type, value);
        });

        return tag;
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

    removeFilter(type, value) {
        if (type === 'category') {
            this.currentFilter = 'all';
            this.activateFilterButton('all');
        } else if (type === 'search') {
            this.currentSearch = '';
            const searchInput = document.querySelector(this.options.searchInput);
            if (searchInput) searchInput.value = '';
        }

        this.updateURL();
        this.applyFilters();
    }

    clearAllFilters() {
        this.currentFilter = 'all';
        this.currentSearch = '';

        const searchInput = document.querySelector(this.options.searchInput);
        if (searchInput) {
            searchInput.value = '';
        }
        document.querySelectorAll(this.options.filterButtons).forEach(btn => {
            btn.classList.remove(this.options.activeClass);
            if (btn.getAttribute('data-filter') === 'all') {
                btn.classList.add(this.options.activeClass);
            }
        });

        const url = new URL(window.location);
        url.search = '';
        window.history.replaceState({}, '', url);

        this.applyFilters();

        const activeFiltersSection = document.getElementById('active-filters');
        if (activeFiltersSection) {
            activeFiltersSection.style.display = 'none';
        }

        if (window.showToast) {
            window.showToast('All filters cleared', 'success');
        }
    }

    updateURL() {
        const url = new URL(window.location);
        
        if (this.currentFilter !== 'all') {
            url.searchParams.set('category', this.currentFilter);
        } else {
            url.searchParams.delete('category');
        }
        
        if (this.currentSearch) {
            url.searchParams.set('search', this.currentSearch);
        } else {
            url.searchParams.delete('search');
        }

        window.history.replaceState({}, '', url);
    }

    applyExternalFilter(filter, search = '') {
        this.currentFilter = filter;
        this.currentSearch = search;

        this.activateFilterButton(filter);
        const searchInput = document.querySelector(this.options.searchInput);
        if (searchInput) searchInput.value = search;

        this.updateURL();
        this.applyFilters();
    }

    destroy() {
        const filterButtons = document.querySelectorAll(this.options.filterButtons);
        filterButtons.forEach(button => {
            button.replaceWith(button.cloneNode(true));
        });

        const searchInput = document.querySelector(this.options.searchInput);
        if (searchInput) {
            searchInput.replaceWith(searchInput.cloneNode(true));
        }
    }
}

if (typeof window !== 'undefined') {
    window.GalleryFilter = GalleryFilter;
}
