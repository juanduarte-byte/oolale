// Módulo de Gestión de Usuarios
(function () {
    const token = localStorage.getItem('token');
    const API_URL = '/api/usuarios';

    let currentPage = 1;
    const itemsPerPage = 10;
    let allUsers = [];
    let filteredUsers = [];

    // Elementos del DOM
    const usersTableBody = document.getElementById('usersTableBody');
    const usersPagination = document.getElementById('usersPagination');
    const searchUserInput = document.getElementById('searchUserInput');
    const userForm = document.getElementById('userForm');
    const userModal = new bootstrap.Modal(document.getElementById('userModal'));
    const addUserBtn = document.getElementById('addUserBtn');

    // Campos del formulario
    const userIdInput = document.getElementById('userId');
    const userEmailInput = document.getElementById('userEmail');
    const userNameInput = document.getElementById('userName');
    const userPasswordInput = document.getElementById('userPassword');
    const userStatusInput = document.getElementById('userStatus');
    const userFormMessage = document.getElementById('userFormMessage');

    // Función para limpiar validaciones
    const clearValidations = () => {
        [userEmailInput, userNameInput, userPasswordInput, userStatusInput].forEach(input => {
            if (input) {
                input.classList.remove('is-valid', 'is-invalid');
                const feedback = input.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.textContent = '';
                }
            }
        });
        if (userFormMessage) {
            userFormMessage.classList.add('d-none');
            userFormMessage.textContent = '';
        }
    };

    // Función para mostrar error de validación
    const showValidationError = (input, message) => {
        if (!input) return;
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        const feedback = input.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = message;
        }
    };

    // Función para mostrar éxito de validación
    const showValidationSuccess = (input) => {
        if (!input) return;
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    };

    // Función para mostrar mensaje en el formulario
    const showFormMessage = (message, type = 'success') => {
        if (!userFormMessage) return;
        userFormMessage.textContent = message;
        userFormMessage.className = `alert alert-${type}`;
        userFormMessage.classList.remove('d-none');

        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            userFormMessage.classList.add('d-none');
        }, 5000);
    };

    // Validación en tiempo real
    if (userEmailInput) {
        userEmailInput.addEventListener('input', () => {
            const result = Validation.email.validate(userEmailInput.value);
            if (userEmailInput.value.trim() === '') {
                userEmailInput.classList.remove('is-valid', 'is-invalid');
            } else if (result.valid) {
                showValidationSuccess(userEmailInput);
            } else {
                showValidationError(userEmailInput, result.errors[0]);
            }
        });
    }

    if (userNameInput) {
        userNameInput.addEventListener('input', () => {
            const result = Validation.text.validate(userNameInput.value, 'Nombre completo', 3, 255, true);
            if (userNameInput.value.trim() === '') {
                userNameInput.classList.remove('is-valid', 'is-invalid');
            } else if (result.valid) {
                showValidationSuccess(userNameInput);
            } else {
                showValidationError(userNameInput, result.errors[0]);
            }
        });
    }

    if (userPasswordInput) {
        userPasswordInput.addEventListener('input', () => {
            const value = userPasswordInput.value;
            const isEditing = userIdInput && userIdInput.value;

            // Si está editando y el campo está vacío, es válido (no cambiar contraseña)
            if (isEditing && value === '') {
                userPasswordInput.classList.remove('is-valid', 'is-invalid');
                return;
            }

            // Si hay valor, validar
            if (value !== '') {
                const result = Validation.password.validate(value);
                if (result.valid) {
                    showValidationSuccess(userPasswordInput);
                } else {
                    showValidationError(userPasswordInput, result.errors[0]);
                }
            }
        });
    }

    // Cargar usuarios
    const loadUsers = async () => {
        try {
            const response = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al cargar usuarios');
            }

            allUsers = await response.json();
            filteredUsers = [...allUsers];
            renderUsers();
        } catch (error) {
            console.error('Error:', error);
            if (usersTableBody) {
                usersTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar usuarios</td></tr>';
            }
        }
    };

    // Renderizar usuarios
    const renderUsers = () => {
        if (!usersTableBody) return;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const usersToShow = filteredUsers.slice(startIndex, endIndex);

        if (usersToShow.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay usuarios para mostrar</td></tr>';
            return;
        }

        usersTableBody.innerHTML = usersToShow.map(user => `
            <tr>
                <td>${user.id_usuario}</td>
                <td>${user.correo_electronico}</td>
                <td>${user.nombre_completo || 'N/A'}</td>
                <td>${user.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <span class="badge bg-${user.estado_cuenta === 'activo' ? 'success' : user.estado_cuenta === 'suspendido' ? 'warning' : 'danger'}">
                        ${user.estado_cuenta}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.editUser(${user.id_usuario})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteUser(${user.id_usuario})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        renderPagination();
    };

    // Renderizar paginación
    const renderPagination = () => {
        if (!usersPagination) return;

        const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

        if (totalPages <= 1) {
            usersPagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Botón anterior
        paginationHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>
            </li>
        `;

        // Números de página
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // Botón siguiente
        paginationHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a>
            </li>
        `;

        usersPagination.innerHTML = paginationHTML;

        // Event listeners para paginación
        usersPagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== currentPage) {
                    currentPage = page;
                    renderUsers();
                }
            });
        });
    };

    // Búsqueda
    if (searchUserInput) {
        searchUserInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filteredUsers = allUsers.filter(user =>
                user.correo_electronico.toLowerCase().includes(searchTerm) ||
                (user.nombre_completo && user.nombre_completo.toLowerCase().includes(searchTerm))
            );
            currentPage = 1;
            renderUsers();
        });
    }

    // Agregar usuario
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            clearValidations();
            userForm.reset();
            if (userIdInput) userIdInput.value = '';
            document.getElementById('userModalLabel').textContent = 'Agregar Usuario';
            if (userPasswordInput) {
                userPasswordInput.required = true;
                userPasswordInput.parentElement.querySelector('.form-text').textContent = 'Mínimo 8 caracteres';
            }
        });
    }

    // Editar usuario
    window.editUser = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al cargar usuario');
            }

            const user = await response.json();

            clearValidations();
            if (userIdInput) userIdInput.value = user.id_usuario;
            if (userEmailInput) userEmailInput.value = user.correo_electronico;
            if (userNameInput) userNameInput.value = user.nombre_completo || '';
            if (userPasswordInput) {
                userPasswordInput.value = '';
                userPasswordInput.required = false;
            }
            if (userStatusInput) userStatusInput.value = user.estado_cuenta;

            document.getElementById('userModalLabel').textContent = 'Editar Usuario';
            userModal.show();
        } catch (error) {
            console.error('Error:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error al cargar el usuario', 'danger');
        }
    };

    // Eliminar usuario
    window.deleteUser = async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar usuario');
            }

            await loadUsers();
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Éxito', 'Usuario eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', error.message || 'Error al eliminar usuario', 'danger');
        }
    };

    // Enviar formulario
    if (userForm) {
        userForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearValidations();

            let hasErrors = false;

            // Validar email
            const emailResult = Validation.email.validate(userEmailInput.value);
            if (!emailResult.valid) {
                showValidationError(userEmailInput, emailResult.errors[0]);
                hasErrors = true;
            } else {
                showValidationSuccess(userEmailInput);
            }

            // Validar nombre
            const nameResult = Validation.text.validate(userNameInput.value, 'Nombre completo', 3, 255, true);
            if (!nameResult.valid) {
                showValidationError(userNameInput, nameResult.errors[0]);
                hasErrors = true;
            } else {
                showValidationSuccess(userNameInput);
            }

            // Validar contraseña (solo si se proporciona o es nuevo usuario)
            const isEditing = userIdInput && userIdInput.value;
            const passwordValue = userPasswordInput.value;

            if (!isEditing || passwordValue !== '') {
                const passwordResult = Validation.password.validate(passwordValue);
                if (!passwordResult.valid) {
                    showValidationError(userPasswordInput, passwordResult.errors[0]);
                    hasErrors = true;
                } else {
                    showValidationSuccess(userPasswordInput);
                }
            }

            if (hasErrors) {
                showFormMessage('Por favor, corrige los errores en el formulario', 'warning');
                return;
            }

            // Preparar datos
            const userData = {
                correo_electronico: userEmailInput.value.trim(),
                nombre_completo: userNameInput.value.trim(),
                estado_cuenta: userStatusInput.value
            };

            // Solo incluir contraseña si se proporciona
            if (passwordValue) {
                userData.contrasena = passwordValue;
            }

            try {
                const url = isEditing ? `${API_URL}/${userIdInput.value}` : API_URL;
                const method = isEditing ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(userData)
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 409) {
                        showValidationError(userEmailInput, 'Este correo electrónico ya está registrado');
                        showFormMessage('El correo electrónico ya está en uso', 'danger');
                    } else {
                        throw new Error(data.message || 'Error al guardar usuario');
                    }
                    return;
                }

                showFormMessage(isEditing ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente', 'success');

                setTimeout(() => {
                    userModal.hide();
                    loadUsers();
                }, 1500);

            } catch (error) {
                console.error('Error:', error);
                showFormMessage(error.message || 'Error al guardar el usuario', 'danger');
            }
        });
    }

    // Inicializar
    loadUsers();
})();
