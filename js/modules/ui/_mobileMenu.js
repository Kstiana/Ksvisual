class MobileMenu {
    constructor(options = {}) {
    this.options = {
        menuToggle: '#mobile-menu-toggle',
        navMenu: '#nav-menu',
        navLinks: '.nav-link',
        header: '#header', 
        activeClass: 'active',
        ...options
    };
    
    this.isOpen = false;

    setTimeout(() => {
        this.init();
    }, 0);
}

    init() {
        this.setupEventListeners();
        this.setupResizeHandler();
        this.setupScrollHandler();
    }

    setupEventListeners() {
        const menuToggle = document.querySelector(this.options.menuToggle);
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleMenu());
        }

        const navLinks = document.querySelectorAll(this.options.navLinks);
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (this.isOpen) {
                    this.closeMenu();
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.isClickInsideMenu(e)) {
                this.closeMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });
    }

    setupResizeHandler() {
        const debouncedResize = window.utils?.debounce?.(() => {
            this.handleResize();
        }, 250) || ((fn, delay) => {
            let timeout;
            return function() {
                clearTimeout(timeout);
                timeout = setTimeout(fn, delay);
            };
        })(() => {
            this.handleResize();
        }, 250);

        window.addEventListener('resize', debouncedResize);
    }

    setupScrollHandler() {
    const header = document.querySelector(this.options.header);
    if (!header) return;

    const scrollHandler = window.utils?.throttle?.(() => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, 100) || ((fn, limit) => {
        let inThrottle;
        return function() {
            if (!inThrottle) {
                fn();
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    })(() => {
        const currentScrollY = window.scrollY;


        if (currentScrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, 100);

    window.addEventListener('scroll', scrollHandler);
}

    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        const navMenu = document.querySelector(this.options.navMenu);
        const menuToggle = document.querySelector(this.options.menuToggle);

        if (navMenu && menuToggle) {
            navMenu.classList.add(this.options.activeClass);
            menuToggle.classList.add(this.options.activeClass);
            this.isOpen = true;

            document.body.style.overflow = 'hidden';

            const firstLink = navMenu.querySelector('a');
            if (firstLink) {
                firstLink.focus();
            }

            document.dispatchEvent(new CustomEvent('mobileMenuOpen'));
        }
    }

    closeMenu() {
        const navMenu = document.querySelector(this.options.navMenu);
        const menuToggle = document.querySelector(this.options.menuToggle);

        if (navMenu && menuToggle) {
            navMenu.classList.remove(this.options.activeClass);
            menuToggle.classList.remove(this.options.activeClass);
            this.isOpen = false;
   
            document.body.style.overflow = '';
       
            menuToggle.focus();

            document.dispatchEvent(new CustomEvent('mobileMenuClose'));
        }
    }

    isClickInsideMenu(event) {
        const navMenu = document.querySelector(this.options.navMenu);
        const menuToggle = document.querySelector(this.options.menuToggle);
        
        return (navMenu && navMenu.contains(event.target)) || 
               (menuToggle && menuToggle.contains(event.target));
    }

    handleResize() {

        if (window.innerWidth > 768 && this.isOpen) {
            this.closeMenu();
        }
    }

    updateActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll(this.options.navLinks);
        
        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            link.classList.remove('active');
            

            if (currentPath.endsWith(linkPath) || 
                (currentPath === '/' && linkPath === 'index.html')) {
                link.classList.add('active');
            }
        });
    }

    setupSmoothScrolling() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link && link.getAttribute('href') !== '#') {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    this.scrollToElement(targetElement);

                    history.pushState(null, null, `#${targetId}`);
                }
            }
        });
    }

    scrollToElement(element) {
        const headerHeight = document.querySelector(this.options.header)?.offsetHeight || 0;
        const targetPosition = element.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    isMenuOpen() {
        return this.isOpen;
    }

    refreshNavLinks() {
        this.updateActiveNavLink();
    }

    destroy() {
        this.closeMenu();

        const menuToggle = document.querySelector(this.options.menuToggle);
        if (menuToggle) {
            menuToggle.replaceWith(menuToggle.cloneNode(true));
        }
        
        window.removeEventListener('resize', this.boundResizeHandler);
        window.removeEventListener('scroll', this.boundScrollHandler);
    }
}

if (typeof window !== 'undefined') {
    window.MobileMenu = MobileMenu;
}
