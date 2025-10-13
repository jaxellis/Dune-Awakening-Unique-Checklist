import {
	loadJsonIntoGlobal,
	checklistData,
	loadSettings,
	loadFilters,
	loadCollapsedCategories,
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

await Promise.all([
	loadJsonIntoGlobal('data/location_icons.json', 'locationIcons'),
	loadJsonIntoGlobal('data/schematics.json', 'schematics'),
	loadJsonIntoGlobal('data/locations.json', 'locations'),
]);

try {
	const raw = localStorage.getItem(STORAGE_KEY);
	Object.assign(checklistData, raw ? JSON.parse(raw) ?? {} : {});
} catch {
	Object.assign(checklistData, {});
}

loadSettings();
loadFilters();
loadCollapsedCategories();
initializeChecklist();
buildFiltersUI();

const openBtn = document.getElementById('openLocationsSidebarBtn');
const closeBtn = document.getElementById('closeLocationsSidebarBtn');
const sidebar = document.getElementById('locationsSidebar');
const settingsBtn = document.getElementById('settingsBtn');
const settingsMenu = document.getElementById('settingsMenu');

openBtn?.addEventListener('click', showTopLocations);
closeBtn?.addEventListener('click', closeLocationsSidebar);

document.addEventListener('click', (event) => {
	if (
		sidebar?.classList.contains('open') &&
		openBtn &&
		!sidebar.contains(event.target) &&
		!openBtn.contains(event.target)
	) {
		sidebar.classList.remove('open');
	}

	if (
		settingsMenu?.classList.contains('open') &&
		settingsBtn &&
		event.target !== settingsBtn &&
		!settingsMenu.contains(event.target)
	) {
		settingsMenu.classList.remove('open');
	}
});

document.addEventListener('keydown', (ev) => {
	if ((ev.ctrlKey || ev.metaKey) && ev.key?.toLowerCase() === 'z') {
		const active = document.activeElement;
		const tag = active?.tagName?.toUpperCase() ?? '';
		const type = active?.type?.toLowerCase() ?? '';

		const textLikeInputs = [
			'text',
			'search',
			'email',
			'tel',
			'url',
			'password',
			'number',
		];

		if (
			tag === 'TEXTAREA' ||
			(tag === 'INPUT' && textLikeInputs.includes(type)) ||
			active?.isContentEditable
		)
			return;

		ev.preventDefault();
		undoLast();
	}
});

Object.assign(window, {
	toggleHideChecked,
	toggleAll,
	clearProgress,
	exportProgress,
	importProgress,
	showTopLocations,
	redoLast,
	undoLast,
	toggleSettings,
});

updateUndoButtonState();
updateRedoButtonState();
