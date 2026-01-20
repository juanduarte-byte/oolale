(function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const configMessage = document.getElementById('configMessage');
    const saveConfigBtn = document.getElementById('saveConfigBtn');

    // Función para mostrar mensajes
    const showMessage = (message, type = 'success') => {
        configMessage.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        setTimeout(() => {
            configMessage.innerHTML = '';
        }, 5000);
    };

    // Toggle de configuraciones de pago
    const paypalEnabled = document.getElementById('paypalEnabled');
    const paypalConfig = document.getElementById('paypalConfig');
    const mercadopagoEnabled = document.getElementById('mercadopagoEnabled');
    const mercadopagoConfig = document.getElementById('mercadopagoConfig');

    if (paypalEnabled) {
        paypalEnabled.addEventListener('change', (e) => {
            paypalConfig.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    if (mercadopagoEnabled) {
        mercadopagoEnabled.addEventListener('change', (e) => {
            mercadopagoConfig.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    // Cargar configuración actual
    const loadConfiguration = async () => {
        try {
            const response = await fetch('/api/configuraciones/system/config', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                // Si no existe endpoint, usar valores por defecto
                console.log('Usando configuración por defecto');
                return;
            }

            const config = await response.json();

            // Cargar configuración de pagos
            if (config.pagos) {
                if (config.pagos.paypal) {
                    document.getElementById('paypalEnabled').checked = config.pagos.paypal.enabled || false;
                    document.getElementById('paypalClientId').value = config.pagos.paypal.clientId || '';
                    document.getElementById('paypalSandbox').checked = config.pagos.paypal.sandbox || false;
                    paypalConfig.style.display = config.pagos.paypal.enabled ? 'block' : 'none';
                }
                if (config.pagos.mercadopago) {
                    document.getElementById('mercadopagoEnabled').checked = config.pagos.mercadopago.enabled || false;
                    document.getElementById('mercadopagoPublicKey').value = config.pagos.mercadopago.publicKey || '';
                    mercadopagoConfig.style.display = config.pagos.mercadopago.enabled ? 'block' : 'none';
                }
            }

            // Cargar configuración de email
            if (config.email) {
                document.getElementById('emailHost').value = config.email.host || '';
                document.getElementById('emailPort').value = config.email.port || 587;
                document.getElementById('emailUser').value = config.email.user || '';
                document.getElementById('emailSecure').checked = config.email.secure || false;
            }

            // Cargar configuración general
            if (config.general) {
                document.getElementById('siteName').value = config.general.siteName || 'Óolale';
                document.getElementById('siteUrl').value = config.general.siteUrl || '';
                document.getElementById('maxUploadSize').value = config.general.maxUploadSize || 10;
                document.getElementById('sessionTimeout').value = config.general.sessionTimeout || 60;
            }

            // Cargar configuración de seguridad
            if (config.security) {
                document.getElementById('requireEmailVerification').checked = config.security.requireEmailVerification || false;
                document.getElementById('enableTwoFactor').checked = config.security.enableTwoFactor || false;
                document.getElementById('logLoginAttempts').checked = config.security.logLoginAttempts || false;
            }

        } catch (error) {
            console.error('Error al cargar configuración:', error);
        }
    };

    // Cargar información del sistema
    const loadSystemInfo = async () => {
        try {
            // Obtener total de usuarios
            const usersResponse = await fetch('/api/usuarios', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                document.getElementById('totalUsers').textContent = Array.isArray(users) ? users.length : 0;
            }

            // Fecha actual como última actualización
            document.getElementById('lastUpdate').textContent = new Date().toLocaleDateString('es-ES');

        } catch (error) {
            console.error('Error al cargar información del sistema:', error);
        }
    };

    // Guardar configuración
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', async () => {
            try {
                const configuration = {
                    pagos: {
                        paypal: {
                            enabled: document.getElementById('paypalEnabled').checked,
                            clientId: document.getElementById('paypalClientId').value.trim(),
                            secret: document.getElementById('paypalSecret').value.trim(),
                            sandbox: document.getElementById('paypalSandbox').checked
                        },
                        mercadopago: {
                            enabled: document.getElementById('mercadopagoEnabled').checked,
                            accessToken: document.getElementById('mercadopagoAccessToken').value.trim(),
                            publicKey: document.getElementById('mercadopagoPublicKey').value.trim()
                        }
                    },
                    email: {
                        host: document.getElementById('emailHost').value.trim(),
                        port: parseInt(document.getElementById('emailPort').value) || 587,
                        user: document.getElementById('emailUser').value.trim(),
                        password: document.getElementById('emailPassword').value.trim(),
                        secure: document.getElementById('emailSecure').checked
                    },
                    general: {
                        siteName: document.getElementById('siteName').value.trim(),
                        siteUrl: document.getElementById('siteUrl').value.trim(),
                        maxUploadSize: parseInt(document.getElementById('maxUploadSize').value) || 10,
                        sessionTimeout: parseInt(document.getElementById('sessionTimeout').value) || 60
                    },
                    security: {
                        requireEmailVerification: document.getElementById('requireEmailVerification').checked,
                        enableTwoFactor: document.getElementById('enableTwoFactor').checked,
                        logLoginAttempts: document.getElementById('logLoginAttempts').checked
                    }
                };

                const response = await fetch('/api/configuraciones/system/config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(configuration)
                });

                if (!response.ok) {
                    throw new Error('Error al guardar la configuración');
                }

                showMessage('Configuración guardada correctamente', 'success');
                
                // Limpiar campos de contraseña
                document.getElementById('paypalSecret').value = '';
                document.getElementById('mercadopagoAccessToken').value = '';
                document.getElementById('emailPassword').value = '';

            } catch (error) {
                console.error('Error:', error);
                showMessage(error.message || 'Error al guardar la configuración', 'danger');
            }
        });
    }

    // Cargar datos al iniciar
    loadConfiguration();
    loadSystemInfo();
})();
