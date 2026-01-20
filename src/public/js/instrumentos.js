// Módulo de Gestión de Instrumentos
(function () {
    const token = localStorage.getItem('token');
    const API_URL = '/api/instrumentos';

    let currentPage = 1;
    const itemsPerPage = 10;
    let allInstruments = [];
    let filteredInstruments = [];

    // Elementos del DOM
    const instrumentsTableBody = document.getElementById('instrumentsTableBody');
    const instrumentsPagination = document.getElementById('instrumentsPagination');
    const searchInstrumentInput = document.getElementById('searchInstrumentInput');
    const instrumentForm = document.getElementById('instrumentForm');
    const instrumentModal = new bootstrap.Modal(document.getElementById('instrumentModal'));
    const addInstrumentBtn = document.getElementById('addInstrumentBtn');

    // Campos del formulario
    const instrumentIdInput = document.getElementById('instrumentId');
    const instrumentNameInput = document.getElementById('instrumentName');
    const instrumentCategoryInput = document.getElementById('instrumentCategory');
    const instrumentFormMessage = document.getElementById('instrumentFormMessage');

    // Función para limpiar validaciones
    const clearValidations = () => {
        [instrumentNameInput, instrumentCategoryInput].forEach(input => {
            if (input) {
                input.classList.remove('is-valid', 'is-invalid');
                const feedback = input.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.textContent = '';
                }
            }
        });
        if (instrumentFormMessage) {
            instrumentFormMessage.classList.add('d-none');
            instrumentFormMessage.textContent = '';
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
        if (!instrumentFormMessage) return;
        instrumentFormMessage.textContent = message;
        instrumentFormMessage.className = `alert alert-${type}`;
        instrumentFormMessage.classList.remove('d-none');

        setTimeout(() => {
            instrumentFormMessage.classList.add('d-none');
        }, 5000);
    };

    // Validación en tiempo real - Nombre
    if (instrumentNameInput) {
        instrumentNameInput.addEventListener('input', () => {
            const result = Validation.text.validate(instrumentNameInput.value, 'Nombre', 2, 50, true);
            if (instrumentNameInput.value.trim() === '') {
                instrumentNameInput.classList.remove('is-valid', 'is-invalid');
            } else if (result.valid) {
                showValidationSuccess(instrumentNameInput);
            } else {
                showValidationError(instrumentNameInput, result.errors[0]);
            }
        });
    }

    // Validación en tiempo real - Categoría (opcional)
    if (instrumentCategoryInput) {
        instrumentCategoryInput.addEventListener('input', () => {
            const value = instrumentCategoryInput.value.trim();
            if (value === '') {
                instrumentCategoryInput.classList.remove('is-valid', 'is-invalid');
            } else {
                const result = Validation.text.validate(value, 'Categoría', 2, 50, false);
                if (result.valid) {
                    showValidationSuccess(instrumentCategoryInput);
                } else {
                    showValidationError(instrumentCategoryInput, result.errors[0]);
                }
            }
        });
    }

    // Cargar instrumentos
    const loadInstruments = async () => {
        try {
            const response = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al cargar instrumentos');
            }

            allInstruments = await response.json();
            filteredInstruments = [...allInstruments];
            renderInstruments();
        } catch (error) {
            console.error('Error:', error);
            if (instrumentsTableBody) {
                instrumentsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar instrumentos</td></tr>';
            }
        }
    };

    // Renderizar instrumentos
    const renderInstruments = () => {
        if (!instrumentsTableBody) return;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const instrumentsToShow = filteredInstruments.slice(startIndex, endIndex);

        if (instrumentsToShow.length === 0) {
            instrumentsTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No hay instrumentos para mostrar</td></tr>';
            return;
        }

        instrumentsTableBody.innerHTML = instrumentsToShow.map(instrument => `
            <tr>
                <td>${instrument.id_instrumento}</td>
                <td>${instrument.nombre}</td>
                <td>${instrument.categoria || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.editInstrument(${instrument.id_instrumento})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteInstrument(${instrument.id_instrumento})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        renderPagination();
    };

    // Renderizar paginación
    const renderPagination = () => {
        if (!instrumentsPagination) return;

        const totalPages = Math.ceil(filteredInstruments.length / itemsPerPage);

        if (totalPages <= 1) {
            instrumentsPagination.innerHTML = '';
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

        instrumentsPagination.innerHTML = paginationHTML;

        instrumentsPagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== currentPage) {
                    currentPage = page;
                    renderInstruments();
                }
            });
        });
    };

    // Búsqueda
    if (searchInstrumentInput) {
        searchInstrumentInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filteredInstruments = allInstruments.filter(instrument =>
                instrument.nombre.toLowerCase().includes(searchTerm) ||
                (instrument.categoria && instrument.categoria.toLowerCase().includes(searchTerm))
            );
            currentPage = 1;
            renderInstruments();
        });
    }

    // Agregar instrumento
    if (addInstrumentBtn) {
        addInstrumentBtn.addEventListener('click', () => {
            clearValidations();
            instrumentForm.reset();
            if (instrumentIdInput) instrumentIdInput.value = '';
            document.getElementById('instrumentModalLabel').textContent = 'Agregar Instrumento';
        });
    }

    // Editar instrumento
    window.editInstrument = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al cargar instrumento');
            }

            const instrument = await response.json();

            clearValidations();
            if (instrumentIdInput) instrumentIdInput.value = instrument.id_instrumento;
            if (instrumentNameInput) instrumentNameInput.value = instrument.nombre;
            if (instrumentCategoryInput) instrumentCategoryInput.value = instrument.categoria || '';

            document.getElementById('instrumentModalLabel').textContent = 'Editar Instrumento';
            instrumentModal.show();
        } catch (error) {
            console.error('Error:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error al cargar el instrumento', 'danger');
        }
    };

    // Eliminar instrumento
    window.deleteInstrument = async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este instrumento?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar instrumento');
            }

            await loadInstruments();
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Éxito', 'Instrumento eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error al eliminar el instrumento', 'danger');
        }
    };

    // Enviar formulario
    if (instrumentForm) {
        instrumentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearValidations();

            let hasErrors = false;

            // Validar nombre
            const nameResult = Validation.text.validate(instrumentNameInput.value, 'Nombre', 2, 50, true);
            if (!nameResult.valid) {
                showValidationError(instrumentNameInput, nameResult.errors[0]);
                hasErrors = true;
            } else {
                showValidationSuccess(instrumentNameInput);
            }

            // Validar categoría (opcional)
            const categoryValue = instrumentCategoryInput.value.trim();
            if (categoryValue !== '') {
                const categoryResult = Validation.text.validate(categoryValue, 'Categoría', 2, 50, false);
                if (!categoryResult.valid) {
                    showValidationError(instrumentCategoryInput, categoryResult.errors[0]);
                    hasErrors = true;
                } else {
                    showValidationSuccess(instrumentCategoryInput);
                }
            }

            if (hasErrors) {
                showFormMessage('Por favor, corrige los errores en el formulario', 'warning');
                return;
            }

            // Preparar datos
            const instrumentData = {
                nombre: instrumentNameInput.value.trim(),
                categoria: categoryValue || null
            };

            try {
                const isEditing = instrumentIdInput && instrumentIdInput.value;
                const url = isEditing ? `${API_URL}/${instrumentIdInput.value}` : API_URL;
                const method = isEditing ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(instrumentData)
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 409) {
                        showValidationError(instrumentNameInput, 'Este instrumento ya existe');
                        showFormMessage('El instrumento ya existe', 'danger');
                    } else {
                        throw new Error(data.message || 'Error al guardar instrumento');
                    }
                    return;
                }

                showFormMessage(isEditing ? 'Instrumento actualizado correctamente' : 'Instrumento creado correctamente', 'success');

                setTimeout(() => {
                    instrumentModal.hide();
                    loadInstruments();
                }, 1500);

            } catch (error) {
                console.error('Error:', error);
                showFormMessage(error.message || 'Error al guardar el instrumento', 'danger');
            }
        });
    }

    // Inicializar
    loadInstruments();
})();
