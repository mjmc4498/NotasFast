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

    // Data Store
    let notes = JSON.parse(localStorage.getItem('notes')) || [];

    const saveNotes = () => {
        localStorage.setItem('notes', JSON.stringify(notes));
    };

    const renderNotes = () => {
        // 1. Get filter and sort values
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterByType.value;
        const sortValue = sortBy.value;

        // 2. Filter notes
        let filteredNotes = notes.filter(note => {
            const matchesSearch = note.title.toLowerCase().includes(searchTerm) ||
                                  note.topics.toLowerCase().includes(searchTerm) ||
                                  note.participants.toLowerCase().includes(searchTerm);
            const matchesFilter = filterValue === 'all' || note.type === filterValue;
            return matchesSearch && matchesFilter;
        });

        // 3. Sort notes
        filteredNotes.sort((a, b) => {
            switch (sortValue) {
                case 'creation-asc':
                    return a.id - b.id;
                case 'meeting-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'meeting-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'creation-desc':
                default:
                    return b.id - a.id;
            }
        });

        // 4. Render notes
        notesList.innerHTML = '';
        if (filteredNotes.length === 0) {
            notesList.innerHTML = '<p class="text-center text-muted">No hay notas que coincidan con los criterios. ¡Crea una nueva!</p>';
            return;
        }

        filteredNotes.forEach(note => {
            const noteCard = `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0 text-truncate">${note.title}</h5>
                            <span class="badge bg-${note.type === 'Virtual' ? 'success' : 'info'}">${note.type}</span>
                        </div>
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">${note.date}</h6>
                            <p class="card-text text-truncate"><strong>Temas:</strong> ${note.topics}</p>
                            <p class="card-text text-truncate"><strong>Acuerdos:</strong> ${note.agreements}</p>
                        </div>
                        <div class="card-footer text-end bg-white border-top-0">
                            <button class="btn btn-sm btn-outline-secondary" onclick="viewNote('${note.id}')"><i class="bi bi-eye"></i> Ver</button>
                            <button class="btn btn-sm btn-outline-primary" onclick="editNote('${note.id}')"><i class="bi bi-pencil"></i> Editar</button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteNote('${note.id}')"><i class="bi bi-trash"></i> Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
            notesList.insertAdjacentHTML('beforeend', noteCard);
        });
    };

    const resetForm = () => {
        noteForm.reset();
        noteIdInput.value = '';
        noteForm.classList.remove('was-validated');
    };

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
            topics: document.getElementById('topics').value,
            agreements: document.getElementById('agreements').value,
            tasks: document.getElementById('pending-tasks').value,
            observations: document.getElementById('observations').value,
        };

        if (id) {
            const index = notes.findIndex(note => note.id === id);
            if (index > -1) {
                notes[index] = noteData;
            }
        } else {
            notes.push(noteData);
        }

        saveNotes();
        renderNotes();
        noteModal.hide();
    });

    // Event listeners for controls
    [searchInput, sortBy, filterByType].forEach(el => el.addEventListener('input', renderNotes));

    window.viewNote = (id) => {
        const note = notes.find(note => note.id === id);
        if (note) {
            viewNoteTitle.textContent = note.title;
            viewNoteBody.innerHTML = `
                <p><strong>Fecha:</strong> ${note.date}</p>
                <p><strong>Participantes:</strong> ${note.participants}</p>
                <p><strong>Tipo:</strong> ${note.type}</p>
                <hr>
                <p><strong>Temas Tratados:</strong></p>
                <p>${note.topics.replace(/\n/g, '<br>')}</p>
                <hr>
                <p><strong>Acuerdos:</strong></p>
                <p>${note.agreements.replace(/\n/g, '<br>')}</p>
                ${note.tasks ? `<hr><p><strong>Tareas Pendientes:</strong></p><p>${note.tasks.replace(/\n/g, '<br>')}</p>` : ''}
                ${note.observations ? `<hr><p><strong>Observaciones:</strong></p><p>${note.observations.replace(/\n/g, '<br>')}</p>` : ''}
            `;
            viewNoteModal.show();
        }
    };

    window.editNote = (id) => {
        const note = notes.find(note => note.id === id);
        if (note) {
            resetForm();
            noteModalLabel.textContent = 'Editar Nota';

            noteIdInput.value = note.id;
            document.getElementById('meeting-title').value = note.title;
            document.getElementById('meeting-date').value = note.date;
            document.getElementById('participants').value = note.participants;
            document.getElementById('meeting-type').value = note.type;
            document.getElementById('topics').value = note.topics;
            document.getElementById('agreements').value = note.agreements;
            document.getElementById('pending-tasks').value = note.tasks;
            document.getElementById('observations').value = note.observations;

            noteModal.show();
        }
    };

    window.deleteNote = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
            notes = notes.filter(note => note.id !== id);
            saveNotes();
            renderNotes();
        }
    };

    // Initial render
    renderNotes();
});
