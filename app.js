fetch('notes.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('notes-container');

    data.notes.forEach(note => {
      const noteEl = document.createElement('div');
      noteEl.className = 'note';
      noteEl.innerHTML = `
        <h3>${note.title}</h3>
        <p>${note.content}</p>
      `;
      container.appendChild(noteEl);
    });
  })
  .catch(error => {
    console.error("Error loading notes:", error);
  });
