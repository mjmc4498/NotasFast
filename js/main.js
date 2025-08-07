document.addEventListener('DOMContentLoaded', () => {
    const noteForm = document.getElementById('note-form');
    const noteIdInput = document.getElementById('note-id');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const searchInput = document.getElementById('search-input');
    const notesList = document.getElementById('notes-list');
    const formCollapse = new bootstrap.Collapse(document.getElementById('note-form-collapse'), {
        toggle: false
    });

    let notes = JSON.parse(localStorage.getItem('notes')) || [];

    const saveNotes = () => {
        localStorage.setItem('notes', JSON.stringify(notes));
    };

    const renderNotes = (filter = '') => {
        notesList.innerHTML = '';
        const filteredNotes = notes.filter(note =>
            note.title.toLowerCase().includes(filter.toLowerCase()) ||
            note.date.includes(filter) ||
            note.participants.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredNotes.length === 0) {
            notesList.innerHTML = '<p class="text-center text-muted">No hay notas para mostrar. ¡Crea una nueva!</p>';
            return;
        }

        filteredNotes.forEach(note => {
            const noteCard = `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0">${note.title}</h5>
                            <span class="badge bg-${note.type === 'Virtual' ? 'success' : 'info'}">${note.type}</span>
                        </div>
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">${note.date}</h6>
                            <p class="card-text"><strong>Participantes:</strong> ${note.participants}</p>
                            <p class="card-text"><strong>Temas:</strong> ${note.topics}</p>
                            ${note.agreements ? `<p class="card-text"><strong>Acuerdos:</strong> ${note.agreements}</p>` : ''}
                            ${note.tasks ? `<p class="card-text"><strong>Tareas:</strong> ${note.tasks}</p>` : ''}
                            ${note.observations ? `<p class="card-text"><strong>Observaciones:</strong> ${note.observations}</p>` : ''}
                        </div>
                        <div class="card-footer text-end">
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
        cancelEditBtn.style.display = 'none';
        formCollapse.hide();
    };

    noteForm.addEventListener('submit', event => {
        event.preventDefault();

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
            // Update existing note
            const index = notes.findIndex(note => note.id === id);
            if (index > -1) {
                notes[index] = noteData;
            }
        } else {
            // Add new note
            notes.push(noteData);
        }

        saveNotes();
        renderNotes();
        resetForm();
    });

    cancelEditBtn.addEventListener('click', () => {
        resetForm();
    });

    searchInput.addEventListener('input', (e) => {
        renderNotes(e.target.value);
    });

    window.editNote = (id) => {
        const note = notes.find(note => note.id === id);
        if (note) {
            noteIdInput.value = note.id;
            document.getElementById('meeting-title').value = note.title;
            document.getElementById('meeting-date').value = note.date;
            document.getElementById('participants').value = note.participants;
            document.getElementById('meeting-type').value = note.type;
            document.getElementById('topics').value = note.topics;
            document.getElementById('agreements').value = note.agreements;
            document.getElementById('pending-tasks').value = note.tasks;
            document.getElementById('observations').value = note.observations;

            cancelEditBtn.style.display = 'inline-block';
            formCollapse.show();
            window.scrollTo(0, 0);
        }
    };

    window.deleteNote = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
            notes = notes.filter(note => note.id !== id);
            saveNotes();
            renderNotes(searchInput.value);
        }
    };

    // Initial render
    renderNotes();
    cancelEditBtn.style.display = 'none';
});
