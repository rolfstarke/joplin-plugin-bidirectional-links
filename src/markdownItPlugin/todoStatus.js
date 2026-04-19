(function() {
	'use strict';

	var CONTENT_SCRIPT_ID = 'todoStatusViewer';

	function extractNoteId(link) {
		// Try data-resource-id attribute first
		var id = link.getAttribute('data-resource-id');
		if (id) return id;

		// Parse href for Joplin internal link patterns
		var href = link.getAttribute('href') || '';
		var match = href.match(/:\/([a-f0-9]{32})/);
		if (match) return match[1];

		return null;
	}

	async function updateTodoStatus() {
		var links = document.querySelectorAll('a[data-resource-id], a[href*=":/"]');
		var noteIdSet = {};
		var linksByNoteId = {};

		links.forEach(function(link) {
			var noteId = extractNoteId(link);
			if (!noteId) return;
			noteIdSet[noteId] = true;
			if (!linksByNoteId[noteId]) linksByNoteId[noteId] = [];
			linksByNoteId[noteId].push(link);
		});

		var noteIds = Object.keys(noteIdSet);
		if (noteIds.length === 0) return;

		var response;
		try {
			response = await webviewApi.postMessage(CONTENT_SCRIPT_ID, {
				command: 'getTodoStatus',
				noteIds: noteIds,
			});
		} catch (e) {
			return;
		}

		if (!response) return;

		noteIds.forEach(function(noteId) {
			var status = response[noteId];
			var noteLinks = linksByNoteId[noteId];
			if (!noteLinks) return;

			noteLinks.forEach(function(link) {
				// Remove any existing indicator
				var existing = link.querySelector('.todo-status-indicator');
				if (existing) existing.remove();

				if (status && status.is_todo) {
					var indicator = document.createElement('span');
					indicator.className = 'todo-status-indicator';
					indicator.textContent = status.todo_completed ? '\u2611 ' : '\u2610 ';
					indicator.title = status.todo_completed ? 'Completed' : 'Open';
					link.insertBefore(indicator, link.firstChild);
					link.classList.add('todo-link');
					if (status.todo_completed) {
						link.classList.add('todo-completed');
					} else {
						link.classList.remove('todo-completed');
					}
				}
			});
		});
	}

	// Run on initial load
	updateTodoStatus();

	// Observe DOM changes for re-renders
	var observer = new MutationObserver(function() {
		updateTodoStatus();
	});

	var target = document.getElementById('joplin-container-content') || document.body;
	observer.observe(target, { childList: true, subtree: true });
})();
