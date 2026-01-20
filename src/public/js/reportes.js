(() => {
    if (!document.getElementById('reportsTableBody')) return;
    const reportModalElement = document.getElementById('reportModal');
    const reportModalLabel = document.getElementById('reportModalLabel');
    const reportIdInput = document.getElementById('reportId');
    const reportReporterIdInput = document.getElementById('reportReporterId');
    const reportReportedIdInput = document.getElementById('reportReportedId');
    const reportReasonInput = document.getElementById('reportReason');
    const reportDescriptionInput = document.getElementById('reportDescription');
    const reportFormMessage = document.getElementById('reportFormMessage');
    const addReportBtn = document.getElementById('addReportBtn');
    const searchReportInput = document.getElementById('searchReportInput');
    const reportForm = document.getElementById('reportForm');

    const reportModal = new bootstrap.Modal(reportModalElement);

    let reports = [];

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/reportes', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al obtener reportes');
            }
            reports = await response.json();
            renderReports(reports);
        } catch (error) {
            console.error('Error fetching reports:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'No se pudieron cargar los reportes.', 'danger');
        }
    };

    const renderReports = (reportsToRender) => {
        reportsTableBody.innerHTML = '';
        if (reportsToRender.length === 0) {
            reportsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay reportes para mostrar.</td></tr>';
            return;
        }
        reportsToRender.forEach(report => {
            const row = reportsTableBody.insertRow();
            row.innerHTML = `
                <td>${report.id_reporte}</td>
                <td>${report.id_reportante}</td>
                <td>${report.id_reportado}</td>
                <td>${report.motivo}</td>
                <td>${report.descripcion_adicional || 'N/A'}</td>
                <td>${new Date(report.fecha_reporte).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-info edit-btn" data-id="${report.id_reporte}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${report.id_reporte}"><i class="bi bi-trash"></i></button>
                </td>
            `;
        });
        addEventListenersToButtons();
    };

    const addEventListenersToButtons = () => {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const report = reports.find(r => r.id_reporte == id);
                if (report) {
                    reportModalLabel.textContent = 'Editar Reporte';
                    reportIdInput.value = report.id_reporte;
                    reportReporterIdInput.value = report.id_reportante;
                    reportReportedIdInput.value = report.id_reportado;
                    reportReasonInput.value = report.motivo;
                    reportDescriptionInput.value = report.descripcion_adicional;
                    reportFormMessage.classList.add('d-none');
                    reportModal.show();
                }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
                    await deleteReport(id);
                }
            });
        });
    };

    const saveReport = async (event) => {
        event.preventDefault();
        const id = reportIdInput.value;
        const token = localStorage.getItem('token');
        const reportData = {
            id_reportante: reportReporterIdInput.value,
            id_reportado: reportReportedIdInput.value,
            motivo: reportReasonInput.value,
            descripcion_adicional: reportDescriptionInput.value,
        };

        try {
            let response;
            if (id) { // Editar
                response = await fetch(`/api/reportes/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(reportData),
                });
            } else { // Crear
                response = await fetch('/api/reportes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(reportData),
                });
            }

            const data = await response.json();
            if (response.ok) {
                reportFormMessage.classList.remove('alert-danger');
                reportFormMessage.classList.add('alert-success');
                reportFormMessage.textContent = data.message;
                reportFormMessage.classList.remove('d-none');
                fetchData(); // Recargar la lista de reportes
                setTimeout(() => reportModal.hide(), 1500);
            } else {
                reportFormMessage.classList.remove('alert-success');
                reportFormMessage.classList.add('alert-danger');
                reportFormMessage.textContent = data.message || 'Error al guardar reporte';
                reportFormMessage.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Error saving report:', error);
            reportFormMessage.classList.remove('alert-success');
            reportFormMessage.classList.add('alert-danger');
            reportFormMessage.textContent = 'Error de conexión con el servidor';
            reportFormMessage.classList.remove('d-none');
        }
    };

    const deleteReport = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/reportes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Éxito', 'Reporte eliminado correctamente.', 'success');
                fetchData();
            } else {
                const data = await response.json();
                if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', data.message || 'Error al eliminar reporte.', 'danger');
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error de conexión con el servidor.', 'danger');
        }
    };

    const filterReports = () => {
        const searchTerm = searchReportInput.value.toLowerCase();
        const filteredReports = reports.filter(report =>
            report.motivo.toLowerCase().includes(searchTerm) ||
            report.descripcion_adicional.toLowerCase().includes(searchTerm)
        );
        renderReports(filteredReports);
    };

    // Event Listeners
    reportForm.addEventListener('submit', saveReport);
    addReportBtn.addEventListener('click', () => {
        reportModalLabel.textContent = 'Agregar Reporte';
        reportForm.reset();
        reportIdInput.value = '';
        reportFormMessage.classList.add('d-none');
        reportModal.show();
    });
    searchReportInput.addEventListener('keyup', filterReports);

    // Manejar el cierre del modal para limpiar mensajes y resetear el formulario
    reportModalElement.addEventListener('hidden.bs.modal', () => {
        reportForm.reset();
        reportIdInput.value = '';
        reportFormMessage.classList.add('d-none');
    });

    // Iniciar la carga de datos tan pronto como el script se carga
    fetchData();
})();
