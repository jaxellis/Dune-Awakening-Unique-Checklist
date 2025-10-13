import {
	loadJsonIntoGlobal,
	checklistData,
	loadSettings,
	loadFilters,
	loadCollapsedCategories,
	activeFilters,
	appSettings,
	collapsedCategories,
	jsonData,
} from './data_34f204dc7050c01b.js';

import {
	initializeChecklist,
	buildFiltersUI,
	showTopLocations,
	closeLocationsSidebar,
	clearProgress,
	exportProgress,
	importProgress,
	toggleAll,
	toggleHideChecked,
	toggleSettings,
} from './dom_bb236832e7e3496a.js';

import {
	updateUndoButtonState,
	updateRedoButtonState,
	undoLast,
	redoLast,
} from './undoRedo_d56ca00e8a04ae79.js';

import { STORAGE_KEY } from './constants_57559eec849b4e2f.js';
import { normalizeKey } from './filters_2d99b6fd3e4eadea.js';

// Initialize everything when the DOM is ready
Promise.all([
	loadJsonIntoGlobal('data/location_icons.json', 'locationIcons'),
	loadJsonIntoGlobal('data/schematics.json', 'schematics'),
	loadJsonIntoGlobal('data/locations.json', 'locations'),
]).then(() => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		Object.assign(checklistData, raw ? JSON.parse(raw) || {} : {});
	} catch (e) {
		Object.assign(checklistData, {});
	}

	loadSettings();
	loadFilters();
	loadCollapsedCategories();
	initializeChecklist();
	buildFiltersUI();
});

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
	const openBtn = document.getElementById('openLocationsSidebarBtn');
	const closeBtn = document.getElementById('closeLocationsSidebarBtn');
	const sidebar = document.getElementById('locationsSidebar');

	if (openBtn) {
		openBtn.addEventListener('click', showTopLocations);
	}

	if (closeBtn) {
		closeBtn.addEventListener('click', closeLocationsSidebar);
	}

	document.addEventListener('click', (event) => {
		if (
			sidebar &&
			openBtn &&
			!sidebar.contains(event.target) &&
			!openBtn.contains(event.target) &&
			sidebar.classList.contains('open')
		) {
			sidebar.classList.remove('open');
		}
	});

	updateUndoButtonState();
	updateRedoButtonState();

	window.toggleHideChecked = toggleHideChecked;
	window.toggleAll = toggleAll;
	window.clearProgress = clearProgress;
	window.exportProgress = exportProgress;
	window.importProgress = importProgress;
	window.showTopLocations = showTopLocations;
	window.redoLast = redoLast;
	window.undoLast = undoLast;
	window.toggleSettings = toggleSettings;
});

document.addEventListener('click', (ev) => {
	const menu = document.getElementById('settingsMenu');
	const btn = document.getElementById('settingsBtn');
	if (!menu || !btn) return;
	if (!menu.classList.contains('open')) return;
	if (ev.target === menu || menu.contains(ev.target) || ev.target === btn)
		return;
	menu.classList.remove('open');
});

document.addEventListener('keydown', (ev) => {
	if ((ev.ctrlKey || ev.metaKey) && ev.key && ev.key.toLowerCase() === 'z') {
		const active = document.activeElement;
		if (active) {
			const tag = (active.tagName || '').toUpperCase();
			if (tag === 'TEXTAREA') return;
			if (tag === 'INPUT') {
				const t = (active.type || '').toLowerCase();

				const textLike = [
					'text',
					'search',
					'email',
					'tel',
					'url',
					'password',
					'number',
				];
				if (textLike.includes(t)) return;
			}
			if (active.isContentEditable) return;
		}

		ev.preventDefault();
		undoLast();
	}
});
