(() => {
    if (!document.getElementById('profilesTableBody')) return;
    const profileModalElement = document.getElementById('profileModal');
    const profileModalLabel = document.getElementById('profileModalLabel');
    const profileIdInput = document.getElementById('profileId');
    const profileUserIdInput = document.getElementById('profileUserId');
    const profileDescriptionInput = document.getElementById('profileDescription');
    const profileExperienceInput = document.getElementById('profileExperience');
    const profileObjectivesInput = document.getElementById('profileObjectives');
    const profileVisibilityInput = document.getElementById('profileVisibility');
    const profileFormMessage = document.getElementById('profileFormMessage');
    const addProfileBtn = document.getElementById('addProfileBtn');
    const searchProfileInput = document.getElementById('searchProfileInput');
    const profileForm = document.getElementById('profileForm');

    const profileModal = new bootstrap.Modal(profileModalElement);

    let profiles = [];

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/perfiles', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al obtener perfiles');
            }
            profiles = await response.json();
            renderProfiles(profiles);
        } catch (error) {
            console.error('Error fetching profiles:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'No se pudieron cargar los perfiles.', 'danger');
        }
    };

    const renderProfiles = (profilesToRender) => {
        profilesTableBody.innerHTML = '';
        if (profilesToRender.length === 0) {
            profilesTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay perfiles para mostrar.</td></tr>';
            return;
        }
        profilesToRender.forEach(profile => {
            const row = profilesTableBody.insertRow();
            row.innerHTML = `
                <td>${profile.id_perfil}</td>
                <td>${profile.id_usuario}</td>
                <td>${profile.descripcion_breve || 'N/A'}</td>
                <td>${profile.experiencia || 'N/A'}</td>
                <td>${profile.objetivos || 'N/A'}</td>
                <td>${profile.visibilidad}</td>
                <td>
                    <button class="btn btn-sm btn-info edit-btn" data-id="${profile.id_perfil}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${profile.id_perfil}"><i class="bi bi-trash"></i></button>
                </td>
            `;
        });
        addEventListenersToButtons();
    };

    const addEventListenersToButtons = () => {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const profile = profiles.find(p => p.id_perfil == id);
                if (profile) {
                    profileModalLabel.textContent = 'Editar Perfil';
                    profileIdInput.value = profile.id_perfil;
                    profileUserIdInput.value = profile.id_usuario;
                    profileDescriptionInput.value = profile.descripcion_breve;
                    profileExperienceInput.value = profile.experiencia;
                    profileObjectivesInput.value = profile.objetivos;
                    profileVisibilityInput.value = profile.visibilidad;
                    profileFormMessage.classList.add('d-none');
                    profileModal.show();
                }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('¿Estás seguro de que quieres eliminar este perfil?')) {
                    await deleteProfile(id);
                }
            });
        });
    };

    const saveProfile = async (event) => {
        event.preventDefault();
        const id = profileIdInput.value;
        const token = localStorage.getItem('token');
        const profileData = {
            id_usuario: profileUserIdInput.value,
            descripcion_breve: profileDescriptionInput.value,
            experiencia: profileExperienceInput.value,
            objetivos: profileObjectivesInput.value,
            visibilidad: profileVisibilityInput.value,
        };

        try {
            let response;
            if (id) { // Editar
                response = await fetch(`/api/perfiles/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(profileData),
                });
            } else { // Crear
                response = await fetch('/api/perfiles', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(profileData),
                });
            }

            const data = await response.json();
            if (response.ok) {
                profileFormMessage.classList.remove('alert-danger');
                profileFormMessage.classList.add('alert-success');
                profileFormMessage.textContent = data.message;
                profileFormMessage.classList.remove('d-none');
                fetchData(); // Recargar la lista de perfiles
                setTimeout(() => profileModal.hide(), 1500);
            } else {
                profileFormMessage.classList.remove('alert-success');
                profileFormMessage.classList.add('alert-danger');
                profileFormMessage.textContent = data.message || 'Error al guardar perfil';
                profileFormMessage.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            profileFormMessage.classList.remove('alert-success');
            profileFormMessage.classList.add('alert-danger');
            profileFormMessage.textContent = 'Error de conexión con el servidor';
            profileFormMessage.classList.remove('d-none');
        }
    };

    const deleteProfile = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/perfiles/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Éxito', 'Perfil eliminado correctamente.', 'success');
                fetchData();
            } else {
                const data = await response.json();
                if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', data.message || 'Error al eliminar perfil.', 'danger');
            }
        } catch (error) {
            console.error('Error deleting profile:', error);
            if (window.mostrarNotificacionAdmin) window.mostrarNotificacionAdmin('Error', 'Error de conexión con el servidor.', 'danger');
        }
    };

    const filterProfiles = () => {
        const searchTerm = searchProfileInput.value.toLowerCase();
        const filteredProfiles = profiles.filter(profile =>
            profile.descripcion_breve.toLowerCase().includes(searchTerm) ||
            profile.experiencia.toLowerCase().includes(searchTerm) ||
            profile.objetivos.toLowerCase().includes(searchTerm)
        );
        renderProfiles(filteredProfiles);
    };

    // Event Listeners
    profileForm.addEventListener('submit', saveProfile);
    addProfileBtn.addEventListener('click', () => {
        profileModalLabel.textContent = 'Agregar Perfil';
        profileForm.reset();
        profileIdInput.value = '';
        profileFormMessage.classList.add('d-none');
        profileModal.show();
    });
    searchProfileInput.addEventListener('keyup', filterProfiles);

    // Manejar el cierre del modal para limpiar mensajes y resetear el formulario
    profileModalElement.addEventListener('hidden.bs.modal', () => {
        profileForm.reset();
        profileIdInput.value = '';
        profileFormMessage.classList.add('d-none');
    });

    // Iniciar la carga de datos tan pronto como el script se carga
    fetchData();
})();
