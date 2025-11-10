class ErrorHandler {
    constructor() {
        this.setupGlobalErrorHandling();
    }

    setupGlobalErrorHandling() {
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('Unhandled Promise Rejection', event.reason);
        });

        window.addEventListener('error', (event) => {
            this.handleError('Runtime Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });
    }

    handleError(type, error, userMessage = null) {
        console.error(`[${type}]`, error);

        if (this.isMinorError(error)) return;

        this.showErrorToast(userMessage || this.getUserFriendlyMessage(error));
    }

    isMinorError(error) {
        const minorErrors = [
            'ResizeObserver',
            'Loading chunk',
            'NetworkError',
            'Failed to fetch'
        ];

        const errorString = error.toString ? error.toString() : String(error);
        return minorErrors.some(minorError => errorString.includes(minorError));
    }

    getUserFriendlyMessage(error) {
        const errorString = error.toString ? error.toString() : String(error);

        if (errorString.includes('NetworkError') || errorString.includes('Failed to fetch')) {
            return 'Network connection issue. Please check your internet connection.';
        } else if (errorString.includes('Loading chunk')) {
            return 'Application update available. Please refresh the page.';
        } else if (errorString.includes('ResizeObserver')) {
            return '';
        } else {
            return 'Something went wrong. Please try again.';
        }
    }

    showErrorToast(message) {
        if (!message) return;

        if (typeof window.showToast === 'function') {
            window.showToast(message, 'error');
        } else {
            console.error('Error Toast:', message);
        }
    }

    handleImageError(imgElement, fallbackSrc = null) {
        if (fallbackSrc) {
            imgElement.src = fallbackSrc;
        } else {
            imgElement.style.backgroundColor = '#f3f4f6';
            imgElement.style.display = 'flex';
            imgElement.style.alignItems = 'center';
            imgElement.style.justifyContent = 'center';
            imgElement.style.color = '#9ca3af';
            imgElement.innerHTML = '<i class="fas fa-image"></i>';
        }
    }

    handleApiError(error, action = 'perform this action') {
        console.error('API Error:', error);
        
        let message = `Failed to ${action}. `;
        
        if (error.status === 404) {
            message += 'The requested resource was not found.';
        } else if (error.status === 500) {
            message += 'Server error. Please try again later.';
        } else if (error.status === 403) {
            message += 'Access denied.';
        } else if (!navigator.onLine) {
            message += 'No internet connection.';
        } else {
            message += 'Please try again.';
        }

        this.showErrorToast(message);
    }
}

if (typeof window !== 'undefined') {
    window.errorHandler = new ErrorHandler();
}