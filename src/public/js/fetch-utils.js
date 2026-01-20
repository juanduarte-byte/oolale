/**
 * Utilidades para peticiones fetch con timeout y manejo de errores
 */

/**
 * Fetch con timeout automático
 * @param {string} url - URL de la petición
 * @param {object} options - Opciones de fetch
 * @param {number} timeout - Timeout en milisegundos (default: 30000)
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = 30000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        
        if (error.name === 'AbortError') {
            throw new Error('La petición tardó demasiado tiempo. Por favor, intenta de nuevo.');
        }
        
        throw error;
    }
}

/**
 * Fetch con retry automático
 * @param {string} url - URL de la petición
 * @param {object} options - Opciones de fetch
 * @param {number} retries - Número de reintentos (default: 3)
 * @param {number} timeout - Timeout en milisegundos (default: 30000)
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options = {}, retries = 3, timeout = 30000) {
    let lastError;
    
    for (let i = 0; i < retries; i++) {
        try {
            return await fetchWithTimeout(url, options, timeout);
        } catch (error) {
            lastError = error;
            
            // No reintentar en errores 4xx (errores del cliente)
            if (error.response && error.response.status >= 400 && error.response.status < 500) {
                throw error;
            }
            
            // Esperar antes de reintentar (backoff exponencial)
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }
    
    throw lastError;
}

/**
 * Wrapper para peticiones API con manejo de errores
 * @param {string} url - URL de la petición
 * @param {object} options - Opciones de fetch
 * @returns {Promise<any>} - Datos de la respuesta
 */
async function fetchAPI(url, options = {}) {
    try {
        const token = localStorage.getItem('token');
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        
        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        const response = await fetchWithTimeout(url, mergedOptions);
        
        // Manejar respuestas no exitosas
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || errorData.error || `Error ${response.status}`;
            throw new Error(errorMessage);
        }
        
        // Intentar parsear JSON
        const data = await response.json().catch(() => null);
        return data;
        
    } catch (error) {
        console.error('Error en fetchAPI:', error);
        throw error;
    }
}

/**
 * Mostrar mensaje de error al usuario
 * @param {string} message - Mensaje de error
 * @param {number} duration - Duración en milisegundos (default: 5000)
 */
function showError(message, duration = 5000) {
    // Buscar contenedor de errores existente o crear uno
    let errorContainer = document.getElementById('error-toast-container');
    
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-toast-container';
        errorContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(errorContainer);
    }
    
    // Crear toast de error
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.style.cssText = `
        background: #f44336;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 20px;
            padding: 0;
            margin-left: auto;
        ">×</button>
    `;
    
    errorContainer.appendChild(toast);
    
    // Auto-remover después del tiempo especificado
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Mostrar mensaje de éxito al usuario
 * @param {string} message - Mensaje de éxito
 * @param {number} duration - Duración en milisegundos (default: 3000)
 */
function showSuccess(message, duration = 3000) {
    let successContainer = document.getElementById('success-toast-container');
    
    if (!successContainer) {
        successContainer = document.createElement('div');
        successContainer.id = 'success-toast-container';
        successContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(successContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.style.cssText = `
        background: #4caf50;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 20px;
            padding: 0;
            margin-left: auto;
        ">×</button>
    `;
    
    successContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Agregar estilos de animación
if (!document.getElementById('fetch-utils-styles')) {
    const style = document.createElement('style');
    style.id = 'fetch-utils-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Exportar funciones
window.fetchWithTimeout = fetchWithTimeout;
window.fetchWithRetry = fetchWithRetry;
window.fetchAPI = fetchAPI;
window.showError = showError;
window.showSuccess = showSuccess;
