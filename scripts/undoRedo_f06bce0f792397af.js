import { UNDO_STACK_MAX } from './constants_9fe2dbbb9bdba702.js';
import {
	checklistData,
	undoStack,
	redoStack,
	saveToStorage,
} from './data_09b4d589a60ee701.js';
import {
	updateItem,
	updateCategoryCount,
	updateStats,
	applyHideCheckedSetting,
	toggleAll,
} from './dom_85dfe6657d89fa82.js';
import { showToast } from './toast_b747dc57bf6fa14f.js';

const clone = (obj) => structuredClone(obj ?? {});

export const pushUndoSnapshot = (meta = null) => {
	try {
		const snap = clone(checklistData);
		const metaClone = meta ? clone(meta) : null;
		undoStack.push({ snap, meta: metaClone });

		redoStack.length = 0;
		if (undoStack.length > UNDO_STACK_MAX) undoStack.shift();
		updateUndoButtonState();
		updateRedoButtonState();
	} catch (err) {
		console.error('Failed to push undo snapshot', err);
	}
};

export const updateUndoButtonState = () => {
	const btn = document.getElementById('undoBtn');
	if (!btn) return;
	btn.disabled = undoStack.length === 0;
};

export const updateRedoButtonState = () => {
	const btn = document.getElementById('redoBtn');
	if (!btn) return;
	btn.disabled = redoStack.length === 0;
};

export const undoLast = () => {
	if (!undoStack.length) return;

	try {
		try {
			const currentSnap = clone(checklistData);
			redoStack.push({ snap: currentSnap, meta: { type: 'undo-redo' } });
			if (redoStack.length > UNDO_STACK_MAX) redoStack.shift();
		} catch (err) {
			console.error('Failed to push redo snapshot', err);
		}

		const entry = undoStack.pop();
		if (!entry) return;

		const { snap: last = {}, meta = null } = entry;

		Object.keys(checklistData).forEach((k) => delete checklistData[k]);
		Object.assign(checklistData, last);

		document.querySelectorAll('.item-checkbox').forEach((checkbox) => {
			const key = checkbox.dataset.key ?? checkbox.id;
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

		const actionMessage = (() => {
			if (!meta?.type) return 'Undo: previous state restored';

			const messages = {
				'item-toggle': `${meta.to ? 'Unmarked' : 'Remarked'} ${meta.name}`,
				'bulk-toggle': `Undo: ${
					meta.to ? 'Checked all items' : 'Unchecked all items'
				}`,
				clear: 'Undo: progress restored',
				import: 'Undo: previous progress restored',
			};

			return messages[meta.type] ?? 'Undo: previous state restored';
		})();

		showToast(actionMessage);
		updateRedoButtonState();
		applyHideCheckedSetting();
	} catch (err) {
		console.error('Failed to undo last action', err);
	}
};

export const redoLast = () => {
	if (!redoStack.length) return;

	try {
		try {
			const currentSnap = clone(checklistData);
			undoStack.push({ snap: currentSnap, meta: { type: 'redo-undo' } });
			if (undoStack.length > UNDO_STACK_MAX) undoStack.shift();
		} catch (err) {
			console.error('Failed to push undo snapshot for redo', err);
		}

		const entry = redoStack.pop();
		if (!entry) return;

		const { snap: next = {}, meta = null } = entry;

		Object.keys(checklistData).forEach((k) => delete checklistData[k]);
		Object.assign(checklistData, next);

		document.querySelectorAll('.item-checkbox').forEach((checkbox) => {
			const key = checkbox.dataset.key ?? checkbox.id;
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

		const actionMessage = (() => {
			if (!meta?.type) return 'Redo applied';

			const messages = {
				'item-toggle': `${meta.to ? 'Rechecked' : 'Unchecked'} ${meta.name}`,
				'bulk-toggle': `Redo: ${
					meta.to ? 'Checked all items' : 'Unchecked all items'
				}`,
				clear: 'Redo: progress cleared again',
				import: 'Redo: imported progress again',
			};

			return messages[meta.type] ?? 'Redo applied';
		})();

		showToast(actionMessage);
		applyHideCheckedSetting();
	} catch (err) {
		console.error('Failed to redo last action', err);
	}
};
