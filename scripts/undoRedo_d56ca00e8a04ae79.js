import { UNDO_STACK_MAX } from './constants_57559eec849b4e2f.js';
import {
	checklistData,
	undoStack,
	redoStack,
	saveToStorage,
} from './data_34f204dc7050c01b.js';

import {
	updateItem,
	updateCategoryCount,
	updateStats,
	applyHideCheckedSetting,
	toggleAll,
} from './dom_bb236832e7e3496a.js';

import { showToast } from './toast_59302154e35eb304.js';

export function pushUndoSnapshot(meta = null) {
	try {
		const snap = JSON.parse(JSON.stringify(checklistData || {}));
		undoStack.push({ snap, meta });

		redoStack.length = 0;
		if (undoStack.length > UNDO_STACK_MAX) undoStack.shift();
		updateUndoButtonState();
		updateRedoButtonState();
	} catch (e) {
		console.error('Failed to push undo snapshot', e);
	}
}

export function updateUndoButtonState() {
	const btn = document.getElementById('undoBtn');
	if (!btn) return;
	btn.disabled = undoStack.length === 0;
}

export function updateRedoButtonState() {
	const btn = document.getElementById('redoBtn');
	if (!btn) return;
	btn.disabled = redoStack.length === 0;
}

export function undoLast() {
	if (undoStack.length === 0) return;
	try {
		try {
			const currentSnap = JSON.parse(JSON.stringify(checklistData || {}));
			redoStack.push({ snap: currentSnap, meta: { type: 'undo-redo' } });
			if (redoStack.length > UNDO_STACK_MAX) redoStack.shift();
		} catch (e) {
			console.error('Failed to push redo snapshot', e);
		}

		const entry = undoStack.pop();
		if (!entry) return;
		const last = entry.snap || {};
		const meta = entry.meta || null;

		for (const key in checklistData) {
			delete checklistData[key];
		}
		Object.assign(checklistData, last);

		document.querySelectorAll('.item-checkbox').forEach((checkbox) => {
			const key = checkbox.dataset.key || checkbox.id;
			checkbox.checked = !!checklistData[key];
			const itemDiv = checkbox.closest('.item');
			updateItem(itemDiv, checkbox.checked);
		});

		document
			.querySelectorAll('.category')
			.forEach((cat) => updateCategoryCount(cat.dataset.category));
		updateStats();
		saveToStorage();
		updateUndoButtonState();
		if (meta && meta?.type) {
			let action = '';
			switch (meta.type) {
				case 'item-toggle':
					action = meta.to ? 'Unmarked' : 'Remarked';
					showToast(`${action} ${meta?.name}`);
					break;
				case 'bulk-toggle':
					action = meta.to ? 'Checked all items' : 'Unchecked all items';
					showToast(`Undo: ${action}`);
					break;
				case 'clear':
					showToast('Undo: progress restored');
					break;
				case 'import':
					showToast('Undo: previous progress restored');
					break;
				default:
					showToast('Undo: previous state restored');
					break;
			}
		} else {
			showToast('Undo: previous state restored');
		}
		updateRedoButtonState();
		applyHideCheckedSetting();
	} catch (e) {
		console.error('Failed to undo last action', e);
	}
}

export function redoLast() {
	if (redoStack.length === 0) return;
	try {
		try {
			const currentSnap = JSON.parse(JSON.stringify(checklistData || {}));
			undoStack.push({ snap: currentSnap, meta: { type: 'redo-undo' } });
			if (undoStack.length > UNDO_STACK_MAX) undoStack.shift();
		} catch (e) {
			console.error('Failed to push undo snapshot for redo', e);
		}

		const entry = redoStack.pop();
		if (!entry) return;
		const next = entry.snap || {};
		for (const key in checklistData) {
			delete checklistData[key];
		}
		Object.assign(checklistData, next);

		document.querySelectorAll('.item-checkbox').forEach((checkbox) => {
			const key = checkbox.dataset.key || checkbox.id;
			checkbox.checked = !!checklistData[key];
			const itemDiv = checkbox.closest('.item');
			updateItem(itemDiv, checkbox.checked);
		});
		document
			.querySelectorAll('.category')
			.forEach((cat) => updateCategoryCount(cat.dataset.category));
		updateStats();
		saveToStorage();
		updateUndoButtonState();
		updateRedoButtonState();
		showToast('Redo applied');
		applyHideCheckedSetting();
	} catch (e) {
		console.error('Failed to redo last action', e);
	}
}
