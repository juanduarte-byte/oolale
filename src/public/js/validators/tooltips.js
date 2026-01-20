/**
 * Gestor de Tooltips para Reglas de Validación
 * 
 * Muestra tooltips informativos con las reglas de validación
 * para cada campo del formulario.
 */

/**
 * Configuración de tooltips con reglas de validación
 * Basado en las restricciones de la base de datos MySQL
 */
const ValidationTooltips = {
  email: {
    title: 'Correo Electrónico',
    rules: [
      'Formato válido: usuario@dominio.com',
      'Máximo 255 caracteres',
      'Debe ser único (no registrado previamente)',
      'Se convertirá a minúsculas automáticamente'
    ]
  },

  password: {
    title: 'Contraseña',
    rules: [
      'Mínimo 8 caracteres',
      'Al menos una letra mayúscula (A-Z)',
      'Al menos una letra minúscula (a-z)',
      'Al menos un número (0-9)',
      'Al menos un carácter especial (!@#$%^&*...)',
      'Máximo 255 caracteres'
    ]
  },

  confirmPassword: {
    title: 'Confirmar Contraseña',
    rules: [
      'Debe coincidir exactamente con la contraseña',
      'Verifica que no haya errores de escritura'
    ]
  },

  fullName: {
    title: 'Nombre Completo',
    rules: [
      'Mínimo 3 caracteres',
      'Máximo 255 caracteres',
      'Solo letras, espacios, acentos y apóstrofes',
      'No se permiten números ni símbolos especiales',
      'Ejemplo: Juan Pérez, María José García'
    ]
  }
};

class TooltipManager {
  constructor() {
    this.currentTooltip = null;
  }

  /**
   * Inicializa los event listeners para los tooltips
   */
  init() {
    document.querySelectorAll('.info-icon').forEach(icon => {
      // Mostrar al hacer hover
      icon.addEventListener('mouseenter', (e) => this.show(e));
      icon.addEventListener('mouseleave', () => this.hide());

      // Toggle al hacer clic (para dispositivos táctiles)
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggle(e);
      });

      // Accesibilidad: mostrar con teclado
      icon.addEventListener('focus', (e) => this.show(e));
      icon.addEventListener('blur', () => this.hide());
    });

    // Cerrar tooltip al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.info-icon') && !e.target.closest('.validation-tooltip')) {
        this.hide();
      }
    });

    // Cerrar tooltip con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });
  }

  /**
   * Muestra el tooltip
   * @param {Event} event - Evento del mouse/teclado
   */
  show(event) {
    const icon = event.target.closest('.info-icon');
    if (!icon) return;

    const fieldName = icon.dataset.field;
    const config = ValidationTooltips[fieldName];

    if (!config) return;

    // Ocultar tooltip anterior si existe
    this.hide();

    // Crear nuevo tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'validation-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.innerHTML = `
      <h4>${config.title}</h4>
      <ul>
        ${config.rules.map(rule => `<li>${rule}</li>`).join('')}
      </ul>
    `;

    document.body.appendChild(tooltip);
    this.currentTooltip = tooltip;

    // Posicionar el tooltip
    this.position(tooltip, icon);

    // Animar entrada
    setTimeout(() => {
      tooltip.classList.add('visible');
    }, 10);
  }

  /**
   * Oculta el tooltip actual
   */
  hide() {
    if (this.currentTooltip) {
      this.currentTooltip.classList.remove('visible');
      setTimeout(() => {
        if (this.currentTooltip && this.currentTooltip.parentNode) {
          this.currentTooltip.parentNode.removeChild(this.currentTooltip);
        }
        this.currentTooltip = null;
      }, 200); // Tiempo de animación
    }
  }

  /**
   * Toggle del tooltip (para dispositivos táctiles)
   * @param {Event} event - Evento del click
   */
  toggle(event) {
    if (this.currentTooltip) {
      this.hide();
    } else {
      this.show(event);
    }
  }

  /**
   * Posiciona el tooltip relativo al icono
   * @param {HTMLElement} tooltip - Elemento del tooltip
   * @param {HTMLElement} anchor - Elemento ancla (icono)
   */
  position(tooltip, anchor) {
    const rect = anchor.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Posición por defecto: debajo del icono
    let top = rect.bottom + scrollTop + 10;
    let left = rect.left + scrollLeft;

    // Ajustar si se sale de la pantalla por la derecha
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 20;
    }

    // Ajustar si se sale de la pantalla por la izquierda
    if (left < 10) {
      left = 10;
    }

    // Ajustar si se sale de la pantalla por abajo
    if (top + tooltipRect.height > window.innerHeight + scrollTop) {
      // Mostrar arriba del icono
      top = rect.top + scrollTop - tooltipRect.height - 10;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }
}

// Crear instancia global
const tooltipManager = new TooltipManager();
