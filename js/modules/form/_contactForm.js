class ContactForm {
    constructor(options = {}) {
        this.options = {
            form: '#contact-form',
            submitButton: '#submit-btn',
            spinner: '#submit-spinner',
            messageContainer: '#form-message',
            ...options
        };
        
        this.isSubmitting = false;
        
        setTimeout(() => {
            this.init();
        }, 0);
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.initializeCharacterCounter();
    }

    cacheElements() {
        this.elements = {
            form: document.querySelector(this.options.form),
            submitButton: document.querySelector(this.options.submitButton),
            spinner: document.querySelector(this.options.spinner),
            messageContainer: document.querySelector(this.options.messageContainer),
            name: document.getElementById('name'),
            email: document.getElementById('email'),
            subject: document.getElementById('subject'),
            message: document.getElementById('message')
        };
    }

    setupEventListeners() {
        if (!this.elements.form) return;

        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        ['name', 'email', 'subject', 'message'].forEach(fieldName => {
            const field = this.elements[fieldName];
            if (field) {
                field.addEventListener('blur', () => this.validateSingleField(fieldName));
                field.addEventListener('input', () => this.clearFieldError(fieldName));
            }
        });
    }

    initializeCharacterCounter() {
        const messageField = this.elements.message;
        if (!messageField) return;

        this.counter = document.createElement('div');
        this.counter.className = 'character-counter';
        this.counter.innerHTML = `
            <span class="character-count">0</span>
            <span class="character-limit">/ 1000</span>
        `;

        messageField.parentNode.appendChild(this.counter);

        messageField.addEventListener('input', () => {
            this.updateCharacterCounter();
        });

        this.updateCharacterCounter();
    }

    updateCharacterCounter() {
        const messageField = this.elements.message;
        if (!messageField || !this.counter) return;

        const count = messageField.value.length;
        const countElement = this.counter.querySelector('.character-count');
        const limit = 1000;
        
        countElement.textContent = count;

        if (count > limit * 0.9) { 
            this.counter.classList.add('near-limit');
            this.counter.classList.remove('over-limit');
        } else if (count > limit) { 
            this.counter.classList.add('over-limit');
            this.counter.classList.remove('near-limit');
        } else { 
            this.counter.classList.remove('near-limit', 'over-limit');
        }
    }

    resetCharacterCounter() {
        if (this.counter) {
            const countElement = this.counter.querySelector('.character-count');
            countElement.textContent = '0';
            this.counter.classList.remove('near-limit', 'over-limit');
        }
    }

    async handleSubmit() {
        if (this.isSubmitting) return;

        const name = this.elements.name.value.trim();
        const email = this.elements.email.value.trim();
        const subject = this.elements.subject.value.trim();
        const message = this.elements.message.value.trim();
        
        // Validation
        if (!name || !email || !subject || !message) {
            this.showNotification('Please fill in all fields.', 'error');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address.', 'error');
            return;
        }

        if (message.length > 1000) {
            this.showNotification('Message should not exceed 1000 characters.', 'error');
            return;
        }

        this.setSubmitting(true);

        try {
            const formData = new FormData(this.elements.form);

            const response = await fetch('/', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded' 
                },
                body: new URLSearchParams(formData).toString()
            });
            
            if (response.ok) {
                this.showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
                this.elements.form.reset(); 
                this.resetCharacterCounter();
            } else {
                throw new Error('Failed to send message');
            }
            
        } catch (error) {
            this.showNotification('Failed to send message. Please email me directly at kstiana1@gmail.com', 'error');
            console.error('Form submission error:', error);
        } finally {
            this.setSubmitting(false);
        }
    }

    validateSingleField(fieldName) {
        const field = this.elements[fieldName];
        if (!field) return true;

        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        this.clearFieldError(fieldName);

        if (field.required && !value) {
            isValid = false;
            errorMessage = 'This field is required.';
        }

        if (fieldName === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address.';
        }

        if (fieldName === 'message' && value && value.length < 10) {
            isValid = false;
            errorMessage = 'Message must be at least 10 characters long.';
        }

        if (fieldName === 'name' && value && value.length < 2) {
            isValid = false;
            errorMessage = 'Name must be at least 2 characters long.';
        }

        if (!isValid) {
            this.showFieldError(fieldName, errorMessage);
        }

        return isValid;
    }

    showFieldError(fieldName, message) {
        const field = this.elements[fieldName];
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.add('has-error');

        let errorElement = document.getElementById(`${fieldName}-error`);
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'form-error';
            errorElement.id = `${fieldName}-error`;
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        field.setAttribute('aria-invalid', 'true');
    }

    clearFieldError(fieldName) {
        const field = this.elements[fieldName];
        const formGroup = field.closest('.form-group');
        if (!formGroup) return;

        formGroup.classList.remove('has-error');

        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.textContent = '';
        }

        field.removeAttribute('aria-invalid');
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setSubmitting(submitting) {
        this.isSubmitting = submitting;

        if (this.elements.submitButton) {
            this.elements.submitButton.disabled = submitting;
        }

        if (this.elements.spinner) {
            this.elements.spinner.style.display = submitting ? 'inline-block' : 'none';
        }

        ['name', 'email', 'subject', 'message'].forEach(fieldName => {
            const field = this.elements[fieldName];
            if (field) {
                field.disabled = submitting;
            }
        });
    }

    showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification__content">
                <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
                <span>${message}</span>
            </div>
            <button class="notification__close">
                <i class="fas fa-times"></i>
            </button>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);

        const closeBtn = notification.querySelector('.notification__close');
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    resetForm() {
        if (this.elements.form) {
            this.elements.form.reset();
            this.resetCharacterCounter();
            this.clearAllErrors();
        }
    }

    clearAllErrors() {
        ['name', 'email', 'subject', 'message'].forEach(fieldName => {
            this.clearFieldError(fieldName);
        });
    }
}

if (typeof window !== 'undefined') {
    window.ContactForm = ContactForm;
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .character-counter {
        text-align: right;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        color: #6b7280;
    }
    
    .character-counter.near-limit {
        color: #f59e0b;
    }
    
    .character-counter.over-limit {
        color: #ef4444;
        font-weight: bold;
    }
    
    .notification__close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 0.25rem;
        transition: background-color 0.2s;
    }
    
    .notification__close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(style);
