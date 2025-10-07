const STORAGE_KEY = 'dune-awakening-checklist-v1';
const SETTINGS_KEY = 'dune-awakening-checklist-settings-v1';

let schematics = {};
let checklistData = {};
let appSettings = {
	hideChecked: false,
};
let activeFilters = {
	main: {},
	sub: {},
};

const FILTERS_KEY = 'dune-awakening-checklist-filters-v1';

function saveFilters() {
	try {
		localStorage.setItem(FILTERS_KEY, JSON.stringify(activeFilters));
	} catch (e) {
		console.error('Failed to save filters', e);
	}
}

function loadFilters() {
	try {
		const raw = localStorage.getItem(FILTERS_KEY);
		const parsed = raw ? JSON.parse(raw) || {} : {};
		activeFilters = Object.assign(activeFilters, parsed);
	} catch (e) {
		console.error('Failed to load filters', e);
	}
}

function buildFiltersUI() {
	const filtersDiv = document.getElementById('filters');
	if (!filtersDiv) return;
	filtersDiv.innerHTML = '';

	const map = {};
	Object.values(schematics)
		.flat()
		.forEach((item) => {
			if (!Array.isArray(item.types) || item.types.length === 0) return;
			const [main, sub] = item.types;
			if (!main) return;
			if (!map[main]) map[main] = new Set();
			if (sub) map[main].add(sub);
		});

	Object.keys(map)
		.sort()
		.forEach((main) => {
			const wrapper = document.createElement('div');
			wrapper.className = 'filter-group';

			const mainId = `filter-main-${main.replace(/\s+/g, '-')}`;
			const mainLabel = document.createElement('label');
			mainLabel.className = 'filter-main-label';
			mainLabel.htmlFor = mainId;

			const mainInput = document.createElement('input');
			mainInput.type = 'checkbox';
			mainInput.id = mainId;
			mainInput.checked = !!activeFilters.main[main];
			mainInput.addEventListener('change', () => {
				activeFilters.main[main] = mainInput.checked;

				if (!mainInput.checked) {
					(map[main] || []).forEach(
						(s) => delete activeFilters.sub[`${main}:${s}`]
					);
				}
				saveFilters();
				applyAllFilters();

				const subList = wrapper.querySelector('.filter-subs');
				if (subList)
					subList.style.display = mainInput.checked ? 'block' : 'none';
				if (mainInput.checked) mainLabel.classList.add('active');
				else mainLabel.classList.remove('active');
			});

			const mainText = document.createElement('span');
			mainText.textContent = main;

			mainLabel.appendChild(mainInput);
			mainLabel.appendChild(mainText);

			if (mainInput.checked) mainLabel.classList.add('active');
			wrapper.appendChild(mainLabel);

			const subsWrap = document.createElement('div');
			subsWrap.className = 'filter-subs';
			subsWrap.style.display = mainInput.checked ? 'block' : 'none';
			Array.from(map[main])
				.sort()
				.forEach((sub) => {
					const subId = `filter-sub-${main.replace(/\s+/g, '-')}-${sub.replace(
						/\s+/g,
						'-'
					)}`;
					const lbl = document.createElement('label');
					lbl.className = 'filter-sub-label';
					lbl.htmlFor = subId;

					const inp = document.createElement('input');
					inp.type = 'checkbox';
					inp.id = subId;
					const key = `${main}:${sub}`;
					inp.checked = !!activeFilters.sub[key];
					inp.addEventListener('change', () => {
						activeFilters.sub[key] = inp.checked;
						saveFilters();
						applyAllFilters();
						if (inp.checked) lbl.classList.add('active');
						else lbl.classList.remove('active');
					});

					const txt = document.createElement('span');
					txt.textContent = sub;
					lbl.appendChild(inp);
					lbl.appendChild(txt);
					if (inp.checked) lbl.classList.add('active');
					subsWrap.appendChild(lbl);
				});

			wrapper.appendChild(subsWrap);
			filtersDiv.appendChild(wrapper);
		});

	applyAllFilters();
}

function itemMatchesFilters(item) {
	const mainSelected = Object.keys(activeFilters.main).some(
		(k) => activeFilters.main[k]
	);

	if (!Array.isArray(item.types) || item.types.length === 0)
		return !mainSelected;
	const [main, sub] = item.types;

	if (!mainSelected) return true;

	if (!main) return false;
	if (!activeFilters.main[main]) return false;

	const subKeys = Object.keys(activeFilters.sub).filter((k) =>
		k.startsWith(main + ':')
	);
	const anySubActive = subKeys.some((k) => activeFilters.sub[k]);
	if (!anySubActive) return true;

	if (!sub) return false;
	return !!activeFilters.sub[`${main}:${sub}`];
}

function applyAllFilters() {
	document.querySelectorAll('.item').forEach((item) => {
		let matches = true;
		const elTypes =
			item.dataset && item.dataset.types ? item.dataset.types.split('|') : null;
		if (elTypes) {
			matches = itemMatchesFilters({ types: elTypes });
		} else {
			const name =
				item.querySelector('.item-name')?.textContent?.trim() || null;
			if (name) {
				let found = null;
				for (const arr of Object.values(schematics)) {
					found = arr.find((it) => (it.name || '').trim() === name);
					if (found) break;
				}
				if (found) matches = itemMatchesFilters(found);
			}
		}

		if (!matches) item.classList.add('hidden');
		else item.classList.remove('hidden');
	});

	document.querySelectorAll('.category').forEach((cat) => {
		const visible = cat.querySelectorAll(
			'.item:not(.hidden):not(.hidden-by-setting)'
		).length;
		if (visible === 0) cat.classList.add('hidden');
		else cat.classList.remove('hidden');
	});
}

window.applyAllFilters = applyAllFilters;
const UNDO_STACK_MAX = 20;
let undoStack = [];
let redoStack = [];

function pushUndoSnapshot(meta = null) {
	try {
		const snap = JSON.parse(JSON.stringify(checklistData || {}));
		undoStack.push({ snap, meta });

		redoStack = [];
		if (undoStack.length > UNDO_STACK_MAX) undoStack.shift();
		updateUndoButtonState();
		updateRedoButtonState();
	} catch (e) {
		console.error('Failed to push undo snapshot', e);
	}
}

function updateUndoButtonState() {
	const btn = document.getElementById('undoBtn');
	if (!btn) return;
	btn.disabled = undoStack.length === 0;
}

function updateRedoButtonState() {
	const btn = document.getElementById('redoBtn');
	if (!btn) return;
	btn.disabled = redoStack.length === 0;
}

async function loadSchematics() {
	try {
		const res = await fetch('data/schematics.json', { cache: 'no-cache' });
		if (!res.ok)
			throw new Error('Failed to fetch schematics.json: ' + res.status);
		schematics = await res.json();
	} catch (err) {
		console.error('Error loading schematics.json', err);
		schematics = {};
	}
}

function saveToStorage() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(checklistData));
	} catch (e) {
		console.error('Failed to save progress to localStorage', e);
	}
}

function updateStats() {
	const total = document.querySelectorAll('.item-checkbox').length;
	const checked = document.querySelectorAll('.item-checkbox:checked').length;
	const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

	const checkedCountEl = document.getElementById('checkedCount');
	const percentageEl = document.getElementById('percentage');
	if (checkedCountEl) checkedCountEl.textContent = checked;
	if (percentageEl) percentageEl.textContent = percentage;
}

function saveSettings() {
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
	} catch (e) {
		console.error('Failed to save settings', e);
	}
}

function loadSettings() {
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		const parsed = raw ? JSON.parse(raw) || {} : {};
		appSettings = Object.assign(appSettings, parsed);
	} catch (e) {
		console.error('Failed to load settings', e);
		appSettings = appSettings || { hideChecked: false };
	}
}

function applyHideCheckedSetting() {
	const items = Array.from(document.querySelectorAll('.item'));
	items.forEach((item) => {
		const checkbox = item.querySelector('.item-checkbox');
		if (!checkbox) return;

		if (appSettings.hideChecked && checkbox.checked) {
			if (item.classList.contains('hidden-by-setting')) return;

			item.classList.remove('appearing');

			item.classList.add('will-hide');

			const onEnd = (ev) => {
				if (
					ev &&
					ev.propertyName &&
					!/opacity|transform|height/.test(ev.propertyName)
				)
					return;
				item.classList.remove('will-hide');
				item.classList.add('hidden-by-setting');
				item.removeEventListener('transitionend', onEnd);
			};

			const timeoutId = setTimeout(() => {
				if (!item.classList.contains('hidden-by-setting')) {
					item.classList.remove('will-hide');
					item.classList.add('hidden-by-setting');
				}
			}, 400);

			item.addEventListener(
				'transitionend',
				(ev) => {
					if (
						ev &&
						ev.propertyName &&
						!/opacity|transform|height/.test(ev.propertyName)
					)
						return;
					clearTimeout(timeoutId);
					onEnd(ev);
				},
				{ once: true }
			);
		} else {
			if (!item.classList.contains('hidden-by-setting')) return;

			item.classList.remove('hidden-by-setting');

			item.classList.add('appearing');

			void item.offsetWidth;

			item.classList.remove('appearing');
		}
	});

	function updateCategoryVisibility() {
		if (appSettings.hideChecked) {
			document.querySelectorAll('.category').forEach((cat) => {
				const visibleCount = cat.querySelectorAll(
					'.item:not(.hidden):not(.hidden-by-setting):not(.will-hide)'
				).length;
				if (visibleCount === 0) cat.classList.add('hidden');
				else cat.classList.remove('hidden');
			});
		} else {
			document
				.querySelectorAll('.category')
				.forEach((cat) => cat.classList.remove('hidden'));
		}
	}

	updateCategoryVisibility();

	setTimeout(updateCategoryVisibility, 420);

	const btn = document.getElementById('hideCheckedBtn');
	if (btn) {
		if (appSettings.hideChecked) btn.classList.add('active-setting');
		else btn.classList.remove('active-setting');
	}
}

function toggleHideChecked() {
	appSettings.hideChecked = !appSettings.hideChecked;
	saveSettings();
	applyHideCheckedSetting();
	showToast(
		appSettings.hideChecked ? 'Hiding checked items' : 'Showing checked items'
	);
}

window.toggleHideChecked = toggleHideChecked;

function updateCategoryCount(categoryName) {
	const category = document.querySelector(`[data-category="${categoryName}"]`);
	if (category) {
		const checked = category.querySelectorAll('.item-checkbox:checked').length;
		const checkedSpan = category.querySelector('.category-checked');
		if (checkedSpan) checkedSpan.textContent = checked;
	}
}

function updateItem(itemDiv, checked) {
	if (!itemDiv) return;
	if (checked) itemDiv.classList.add('checked');
	else itemDiv.classList.remove('checked');
}

function toggleCategory(categoryDiv) {
	if (!categoryDiv) return;
	categoryDiv.classList.toggle('collapsed');
}

function toggleAll(check) {
	pushUndoSnapshot({ type: 'bulk-toggle', to: !!check });
	document.querySelectorAll('.item-checkbox').forEach((checkbox) => {
		checkbox.checked = check;
		const key = checkbox.dataset.key || checkbox.id;
		checklistData[key] = check;
		const itemDiv = checkbox.closest('.item');
		updateItem(itemDiv, check);
	});

	document.querySelectorAll('.category').forEach((cat) => {
		const name = cat.dataset.category;
		updateCategoryCount(name);
	});
	updateStats();
	saveToStorage();

	showToast(check ? 'Checked all items' : 'Unchecked all items');

	applyHideCheckedSetting();
}

function clearProgress() {
	if (confirm('Are you sure you want to reset all progress?')) {
		pushUndoSnapshot({ type: 'clear' });
		checklistData = {};
		toggleAll(false);
		saveToStorage();
		showToast('Progress reset');
	}
}

function exportProgress() {
	const dataStr = JSON.stringify(checklistData);
	const dataBlob = new Blob([dataStr], { type: 'application/json' });
	const url = URL.createObjectURL(dataBlob);
	const link = document.createElement('a');
	link.href = url;
	link.download = 'dune-awakening-progress.json';
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
	showToast('Progress exported');
}

function importProgress() {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json';
	input.onchange = (e) => {
		const file = e.target.files[0];
		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const parsed = JSON.parse(event.target.result);
				if (typeof parsed === 'object' && parsed !== null) {
					pushUndoSnapshot({ type: 'import' });
					checklistData = parsed;

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
					showToast('Progress imported');
					applyHideCheckedSetting();
				} else {
					throw new Error('Invalid file');
				}
			} catch (error) {
				alert(
					"Error importing file. Please ensure it's a valid progress file."
				);
			}
		};
		reader.readAsText(file);
	};
	input.click();
}

function filterItems(searchTerm) {
	const term = (searchTerm || '').toLowerCase();
	document.querySelectorAll('.item').forEach((item) => {
		const searchText = item.dataset.searchText || '';
		const passesSearch = !term || searchText.includes(term);

		let passesFilter = true;

		if (item.dataset && item.dataset.types) {
			const arr = item.dataset.types.split('|');
			passesFilter = itemMatchesFilters({ types: arr });
		} else {
			const name = item.querySelector('.item-name')?.textContent?.trim() || '';
			if (name) {
				let found = null;
				for (const arr of Object.values(schematics)) {
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
		document
			.querySelectorAll('.category')
			.forEach((cat) => cat.classList.remove('collapsed'));

		document.querySelectorAll('.category').forEach((cat) => {
			const visibleCount = cat.querySelectorAll(
				'.item:not(.hidden):not(.hidden-by-setting)'
			).length;
			if (visibleCount === 0) cat.classList.add('hidden');
			else cat.classList.remove('hidden');
		});
	} else {
		document
			.querySelectorAll('.category')
			.forEach((cat) => cat.classList.remove('hidden'));
	}
}

function normalizeKey(name) {
	return (name || '').toString().trim().toLowerCase();
}

function initializeChecklist() {
	const categoriesDiv = document.getElementById('categories');
	if (!categoriesDiv) return;
	categoriesDiv.innerHTML = '';

	const humanName = (t) =>
		t && typeof t === 'string' ? t.charAt(0).toUpperCase() + t.slice(1) : t;

	let totalItems = 0;
	for (const [catKey, items] of Object.entries(schematics)) {
		if (!Array.isArray(items) || items.length === 0) continue;
		totalItems += items.length;

		const categoryDiv = document.createElement('div');
		categoryDiv.className = 'category';
		categoryDiv.dataset.category = catKey;

		const headerDiv = document.createElement('div');
		headerDiv.className = 'category-header';
		headerDiv.onclick = () => toggleCategory(categoryDiv);

		const titleSpan = document.createElement('span');
		titleSpan.className = 'category-title';
		titleSpan.textContent = humanName(catKey);

		const countSpan = document.createElement('span');
		countSpan.className = 'category-count';
		countSpan.innerHTML = `<span class="category-checked">0</span> / ${items.length} <span class="chevron">▼</span>`;

		headerDiv.appendChild(titleSpan);
		headerDiv.appendChild(countSpan);
		categoryDiv.appendChild(headerDiv);

		const contentDiv = document.createElement('div');
		contentDiv.className = 'category-content';

		const sorted = items
			.slice()
			.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
		sorted.forEach((item) => {
			const itemId = normalizeKey(item.name);
			const itemName = item.name || '';
			const itemDiv = document.createElement('div');

			itemDiv.className = 'item infobox';
			itemDiv.dataset.searchText = `${item.name || ''} ${
				item.location || ''
			}`.toLowerCase();

			if (Array.isArray(item.types) && item.types.length > 0) {
				itemDiv.dataset.types = item.types.join('|');
			}

			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.className = 'item-checkbox';

			checkbox.id = `${catKey}-${itemId}`;

			checkbox.dataset.key = itemId;
			checkbox.checked = !!checklistData[itemId];
			checkbox.onchange = () => {
				const prev = !!checklistData[itemId];
				pushUndoSnapshot({
					type: 'item-toggle',
					key: itemId,
					name: itemName,
					from: prev,
					to: !!checkbox.checked,
				});
				checklistData[itemId] = checkbox.checked;
				updateItem(itemDiv, checkbox.checked);
				updateStats();
				updateCategoryCount(catKey);
				saveToStorage();

				showToast(
					checkbox.checked ? `Marked ${itemName}` : `Unmarked ${itemName}`
				);

				applyHideCheckedSetting();
			};

			const img = document.createElement('img');
			img.loading = 'lazy';
			img.className = 'item-image';
			if (
				item.image &&
				typeof item.image === 'string' &&
				item.image.trim() !== ''
			) {
				const src = '/' + item.image.replace(/\\/g, '/').replace(/^\//, '');
				img.src = src;
				img.alt = item.name || 'item image';
			} else {
				img.alt = item.name || 'item image';
				img.src = '';
			}

			const infoDiv = document.createElement('div');
			infoDiv.className = 'item-info';

			const nameDiv = document.createElement('div');
			nameDiv.className = 'item-name';

			let nameHtml = '';
			const safeName = item.name || '';
			if (item.url && typeof item.url === 'string' && item.url.trim() !== '') {
				const safeUrl = item.url.trim();
				nameHtml = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeName}</a>`;
			} else {
				nameHtml = safeName;
			}

			nameHtml += item.tier
				? `<span class="tier-badge tier-${
						item.tier
				  }">${item.tier.toUpperCase()}</span>`
				: '';

			nameDiv.innerHTML = nameHtml;

			const locationDiv = document.createElement('div');
			locationDiv.className = 'item-location';
			locationDiv.textContent = `📍 ${item.location || ''}`;

			infoDiv.appendChild(nameDiv);
			infoDiv.appendChild(locationDiv);

			itemDiv.tabIndex = 0;
			itemDiv.addEventListener('click', (ev) => {
				if (ev.target.closest('a')) return;
				checkbox.checked = !checkbox.checked;

				checkbox.dispatchEvent(new Event('change', { bubbles: true }));
			});
			itemDiv.addEventListener('keydown', (ev) => {
				if (ev.key === ' ' || ev.key === 'Enter') {
					if (ev.target.closest('a')) return;
					ev.preventDefault();
					checkbox.checked = !checkbox.checked;
					checkbox.dispatchEvent(new Event('change', { bubbles: true }));
				}
			});

			itemDiv.appendChild(checkbox);
			itemDiv.appendChild(img);
			itemDiv.appendChild(infoDiv);
			contentDiv.appendChild(itemDiv);

			if (checkbox.checked) itemDiv.classList.add('checked');
		});

		categoryDiv.appendChild(contentDiv);
		categoriesDiv.appendChild(categoryDiv);
		updateCategoryCount(catKey);
	}

	const totalCountEl = document.getElementById('totalCount');
	if (totalCountEl) totalCountEl.textContent = totalItems;
	updateStats();

	applyHideCheckedSetting();
}

loadSchematics().then(() => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		checklistData = raw ? JSON.parse(raw) || {} : {};
	} catch (e) {
		checklistData = {};
	}

	loadSettings();
	loadFilters();
	initializeChecklist();

	buildFiltersUI();
});

window.toggleAll = toggleAll;
window.clearProgress = clearProgress;
window.exportProgress = exportProgress;
window.importProgress = importProgress;
window.filterItems = filterItems;

function undoLast() {
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

		checklistData = last || {};

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

		if (meta && meta.type) {
			if (meta.type === 'item-toggle') {
				const action = meta.to ? 'Unmarked' : 'Remarked';
				showToast(`${action} ${meta.name}`);
			} else if (meta.type === 'bulk-toggle') {
				const action = meta.to ? 'Checked all items' : 'Unchecked all items';
				showToast(`Undo: ${action}`);
			} else if (meta.type === 'clear') {
				showToast('Undo: progress restored');
			} else if (meta.type === 'import') {
				showToast('Undo: previous progress restored');
			} else {
				showToast('Undo: previous state restored');
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

window.undoLast = undoLast;
updateUndoButtonState();
updateRedoButtonState();

function redoLast() {
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
		checklistData = next;

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
window.redoLast = redoLast;

function toggleSettings() {
	const menu = document.getElementById('settingsMenu');
	if (!menu) return;
	menu.classList.toggle('open');
}

document.addEventListener('click', (ev) => {
	const menu = document.getElementById('settingsMenu');
	const btn = document.getElementById('settingsBtn');
	if (!menu || !btn) return;
	if (!menu.classList.contains('open')) return;
	if (ev.target === menu || menu.contains(ev.target) || ev.target === btn)
		return;
	menu.classList.remove('open');
});

let toastTimeout = null;
function showToast(message, ms = 2200) {
	const el = document.getElementById('toast');
	if (!el) return;
	el.textContent = message;
	el.classList.remove('hidden');

	void el.offsetWidth;
	el.classList.add('show');

	if (toastTimeout) clearTimeout(toastTimeout);
	toastTimeout = setTimeout(() => {
		el.classList.remove('show');

		setTimeout(() => el.classList.add('hidden'), 220);
		toastTimeout = null;
	}, ms);
}

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
