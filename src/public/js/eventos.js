// Módulo de Gestión de Eventos
(function () {
    const token = localStorage.getItem('token');
    const API_URL = '/api/eventos';

    let currentPage = 1;
    const itemsPerPage = 10;
    let allEvents = [];
    let filteredEvents = [];
    let eventModal;

    // Elementos del DOM
    const eventsTableBody = document.getElementById('eventsTableBody');
    const eventsPagination = document.getElementById('eventsPagination');
    const searchEventInput = document.getElementById('searchEventInput');
    const eventForm = document.getElementById('eventForm');
    const addEventBtn = document.getElementById('addEventBtn');
    const eventFormMessage = document.getElementById('eventFormMessage');

    // Campos del formulario
    const eventIdInput = document.getElementById('eventId');
    const eventTitleInput = document.getElementById('eventTitle');
    const eventDescriptionInput = document.getElementById('eventDescription');
    const eventDateInput = document.getElementById('eventDate');
    const eventTimeInput = document.getElementById('eventTime');
    const eventLocationInput = document.getElementById('eventLocation');
    const eventCapacityInput = document.getElementById('eventCapacity');
    const eventTypeInput = document.getElementById('eventType');
    const eventVisibilityInput = document.getElementById('eventVisibility');

    // Inicializar modal
    const eventModalElement = document.getElementById('eventModal');
    if (eventModalElement) {
        eventModal = new bootstrap.Modal(eventModalElement);
    }

    // Función para limpiar validaciones
    const clearValidations = () => {
        [eventTitleInput, eventDescriptionInput, eventDateInput, eventTimeInput,
            eventLocationInput, eventCapacityInput].forEach(input => {
                if (input) {
                    input.classList.remove('is-valid', 'is-invalid');
                    const feedback = input.nextElementSibling;
                    if (feedback && feedback.classList.contains('invalid-feedback')) {
                        feedback.textContent = '';
                    }
                }
            });
        if (eventFormMessage) {
            eventFormMessage.classList.add('d-none');
            eventFormMessage.textContent = '';
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
        if (!eventFormMessage) return;
        eventFormMessage.textContent = message;
        eventFormMessage.className = `alert alert-${type}`;
        eventFormMessage.classList.remove('d-none');

        setTimeout(() => {
            eventFormMessage.classList.add('d-none');
        }, 5000);
    };

    // Validación en tiempo real - Título
    if (eventTitleInput) {
        eventTitleInput.addEventListener('input', () => {
            const value = eventTitleInput.value.trim();
            if (value === '') {
                eventTitleInput.classList.remove('is-valid', 'is-invalid');
            } else if (value.length < 5) {
                showValidationError(eventTitleInput, 'El título debe tener al menos 5 caracteres');
            } else if (value.length > 200) {
                showValidationError(eventTitleInput, 'El título no puede exceder 200 caracteres');
            } else {
                showValidationSuccess(eventTitleInput);
            }
        });
    }

    // Validación en tiempo real - Descripción
    if (eventDescriptionInput) {
        eventDescriptionInput.addEventListener('input', () => {
            const value = eventDescriptionInput.value.trim();
            if (value === '') {
                eventDescriptionInput.classList.remove('is-valid', 'is-invalid');
            } else if (value.length < 10) {
                showValidationError(eventDescriptionInput, 'La descripción debe tener al menos 10 caracteres');
            } else if (value.length > 2000) {
                showValidationError(eventDescriptionInput, 'La descripción no puede exceder 2000 caracteres');
            } else {
                showValidationSuccess(eventDescriptionInput);
            }
        });
    }

    // Validación en tiempo real - Fecha
    if (eventDateInput) {
        eventDateInput.addEventListener('input', () => {
            const value = eventDateInput.value;
            if (value === '') {
                eventDateInput.classList.remove('is-valid', 'is-invalid');
            } else {
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (selectedDate < today) {
                    showValidationError(eventDateInput, 'La fecha del evento debe ser futura');
                } else {
                    showValidationSuccess(eventDateInput);
                }
            }
        });
    }

    // Validación en tiempo real - Ubicación
    if (eventLocationInput) {
        eventLocationInput.addEventListener('input', () => {
            const value = eventLocationInput.value.trim();
            if (value === '') {
                eventLocationInput.classList.remove('is-valid', 'is-invalid');
            } else if (value.length < 5) {
                showValidationError(eventLocationInput, 'La ubicación debe tener al menos 5 caracteres');
            } else if (value.length > 500) {
                showValidationError(eventLocationInput, 'La ubicación no puede exceder 500 caracteres');
            } else {
                showValidationSuccess(eventLocationInput);
            }
        });
    }

    // Validación en tiempo real - Capacidad
    if (eventCapacityInput) {
        eventCapacityInput.addEventListener('input', () => {
            const value = eventCapacityInput.value;
            if (value === '') {
                eventCapacityInput.classList.remove('is-valid', 'is-invalid');
            } else {
                const capacity = parseInt(value);
                if (isNaN(capacity) || capacity < 2) {
                    showValidationError(eventCapacityInput, 'La capacidad debe ser al menos 2');
                } else if (capacity > 1000) {
                    showValidationError(eventCapacityInput, 'La capacidad no puede exceder 1000');
                } else {
                    showValidationSuccess(eventCapacityInput);
                }
            }
        });
    }

    // Cargar eventos
    const loadEvents = async () => {
        try {
            const response = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al cargar eventos');
            }

            const data = await response.json();
            allEvents = data.data || [];
            filteredEvents = [...allEvents];
            renderEvents();
        } catch (error) {
            console.error('Error:', error);
            if (eventsTableBody) {
                eventsTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error al cargar eventos</td></tr>';
            }
        }
    };

    // Renderizar eventos
    const renderEvents = () => {
        if (!eventsTableBody) return;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const eventsToShow = filteredEvents.slice(startIndex, endIndex);

        if (eventsToShow.length === 0) {
            eventsTableBody.innerHTML = '<tr><td colspan="9" class="text-center">No hay eventos para mostrar</td></tr>';
            return;
        }

        eventsTableBody.innerHTML = eventsToShow.map(event => {
            const fecha = event.fecha_evento ? new Date(event.fecha_evento).toLocaleDateString() : 'N/A';
            const hora = event.hora_evento || 'N/A';
            const tipo = event.tipo || 'otro';
            const estado = event.estado || 'activo';
            const participantes = event.participantes_actuales || event.num_participantes || 0;
            const capacidad = event.capacidad || '∞';
            const disponible = event.espacios_disponibles !== null ? event.espacios_disponibles : '∞';

            const estadoBadge = estado === 'activo' ? 'success' : estado === 'cancelado' ? 'danger' : 'secondary';
            const tipoBadge = tipo === 'concierto' ? 'primary' : tipo === 'jam_session' ? 'info' : 'secondary';

            return `
                <tr>
                    <td>${event.id_evento}</td>
                    <td><strong>${event.titulo}</strong></td>
                    <td>${event.descripcion ? (event.descripcion.length > 50 ? event.descripcion.substring(0, 50) + '...' : event.descripcion) : 'N/A'}</td>
                    <td>${fecha}</td>
                    <td>${hora}</td>
                    <td>${event.ubicacion ? (event.ubicacion.length > 30 ? event.ubicacion.substring(0, 30) + '...' : event.ubicacion) : 'N/A'}</td>
                    <td><span class="badge bg-${tipoBadge}">${tipo}</span></td>
                    <td><span class="badge bg-${estadoBadge}">${estado}</span></td>
                    <td>
                        <small>${participantes}/${capacidad}</small><br>
                        <small class="text-muted">${disponible} disponibles</small>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="window.editEvent(${event.id_evento})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="window.viewParticipants(${event.id_evento})" title="Ver participantes">
                            <i class="bi bi-people"></i>
                        </button>
                        ${estado === 'activo' ? `
                        <button class="btn btn-sm btn-danger" onclick="window.cancelEvent(${event.id_evento})" title="Cancelar">
                            <i class="bi bi-x-circle"></i>
                        </button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger" onclick="window.deleteEvent(${event.id_evento})" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        renderPagination();
    };

    // Renderizar paginación
    const renderPagination = () => {
        if (!eventsPagination) return;

        const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

        if (totalPages <= 1) {
            eventsPagination.innerHTML = '';
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

        eventsPagination.innerHTML = paginationHTML;

        eventsPagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== currentPage) {
                    currentPage = page;
                    renderEvents();
                }
            });
        });
    };

    // Búsqueda
    if (searchEventInput) {
        searchEventInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filteredEvents = allEvents.filter(event =>
                event.titulo.toLowerCase().includes(searchTerm) ||
                (event.descripcion && event.descripcion.toLowerCase().includes(searchTerm)) ||
                (event.ubicacion && event.ubicacion.toLowerCase().includes(searchTerm)) ||
                (event.tipo && event.tipo.toLowerCase().includes(searchTerm))
            );
            currentPage = 1;
            renderEvents();
        });
    }

    // Agregar evento
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            clearValidations();
            eventForm.reset();
            if (eventIdInput) eventIdInput.value = '';
            document.getElementById('eventModalLabel').textContent = 'Agregar Evento';
        });
    }

    // Editar evento
    window.editEvent = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al cargar evento');
            }

            const data = await response.json();
            const event = data.data;

            clearValidations();
            if (eventIdInput) eventIdInput.value = event.id_evento;
            if (eventTitleInput) eventTitleInput.value = event.titulo;
            if (eventDescriptionInput) eventDescriptionInput.value = event.descripcion || '';
            if (eventDateInput) eventDateInput.value = event.fecha_evento;
            if (eventTimeInput) eventTimeInput.value = event.hora_evento;
            if (eventLocationInput) eventLocationInput.value = event.ubicacion || '';
            if (eventCapacityInput) eventCapacityInput.value = event.capacidad || '';
            if (eventTypeInput) eventTypeInput.value = event.tipo || 'otro';
            if (eventVisibilityInput) eventVisibilityInput.value = event.visibilidad || 'publico';

            document.getElementById('eventModalLabel').textContent = 'Editar Evento';
            eventModal.show();
        } catch (error) {
            console.error('Error:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error al cargar el evento', 'danger');
        }
    };

    // Ver participantes
    window.viewParticipants = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}/participantes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al cargar participantes');
            }

            const data = await response.json();
            const participantes = data.data || [];

            let message = `Participantes del evento:\n\n`;
            if (participantes.length === 0) {
                message += 'No hay participantes registrados aún.';
            } else {
                participantes.forEach((p, index) => {
                    message += `${index + 1}. ${p.nombre_completo} (${p.email})\n`;
                });
            }

            alert(message);
        } catch (error) {
            console.error('Error:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error al cargar participantes', 'danger');
        }
    };

    // Cancelar evento
    window.cancelEvent = async (id) => {
        if (!confirm('¿Estás seguro de que deseas cancelar este evento?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${id}/cancelar`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error?.message || 'Error al cancelar evento');
            }

            await loadEvents();
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Éxito', 'Evento cancelado correctamente', 'success');
        } catch (error) {
            console.error('Error:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', error.message, 'danger');
        }
    };

    // Eliminar evento
    window.deleteEvent = async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error?.message || 'Error al eliminar evento');
            }

            await loadEvents();
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Éxito', 'Evento eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', error.message, 'danger');
        }
    };

    // Enviar formulario
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearValidations();

            let hasErrors = false;

            // Validar título
            if (!eventTitleInput.value.trim()) {
                showValidationError(eventTitleInput, 'El título es requerido');
                hasErrors = true;
            } else if (eventTitleInput.value.trim().length < 5) {
                showValidationError(eventTitleInput, 'El título debe tener al menos 5 caracteres');
                hasErrors = true;
            } else {
                showValidationSuccess(eventTitleInput);
            }

            // Validar descripción
            if (!eventDescriptionInput.value.trim()) {
                showValidationError(eventDescriptionInput, 'La descripción es requerida');
                hasErrors = true;
            } else if (eventDescriptionInput.value.trim().length < 10) {
                showValidationError(eventDescriptionInput, 'La descripción debe tener al menos 10 caracteres');
                hasErrors = true;
            } else {
                showValidationSuccess(eventDescriptionInput);
            }

            // Validar fecha
            if (!eventDateInput.value) {
                showValidationError(eventDateInput, 'La fecha es requerida');
                hasErrors = true;
            } else {
                const selectedDate = new Date(eventDateInput.value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (selectedDate < today) {
                    showValidationError(eventDateInput, 'La fecha debe ser futura');
                    hasErrors = true;
                } else {
                    showValidationSuccess(eventDateInput);
                }
            }

            // Validar hora
            if (!eventTimeInput.value) {
                showValidationError(eventTimeInput, 'La hora es requerida');
                hasErrors = true;
            } else {
                showValidationSuccess(eventTimeInput);
            }

            // Validar ubicación
            if (!eventLocationInput.value.trim()) {
                showValidationError(eventLocationInput, 'La ubicación es requerida');
                hasErrors = true;
            } else if (eventLocationInput.value.trim().length < 5) {
                showValidationError(eventLocationInput, 'La ubicación debe tener al menos 5 caracteres');
                hasErrors = true;
            } else {
                showValidationSuccess(eventLocationInput);
            }

            // Validar capacidad (opcional)
            if (eventCapacityInput.value) {
                const capacity = parseInt(eventCapacityInput.value);
                if (isNaN(capacity) || capacity < 2 || capacity > 1000) {
                    showValidationError(eventCapacityInput, 'La capacidad debe estar entre 2 y 1000');
                    hasErrors = true;
                } else {
                    showValidationSuccess(eventCapacityInput);
                }
            }

            if (hasErrors) {
                showFormMessage('Por favor, corrige los errores en el formulario', 'warning');
                return;
            }

            // Preparar datos
            const eventData = {
                titulo: eventTitleInput.value.trim(),
                descripcion: eventDescriptionInput.value.trim(),
                fecha_evento: eventDateInput.value,
                hora_evento: eventTimeInput.value,
                ubicacion: eventLocationInput.value.trim(),
                capacidad: eventCapacityInput.value ? parseInt(eventCapacityInput.value) : null,
                tipo: eventTypeInput.value,
                visibilidad: eventVisibilityInput.value
            };

            try {
                const isEditing = eventIdInput && eventIdInput.value;
                const url = isEditing ? `${API_URL}/${eventIdInput.value}` : API_URL;
                const method = isEditing ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(eventData)
                });

                const data = await response.json();

                if (!response.ok) {
                    if (data.error && data.error.details) {
                        throw new Error(data.error.details.join(', '));
                    }
                    throw new Error(data.error?.message || 'Error al guardar evento');
                }

                showFormMessage(isEditing ? 'Evento actualizado correctamente' : 'Evento creado correctamente', 'success');

                setTimeout(() => {
                    eventModal.hide();
                    loadEvents();
                }, 1500);

            } catch (error) {
                console.error('Error:', error);
                showFormMessage(error.message || 'Error al guardar el evento', 'danger');
            }
        });
    }

    // Inicializar
    if (token) {
        loadEvents();
    } else {
        console.error('No hay token de autenticación');
        if (eventsTableBody) {
            eventsTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Debes iniciar sesión para ver los eventos</td></tr>';
        }
    }
})();
