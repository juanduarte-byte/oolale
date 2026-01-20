// Módulo de Gestión de Muestras Multimedia
(function () {
    const token = localStorage.getItem('token');
    const API_URL = '/api/muestras';

    let currentPage = 1;
    const itemsPerPage = 10;
    let allSamples = [];
    let filteredSamples = [];

    // Elementos del DOM
    const samplesTableBody = document.getElementById('samplesTableBody');
    const samplesPagination = document.getElementById('samplesPagination');
    const searchSampleInput = document.getElementById('searchSampleInput');
    const sampleForm = document.getElementById('sampleForm');
    const sampleModal = new bootstrap.Modal(document.getElementById('sampleModal'));
    const addSampleBtn = document.getElementById('addSampleBtn');

    // Campos del formulario
    const sampleIdInput = document.getElementById('sampleId');
    const sampleProfileIdInput = document.getElementById('sampleProfileId');
    const sampleTypeInput = document.getElementById('sampleType');
    const sampleFilePathInput = document.getElementById('sampleFilePath');
    const sampleDescriptionInput = document.getElementById('sampleDescription');
    const sampleFormMessage = document.getElementById('sampleFormMessage');

    const clearValidations = () => {
        [sampleProfileIdInput, sampleTypeInput, sampleFilePathInput, sampleDescriptionInput].forEach(input => {
            if (input) {
                input.classList.remove('is-valid', 'is-invalid');
                const feedback = input.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.textContent = '';
                }
            }
        });
        if (sampleFormMessage) {
            sampleFormMessage.classList.add('d-none');
            sampleFormMessage.textContent = '';
        }
    };

    const showValidationError = (input, message) => {
        if (!input) return;
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        const feedback = input.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = message;
        }
    };

    const showValidationSuccess = (input) => {
        if (!input) return;
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    };

    const showFormMessage = (message, type = 'success') => {
        if (!sampleFormMessage) return;
        sampleFormMessage.textContent = message;
        sampleFormMessage.className = `alert alert-${type}`;
        sampleFormMessage.classList.remove('d-none');
        setTimeout(() => sampleFormMessage.classList.add('d-none'), 5000);
    };

    if (sampleProfileIdInput) {
        sampleProfileIdInput.addEventListener('input', () => {
            const value = sampleProfileIdInput.value;
            if (value === '') {
                sampleProfileIdInput.classList.remove('is-valid', 'is-invalid');
            } else {
                const result = Validation.number.validate(value, 'ID Perfil', 1, 999999999, true);
                result.valid ? showValidationSuccess(sampleProfileIdInput) : showValidationError(sampleProfileIdInput, result.errors[0]);
            }
        });
    }

    if (sampleFilePathInput) {
        sampleFilePathInput.addEventListener('input', () => {
            const value = sampleFilePathInput.value.trim();
            if (value === '') {
                sampleFilePathInput.classList.remove('is-valid', 'is-invalid');
            } else {
                const result = Validation.text.validate(value, 'Ruta Archivo', 3, 500, true);
                result.valid ? showValidationSuccess(sampleFilePathInput) : showValidationError(sampleFilePathInput, result.errors[0]);
            }
        });
    }

    if (sampleDescriptionInput) {
        sampleDescriptionInput.addEventListener('input', () => {
            const value = sampleDescriptionInput.value.trim();
            if (value === '') {
                sampleDescriptionInput.classList.remove('is-valid', 'is-invalid');
            } else {
                const result = Validation.text.validate(value, 'Descripción', 5, 1000, false);
                result.valid ? showValidationSuccess(sampleDescriptionInput) : showValidationError(sampleDescriptionInput, result.errors[0]);
            }
        });
    }

    const loadSamples = async () => {
        try {
            const response = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Error al cargar muestras');
            allSamples = await response.json();
            filteredSamples = [...allSamples];
            renderSamples();
        } catch (error) {
            console.error('Error:', error);
            if (samplesTableBody) samplesTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar muestras</td></tr>';
        }
    };

    const renderSamples = () => {
        if (!samplesTableBody) return;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const samplesToShow = filteredSamples.slice(startIndex, endIndex);

        if (samplesToShow.length === 0) {
            samplesTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay muestras para mostrar</td></tr>';
            return;
        }

        samplesTableBody.innerHTML = samplesToShow.map(sample => `
            <tr>
                <td>${sample.id_muestra}</td>
                <td>${sample.id_perfil}</td>
                <td><span class="badge bg-${sample.tipo === 'audio' ? 'primary' : 'success'}">${sample.tipo}</span></td>
                <td>${sample.ruta_archivo ? (sample.ruta_archivo.length > 40 ? sample.ruta_archivo.substring(0, 40) + '...' : sample.ruta_archivo) : 'N/A'}</td>
                <td>${sample.descripcion ? (sample.descripcion.length > 30 ? sample.descripcion.substring(0, 30) + '...' : sample.descripcion) : 'N/A'}</td>
                <td>${sample.fecha_subida ? new Date(sample.fecha_subida).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.editSample(${sample.id_muestra})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="window.deleteSample(${sample.id_muestra})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `).join('');
        renderPagination();
    };

    const renderPagination = () => {
        if (!samplesPagination) return;
        const totalPages = Math.ceil(filteredSamples.length / itemsPerPage);
        if (totalPages <= 1) { samplesPagination.innerHTML = ''; return; }

        let html = `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a></li>`;
        for (let i = 1; i <= totalPages; i++) html += `<li class="page-item ${currentPage === i ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a></li>`;
        samplesPagination.innerHTML = html;
        samplesPagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== currentPage) { currentPage = page; renderSamples(); }
            });
        });
    };

    if (searchSampleInput) {
        searchSampleInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filteredSamples = allSamples.filter(sample =>
                sample.tipo.toLowerCase().includes(searchTerm) ||
                (sample.ruta_archivo && sample.ruta_archivo.toLowerCase().includes(searchTerm)) ||
                (sample.descripcion && sample.descripcion.toLowerCase().includes(searchTerm))
            );
            currentPage = 1;
            renderSamples();
        });
    }

    if (addSampleBtn) {
        addSampleBtn.addEventListener('click', () => {
            clearValidations();
            sampleForm.reset();
            if (sampleIdInput) sampleIdInput.value = '';
            document.getElementById('sampleModalLabel').textContent = 'Agregar Muestra Multimedia';
        });
    }

    window.editSample = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Error al cargar muestra');
            const sample = await response.json();
            clearValidations();
            if (sampleIdInput) sampleIdInput.value = sample.id_muestra;
            if (sampleProfileIdInput) sampleProfileIdInput.value = sample.id_perfil;
            if (sampleTypeInput) sampleTypeInput.value = sample.tipo;
            if (sampleFilePathInput) sampleFilePathInput.value = sample.ruta_archivo || '';
            if (sampleDescriptionInput) sampleDescriptionInput.value = sample.descripcion || '';
            document.getElementById('sampleModalLabel').textContent = 'Editar Muestra Multimedia';
            sampleModal.show();
        } catch (error) {
            console.error('Error:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error al cargar la muestra', 'danger');
        }
    };

    window.deleteSample = async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta muestra?')) return;
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Error al eliminar muestra');
            await loadSamples();
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Éxito', 'Muestra eliminada correctamente', 'success');
        } catch (error) {
            console.error('Error:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error al eliminar la muestra', 'danger');
        }
    };

    if (sampleForm) {
        sampleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearValidations();
            let hasErrors = false;

            const profileIdResult = Validation.number.validate(sampleProfileIdInput.value, 'ID Perfil', 1, 999999999, true);
            if (!profileIdResult.valid) { showValidationError(sampleProfileIdInput, profileIdResult.errors[0]); hasErrors = true; }
            else showValidationSuccess(sampleProfileIdInput);

            const filePathResult = Validation.text.validate(sampleFilePathInput.value, 'Ruta Archivo', 3, 500, true);
            if (!filePathResult.valid) { showValidationError(sampleFilePathInput, filePathResult.errors[0]); hasErrors = true; }
            else showValidationSuccess(sampleFilePathInput);

            const descValue = sampleDescriptionInput.value.trim();
            if (descValue !== '') {
                const descResult = Validation.text.validate(descValue, 'Descripción', 5, 1000, false);
                if (!descResult.valid) { showValidationError(sampleDescriptionInput, descResult.errors[0]); hasErrors = true; }
                else showValidationSuccess(sampleDescriptionInput);
            }

            if (hasErrors) { showFormMessage('Por favor, corrige los errores en el formulario', 'warning'); return; }

            const sampleData = {
                id_perfil: parseInt(sampleProfileIdInput.value),
                tipo: sampleTypeInput.value,
                ruta_archivo: sampleFilePathInput.value.trim(),
                descripcion: descValue || null
            };

            try {
                const isEditing = sampleIdInput && sampleIdInput.value;
                const url = isEditing ? `${API_URL}/${sampleIdInput.value}` : API_URL;
                const method = isEditing ? 'PUT' : 'POST';
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(sampleData)
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Error al guardar muestra');
                showFormMessage(isEditing ? 'Muestra actualizada correctamente' : 'Muestra creada correctamente', 'success');
                setTimeout(() => { sampleModal.hide(); loadSamples(); }, 1500);
            } catch (error) {
                console.error('Error:', error);
                showFormMessage(error.message || 'Error al guardar la muestra', 'danger');
            }
        });
    }

    loadSamples();
})();
