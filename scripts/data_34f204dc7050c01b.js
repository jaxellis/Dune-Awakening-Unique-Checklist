import {
	COLLAPSE_KEY,
	FILTERS_KEY,
	SETTINGS_KEY,
	STORAGE_KEY,
} from './constants_57559eec849b4e2f.js';

export let activeFilters = { main: {}, sub: {} };
export let appSettings = { hideChecked: false };
export let checklistData = {};
export let collapsedCategories = new Set();
export let jsonData = { schematics: {}, locationIcons: {}, locations: {} };

export let undoStack = [];
export let redoStack = [];

export const saveFilters = () => {
	try {
		globalThis.localStorage?.setItem(
			FILTERS_KEY,
			JSON.stringify(activeFilters)
		);
	} catch {
		console.error('Failed to save filters');
	}
};

export const loadFilters = () => {
	try {
		const raw = globalThis.localStorage?.getItem(FILTERS_KEY);
		activeFilters = { ...activeFilters, ...(raw ? JSON.parse(raw) ?? {} : {}) };
	} catch {
		console.error('Failed to load filters');
	}
};

export const loadJsonIntoGlobal = async (filePath, key) => {
	try {
		const res = await fetch(filePath, { cache: 'no-cache' });
		if (!res.ok) throw new Error(`Failed to fetch ${filePath}: ${res.status}`);
		jsonData[key] = await res.json();
	} catch (err) {
		console.error(`Error loading ${filePath}`, err);
		jsonData[key] = {};
	}
};

export const saveToStorage = () => {
	try {
		globalThis.localStorage?.setItem(
			STORAGE_KEY,
			JSON.stringify(checklistData)
		);
	} catch {
		console.error('Failed to save progress to localStorage');
	}
};

export const saveSettings = () => {
	try {
		globalThis.localStorage?.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
	} catch {
		console.error('Failed to save settings');
	}
};

export const loadSettings = () => {
	try {
		const raw = globalThis.localStorage?.getItem(SETTINGS_KEY);
		appSettings = { ...appSettings, ...(raw ? JSON.parse(raw) ?? {} : {}) };
	} catch {
		console.error('Failed to load settings');
	}
};

export const saveCollapsedCategories = () => {
	try {
		globalThis.localStorage?.setItem(
			COLLAPSE_KEY,
			JSON.stringify([...collapsedCategories])
		);
	} catch {
		console.error('Failed to save collapsed categories');
	}
};

export const loadCollapsedCategories = () => {
	try {
		const raw = globalThis.localStorage?.getItem(COLLAPSE_KEY);
		collapsedCategories = raw ? new Set(JSON.parse(raw)) : new Set();
	} catch {
		console.error('Failed to load collapsed categories');
		collapsedCategories = new Set();
	}
};
