/**
 * JavaScript para manejo de pagos
 * Integración con PayPal y Mercado Pago
 */

class PaymentManager {
    constructor() {
        this.selectedMethod = null;
        this.amount = 0;
        this.description = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.updateSummary();
    }

    setupEventListeners() {
        // Cambio de método de pago
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.selectPaymentMethod(e.target.value);
            });
        });

        // Cambio de monto
        document.getElementById('amount').addEventListener('input', (e) => {
            this.amount = parseFloat(e.target.value) || 0;
            this.updateSummary();
        });

        // Cambio de descripción
        document.getElementById('description').addEventListener('input', (e) => {
            this.description = e.target.value;
        });

        // Formateo de número de tarjeta
        const cardNumber = document.getElementById('cardNumber');
        if (cardNumber) {
            cardNumber.addEventListener('input', this.formatCardNumber);
        }

        // Formateo de fecha de vencimiento
        const cardExpiry = document.getElementById('cardExpiry');
        if (cardExpiry) {
            cardExpiry.addEventListener('input', this.formatCardExpiry);
        }

        // Solo números en CVV
        const cardCvv = document.getElementById('cardCvv');
        if (cardCvv) {
            cardCvv.addEventListener('input', this.formatCvv);
        }
    }

    setupFormValidation() {
        // Validación en tiempo real
        const inputs = document.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    selectPaymentMethod(method) {
        // Remover selección anterior
        document.querySelectorAll('.payment-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Seleccionar nuevo método
        const selectedOption = document.querySelector(`[data-method="${method}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
            this.selectedMethod = method;
            this.updateSummary();
        }
    }

    updateSummary() {
        const subtotal = this.amount;
        const fee = this.calculateFee(subtotal, this.selectedMethod);
        const total = subtotal + fee;

        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('fee').textContent = `$${fee.toFixed(2)}`;
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    }

    calculateFee(amount, method) {
        if (!amount || !method) return 0;

        const feeRates = {
            'paypal': 0.035, // 3.5%
            'mercadopago': 0.029, // 2.9%
            'tarjeta': 0.025, // 2.5%
            'transferencia': 0 // Sin comisión
        };

        return amount * (feeRates[method] || 0);
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.id;
        let isValid = true;
        let errorMessage = '';

        // Validaciones específicas
        switch (fieldName) {
            case 'amount':
                if (!value || parseFloat(value) <= 0) {
                    isValid = false;
                    errorMessage = 'El monto debe ser mayor a 0';
                } else if (parseFloat(value) > 50000) {
                    isValid = false;
                    errorMessage = 'El monto máximo es $50,000';
                }
                break;

            case 'description':
                if (!value) {
                    isValid = false;
                    errorMessage = 'La descripción es requerida';
                } else if (value.length < 3) {
                    isValid = false;
                    errorMessage = 'La descripción debe tener al menos 3 caracteres';
                }
                break;

            case 'cardNumber':
                const cardRegex = /^[0-9\s]{13,19}$/;
                if (!cardRegex.test(value.replace(/\s/g, ''))) {
                    isValid = false;
                    errorMessage = 'Número de tarjeta inválido';
                }
                break;

            case 'cardName':
                if (!value) {
                    isValid = false;
                    errorMessage = 'El nombre es requerido';
                }
                break;

            case 'cardExpiry':
                const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
                if (!expiryRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Formato inválido (MM/AA)';
                } else {
                    const [month, year] = value.split('/');
                    const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
                    if (expiry < new Date()) {
                        isValid = false;
                        errorMessage = 'La tarjeta está vencida';
                    }
                }
                break;

            case 'cardCvv':
                if (!/^[0-9]{3,4}$/.test(value)) {
                    isValid = false;
                    errorMessage = 'CVV inválido (3-4 dígitos)';
                }
                break;
        }

        this.setFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    setFieldValidation(field, isValid, errorMessage) {
        const formGroup = field.closest('.form-group');
        
        // Remover clases anteriores
        formGroup.classList.remove('error', 'success');
        
        // Remover mensaje de error anterior
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        if (isValid) {
            formGroup.classList.add('success');
        } else {
            formGroup.classList.add('error');
            
            // Agregar mensaje de error
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = errorMessage;
            formGroup.appendChild(errorDiv);
        }
    }

    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.remove('error');
        
        const errorMessage = formGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    formatCardNumber(e) {
        let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    }

    formatCardExpiry(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    }

    formatCvv(e) {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    }

    validateForm() {
        let isValid = true;

        // Validar campos básicos
        const amount = document.getElementById('amount');
        const description = document.getElementById('description');

        if (!this.validateField(amount)) isValid = false;
        if (!this.validateField(description)) isValid = false;

        // Validar método de pago seleccionado
        if (!this.selectedMethod) {
            this.showError('Por favor selecciona un método de pago');
            return false;
        }

        // Validar campos específicos del método
        if (this.selectedMethod === 'tarjeta') {
            const cardFields = ['cardNumber', 'cardName', 'cardExpiry', 'cardCvv'];
            cardFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field && !this.validateField(field)) {
                    isValid = false;
                }
            });
        }

        return isValid;
    }

    async processPayment() {
        if (!this.validateForm()) {
            return;
        }

        this.showLoading();

        try {
            const paymentData = {
                monto: this.amount,
                metodoPago: this.selectedMethod,
                descripcion: this.description,
                moneda: 'MXN'
            };

            // Agregar datos específicos del método
            if (this.selectedMethod === 'tarjeta') {
                paymentData.cardData = {
                    number: document.getElementById('cardNumber').value.replace(/\s/g, ''),
                    name: document.getElementById('cardName').value,
                    expiry: document.getElementById('cardExpiry').value,
                    cvv: document.getElementById('cardCvv').value
                };
            }

            const response = await this.makePaymentRequest(paymentData);

            if (response.success) {
                this.handlePaymentSuccess(response);
            } else {
                this.handlePaymentError(response.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Payment error:', error);
            this.handlePaymentError('Error de conexión. Por favor intenta de nuevo.');
        }
    }

    async makePaymentRequest(paymentData) {
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('No estás autenticado. Por favor inicia sesión.');
        }

        const response = await fetch('/api/pagos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(paymentData)
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.message || 'Error al procesar el pago'
            };
        }

        return {
            success: true,
            ...data
        };
    }

    handlePaymentSuccess(response) {
        this.hideLoading();

        // Redirigir según el método de pago
        if (response.approvalUrl) {
            // PayPal - redirigir a aprobación
            window.location.href = response.approvalUrl;
        } else if (response.initPoint) {
            // Mercado Pago - redirigir a checkout
            window.location.href = response.initPoint;
        } else {
            // Otros métodos - mostrar éxito
            this.showSuccess(response.message || 'Pago procesado exitosamente.');
        }
    }

    handlePaymentError(errorMessage) {
        this.hideLoading();
        this.showError(errorMessage);
    }

    showLoading() {
        const modal = document.getElementById('loadingModal');
        modal.classList.add('show');
        
        const button = document.getElementById('processPayment');
        button.classList.add('loading');
        button.disabled = true;
    }

    hideLoading() {
        const modal = document.getElementById('loadingModal');
        modal.classList.remove('show');
        
        const button = document.getElementById('processPayment');
        button.classList.remove('loading');
        button.disabled = false;
    }

    showSuccess(message) {
        document.getElementById('successMessage').textContent = message;
        document.getElementById('successModal').classList.add('show');
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorModal').classList.add('show');
    }
}

// Funciones globales
function processPayment() {
    window.paymentManager.processPayment();
}

function goBack() {
    if (confirm('¿Estás seguro de que quieres cancelar el pago?')) {
        window.history.back();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
    
    // Si es modal de éxito, redirigir
    if (modalId === 'successModal') {
        window.location.href = '/dashboard.html';
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.paymentManager = new PaymentManager();
    
    // Verificar si hay parámetros de URL (para PayPal callback)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const PayerID = urlParams.get('PayerID');
    
    if (token && PayerID) {
        // Callback de PayPal - capturar pago
        capturePayPalPayment(token);
    }
});

// Función para capturar pago de PayPal
async function capturePayPalPayment(orderId) {
    try {
        const authToken = localStorage.getItem('token');
        
        const response = await fetch(`/api/pagos/paypal/capture/${orderId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            window.paymentManager.showSuccess('Pago con PayPal completado exitosamente.');
        } else {
            window.paymentManager.showError(data.message || 'Error al completar el pago');
        }
    } catch (error) {
        console.error('Error capturing PayPal payment:', error);
        window.paymentManager.showError('Error al procesar el pago con PayPal');
    }
}

// Manejo de teclas
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Cerrar modales con Escape
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }
});

// Cerrar modales al hacer clic fuera
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});
