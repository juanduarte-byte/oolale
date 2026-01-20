// Módulo de Gestión de Bloqueos
(function () {
    const token = localStorage.getItem('token');
    const API_URL = '/api/bloqueos';

    let currentPage = 1;
    const itemsPerPage = 10;
    let allBlocks = [];
    let filteredBlocks = [];

    const blocksTableBody = document.getElementById('blocksTableBody');
    const blocksPagination = document.getElementById('blocksPagination');
    const searchBlockInput = document.getElementById('searchBlockInput');
    const blockForm = document.getElementById('blockForm');
    const blockModal = new bootstrap.Modal(document.getElementById('blockModal'));
    const addBlockBtn = document.getElementById('addBlockBtn');

    const blockIdInput = document.getElementById('blockId');
    const blockerIdInput = document.getElementById('blockerId');
    const blockedIdInput = document.getElementById('blockedId');
    const blockFormMessage = document.getElementById('blockFormMessage');

    const clearValidations = () => {
        [blockerIdInput, blockedIdInput].forEach(input => {
            if (input) {
                input.classList.remove('is-valid', 'is-invalid');
                const feedback = input.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) feedback.textContent = '';
            }
        });
        if (blockFormMessage) {
            blockFormMessage.classList.add('d-none');
            blockFormMessage.textContent = '';
        }
    };

    const showValidationError = (input, message) => {
        if (!input) return;
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        const feedback = input.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) feedback.textContent = message;
    };

    const showValidationSuccess = (input) => {
        if (!input) return;
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    };

    const showFormMessage = (message, type = 'success') => {
        if (!blockFormMessage) return;
        blockFormMessage.textContent = message;
        blockFormMessage.className = `alert alert-${type}`;
        blockFormMessage.classList.remove('d-none');
        setTimeout(() => blockFormMessage.classList.add('d-none'), 5000);
    };

    if (blockerIdInput) {
        blockerIdInput.addEventListener('input', () => {
            const value = blockerIdInput.value;
            if (value === '') {
                blockerIdInput.classList.remove('is-valid', 'is-invalid');
            } else {
                const result = Validation.number.validate(value, 'ID Bloqueador', 1, 999999999, true);
                result.valid ? showValidationSuccess(blockerIdInput) : showValidationError(blockerIdInput, result.errors[0]);
            }
        });
    }

    if (blockedIdInput) {
        blockedIdInput.addEventListener('input', () => {
            const value = blockedIdInput.value;
            if (value === '') {
                blockedIdInput.classList.remove('is-valid', 'is-invalid');
            } else {
                const result = Validation.number.validate(value, 'ID Bloqueado', 1, 999999999, true);
                result.valid ? showValidationSuccess(blockedIdInput) : showValidationError(blockedIdInput, result.errors[0]);
            }
        });
    }

    const loadBlocks = async () => {
        try {
            const response = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Error al cargar bloqueos');
            allBlocks = await response.json();
            filteredBlocks = [...allBlocks];
            renderBlocks();
        } catch (error) {
            console.error('Error:', error);
            if (blocksTableBody) blocksTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar bloqueos</td></tr>';
        }
    };

    const renderBlocks = () => {
        if (!blocksTableBody) return;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const blocksToShow = filteredBlocks.slice(startIndex, endIndex);

        if (blocksToShow.length === 0) {
            blocksTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay bloqueos para mostrar</td></tr>';
            return;
        }

        blocksTableBody.innerHTML = blocksToShow.map(block => `
            <tr>
                <td>${block.id_bloqueo}</td>
                <td>${block.id_bloqueador}</td>
                <td>${block.id_bloqueado}</td>
                <td>${block.fecha_bloqueo ? new Date(block.fecha_bloqueo).toLocaleString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.editBlock(${block.id_bloqueo})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteBlock(${block.id_bloqueo})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
        renderPagination();
    };

    const renderPagination = () => {
        if (!blocksPagination) return;
        const totalPages = Math.ceil(filteredBlocks.length / itemsPerPage);
        if (totalPages <= 1) { blocksPagination.innerHTML = ''; return; }

        let html = `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a></li>`;
        for (let i = 1; i <= totalPages; i++) html += `<li class="page-item ${currentPage === i ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a></li>`;
        blocksPagination.innerHTML = html;
        blocksPagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== currentPage) { currentPage = page; renderBlocks(); }
            });
        });
    };

    if (searchBlockInput) {
        searchBlockInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filteredBlocks = allBlocks.filter(block =>
                block.id_bloqueador.toString().includes(searchTerm) ||
                block.id_bloqueado.toString().includes(searchTerm)
            );
            currentPage = 1;
            renderBlocks();
        });
    }

    if (addBlockBtn) {
        addBlockBtn.addEventListener('click', () => {
            clearValidations();
            blockForm.reset();
            if (blockIdInput) blockIdInput.value = '';
            document.getElementById('blockModalLabel').textContent = 'Agregar Bloqueo';
        });
    }

    window.editBlock = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Error al cargar bloqueo');
            const block = await response.json();
            clearValidations();
            if (blockIdInput) blockIdInput.value = block.id_bloqueo;
            if (blockerIdInput) blockerIdInput.value = block.id_bloqueador;
            if (blockedIdInput) blockedIdInput.value = block.id_bloqueado;
            document.getElementById('blockModalLabel').textContent = 'Editar Bloqueo';
            blockModal.show();
        } catch (error) {
            console.error('Error:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error al cargar el bloqueo', 'danger');
        }
    };

    window.deleteBlock = async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este bloqueo?')) return;
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Error al eliminar bloqueo');
            await loadBlocks();
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Éxito', 'Bloqueo eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error al eliminar el bloqueo', 'danger');
        }
    };

    if (blockForm) {
        blockForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearValidations();
            let hasErrors = false;

            const blockerResult = Validation.number.validate(blockerIdInput.value, 'ID Bloqueador', 1, 999999999, true);
            if (!blockerResult.valid) { showValidationError(blockerIdInput, blockerResult.errors[0]); hasErrors = true; }
            else showValidationSuccess(blockerIdInput);

            const blockedResult = Validation.number.validate(blockedIdInput.value, 'ID Bloqueado', 1, 999999999, true);
            if (!blockedResult.valid) { showValidationError(blockedIdInput, blockedResult.errors[0]); hasErrors = true; }
            else showValidationSuccess(blockedIdInput);

            if (blockerIdInput.value === blockedIdInput.value) {
                showValidationError(blockedIdInput, 'El bloqueador y bloqueado deben ser diferentes');
                hasErrors = true;
            }

            if (hasErrors) { showFormMessage('Por favor, corrige los errores en el formulario', 'warning'); return; }

            const blockData = {
                id_bloqueador: parseInt(blockerIdInput.value),
                id_bloqueado: parseInt(blockedIdInput.value)
            };

            try {
                const isEditing = blockIdInput && blockIdInput.value;
                const url = isEditing ? `${API_URL}/${blockIdInput.value}` : API_URL;
                const method = isEditing ? 'PUT' : 'POST';
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(blockData)
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Error al guardar bloqueo');
                showFormMessage(isEditing ? 'Bloqueo actualizado correctamente' : 'Bloqueo creado correctamente', 'success');
                setTimeout(() => { blockModal.hide(); loadBlocks(); }, 1500);
            } catch (error) {
                console.error('Error:', error);
                showFormMessage(error.message || 'Error al guardar el bloqueo', 'danger');
            }
        });
    }

    loadBlocks();
})();
