/**
 * Lógica del Formulario de Registro de Admin
 * Óolale - Usando sistema de validación unificado
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del formulario
  const form = document.getElementById('registerForm');
  const emailInput = document.getElementById('email');
  const fullNameInput = document.getElementById('fullName');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const submitBtn = document.getElementById('submitBtn');
  const globalError = document.getElementById('globalError');

  // Estado de validación
  const validationState = {
    email: false,
    fullName: false,
    password: false,
    confirmPassword: false
  };

  // ========================================
  // VALIDACIÓN EN TIEMPO REAL
  // ========================================

  // Validar Email
  emailInput.addEventListener('input', () => {
    const result = Validation.email.validate(emailInput.value);
    
    if (result.valid) {
      emailInput.classList.add('valid');
      emailInput.classList.remove('invalid');
      validationState.email = true;
    } else {
      emailInput.classList.remove('valid');
      emailInput.classList.add('invalid');
      validationState.email = false;
    }
    
    updateSubmitButton();
  });

  emailInput.addEventListener('blur', () => {
    const result = Validation.email.validate(emailInput.value);
    if (!result.valid && emailInput.value) {
      const feedback = emailInput.nextElementSibling;
      if (feedback && feedback.classList.contains('validation-feedback')) {
        feedback.textContent = result.errors[0];
        feedback.classList.add('error');
      }
    }
  });

  // Validar Nombre Completo
  fullNameInput.addEventListener('input', () => {
    const result = Validation.name.validate(fullNameInput.value, 'nombre completo');
    
    if (result.valid) {
      fullNameInput.classList.add('valid');
      fullNameInput.classList.remove('invalid');
      validationState.fullName = true;
    } else {
      fullNameInput.classList.remove('valid');
      fullNameInput.classList.add('invalid');
      validationState.fullName = false;
    }
    
    updateSubmitButton();
  });

  fullNameInput.addEventListener('blur', () => {
    const result = Validation.name.validate(fullNameInput.value, 'nombre completo');
    if (!result.valid && fullNameInput.value) {
      const feedback = fullNameInput.nextElementSibling;
      if (feedback && feedback.classList.contains('validation-feedback')) {
        feedback.textContent = result.errors[0];
        feedback.classList.add('error');
      }
    }
  });

  // Validar Contraseña con requisitos visuales
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const result = Validation.password.validate(password);
    
    // Actualizar requisitos visuales
    document.getElementById('req-length').classList.toggle('valid', password.length >= 8);
    document.getElementById('req-uppercase').classList.toggle('valid', /[A-Z]/.test(password));
    document.getElementById('req-lowercase').classList.toggle('valid', /[a-z]/.test(password));
    document.getElementById('req-number').classList.toggle('valid', /[0-9]/.test(password));
    document.getElementById('req-special').classList.toggle('valid', /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password));
    
    if (result.valid) {
      passwordInput.classList.add('valid');
      passwordInput.classList.remove('invalid');
      validationState.password = true;
    } else {
      passwordInput.classList.remove('valid');
      passwordInput.classList.add('invalid');
      validationState.password = false;
    }
    
    // Re-validar confirmación si ya tiene valor
    if (confirmPasswordInput.value) {
      validateConfirmPassword();
    }
    
    updateSubmitButton();
  });

  // Validar Confirmar Contraseña
  confirmPasswordInput.addEventListener('input', validateConfirmPassword);
  confirmPasswordInput.addEventListener('blur', validateConfirmPassword);

  function validateConfirmPassword() {
    const confirmValue = confirmPasswordInput.value;
    const passwordValue = passwordInput.value;
    const feedback = confirmPasswordInput.nextElementSibling;

    if (!confirmValue) {
      confirmPasswordInput.classList.remove('valid', 'invalid');
      validationState.confirmPassword = false;
    } else if (confirmValue !== passwordValue) {
      confirmPasswordInput.classList.remove('valid');
      confirmPasswordInput.classList.add('invalid');
      if (feedback && feedback.classList.contains('validation-feedback')) {
        feedback.textContent = 'Las contraseñas no coinciden';
        feedback.classList.add('error');
      }
      validationState.confirmPassword = false;
    } else {
      confirmPasswordInput.classList.add('valid');
      confirmPasswordInput.classList.remove('invalid');
      if (feedback && feedback.classList.contains('validation-feedback')) {
        feedback.textContent = '';
        feedback.classList.remove('error');
      }
      validationState.confirmPassword = true;
    }
    
    updateSubmitButton();
  }

  // ========================================
  // TOGGLE PASSWORD VISIBILITY
  // ========================================

  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
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
  });

  // ========================================
  // HABILITAR/DESHABILITAR BOTÓN SUBMIT
  // ========================================

  function updateSubmitButton() {
    const allValid = Object.values(validationState).every(v => v === true);
    submitBtn.disabled = !allValid;
  }

  // ========================================
  // ENVÍO DEL FORMULARIO
  // ========================================

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar todos los campos una vez más
    const formData = {
      email: emailInput.value.trim(),
      fullName: fullNameInput.value.trim(),
      password: passwordInput.value
    };

    const rules = {
      email: { type: 'email' },
      fullName: { type: 'name', fieldName: 'nombre completo' },
      password: { type: 'password' }
    };

    const validationResult = Validation.validateForm(formData, rules);

    if (!validationResult.valid || !validationState.confirmPassword) {
      showGlobalError('Por favor, corrige los errores en el formulario');
      return;
    }

    // Deshabilitar botón durante el envío
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creando cuenta...';

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password,
          fullName: formData.fullName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar token y datos del usuario
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Mostrar mensaje de éxito
        showGlobalSuccess('Cuenta creada exitosamente. Redirigiendo...');
        
        // Redirigir según el rol del usuario
        setTimeout(() => {
          if (data.user && data.user.isAdmin) {
            window.location.href = 'dashboard.html';
          } else {
            window.location.href = 'user-dashboard.html';
          }
        }, 1500);
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

      case 409:
        // Email duplicado
        emailInput.classList.add('invalid');
        emailInput.classList.remove('valid');
        const emailFeedback = emailInput.nextElementSibling;
        if (emailFeedback && emailFeedback.classList.contains('validation-feedback')) {
          emailFeedback.textContent = 'Este correo ya está registrado';
          emailFeedback.classList.add('error');
        }
        showGlobalError('Este correo ya está registrado. <a href="login.html">¿Quieres iniciar sesión?</a>');
        emailInput.focus();
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
    globalError.style.display = 'block';
    globalError.classList.remove('hidden');
    
    // Scroll al error
    globalError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showGlobalSuccess(message) {
    globalError.innerHTML = `<i class="bi bi-check-circle"></i> ${message}`;
    globalError.className = 'alert alert-success';
    globalError.style.display = 'block';
    globalError.classList.remove('hidden');
  }

  // ========================================
  // NAVEGACIÓN CON TECLADO
  // ========================================

  confirmPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !submitBtn.disabled) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  });
});
