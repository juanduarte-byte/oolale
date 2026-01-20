// Módulo de Gestión de Géneros
(function () {
    const token = localStorage.getItem('token');
    const API_URL = '/api/generos';

    let currentPage = 1;
    const itemsPerPage = 10;
    let allGenres = [];
    let filteredGenres = [];

    // Elementos del DOM
    const genresTableBody = document.getElementById('genresTableBody');
    const genresPagination = document.getElementById('genresPagination');
    const searchGenreInput = document.getElementById('searchGenreInput');
    const genreForm = document.getElementById('genreForm');
    const genreModal = new bootstrap.Modal(document.getElementById('genreModal'));
    const addGenreBtn = document.getElementById('addGenreBtn');

    // Campos del formulario
    const genreIdInput = document.getElementById('genreId');
    const genreNameInput = document.getElementById('genreName');
    const genreFormMessage = document.getElementById('genreFormMessage');

    // Función para limpiar validaciones
    const clearValidations = () => {
        if (genreNameInput) {
            genreNameInput.classList.remove('is-valid', 'is-invalid');
            const feedback = genreNameInput.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.textContent = '';
            }
        }
        if (genreFormMessage) {
            genreFormMessage.classList.add('d-none');
            genreFormMessage.textContent = '';
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
        if (!genreFormMessage) return;
        genreFormMessage.textContent = message;
        genreFormMessage.className = `alert alert-${type}`;
        genreFormMessage.classList.remove('d-none');

        setTimeout(() => {
            genreFormMessage.classList.add('d-none');
        }, 5000);
    };

    // Validación en tiempo real - Nombre
    if (genreNameInput) {
        genreNameInput.addEventListener('input', () => {
            const result = Validation.text.validate(genreNameInput.value, 'Nombre', 2, 50, true);
            if (genreNameInput.value.trim() === '') {
                genreNameInput.classList.remove('is-valid', 'is-invalid');
            } else if (result.valid) {
                showValidationSuccess(genreNameInput);
            } else {
                showValidationError(genreNameInput, result.errors[0]);
            }
        });
    }

    // Cargar géneros
    const loadGenres = async () => {
        try {
            const response = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al cargar géneros');
            }

            allGenres = await response.json();
            filteredGenres = [...allGenres];
            renderGenres();
        } catch (error) {
            console.error('Error:', error);
            if (genresTableBody) {
                genresTableBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Error al cargar géneros</td></tr>';
            }
        }
    };

    // Renderizar géneros
    const renderGenres = () => {
        if (!genresTableBody) return;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const genresToShow = filteredGenres.slice(startIndex, endIndex);

        if (genresToShow.length === 0) {
            genresTableBody.innerHTML = '<tr><td colspan="3" class="text-center">No hay géneros para mostrar</td></tr>';
            return;
        }

        genresTableBody.innerHTML = genresToShow.map(genre => `
            <tr>
                <td>${genre.id_genero}</td>
                <td>${genre.nombre}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.editGenre(${genre.id_genero})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteGenre(${genre.id_genero})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        renderPagination();
    };

    // Renderizar paginación
    const renderPagination = () => {
        if (!genresPagination) return;

        const totalPages = Math.ceil(filteredGenres.length / itemsPerPage);

        if (totalPages <= 1) {
            genresPagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        paginationHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>
            </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        paginationHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a>
            </li>
        `;

        genresPagination.innerHTML = paginationHTML;

        genresPagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== currentPage) {
                    currentPage = page;
                    renderGenres();
                }
            });
        });
    };

    // Búsqueda
    if (searchGenreInput) {
        searchGenreInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filteredGenres = allGenres.filter(genre =>
                genre.nombre.toLowerCase().includes(searchTerm)
            );
            currentPage = 1;
            renderGenres();
        });
    }

    // Agregar género
    if (addGenreBtn) {
        addGenreBtn.addEventListener('click', () => {
            clearValidations();
            genreForm.reset();
            if (genreIdInput) genreIdInput.value = '';
            document.getElementById('genreModalLabel').textContent = 'Agregar Género';
        });
    }

    // Editar género
    window.editGenre = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al cargar género');
            }

            const genre = await response.json();

            clearValidations();
            if (genreIdInput) genreIdInput.value = genre.id_genero;
            if (genreNameInput) genreNameInput.value = genre.nombre;

            document.getElementById('genreModalLabel').textContent = 'Editar Género';
            genreModal.show();
        } catch (error) {
            console.error('Error:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error al cargar el género', 'danger');
        }
    };

    // Eliminar género
    window.deleteGenre = async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este género?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar género');
            }

            await loadGenres();
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Éxito', 'Género eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error al eliminar el género', 'danger');
        }
    };

    // Enviar formulario
    if (genreForm) {
        genreForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearValidations();

            let hasErrors = false;

            // Validar nombre
            const nameResult = Validation.text.validate(genreNameInput.value, 'Nombre', 2, 50, true);
            if (!nameResult.valid) {
                showValidationError(genreNameInput, nameResult.errors[0]);
                hasErrors = true;
            } else {
                showValidationSuccess(genreNameInput);
            }

            if (hasErrors) {
                showFormMessage('Por favor, corrige los errores en el formulario', 'warning');
                return;
            }

            // Preparar datos
            const genreData = {
                nombre: genreNameInput.value.trim()
            };

            try {
                const isEditing = genreIdInput && genreIdInput.value;
                const url = isEditing ? `${API_URL}/${genreIdInput.value}` : API_URL;
                const method = isEditing ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(genreData)
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 409) {
                        showValidationError(genreNameInput, 'Este género ya existe');
                        showFormMessage('El género ya existe', 'danger');
                    } else {
                        throw new Error(data.message || 'Error al guardar género');
                    }
                    return;
                }

                showFormMessage(isEditing ? 'Género actualizado correctamente' : 'Género creado correctamente', 'success');

                setTimeout(() => {
                    genreModal.hide();
                    loadGenres();
                }, 1500);

            } catch (error) {
                console.error('Error:', error);
                showFormMessage(error.message || 'Error al guardar el género', 'danger');
            }
        });
    }

    // Inicializar
    loadGenres();
})();
