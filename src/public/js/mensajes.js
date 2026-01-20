(() => {
    if (!document.getElementById('messagesTableBody')) return;
    const messageModalElement = document.getElementById('messageModal');
    const messageModalLabel = document.getElementById('messageModalLabel');
    const messageIdInput = document.getElementById('messageId');
    const messageSenderIdInput = document.getElementById('messageSenderId');
    const messageReceiverIdInput = document.getElementById('messageReceiverId');
    const messageTypeInput = document.getElementById('messageType');
    const messageContentInput = document.getElementById('messageContent');
    const messageReadStatusInput = document.getElementById('messageReadStatus');
    const messageFormMessage = document.getElementById('messageFormMessage');
    const addMessageBtn = document.getElementById('addMessageBtn');
    const searchMessageInput = document.getElementById('searchMessageInput');
    const messageForm = document.getElementById('messageForm');

    const messageModal = new bootstrap.Modal(messageModalElement);

    let messages = [];

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/mensajes', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al obtener mensajes');
            }
            messages = await response.json();
            renderMessages(messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'No se pudieron cargar los mensajes.', 'danger');
        }
    };

    const renderMessages = (messagesToRender) => {
        messagesTableBody.innerHTML = '';
        if (messagesToRender.length === 0) {
            messagesTableBody.innerHTML = '<tr><td colspan="8" class="text-center">No hay mensajes para mostrar.</td></tr>';
            return;
        }
        messagesToRender.forEach(message => {
            const row = messagesTableBody.insertRow();
            row.innerHTML = `
                <td>${message.id_mensaje}</td>
                <td>${message.id_remitente}</td>
                <td>${message.id_destinatario}</td>
                <td>${message.tipo}</td>
                <td>${message.contenido.substring(0, 50)}...</td>
                <td>${new Date(message.fecha_envio).toLocaleDateString()}</td>
                <td>${message.estado_lectura ? 'Sí' : 'No'}</td>
                <td>
                    <button class="btn btn-sm btn-info edit-btn" data-id="${message.id_mensaje}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${message.id_mensaje}"><i class="bi bi-trash"></i></button>
                </td>
            `;
        });
        addEventListenersToButtons();
    };

    const addEventListenersToButtons = () => {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const message = messages.find(m => m.id_mensaje == id);
                if (message) {
                    messageModalLabel.textContent = 'Editar Mensaje';
                    messageIdInput.value = message.id_mensaje;
                    messageSenderIdInput.value = message.id_remitente;
                    messageReceiverIdInput.value = message.id_destinatario;
                    messageTypeInput.value = message.tipo;
                    messageContentInput.value = message.contenido;
                    messageReadStatusInput.checked = message.estado_lectura;
                    messageFormMessage.classList.add('d-none');
                    messageModal.show();
                }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
                    await deleteMessage(id);
                }
            });
        });
    };

    const saveMessage = async (event) => {
        event.preventDefault();
        const id = messageIdInput.value;
        const token = localStorage.getItem('token');
        const messageData = {
            id_remitente: messageSenderIdInput.value,
            id_destinatario: messageReceiverIdInput.value,
            tipo: messageTypeInput.value,
            contenido: messageContentInput.value,
            estado_lectura: messageReadStatusInput.checked,
        };

        try {
            let response;
            if (id) { // Editar
                response = await fetch(`/api/mensajes/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(messageData),
                });
            } else { // Crear
                response = await fetch('/api/mensajes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(messageData),
                });
            }

            const data = await response.json();
            if (response.ok) {
                messageFormMessage.classList.remove('alert-danger');
                messageFormMessage.classList.add('alert-success');
                messageFormMessage.textContent = data.message;
                messageFormMessage.classList.remove('d-none');
                fetchData(); // Recargar la lista de mensajes
                setTimeout(() => messageModal.hide(), 1500);
            } else {
                messageFormMessage.classList.remove('alert-success');
                messageFormMessage.classList.add('alert-danger');
                messageFormMessage.textContent = data.message || 'Error al guardar mensaje';
                messageFormMessage.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Error saving message:', error);
            messageFormMessage.classList.remove('alert-success');
            messageFormMessage.classList.add('alert-danger');
            messageFormMessage.textContent = 'Error de conexión con el servidor';
            messageFormMessage.classList.remove('d-none');
        }
    };

    const deleteMessage = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/mensajes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Éxito', 'Mensaje eliminado correctamente.', 'success');
                fetchData();
            } else {
                const data = await response.json();
                if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', data.message || 'Error al eliminar mensaje.', 'danger');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error de conexión con el servidor.', 'danger');
        }
    };

    const filterMessages = () => {
        const searchTerm = searchMessageInput.value.toLowerCase();
        const filteredMessages = messages.filter(message =>
            message.contenido.toLowerCase().includes(searchTerm) ||
            message.tipo.toLowerCase().includes(searchTerm)
        );
        renderMessages(filteredMessages);
    };

    // Event Listeners
    messageForm.addEventListener('submit', saveMessage);
    addMessageBtn.addEventListener('click', () => {
        messageModalLabel.textContent = 'Agregar Mensaje';
        messageForm.reset();
        messageIdInput.value = '';
        messageFormMessage.classList.add('d-none');
        messageModal.show();
    });
    searchMessageInput.addEventListener('keyup', filterMessages);

    // Manejar el cierre del modal para limpiar mensajes y resetear el formulario
    messageModalElement.addEventListener('hidden.bs.modal', () => {
        messageForm.reset();
        messageIdInput.value = '';
        messageFormMessage.classList.add('d-none');
    });

    // Iniciar la carga de datos tan pronto como el script se carga
    fetchData();
})();
