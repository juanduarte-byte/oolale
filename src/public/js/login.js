/**
 * Lógica del Formulario de Login de Admin
 * Óolale - Usando sistema de validación unificado
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del formulario
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('submitBtn');
  const globalError = document.getElementById('globalError');

  // ========================================
  // VALIDACIÓN EN TIEMPO REAL
  // ========================================

  // Validar Email
  emailInput.addEventListener('blur', () => {
    if (emailInput.value.trim()) {
      const result = Validation.email.validate(emailInput.value);
      if (!result.valid) {
        emailInput.classList.add('invalid');
        emailInput.classList.remove('valid');
        const feedback = emailInput.nextElementSibling;
        if (feedback && feedback.classList.contains('validation-feedback')) {
          feedback.textContent = result.errors[0];
          feedback.classList.add('error');
        }
      } else {
        emailInput.classList.add('valid');
        emailInput.classList.remove('invalid');
        const feedback = emailInput.nextElementSibling;
        if (feedback && feedback.classList.contains('validation-feedback')) {
          feedback.textContent = '';
          feedback.classList.remove('error');
        }
      }
    }
  });

  // Limpiar error al escribir
  emailInput.addEventListener('input', () => {
    emailInput.classList.remove('invalid', 'valid');
    const feedback = emailInput.nextElementSibling;
    if (feedback && feedback.classList.contains('validation-feedback')) {
      feedback.textContent = '';
      feedback.classList.remove('error');
    }
  });

  passwordInput.addEventListener('input', () => {
    passwordInput.classList.remove('invalid', 'valid');
    const feedback = passwordInput.nextElementSibling;
    if (feedback && feedback.classList.contains('validation-feedback')) {
      feedback.textContent = '';
      feedback.classList.remove('error');
    }
  });

  // ========================================
  // TOGGLE PASSWORD VISIBILITY
  // ========================================

  const toggleButton = document.querySelector('.toggle-password');
  if (toggleButton) {
    toggleButton.addEventListener('click', function() {
      const wrapper = this.parentElement;
      const input = wrapper.querySelector('input');
      const icon = this.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'bi bi-eye-slash-fill';
        this.setAttribute('aria-label', 'Ocultar contraseña');
      } else {
        input.type = 'password';
        icon.className = 'bi bi-eye-fill';
        this.setAttribute('aria-label', 'Mostrar contraseña');
      }
    });
  }

  // ========================================
  // ENVÍO DEL FORMULARIO
  // ========================================

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Ocultar error global previo
    globalError.classList.add('hidden');

    // Validar campos
    const formData = {
      email: emailInput.value.trim(),
      password: passwordInput.value
    };

    const rules = {
      email: { type: 'email' },
      password: { type: 'text', fieldName: 'Contraseña', minLength: 1, maxLength: 255, required: true }
    };

    const validationResult = Validation.validateForm(formData, rules);

    if (!validationResult.valid) {
      for (const [field, errors] of Object.entries(validationResult.errors)) {
        const input = document.getElementById(field);
        if (input) {
          input.classList.add('invalid');
          input.classList.remove('valid');
          const feedback = input.nextElementSibling;
          if (feedback && feedback.classList.contains('validation-feedback')) {
            feedback.textContent = errors[0];
            feedback.classList.add('error');
          }
        }
      }
      showGlobalError('Por favor, corrige los errores en el formulario');
      return;
    }

    // Deshabilitar botón durante el envío
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Iniciando sesión...';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar token y datos del usuario
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Mostrar mensaje de éxito
        showGlobalSuccess('Inicio de sesión exitoso. Redirigiendo...');
        
        // Redirigir según el rol del usuario
        setTimeout(() => {
          if (data.user && data.user.isAdmin) {
            window.location.href = 'dashboard.html';
          } else {
            window.location.href = 'user-dashboard.html';
          }
        }, 1000);
      } else {
        handleServerError(response.status, data);
      }
    } catch (error) {
      console.error('Error:', error);
      showGlobalError('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // ========================================
  // MANEJO DE ERRORES DEL SERVIDOR
  // ========================================

  function handleServerError(status, data) {
    switch (status) {
      case 400:
        // Errores de validación
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach(error => {
            const field = document.getElementById(error.field);
            if (field) {
              field.classList.add('invalid');
              field.classList.remove('valid');
              const feedback = field.nextElementSibling;
              if (feedback && feedback.classList.contains('validation-feedback')) {
                feedback.textContent = error.message;
                feedback.classList.add('error');
              }
            }
          });
          showGlobalError('Por favor, corrige los errores indicados');
        } else {
          showGlobalError(data.message || 'Datos inválidos');
        }
        break;

      case 401:
        // Credenciales incorrectas
        emailInput.classList.add('invalid');
        passwordInput.classList.add('invalid');
        showGlobalError('Credenciales incorrectas. Verifica tu email y contraseña.');
        passwordInput.value = '';
        passwordInput.focus();
        break;

      case 429:
        // Demasiados intentos
        showGlobalError('Demasiados intentos de inicio de sesión. Por favor, espera 15 minutos e intenta de nuevo.');
        break;

      case 500:
      case 503:
        showGlobalError('Error del servidor. Por favor, intenta de nuevo más tarde.');
        break;

      default:
        showGlobalError(data.message || 'Ocurrió un error inesperado');
    }
  }

  // ========================================
  // UTILIDADES DE UI
  // ========================================

  function showGlobalError(message) {
    globalError.innerHTML = `<i class="bi bi-exclamation-circle"></i> ${message}`;
    globalError.className = 'alert alert-error';
    globalError.classList.remove('hidden');
    
    // Scroll al error
    globalError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showGlobalSuccess(message) {
    globalError.innerHTML = `<i class="bi bi-check-circle"></i> ${message}`;
    globalError.className = 'alert alert-success';
    globalError.classList.remove('hidden');
  }

  // ========================================
  // NAVEGACIÓN CON TECLADO
  // ========================================

  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  });
});
