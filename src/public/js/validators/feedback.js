/**
 * Gestor de Feedback Visual para Validación
 * 
 * Proporciona feedback visual inmediato a los usuarios sobre el estado
 * de validación de los campos del formulario.
 */

class FeedbackManager {
  /**
   * Muestra feedback de validación en un campo específico
   * @param {HTMLElement} fieldElement - El input field
   * @param {Object} result - Resultado de validación { valid, errors }
   */
  showFieldFeedback(fieldElement, result) {
    if (!fieldElement) return;

    const feedbackDiv = fieldElement.parentElement.querySelector('.validation-feedback');
    if (!feedbackDiv) return;

    if (result.valid) {
      fieldElement.classList.remove('invalid');
      fieldElement.classList.add('valid');
      fieldElement.setAttribute('aria-invalid', 'false');
      
      feedbackDiv.innerHTML = '<span class="success">✓ Válido</span>';
      feedbackDiv.className = 'validation-feedback success';
      feedbackDiv.setAttribute('role', 'status');
    } else {
      fieldElement.classList.remove('valid');
      fieldElement.classList.add('invalid');
      fieldElement.setAttribute('aria-invalid', 'true');
      
      feedbackDiv.innerHTML = result.errors.map(err => 
        `<span class="error-item">✗ ${err}</span>`
      ).join('');
      feedbackDiv.className = 'validation-feedback error';
      feedbackDiv.setAttribute('role', 'alert');
    }
  }

  /**
   * Muestra el indicador de fortaleza de contraseña
   * @param {string} strength - 'weak', 'medium', o 'strong'
   * @param {HTMLElement} containerElement - Contenedor del indicador
   */
  showPasswordStrength(strength, containerElement) {
    if (!containerElement) return;

    const strengthBar = containerElement.querySelector('.strength-bar');
    const strengthText = containerElement.querySelector('.strength-text');

    if (!strengthBar || !strengthText) return;

    // Remover clases anteriores
    strengthBar.classList.remove('weak', 'medium', 'strong');
    strengthBar.classList.add(strength);

    const labels = {
      weak: 'Débil',
      medium: 'Media',
      strong: 'Fuerte'
    };

    strengthText.textContent = labels[strength] || 'Débil';
    strengthText.className = `strength-text ${strength}`;
  }

  /**
   * Actualiza el contador de caracteres
   * @param {HTMLElement} fieldElement - El input field
   * @param {number} maxLength - Longitud máxima permitida
   */
  updateCharCounter(fieldElement, maxLength) {
    if (!fieldElement) return;

    const counter = fieldElement.parentElement.querySelector('.char-counter');
    if (!counter) return;

    const currentLength = fieldElement.value.length;
    counter.textContent = `${currentLength} / ${maxLength}`;

    // Advertencia cuando se acerca al límite (90%)
    if (currentLength > maxLength * 0.9) {
      counter.classList.add('warning');
    } else {
      counter.classList.remove('warning');
    }

    // Error si excede el límite
    if (currentLength > maxLength) {
      counter.classList.add('error');
    } else {
      counter.classList.remove('error');
    }
  }

  /**
   * Muestra un mensaje de error global
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de alerta: 'error', 'success', 'warning', 'info'
   * @param {Object} options - Opciones adicionales { showRetry: boolean, autoHide: boolean }
   */
  showGlobalError(message, type = 'error', options = {}) {
    const errorDiv = document.getElementById('globalError');
    if (!errorDiv) return;

    errorDiv.innerHTML = message;
    errorDiv.className = `alert alert-${type}`;
    errorDiv.classList.remove('hidden');
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');

    // Agregar botón de reintentar si se solicita
    if (options.showRetry) {
      this.showRetryButton(errorDiv);
    }

    // Auto-ocultar después de 5 segundos (por defecto)
    if (options.autoHide !== false) {
      setTimeout(() => {
        errorDiv.classList.add('hidden');
      }, 5000);
    }

    // Scroll al mensaje de error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Muestra un mensaje de éxito
   * @param {string} message - Mensaje a mostrar
   * @param {Object} options - Opciones adicionales
   */
  showSuccess(message, options = {}) {
    this.showGlobalError(message, 'success', options);
  }

  /**
   * Muestra un mensaje de advertencia
   * @param {string} message - Mensaje a mostrar
   * @param {Object} options - Opciones adicionales
   */
  showWarning(message, options = {}) {
    this.showGlobalError(message, 'warning', options);
  }

  /**
   * Oculta el mensaje global
   */
  hideGlobalError() {
    const errorDiv = document.getElementById('globalError');
    if (errorDiv) {
      errorDiv.classList.add('hidden');
    }
  }

  /**
   * Agrega un botón de reintentar al mensaje de error
   * @param {HTMLElement} errorDiv - Div del mensaje de error
   */
  showRetryButton(errorDiv) {
    // Verificar si ya existe un botón de reintentar
    if (errorDiv.querySelector('.retry-button')) return;

    const retryButton = document.createElement('button');
    retryButton.type = 'button';
    retryButton.className = 'retry-button';
    retryButton.textContent = 'Reintentar';
    retryButton.style.marginTop = '10px';

    retryButton.addEventListener('click', () => {
      // Ocultar el error y reenviar el formulario
      errorDiv.classList.add('hidden');
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });

    errorDiv.appendChild(retryButton);
  }

  /**
   * Limpia todos los feedbacks de validación
   */
  clearAllFeedback() {
    document.querySelectorAll('.validation-feedback').forEach(feedback => {
      feedback.innerHTML = '';
      feedback.className = 'validation-feedback';
    });

    document.querySelectorAll('input').forEach(input => {
      input.classList.remove('valid', 'invalid');
      input.removeAttribute('aria-invalid');
    });

    this.hideGlobalError();
  }
}

// Crear instancia global
const feedbackManager = new FeedbackManager();
