/**
 * Sistema de Validación Frontend para Óolale
 * Validaciones consistentes en toda la aplicación
 */

const Validation = {
    /**
     * Validaciones de contraseña
     */
    password: {
        minLength: 8,
        maxLength: 255,
        
        validate(password) {
            const errors = [];
            
            if (!password || password.length < this.minLength) {
                errors.push(`La contraseña debe tener al menos ${this.minLength} caracteres`);
            }
            
            if (password && password.length > this.maxLength) {
                errors.push(`La contraseña no puede exceder ${this.maxLength} caracteres`);
            }
            
            if (!/[A-Z]/.test(password)) {
                errors.push('La contraseña debe contener al menos una letra mayúscula');
            }
            
            if (!/[a-z]/.test(password)) {
                errors.push('La contraseña debe contener al menos una letra minúscula');
            }
            
            if (!/[0-9]/.test(password)) {
                errors.push('La contraseña debe contener al menos un número');
            }
            
            if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
                errors.push('La contraseña debe contener al menos un carácter especial');
            }
            
            return {
                valid: errors.length === 0,
                errors
            };
        },
        
        checkStrength(password) {
            let strength = 0;
            
            if (password.length >= 8) strength++;
            if (password.length >= 12) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[a-z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) strength++;
            
            if (strength <= 2) return 'weak';
            if (strength <= 4) return 'medium';
            return 'strong';
        }
    },
    
    /**
     * Validaciones de email
     */
    email: {
        maxLength: 255,
        
        validate(email) {
            const errors = [];
            
            if (!email || email.trim() === '') {
                errors.push('El correo electrónico es obligatorio');
                return { valid: false, errors };
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errors.push('Formato de correo electrónico inválido');
            }
            
            if (email.length > this.maxLength) {
                errors.push(`El correo no puede exceder ${this.maxLength} caracteres`);
            }
            
            return {
                valid: errors.length === 0,
                errors
            };
        }
    },
    
    /**
     * Validaciones de nombre
     */
    name: {
        minLength: 3,
        maxLength: 255,
        
        validate(name, fieldName = 'nombre') {
            const errors = [];
            
            if (!name || name.trim() === '') {
                errors.push(`El ${fieldName} es obligatorio`);
                return { valid: false, errors };
            }
            
            const trimmedName = name.trim();
            
            if (trimmedName.length < this.minLength) {
                errors.push(`El ${fieldName} debe tener al menos ${this.minLength} caracteres`);
            }
            
            if (trimmedName.length > this.maxLength) {
                errors.push(`El ${fieldName} no puede exceder ${this.maxLength} caracteres`);
            }
            
            if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']+$/.test(trimmedName)) {
                errors.push(`El ${fieldName} solo puede contener letras, espacios y acentos`);
            }
            
            if (/\s{2,}/.test(trimmedName)) {
                errors.push(`El ${fieldName} no puede contener espacios múltiples consecutivos`);
            }
            
            return {
                valid: errors.length === 0,
                errors
            };
        }
    },
    
    /**
     * Validaciones de teléfono
     */
    phone: {
        validate(phone, required = false) {
            const errors = [];
            
            if (!phone || phone.trim() === '') {
                if (required) {
                    errors.push('El teléfono es obligatorio');
                }
                return { valid: !required, errors };
            }
            
            // Permitir formatos: +123456789, 123456789, (123) 456-7890, etc.
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(phone)) {
                errors.push('Formato de teléfono inválido');
            }
            
            // Verificar que tenga al menos 7 dígitos
            const digits = phone.replace(/\D/g, '');
            if (digits.length < 7) {
                errors.push('El teléfono debe tener al menos 7 dígitos');
            }
            
            if (digits.length > 15) {
                errors.push('El teléfono no puede tener más de 15 dígitos');
            }
            
            return {
                valid: errors.length === 0,
                errors
            };
        }
    },
    
    /**
     * Validaciones de texto general
     */
    text: {
        validate(text, fieldName, minLength = 1, maxLength = 1000, required = true) {
            const errors = [];
            
            if (!text || text.trim() === '') {
                if (required) {
                    errors.push(`${fieldName} es obligatorio`);
                }
                return { valid: !required, errors };
            }
            
            const trimmedText = text.trim();
            
            if (trimmedText.length < minLength) {
                errors.push(`${fieldName} debe tener al menos ${minLength} caracteres`);
            }
            
            if (trimmedText.length > maxLength) {
                errors.push(`${fieldName} no puede exceder ${maxLength} caracteres`);
            }
            
            return {
                valid: errors.length === 0,
                errors
            };
        }
    },
    
    /**
     * Validaciones de número
     */
    number: {
        validate(value, fieldName, min = null, max = null, required = true) {
            const errors = [];
            
            if (value === null || value === undefined || value === '') {
                if (required) {
                    errors.push(`${fieldName} es obligatorio`);
                }
                return { valid: !required, errors };
            }
            
            const num = Number(value);
            
            if (isNaN(num)) {
                errors.push(`${fieldName} debe ser un número válido`);
                return { valid: false, errors };
            }
            
            if (min !== null && num < min) {
                errors.push(`${fieldName} debe ser mayor o igual a ${min}`);
            }
            
            if (max !== null && num > max) {
                errors.push(`${fieldName} debe ser menor o igual a ${max}`);
            }
            
            return {
                valid: errors.length === 0,
                errors
            };
        }
    },
    
    /**
     * Validaciones de fecha
     */
    date: {
        validate(dateString, fieldName, required = true) {
            const errors = [];
            
            if (!dateString || dateString.trim() === '') {
                if (required) {
                    errors.push(`${fieldName} es obligatoria`);
                }
                return { valid: !required, errors };
            }
            
            const date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                errors.push(`${fieldName} no es una fecha válida`);
            }
            
            return {
                valid: errors.length === 0,
                errors
            };
        },
        
        isFuture(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            return date > now;
        },
        
        isPast(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            return date < now;
        }
    },
    
    /**
     * Validaciones de URL
     */
    url: {
        validate(url, required = false) {
            const errors = [];
            
            if (!url || url.trim() === '') {
                if (required) {
                    errors.push('La URL es obligatoria');
                }
                return { valid: !required, errors };
            }
            
            try {
                new URL(url);
            } catch (e) {
                errors.push('Formato de URL inválido');
            }
            
            return {
                valid: errors.length === 0,
                errors
            };
        }
    },
    
    /**
     * Utilidades para mostrar errores en el DOM
     */
    ui: {
        showError(elementId, message) {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            // Agregar clase de error al input
            element.classList.add('is-invalid');
            element.classList.remove('is-valid');
            
            // Buscar o crear elemento de feedback
            let feedback = element.nextElementSibling;
            if (!feedback || !feedback.classList.contains('invalid-feedback')) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                element.parentNode.insertBefore(feedback, element.nextSibling);
            }
            
            feedback.textContent = message;
            feedback.style.display = 'block';
        },
        
        showSuccess(elementId) {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            element.classList.add('is-valid');
            element.classList.remove('is-invalid');
            
            // Ocultar mensaje de error si existe
            const feedback = element.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.style.display = 'none';
            }
        },
        
        clearValidation(elementId) {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            element.classList.remove('is-valid', 'is-invalid');
            
            const feedback = element.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.style.display = 'none';
            }
        },
        
        showAlert(message, type = 'danger', containerId = 'alertContainer') {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Container ${containerId} not found`);
                return;
            }
            
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show`;
            alert.role = 'alert';
            alert.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            container.innerHTML = '';
            container.appendChild(alert);
            
            // Auto-cerrar después de 5 segundos
            setTimeout(() => {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 150);
            }, 5000);
        }
    },
    
    /**
     * Validar formulario completo
     */
    validateForm(formData, rules) {
        const errors = {};
        let isValid = true;
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = formData[field];
            let result;
            
            switch (rule.type) {
                case 'email':
                    result = this.email.validate(value);
                    break;
                case 'password':
                    result = this.password.validate(value);
                    break;
                case 'name':
                    result = this.name.validate(value, rule.fieldName || field);
                    break;
                case 'phone':
                    result = this.phone.validate(value, rule.required);
                    break;
                case 'text':
                    result = this.text.validate(
                        value,
                        rule.fieldName || field,
                        rule.minLength,
                        rule.maxLength,
                        rule.required
                    );
                    break;
                case 'number':
                    result = this.number.validate(
                        value,
                        rule.fieldName || field,
                        rule.min,
                        rule.max,
                        rule.required
                    );
                    break;
                case 'date':
                    result = this.date.validate(value, rule.fieldName || field, rule.required);
                    break;
                case 'url':
                    result = this.url.validate(value, rule.required);
                    break;
                default:
                    result = { valid: true, errors: [] };
            }
            
            if (!result.valid) {
                errors[field] = result.errors;
                isValid = false;
            }
        }
        
        return {
            valid: isValid,
            errors
        };
    }
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validation;
}
