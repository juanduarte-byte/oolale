/**
 * Biblioteca de Validación Frontend para Óolale Admin
 * 
 * Este archivo contiene validadores que reflejan las restricciones de la base de datos MySQL
 * y proporcionan feedback en tiempo real a los usuarios.
 */

/**
 * Clase base para validación de campos
 * No se usa directamente, pero proporciona estructura común
 */
class FieldValidator {
  constructor(fieldConfig) {
    this.field = fieldConfig.field;
    this.rules = fieldConfig.rules;
    this.feedbackElement = fieldConfig.feedbackElement;
  }

  /**
   * Valida un valor según las reglas configuradas
   * @param {string} value - Valor a validar
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(value) {
    // Implementado por subclases
    return { valid: true, errors: [] };
  }

  /**
   * Muestra feedback visual en el elemento
   * @param {Object} result - Resultado de validación { valid, errors }
   */
  showFeedback(result) {
    if (!this.feedbackElement) return;

    if (result.valid) {
      this.field.classList.remove('invalid');
      this.field.classList.add('valid');
      this.feedbackElement.innerHTML = '<span class="success">✓ Válido</span>';
      this.feedbackElement.className = 'validation-feedback success';
    } else {
      this.field.classList.remove('valid');
      this.field.classList.add('invalid');
      this.feedbackElement.innerHTML = result.errors.map(err => 
        `<span class="error-item">${err}</span>`
      ).join('');
      this.feedbackElement.className = 'validation-feedback error';
    }
  }
}


/**
 * Validador de Correo Electrónico
 * 
 * Restricciones basadas en la base de datos:
 * - Campo: correo_electronico VARCHAR(255) UNIQUE NOT NULL
 * 
 * Reglas de validación:
 * - Formato RFC 5322 estándar
 * - Máximo 255 caracteres (límite de base de datos)
 * - Transformación a minúsculas para consistencia
 * 
 * Ejemplos válidos:
 * - usuario@ejemplo.com
 * - nombre.apellido@dominio.co
 * - admin123@test-site.org
 * 
 * Ejemplos inválidos:
 * - usuario@ejemplo (sin TLD)
 * - @ejemplo.com (sin usuario)
 * - usuario@.com (dominio inválido)
 * - usuario ejemplo@test.com (espacios)
 */
const EmailValidator = {
  // Patrón RFC 5322 simplificado pero robusto
  pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  maxLength: 255, // VARCHAR(255) en base de datos

  /**
   * Valida un correo electrónico
   * @param {string} email - Correo a validar
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(email) {
    const errors = [];

    if (!email || email.trim() === '') {
      errors.push('El correo electrónico es obligatorio');
      return { valid: false, errors };
    }

    const trimmedEmail = email.trim();

    if (trimmedEmail.length > this.maxLength) {
      errors.push(`Máximo ${this.maxLength} caracteres`);
    }

    if (!this.pattern.test(trimmedEmail)) {
      errors.push('Formato de correo inválido (ejemplo: usuario@dominio.com)');
    }

    // Verificar caracteres no permitidos comunes
    if (trimmedEmail.includes(' ')) {
      errors.push('El correo no puede contener espacios');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Normaliza el email a minúsculas
   * @param {string} email - Email a normalizar
   * @returns {string} Email en minúsculas
   */
  normalize(email) {
    return email.trim().toLowerCase();
  }
};


/**
 * Validador de Contraseña
 * 
 * Restricciones basadas en la base de datos:
 * - Campo: contraseña VARCHAR(255) NOT NULL
 * - Almacenada como hash bcrypt (~60 caracteres)
 * 
 * Reglas de validación:
 * - Mínimo 8 caracteres (seguridad)
 * - Máximo 255 caracteres (límite de base de datos)
 * - Al menos una letra mayúscula (A-Z)
 * - Al menos una letra minúscula (a-z)
 * - Al menos un número (0-9)
 * - Al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)
 * 
 * Ejemplos válidos:
 * - MyP@ssw0rd
 * - Secure123!
 * - Admin#2024Pass
 * 
 * Ejemplos inválidos:
 * - password (sin mayúscula, número, especial)
 * - Pass123 (sin carácter especial)
 * - SHORT1! (menos de 8 caracteres)
 */
const PasswordValidator = {
  minLength: 8,
  maxLength: 255, // VARCHAR(255) en base de datos

  // Patrones para cada requisito
  patterns: {
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/
  },

  /**
   * Valida una contraseña
   * @param {string} password - Contraseña a validar
   * @returns {Object} { valid: boolean, errors: string[], strength: string }
   */
  validate(password) {
    const errors = [];

    if (!password || password.trim() === '') {
      errors.push('La contraseña es obligatoria');
      return { valid: false, errors, strength: 'weak' };
    }

    if (password.length < this.minLength) {
      errors.push(`Mínimo ${this.minLength} caracteres`);
    }

    if (password.length > this.maxLength) {
      errors.push(`Máximo ${this.maxLength} caracteres`);
    }

    if (!this.patterns.uppercase.test(password)) {
      errors.push('Debe contener al menos una letra mayúscula (A-Z)');
    }

    if (!this.patterns.lowercase.test(password)) {
      errors.push('Debe contener al menos una letra minúscula (a-z)');
    }

    if (!this.patterns.number.test(password)) {
      errors.push('Debe contener al menos un número (0-9)');
    }

    if (!this.patterns.special.test(password)) {
      errors.push('Debe contener al menos un carácter especial (!@#$%^&*...)');
    }

    return {
      valid: errors.length === 0,
      errors,
      strength: this.calculateStrength(password)
    };
  },

  /**
   * Calcula la fortaleza de la contraseña
   * @param {string} password - Contraseña a evaluar
   * @returns {string} 'weak', 'medium', o 'strong'
   */
  calculateStrength(password) {
    if (!password) return 'weak';

    let strength = 0;

    // Longitud
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (password.length >= 16) strength++;

    // Complejidad
    if (this.patterns.uppercase.test(password)) strength++;
    if (this.patterns.lowercase.test(password)) strength++;
    if (this.patterns.number.test(password)) strength++;
    if (this.patterns.special.test(password)) strength++;

    // Clasificación
    if (strength <= 3) return 'weak';
    if (strength <= 5) return 'medium';
    return 'strong';
  }
};


/**
 * Validador de Nombre Completo
 * 
 * Restricciones basadas en la base de datos:
 * - Campo: nombre_completo VARCHAR(255) NOT NULL
 * 
 * Reglas de validación:
 * - Mínimo 3 caracteres
 * - Máximo 255 caracteres (límite de base de datos)
 * - Solo letras (a-z, A-Z)
 * - Espacios permitidos
 * - Acentos permitidos (á, é, í, ó, ú, ñ)
 * - Apóstrofes permitidos (')
 * - NO se permiten números ni caracteres especiales
 * 
 * Ejemplos válidos:
 * - Juan Pérez
 * - María José García
 * - O'Connor
 * - José María Rodríguez López
 * 
 * Ejemplos inválidos:
 * - Juan123 (contiene números)
 * - María@García (contiene caracteres especiales)
 * - AB (menos de 3 caracteres)
 */
const FullNameValidator = {
  minLength: 3,
  maxLength: 255, // VARCHAR(255) en base de datos
  // Patrón que acepta letras, espacios, acentos y apóstrofes
  pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']+$/,

  /**
   * Valida un nombre completo
   * @param {string} name - Nombre a validar
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(name) {
    const errors = [];

    if (!name || name.trim() === '') {
      errors.push('El nombre completo es obligatorio');
      return { valid: false, errors };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < this.minLength) {
      errors.push(`Mínimo ${this.minLength} caracteres`);
    }

    if (trimmedName.length > this.maxLength) {
      errors.push(`Máximo ${this.maxLength} caracteres`);
    }

    if (!this.pattern.test(trimmedName)) {
      errors.push('Solo se permiten letras, espacios, acentos y apóstrofes');
    }

    // Verificar que no tenga múltiples espacios consecutivos
    if (/\s{2,}/.test(trimmedName)) {
      errors.push('No se permiten espacios múltiples consecutivos');
    }

    // Verificar que no empiece o termine con espacio (ya aplicamos trim, pero por si acaso)
    if (trimmedName !== name.trim()) {
      errors.push('No debe comenzar ni terminar con espacios');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Normaliza el nombre (trim y capitalización básica)
   * @param {string} name - Nombre a normalizar
   * @returns {string} Nombre normalizado
   */
  normalize(name) {
    return name.trim().replace(/\s+/g, ' ');
  }
};
