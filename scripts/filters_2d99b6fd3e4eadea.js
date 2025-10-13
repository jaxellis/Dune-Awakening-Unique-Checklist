import {
	activeFilters,
	jsonData,
	checklistData,
	saveFilters,
} from './data_34f204dc7050c01b.js';

import { updateCategoryVisibility } from './dom_bb236832e7e3496a.js';
import { pushUndoSnapshot } from './undoRedo_d56ca00e8a04ae79.js';
import { showToast } from './toast_59302154e35eb304.js';

export const itemMatchesFilters = (item) => {
	const mainSelected = Object.values(activeFilters.main).some(Boolean);

	if (!Array.isArray(item.types) || item.types.length === 0)
		return !mainSelected;

	const [main, sub] = item.types;

	if (!mainSelected) return true;
	if (!main || !activeFilters.main[main]) return false;

	const anySubActive = Object.keys(activeFilters.sub)
		.filter((k) => k.startsWith(`${main}:`))
		.some((k) => activeFilters.sub[k]);

	if (!anySubActive) return true;
	if (!sub) return false;

	return Boolean(activeFilters.sub[`${main}:${sub}`]);
};

export const applyAllFilters = () => {
	for (const item of document.querySelectorAll('.item')) {
		let matches = true;
		const elTypes = item.dataset?.types?.split('|');

		if (elTypes) {
			matches = itemMatchesFilters({ types: elTypes });
		} else {
			const name = item.querySelector('.item-name')?.textContent?.trim() ?? '';
			if (name) {
				let found = null;
				for (const arr of Object.values(jsonData.schematics)) {
					found = arr.find((it) => it.name?.trim() === name);
					if (found) break;
				}
				matches = found ? itemMatchesFilters(found) : true;
			}
		}

		item.classList.toggle('hidden', !matches);
	}

	updateCategoryVisibility();
};

export const filterItems = (searchTerm = '') => {
	const term = searchTerm.toLowerCase();

	for (const item of document.querySelectorAll('.item')) {
		const searchText = item.dataset.searchText ?? '';
		const passesSearch = !term || searchText.includes(term);

		let passesFilter = true;
		const elTypes = item.dataset?.types?.split('|');

		if (elTypes) {
			passesFilter = itemMatchesFilters({ types: elTypes });
		} else {
			const name = item.querySelector('.item-name')?.textContent?.trim() ?? '';
			if (name) {
				let found = null;
				for (const arr of Object.values(jsonData.schematics)) {
					found = arr.find((it) => it.name?.trim() === name);
					if (found) break;
				}
				passesFilter = found ? itemMatchesFilters(found) : true;
			}
		}

		item.classList.toggle('hidden', !(passesSearch && passesFilter));
	}

	updateCategoryVisibility();
};

export const normalizeKey = (name) =>
	String(name ?? '')
		.trim()
		.toLowerCase();

export const getTopLocations = () => {
	const locationCounts = {};

	for (const items of Object.values(jsonData.schematics)) {
		for (const item of items) {
			if (checklistData[normalizeKey(item.name)]) continue;
			if (!item.location?.length) continue;

			for (const loc of item.location) {
				if (!loc?.trim()) continue;

				const locName = loc.startsWith('NPC Camp')
					? loc.split('|')[0] ?? 'Unknown NPC Camp'
					: loc.replace(/<\/?loc>/g, '').trim();

				locationCounts[locName] = (locationCounts[locName] ?? 0) + 1;
			}
		}
	}

	return Object.entries(locationCounts)
		.sort(([, aCount], [, bCount]) => bCount - aCount)
		.map(([location, count]) => ({ location, count }));
};
