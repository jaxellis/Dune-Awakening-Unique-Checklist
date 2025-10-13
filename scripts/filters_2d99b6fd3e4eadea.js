import {
	activeFilters,
	jsonData,
	checklistData,
	saveFilters,
} from './data_34f204dc7050c01b.js';

import { updateCategoryVisibility } from './dom_bb236832e7e3496a.js';

import { pushUndoSnapshot } from './undoRedo_d56ca00e8a04ae79.js';
import { showToast } from './toast_59302154e35eb304.js';

export function itemMatchesFilters(item) {
	const mainSelected = Object.keys(activeFilters.main).some(
		(k) => activeFilters.main[k]
	);

	if (!Array.isArray(item.types) || !item.types?.length) return !mainSelected;
	const [main, sub] = item.types;

	if (!mainSelected) return true;

	if (!main) return false;
	if (!activeFilters.main[main]) return false;

	const subKeys = Object.keys(activeFilters.sub).filter((k) =>
		k.startsWith(`${main}:`)
	);
	const anySubActive = subKeys.some((k) => activeFilters.sub[k]);
	if (!anySubActive) return true;

	if (!sub) return false;
	return !!activeFilters.sub[`${main}:${sub}`];
}

export function applyAllFilters() {
	document.querySelectorAll('.item').forEach((item) => {
		let matches = true;
		const elTypes = item.dataset?.types?.split('|');
		if (elTypes) {
			matches = itemMatchesFilters({ types: elTypes });
		} else {
			const name = item.querySelector('.item-name')?.textContent?.trim() ?? '';
			if (name) {
				let found = null;
				for (const arr of Object.values(jsonData.schematics)) {
					found = arr.find((it) => (it.name || '').trim() === name);
					if (found) break;
				}
				if (found) matches = itemMatchesFilters(found);
			}
		}

		if (!matches) item.classList.add('hidden');
		else item.classList.remove('hidden');
	});

	updateCategoryVisibility();
}

export function filterItems(searchTerm) {
	const term = (searchTerm || '').toLowerCase();
	document.querySelectorAll('.item').forEach((item) => {
		const searchText = item.dataset.searchText || '';
		const passesSearch = !term || searchText.includes(term);

		let passesFilter = true;

		if (item.dataset?.types) {
			const arr = item.dataset.types.split('|');
			passesFilter = itemMatchesFilters({ types: arr });
		} else {
			const name = item.querySelector('.item-name')?.textContent?.trim() ?? '';
			if (name) {
				let found = null;
				for (const arr of Object.values(jsonData.schematics)) {
					found = arr.find((it) => (it.name || '').trim() === name);
					if (found) break;
				}
				if (found) passesFilter = itemMatchesFilters(found);
			}
		}

		if (passesSearch && passesFilter) item.classList.remove('hidden');
		else item.classList.add('hidden');
	});

	if (term) {
		updateCategoryVisibility();
	} else {
		updateCategoryVisibility();
	}
}

export function normalizeKey(name) {
	return (name || '').toString().trim().toLowerCase();
}

export function getTopLocations() {
	const locationCounts = {};

	for (const items of Object.values(jsonData.schematics)) {
		for (const item of items) {
			if (checklistData[normalizeKey(item.name)]) continue;

			if (!item.location?.length) continue;

			for (const loc of item.location) {
				if (!loc?.trim()) continue;

				let locName;

				if (loc.startsWith('NPC Camp')) {
					const parts = loc.split('|');
					locName = parts[0] || 'Unknown NPC Camp';
				} else {
					locName = loc.replace(/<\/?loc>/g, '').trim();
				}

				locationCounts[locName] = (locationCounts[locName] || 0) + 1;
			}
		}
	}

	// Sort locations by descending number of unmarked items
	return Object.entries(locationCounts)
		.sort((a, b) => b[1] - a[1])
		.map(([location, count]) => ({ location, count }));
}
