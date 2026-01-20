(function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const profileForm = document.getElementById('profileForm');
    const profileMessage = document.getElementById('profileMessage');
    const newPasswordInput = document.getElementById('newPassword');
    const passwordRequirements = document.querySelector('.password-requirements');

    // Función para mostrar mensajes
    const showMessage = (message, type = 'success') => {
        profileMessage.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        setTimeout(() => {
            profileMessage.innerHTML = '';
        }, 5000);
    };

    // Cargar datos del perfil
    const loadProfile = async () => {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al cargar el perfil');
            }

            const data = await response.json();
            
            document.getElementById('profileNombre').value = data.nombre || '';
            document.getElementById('profileApellido').value = data.apellido || '';
            document.getElementById('profileEmail').value = data.email || '';
            document.getElementById('profileTelefono').value = data.telefono || '';
            document.getElementById('profileRol').value = data.rol || '';
            
            if (data.fecha_registro) {
                const fecha = new Date(data.fecha_registro);
                document.getElementById('profileFechaRegistro').value = fecha.toLocaleDateString('es-ES');
            }

        } catch (error) {
            console.error('Error:', error);
            showMessage('Error al cargar los datos del perfil', 'danger');
        }
    };

    // Validación en tiempo real de nueva contraseña
    if (newPasswordInput) {
        newPasswordInput.addEventListener('focus', () => {
            if (passwordRequirements) {
                passwordRequirements.style.display = 'block';
            }
        });

        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            
            if (password.length > 0 && passwordRequirements) {
                passwordRequirements.style.display = 'block';
                
                // Actualizar requisitos visuales
                document.getElementById('req-length-profile').classList.toggle('valid', password.length >= 8);
                document.getElementById('req-uppercase-profile').classList.toggle('valid', /[A-Z]/.test(password));
                document.getElementById('req-lowercase-profile').classList.toggle('valid', /[a-z]/.test(password));
                document.getElementById('req-number-profile').classList.toggle('valid', /[0-9]/.test(password));
                document.getElementById('req-special-profile').classList.toggle('valid', /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password));
            } else if (password.length === 0 && passwordRequirements) {
                passwordRequirements.style.display = 'none';
            }
        });
    }

    // Manejar el envío del formulario
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Limpiar validaciones previas
            document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
            document.querySelectorAll('.invalid-feedback').forEach(el => {
                el.textContent = '';
                el.style.display = 'none';
            });

            const nombre = document.getElementById('profileNombre').value.trim();
            const apellido = document.getElementById('profileApellido').value.trim();
            const telefono = document.getElementById('profileTelefono').value.trim();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            let hasErrors = false;

            // Validar nombre
            const nombreResult = Validation.name.validate(nombre, 'nombre');
            if (!nombreResult.valid) {
                const input = document.getElementById('profileNombre');
                input.classList.add('is-invalid');
                const feedback = input.nextElementSibling;
                if (feedback) {
                    feedback.textContent = nombreResult.errors[0];
                    feedback.style.display = 'block';
                }
                hasErrors = true;
            }

            // Validar apellido
            const apellidoResult = Validation.name.validate(apellido, 'apellido');
            if (!apellidoResult.valid) {
                const input = document.getElementById('profileApellido');
                input.classList.add('is-invalid');
                const feedback = input.nextElementSibling;
                if (feedback) {
                    feedback.textContent = apellidoResult.errors[0];
                    feedback.style.display = 'block';
                }
                hasErrors = true;
            }

            // Validar teléfono (opcional)
            if (telefono) {
                const telefonoResult = Validation.phone.validate(telefono, false);
                if (!telefonoResult.valid) {
                    const input = document.getElementById('profileTelefono');
                    input.classList.add('is-invalid');
                    const feedback = input.nextElementSibling;
                    if (feedback) {
                        feedback.textContent = telefonoResult.errors[0];
                        feedback.style.display = 'block';
                    }
                    hasErrors = true;
                }
            }

            // Validar cambio de contraseña si se proporcionó
            if (newPassword || confirmPassword || currentPassword) {
                if (!currentPassword) {
                    const input = document.getElementById('currentPassword');
                    input.classList.add('is-invalid');
                    const feedback = input.nextElementSibling;
                    if (feedback) {
                        feedback.textContent = 'Debe ingresar su contraseña actual';
                        feedback.style.display = 'block';
                    }
                    hasErrors = true;
                }

                if (newPassword) {
                    const passwordResult = Validation.password.validate(newPassword);
                    if (!passwordResult.valid) {
                        const input = document.getElementById('newPassword');
                        input.classList.add('is-invalid');
                        const feedback = input.nextElementSibling.nextElementSibling;
                        if (feedback) {
                            feedback.textContent = passwordResult.errors[0];
                            feedback.style.display = 'block';
                        }
                        hasErrors = true;
                    }
                }

                if (newPassword !== confirmPassword) {
                    const input = document.getElementById('confirmPassword');
                    input.classList.add('is-invalid');
                    const feedback = input.nextElementSibling;
                    if (feedback) {
                        feedback.textContent = 'Las contraseñas no coinciden';
                        feedback.style.display = 'block';
                    }
                    hasErrors = true;
                }
            }

            if (hasErrors) {
                showMessage('Por favor corrige los errores en el formulario', 'warning');
                return;
            }

            try {
                const updateData = {
                    nombre,
                    apellido,
                    telefono
                };

                // Si hay cambio de contraseña, agregarlo
                if (currentPassword && newPassword) {
                    updateData.currentPassword = currentPassword;
                    updateData.newPassword = newPassword;
                }

                const response = await fetch('/api/auth/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updateData)
                });

                const result = await response.json();

                if (!response.ok) {
                    // Manejar error de contraseña incorrecta
                    if (response.status === 401) {
                        const input = document.getElementById('currentPassword');
                        input.classList.add('is-invalid');
                        const feedback = input.nextElementSibling;
                        if (feedback) {
                            feedback.textContent = 'La contraseña actual es incorrecta';
                            feedback.style.display = 'block';
                        }
                        showMessage('La contraseña actual es incorrecta', 'danger');
                        return;
                    }
                    throw new Error(result.message || 'Error al actualizar el perfil');
                }

                showMessage('Perfil actualizado correctamente', 'success');
                
                // Limpiar campos de contraseña
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
                
                // Ocultar requisitos de contraseña
                if (passwordRequirements) {
                    passwordRequirements.style.display = 'none';
                }

                // Recargar perfil
                loadProfile();

            } catch (error) {
                console.error('Error:', error);
                showMessage(error.message || 'Error al actualizar el perfil', 'danger');
            }
        });
    }

    // Cargar el perfil al iniciar
    loadProfile();
})();
