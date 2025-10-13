import {
	COLLAPSE_KEY,
	FILTERS_KEY,
	SETTINGS_KEY,
	STORAGE_KEY,
} from './constants_57559eec849b4e2f.js';

export let activeFilters = {
	main: {},
	sub: {},
};
export let appSettings = {
	hideChecked: false,
};
export let checklistData = {};
export let collapsedCategories = new Set();
export let jsonData = {
	schematics: {},
	locationIcons: {},
	locations: {},
};

export let undoStack = [];
export let redoStack = [];

export function saveFilters() {
	try {
		localStorage.setItem(FILTERS_KEY, JSON.stringify(activeFilters));
	} catch (e) {
		console.error('Failed to save filters', e);
	}
}

export function loadFilters() {
	try {
		const raw = localStorage.getItem(FILTERS_KEY);
		const parsed = raw ? JSON.parse(raw) || {} : {};
		activeFilters = Object.assign(activeFilters, parsed);
	} catch (e) {
		console.error('Failed to load filters', e);
	}
}

export async function loadJsonIntoGlobal(filePath, key) {
	try {
		const res = await fetch(filePath, { cache: 'no-cache' });
		if (!res.ok) throw new Error(`Failed to fetch ${filePath}: ${res.status}`);
		jsonData[key] = await res.json();
	} catch (err) {
		console.error(`Error loading ${filePath}`, err);
		jsonData[key] = {};
	}
}

export function saveToStorage() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(checklistData));
	} catch (e) {
		console.error('Failed to save progress to localStorage', e);
	}
}

export function saveSettings() {
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
	} catch (e) {
		console.error('Failed to save settings', e);
	}
}

export function loadSettings() {
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		const parsed = raw ? JSON.parse(raw) || {} : {};
		appSettings = Object.assign(appSettings, parsed);
	} catch (e) {
		console.error('Failed to load settings', e);
	}
}

export function saveCollapsedCategories() {
	try {
		localStorage.setItem(
			COLLAPSE_KEY,
			JSON.stringify([...collapsedCategories])
		);
	} catch (e) {
		console.error('Failed to save collapsed categories', e);
	}
}

export function loadCollapsedCategories() {
	try {
		const raw = localStorage.getItem(COLLAPSE_KEY);
		if (raw) collapsedCategories = new Set(JSON.parse(raw));
		else collapsedCategories = new Set();
	} catch (e) {
		console.error('Failed to load collapsed categories', e);
		collapsedCategories = new Set();
	}
}
