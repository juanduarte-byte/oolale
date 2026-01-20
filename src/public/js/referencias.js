(() => {
    if (!document.getElementById('referencesTableBody')) return;
    const referenceModalElement = document.getElementById('referenceModal');
    const referenceModalLabel = document.getElementById('referenceModalLabel');
    const referenceIdInput = document.getElementById('referenceId');
    const referenceAuthorIdInput = document.getElementById('referenceAuthorId');
    const referenceReferencedIdInput = document.getElementById('referenceReferencedId');
    const referenceRatingInput = document.getElementById('referenceRating');
    const referenceCommentInput = document.getElementById('referenceComment');
    const referenceFormMessage = document.getElementById('referenceFormMessage');
    const addReferenceBtn = document.getElementById('addReferenceBtn');
    const searchReferenceInput = document.getElementById('searchReferenceInput');
    const referenceForm = document.getElementById('referenceForm');

    const referenceModal = new bootstrap.Modal(referenceModalElement);

    let references = [];

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/referencias', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al obtener referencias');
            }
            references = await response.json();
            renderReferences(references);
        } catch (error) {
            console.error('Error fetching references:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'No se pudieron cargar las referencias.', 'danger');
        }
    };

    const renderReferences = (referencesToRender) => {
        referencesTableBody.innerHTML = '';
        if (referencesToRender.length === 0) {
            referencesTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay referencias para mostrar.</td></tr>';
            return;
        }
        referencesToRender.forEach(reference => {
            const row = referencesTableBody.insertRow();
            row.innerHTML = `
                <td>${reference.id_referencia}</td>
                <td>${reference.id_autor}</td>
                <td>${reference.id_referenciado}</td>
                <td>${reference.calificacion}</td>
                <td>${reference.comentario || 'N/A'}</td>
                <td>${new Date(reference.fecha).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-info edit-btn" data-id="${reference.id_referencia}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${reference.id_referencia}"><i class="bi bi-trash"></i></button>
                </td>
            `;
        });
        addEventListenersToButtons();
    };

    const addEventListenersToButtons = () => {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const reference = references.find(r => r.id_referencia == id);
                if (reference) {
                    referenceModalLabel.textContent = 'Editar Referencia';
                    referenceIdInput.value = reference.id_referencia;
                    referenceAuthorIdInput.value = reference.id_autor;
                    referenceReferencedIdInput.value = reference.id_referenciado;
                    referenceRatingInput.value = reference.calificacion;
                    referenceCommentInput.value = reference.comentario;
                    referenceFormMessage.classList.add('d-none');
                    referenceModal.show();
                }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('¿Estás seguro de que quieres eliminar esta referencia?')) {
                    await deleteReference(id);
                }
            });
        });
    };

    const saveReference = async (event) => {
        event.preventDefault();
        const id = referenceIdInput.value;
        const token = localStorage.getItem('token');
        const referenceData = {
            id_autor: referenceAuthorIdInput.value,
            id_referenciado: referenceReferencedIdInput.value,
            calificacion: referenceRatingInput.value,
            comentario: referenceCommentInput.value,
        };

        try {
            let response;
            if (id) { // Editar
                response = await fetch(`/api/referencias/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(referenceData),
                });
            } else { // Crear
                response = await fetch('/api/referencias', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(referenceData),
                });
            }

            const data = await response.json();
            if (response.ok) {
                referenceFormMessage.classList.remove('alert-danger');
                referenceFormMessage.classList.add('alert-success');
                referenceFormMessage.textContent = data.message;
                referenceFormMessage.classList.remove('d-none');
                fetchData(); // Recargar la lista de referencias
                setTimeout(() => referenceModal.hide(), 1500);
            } else {
                referenceFormMessage.classList.remove('alert-success');
                referenceFormMessage.classList.add('alert-danger');
                referenceFormMessage.textContent = data.message || 'Error al guardar referencia';
                referenceFormMessage.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Error saving reference:', error);
            referenceFormMessage.classList.remove('alert-success');
            referenceFormMessage.classList.add('alert-danger');
            referenceFormMessage.textContent = 'Error de conexión con el servidor';
            referenceFormMessage.classList.remove('d-none');
        }
    };

    const deleteReference = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/referencias/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Éxito', 'Referencia eliminada correctamente.', 'success');
                fetchData();
            } else {
                const data = await response.json();
                if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', data.message || 'Error al eliminar referencia.', 'danger');
            }
        } catch (error) {
            console.error('Error deleting reference:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error de conexión con el servidor.', 'danger');
        }
    };

    const filterReferences = () => {
        const searchTerm = searchReferenceInput.value.toLowerCase();
        const filteredReferences = references.filter(reference =>
            reference.comentario.toLowerCase().includes(searchTerm)
        );
        renderReferences(filteredReferences);
    };

    // Event Listeners
    referenceForm.addEventListener('submit', saveReference);
    addReferenceBtn.addEventListener('click', () => {
        referenceModalLabel.textContent = 'Agregar Referencia';
        referenceForm.reset();
        referenceIdInput.value = '';
        referenceFormMessage.classList.add('d-none');
        referenceModal.show();
    });
    searchReferenceInput.addEventListener('keyup', filterReferences);

    // Manejar el cierre del modal para limpiar mensajes y resetear el formulario
    referenceModalElement.addEventListener('hidden.bs.modal', () => {
        referenceForm.reset();
        referenceIdInput.value = '';
        referenceFormMessage.classList.add('d-none');
    });

    // Iniciar la carga de datos tan pronto como el script se carga
    fetchData();
})();
