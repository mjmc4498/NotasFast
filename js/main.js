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

    const showAlert = (message, type = 'success') => {
        const alertContainer = document.getElementById('alert-container');
        const alert = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        alertContainer.innerHTML = alert;
        setTimeout(() => {
            const alertNode = alertContainer.querySelector('.alert');
            if (alertNode) {
                bootstrap.Alert.getOrCreateInstance(alertNode).close();
            }
        }, 4000);
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

        const isUpdating = !!id;
        if (isUpdating) {
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
        showAlert(`Nota ${isUpdating ? 'actualizada' : 'creada'} con éxito.`, 'success');
    });

    // Event listeners for controls
    [searchInput, sortBy, filterByType].forEach(el => el.addEventListener('input', renderNotes));

    const exportNotesBtn = document.getElementById('export-notes-btn');
    const importNotesBtn = document.getElementById('import-notes-btn');
    const importFileInput = document.getElementById('import-file-input');

    exportNotesBtn.addEventListener('click', () => {
        if (notes.length === 0) {
            showAlert('No hay notas para exportar.', 'warning');
            return;
        }
        const headers = ['id', 'title', 'date', 'participants', 'type', 'topics', 'agreements', 'tasks', 'observations'];
        const csvData = notes.map(note => headers.map(header => `"${(note[header] || '').toString().replace(/"/g, '""')}"`).join(','));
        csvData.unshift(headers.join(','));

        const csvBlob = new Blob([csvData.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(csvBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `notas_reuniones_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showAlert('Notas exportadas a CSV con éxito.');
    });

    importNotesBtn.addEventListener('click', () => importFileInput.click());

    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const importedNotes = results.data;
                if (Array.isArray(importedNotes)) {
                     const validNotes = importedNotes.filter(n => n.id && n.title);
                    notes = [...notes, ...validNotes.filter(newNote => !notes.some(existing => existing.id === newNote.id))];
                    saveNotes();
                    renderNotes();
                    showAlert(`${validNotes.length} notas importadas con éxito desde CSV.`);
                } else {
                    showAlert('El archivo CSV no pudo ser procesado.', 'danger');
                }
            },
            error: (error) => {
                showAlert(`Error al leer el archivo CSV: ${error.message}`, 'danger');
            }
        });

        importFileInput.value = ''; // Reset for same-file import
    });


    window.viewNote = (id) => {
        const note = notes.find(note => note.id === id);
        if (note) {
            viewNoteModal._element.dataset.noteId = id; // Store id in modal
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
            showAlert('Nota eliminada con éxito.', 'danger');
        }
    };

    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector("label[for='theme-toggle'] i");

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            themeToggle.checked = true;
            themeIcon.classList.remove('bi-moon-stars-fill');
            themeIcon.classList.add('bi-sun-fill');
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            themeToggle.checked = false;
            themeIcon.classList.remove('bi-sun-fill');
            themeIcon.classList.add('bi-moon-stars-fill');
        }
    };

    themeToggle.addEventListener('click', () => {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    const copyNoteBtn = document.getElementById('copy-note-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    copyNoteBtn.addEventListener('click', () => {
        const noteId = viewNoteModal._element.dataset.noteId;
        const note = notes.find(n => n.id === noteId);
        if (note) {
            const noteText = `
Título: ${note.title}
Fecha: ${note.date}
Participantes: ${note.participants}
Tipo: ${note.type}

Temas Tratados:
${note.topics}

Acuerdos:
${note.agreements}

Tareas Pendientes:
${note.tasks || 'Ninguna'}

Observaciones:
${note.observations || 'Ninguna'}
            `.trim();
            navigator.clipboard.writeText(noteText)
                .then(() => showAlert('Nota copiada al portapapeles.'))
                .catch(() => showAlert('No se pudo copiar la nota.', 'danger'));
        }
    });

    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const noteId = viewNoteModal._element.dataset.noteId;
        const note = notes.find(n => n.id === noteId);
        if(note) {
            const doc = new jsPDF();
            // Simple text based PDF
            doc.text(`Título: ${note.title}`, 10, 10);
            doc.text(`Fecha: ${note.date}`, 10, 20);
            doc.text(`Participantes: ${note.participants}`, 10, 30);
            // ... add more fields as needed
            doc.save(`${note.title.replace(/\s/g, '_')}.pdf`);
            showAlert('La exportación a PDF es una función básica. Se puede mejorar con html2canvas.', 'info');
        }
    });


    // Initial render
    renderNotes();
});
