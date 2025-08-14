document.addEventListener('DOMContentLoaded', () => {
    // Form and Modal Elements
    const noteForm = document.getElementById('note-form');
    const noteModal = new bootstrap.Modal(document.getElementById('note-modal'));
    const noteModalLabel = document.getElementById('note-modal-label');
    const noteIdInput = document.getElementById('note-id');

    // View Modal Elements
    const viewNoteModal = new bootstrap.Modal(document.getElementById('view-note-modal'));
    const viewNoteTitle = document.getElementById('view-note-title');
    const viewNoteBody = document.getElementById('view-note-body');

    // Controls
    const searchInput = document.getElementById('search-input');
    const sortBy = document.getElementById('sort-by');
    const filterByType = document.getElementById('filter-by-type');
    const addNoteFab = document.getElementById('add-note-fab');

    // Notes List
    const notesList = document.getElementById('notes-list');
    const dashboardSection = document.getElementById('dashboard-section');

    // Data Store
    let notes = JSON.parse(localStorage.getItem('notes')) || [];

    // --- Core Functions ---
    const saveNotes = () => {
        localStorage.setItem('notes', JSON.stringify(notes));
        updateIndicators();
    };

    const updateIndicators = () => {
        if (!dashboardSection) return;
        const totalNotes = notes.length;
        const highPriority = notes.filter(n => n.priority === 'Alto').length;
        const mediumPriority = notes.filter(n => n.priority === 'Medio').length;
        const lowPriority = notes.filter(n => n.priority === 'Bajo').length;

        dashboardSection.innerHTML = `
            <div class="col-6 col-md-3 mb-2"><div class="card p-2"><h6 class="card-title mb-1">Total</h6><p class="card-text fs-4 fw-bold">${totalNotes}</p></div></div>
            <div class="col-6 col-md-3 mb-2"><div class="card p-2 border-danger"><h6 class="card-title mb-1 text-danger">Alta</h6><p class="card-text fs-4 fw-bold">${highPriority}</p></div></div>
            <div class="col-6 col-md-3 mb-2"><div class="card p-2 border-warning"><h6 class="card-title mb-1 text-warning">Media</h6><p class="card-text fs-4 fw-bold">${mediumPriority}</p></div></div>
            <div class="col-6 col-md-3 mb-2"><div class="card p-2 border-success"><h6 class="card-title mb-1 text-success">Baja</h6><p class="card-text fs-4 fw-bold">${lowPriority}</p></div></div>
        `;
    };

    const showAlert = (message, type = 'success') => {
        const alertContainer = document.getElementById('alert-container');
        const alert = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
        alertContainer.innerHTML = alert;
        setTimeout(() => {
            const alertNode = alertContainer.querySelector('.alert');
            if (alertNode) bootstrap.Alert.getOrCreateInstance(alertNode).close();
        }, 4000);
    };

    const renderNotes = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterByType.value;
        const sortValue = sortBy.value;

        let filteredNotes = notes.filter(note =>
            (note.title.toLowerCase().includes(searchTerm) || note.topics.toLowerCase().includes(searchTerm) || note.participants.toLowerCase().includes(searchTerm)) &&
            (filterValue === 'all' || note.type === filterValue)
        );

        filteredNotes.sort((a, b) => {
            switch (sortValue) {
                case 'creation-asc': return a.id - b.id;
                case 'meeting-desc': return new Date(b.date) - new Date(a.date);
                case 'meeting-asc': return new Date(a.date) - new Date(b.date);
                default: return b.id - a.id;
            }
        });

        notesList.innerHTML = '';
        if (filteredNotes.length === 0) {
            notesList.innerHTML = '<p class="text-center text-muted">No hay notas para mostrar.</p>';
            return;
        }

        const priority_map = { 'Alto': 'danger', 'Medio': 'warning', 'Bajo': 'success' };
        filteredNotes.forEach(note => {
            const noteCard = `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0 text-truncate">${note.title}</h5>
                            <div>
                                <span class="badge bg-${priority_map[note.priority] || 'secondary'}">${note.priority}</span>
                                <span class="badge bg-${note.type === 'Virtual' ? 'success' : 'info'} ms-1">${note.type}</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">Reunión: ${note.date}</h6>
                            ${note.deadline ? `<h6 class="card-subtitle mb-2 text-danger">Límite: ${note.deadline}</h6>` : ''}
                            <p class="card-text text-truncate"><strong>Temas:</strong> ${note.topics}</p>
                        </div>
                        <div class="card-footer text-end bg-white border-top-0">
                            <button class="btn btn-sm btn-outline-secondary" onclick="viewNote('${note.id}')"><i class="bi bi-eye"></i></button>
                            <button class="btn btn-sm btn-outline-primary" onclick="editNote('${note.id}')"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteNote('${note.id}')"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                </div>`;
            notesList.insertAdjacentHTML('beforeend', noteCard);
        });
    };

    const resetForm = () => {
        noteForm.reset();
        noteIdInput.value = '';
        noteForm.classList.remove('was-validated');
        document.getElementById('priority').value = 'Medio';
    };

    // --- Event Listeners ---
    addNoteFab.addEventListener('click', () => {
        resetForm();
        noteModalLabel.textContent = 'Crear Nueva Nota';
    });

    noteForm.addEventListener('submit', event => {
        event.preventDefault();
        event.stopPropagation();
        if (!noteForm.checkValidity()) {
            noteForm.classList.add('was-validated');
            return;
        }
        const id = noteIdInput.value;
        const noteData = {
            id: id || Date.now().toString(),
            title: document.getElementById('meeting-title').value,
            date: document.getElementById('meeting-date').value,
            participants: document.getElementById('participants').value,
            type: document.getElementById('meeting-type').value,
            priority: document.getElementById('priority').value,
            deadline: document.getElementById('deadline').value,
            topics: document.getElementById('topics').value,
            agreements: document.getElementById('agreements').value,
            tasks: document.getElementById('pending-tasks').value,
            observations: document.getElementById('observations').value,
        };
        const isUpdating = !!id;
        if (isUpdating) {
            const index = notes.findIndex(note => note.id === id);
            if (index > -1) notes[index] = noteData;
        } else {
            notes.push(noteData);
        }
        saveNotes();
        renderNotes();
        noteModal.hide();
        showAlert(`Nota ${isUpdating ? 'actualizada' : 'creada'} con éxito.`, 'success');
    });

    [searchInput, sortBy, filterByType].forEach(el => el.addEventListener('input', renderNotes));

    // --- Import/Export ---
    const exportNotesBtn = document.getElementById('export-notes-btn');
    const importNotesBtn = document.getElementById('import-notes-btn');
    const importFileInput = document.getElementById('import-file-input');

    exportNotesBtn.addEventListener('click', () => {
        if (notes.length === 0) return showAlert('No hay notas para exportar.', 'warning');
        const headers = ['id', 'title', 'date', 'participants', 'type', 'priority', 'deadline', 'topics', 'agreements', 'tasks', 'observations'];
        const csvData = notes.map(note => headers.map(header => `"${(note[header] || '').toString().replace(/"/g, '""')}"`).join(','));
        csvData.unshift(headers.join(','));
        const csvBlob = new Blob([csvData.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(csvBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `notas_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    });

    importNotesBtn.addEventListener('click', () => importFileInput.click());

    importFileInput.addEventListener('change', event => {
        const file = event.target.files[0];
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: results => {
                const validNotes = results.data.filter(n => n.id && n.title && n.priority);
                notes = [...notes, ...validNotes.filter(newNote => !notes.some(existing => existing.id === newNote.id))];
                saveNotes();
                renderNotes();
                showAlert(`${validNotes.length} notas importadas.`, 'success');
            },
            error: error => showAlert(`Error al leer CSV: ${error.message}`, 'danger'),
        });
        importFileInput.value = '';
    });

    // --- Window Functions ---
    window.viewNote = (id) => {
        const note = notes.find(note => note.id === id);
        if (!note) return;
        viewNoteModal._element.dataset.noteId = id;
        viewNoteTitle.textContent = note.title;
        viewNoteBody.innerHTML = `
            <p><strong>Fecha:</strong> ${note.date}</p>
            ${note.deadline ? `<p><strong>Límite:</strong> ${note.deadline}</p>`: ''}
            <p><strong>Prioridad:</strong> ${note.priority}</p>
            <p><strong>Participantes:</strong> ${note.participants}</p>
            <p><strong>Tipo:</strong> ${note.type}</p><hr>
            <p><strong>Temas:</strong><br>${note.topics.replace(/\n/g, '<br>')}</p><hr>
            <p><strong>Acuerdos:</strong><br>${note.agreements.replace(/\n/g, '<br>')}</p>
            ${note.tasks ? `<hr><p><strong>Tareas:</strong><br>${note.tasks.replace(/\n/g, '<br>')}</p>` : ''}
            ${note.observations ? `<hr><p><strong>Obs:</strong><br>${note.observations.replace(/\n/g, '<br>')}</p>` : ''}
        `;
        viewNoteModal.show();
    };

    window.editNote = (id) => {
        const note = notes.find(note => note.id === id);
        if (!note) return;
        resetForm();
        noteModalLabel.textContent = 'Editar Nota';
        noteIdInput.value = note.id;
        document.getElementById('meeting-title').value = note.title;
        document.getElementById('meeting-date').value = note.date;
        document.getElementById('participants').value = note.participants;
        document.getElementById('meeting-type').value = note.type;
        document.getElementById('priority').value = note.priority;
        document.getElementById('deadline').value = note.deadline;
        document.getElementById('topics').value = note.topics;
        document.getElementById('agreements').value = note.agreements;
        document.getElementById('pending-tasks').value = note.tasks;
        document.getElementById('observations').value = note.observations;
        noteModal.show();
    };

    window.deleteNote = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
            notes = notes.filter(note => note.id !== id);
            saveNotes();
            renderNotes();
            showAlert('Nota eliminada.', 'danger');
        }
    };

    // --- Theme Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector("label[for='theme-toggle'] i");
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            themeToggle.checked = true;
            themeIcon.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            themeToggle.checked = false;
            themeIcon.classList.replace('bi-sun-fill', 'bi-moon-stars-fill');
        }
    };
    themeToggle.addEventListener('click', () => {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // --- Other Buttons ---
    document.getElementById('copy-note-btn').addEventListener('click', () => {
        const note = notes.find(n => n.id === viewNoteModal._element.dataset.noteId);
        if (!note) return;
        const noteText = `Título: ${note.title}\nFecha: ${note.date}\nLímite: ${note.deadline || ''}\nPrioridad: ${note.priority}\n\n${note.topics}`;
        navigator.clipboard.writeText(noteText).then(() => showAlert('Copiado al portapapeles.'), () => showAlert('Error al copiar.', 'danger'));
    });

    document.getElementById('export-pdf-btn').addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const note = notes.find(n => n.id === viewNoteModal._element.dataset.noteId);
        if (!note) return;
        const doc = new jsPDF();
        doc.text(`Título: ${note.title}`, 10, 10);
        doc.text(`Fecha: ${note.date}`, 10, 20);
        // Add more fields...
        doc.save(`${note.title.replace(/\s/g, '_')}.pdf`);
    });

    // --- Initial Load ---
    applyTheme(localStorage.getItem('theme') || 'light');
    updateIndicators();
    renderNotes();
});
