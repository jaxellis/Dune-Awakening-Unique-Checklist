import { IMAGE_PATH_PREFIX } from './constants_57559eec849b4e2f.js';

import {
	appSettings,
	checklistData,
	collapsedCategories,
	jsonData,
	saveToStorage,
	saveCollapsedCategories,
	saveSettings,
	loadCollapsedCategories,
	activeFilters,
	saveFilters,
} from './data_34f204dc7050c01b.js';

import {
	applyAllFilters,
	itemMatchesFilters,
	getTopLocations,
	normalizeKey,
	filterItems,
} from './filters_2d99b6fd3e4eadea.js';

import { pushUndoSnapshot } from './undoRedo_d56ca00e8a04ae79.js';

import { showToast } from './toast_59302154e35eb304.js';

export function showTopLocations() {
	const sidebar = document.getElementById('locationsSidebar');
	const locationsList = document.getElementById('locationsList');
	if (!sidebar || !locationsList) return;

	const results = getTopLocations();

	if (results.length === 0) {
		locationsList.innerHTML =
			'<p style="color: #b8b8b8; text-align: center;">All items are collected or have no locations.</p>';
	} else {
		locationsList.innerHTML = '';
		const listHeader = document.createElement('div');
		listHeader.className = 'location-list-header';
		listHeader.innerHTML =
			'<span class="location-name">Location Name</span><span class="location-count">Count</span>';
		locationsList.appendChild(listHeader);

		for (const { location, count } of results) {
			const locationItem = document.createElement('div');
			locationItem.className = 'location-item';

			const locationName = document.createElement('span');
			locationName.className = 'location-name';
			locationName.textContent = location;

			const itemCount = document.createElement('span');
			itemCount.className = 'location-count';
			itemCount.textContent = `${count}`;

			locationItem.appendChild(locationName);
			locationItem.appendChild(itemCount);
			locationsList.appendChild(locationItem);
		}
	}

	sidebar.classList.add('open');
	const openLocationsSidebarBtn = document.getElementById(
		'openLocationsSidebarBtn'
	);
	if (!openLocationsSidebarBtn) return;
	document.addEventListener('click', (event) => {
		if (
			!sidebar.contains(event.target) &&
			!openLocationsSidebarBtn.contains(event.target) &&
			sidebar.classList.contains('open')
		) {
			sidebar.classList.remove('open');
		}
	});
}

export function buildFiltersUI() {
	const filtersDiv = document.getElementById('filters');
	if (!filtersDiv) return;
	filtersDiv.innerHTML = '';

	const map = {};
	Object.values(jsonData.schematics)
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

export function updateStats() {
	const total = document.querySelectorAll('.item-checkbox').length;
	const checked = document.querySelectorAll('.item-checkbox:checked').length;
	const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

	const checkedCountEl = document.getElementById('checkedCount');
	const percentageEl = document.getElementById('percentage');
	if (checkedCountEl) checkedCountEl.textContent = checked;
	if (percentageEl) percentageEl.textContent = percentage;
}

export function applyHideCheckedSetting() {
	const items = Array.from(document.querySelectorAll('.item'));
	items.forEach((item) => {
		const checkbox = item.querySelector('.item-checkbox');
		if (!checkbox) return;

		if (appSettings.hideChecked && checkbox.checked) {
			item.classList.add('hidden-by-setting');
		} else {
			item.classList.remove('hidden-by-setting');
		}
	});

	const btn = document.getElementById('hideCheckedBtn');
	if (btn) {
		if (appSettings.hideChecked) btn.classList.add('active-setting');
		else btn.classList.remove('active-setting');
	}
}

export function toggleHideChecked() {
	appSettings.hideChecked = !appSettings.hideChecked;
	saveSettings();
	applyHideCheckedSetting();
	applyAllFilters();
	showToast(
		appSettings.hideChecked ? 'Hiding checked items' : 'Showing checked items'
	);
}

export function updateCategoryCount(categoryName) {
	const category = document.querySelector(`[data-category="${categoryName}"]`);
	if (category) {
		const checked = category.querySelectorAll('.item-checkbox:checked').length;
		const checkedSpan = category.querySelector('.category-checked');
		if (checkedSpan) checkedSpan.textContent = checked;
	}
}

export function updateItem(itemDiv, checked) {
	if (!itemDiv) return;
	if (checked) itemDiv.classList.add('checked');
	else itemDiv.classList.remove('checked');
}

export function toggleCategory(categoryDiv) {
	if (!categoryDiv) return;
	const name = categoryDiv.dataset.category;
	categoryDiv.classList.toggle('collapsed');
	categoryDiv.classList.contains('collapsed')
		? collapsedCategories.add(name)
		: collapsedCategories.delete(name);
	saveCollapsedCategories();
}

export function toggleAll(check) {
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

export function clearProgress() {
	if (confirm('Are you sure you want to reset all progress?')) {
		pushUndoSnapshot({ type: 'clear' });
		checklistData = {};
		toggleAll(false);
		saveToStorage();
		showToast('Progress reset');
	}
}

export function exportProgress() {
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

export function importProgress() {
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

export function initializeChecklist() {
	const categoriesDiv = document.getElementById('categories');
	if (!categoriesDiv) return;
	categoriesDiv.innerHTML = '';

	const humanName = (t) =>
		t && typeof t === 'string' ? t.charAt(0).toUpperCase() + t.slice(1) : t;

	let totalItems = 0;
	for (const [catKey, items] of Object.entries(jsonData.schematics)) {
		if (!Array.isArray(items) || items.length === 0) continue;
		totalItems += items.length;

		const categoryDiv = document.createElement('div');
		categoryDiv.className = 'category';
		categoryDiv.dataset.category = catKey;

		if (collapsedCategories.has(catKey)) {
			categoryDiv.classList.add('collapsed');
		}

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
				showTopLocations(); // Update location counts when an item is checked/unchecked
			};

			const img = document.createElement('img');
			img.loading = 'lazy';
			img.className = 'item-image';
			if (
				item.image &&
				typeof item.image === 'string' &&
				item.image.trim() !== ''
			) {
				img.src = IMAGE_PATH_PREFIX + item.image;
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
			if (item.url && typeof item.url === 'string' && item.url.trim() !== '') {
				nameHtml = `<a href="${item.url.trim()}" target="_blank" rel="noopener noreferrer">${itemName}</a>`;
			} else {
				nameHtml = itemName;
			}
			nameDiv.innerHTML = nameHtml;
			infoDiv.appendChild(nameDiv);

			const locationDiv = document.createElement('div');
			locationDiv.className = 'item-location';

			item.locationData = (item.location || []).map((locStr) => {
				const match = locStr.match(/<loc>(.*?)<\/loc>/);

				if (!match) {
					if (locStr.startsWith('NPC Camp')) {
						const [location, url, group] = locStr.split('|');
						return {
							location: 'NPC Camp',
							url: url,
							locationType: 'Camp',
							group: group,
							extraText: location.replace('NPC Camp', '').trim(),
						};
					}
					return {
						location: locStr.trim(),
						url: null,
						locationType: null,
						group: null,
						extraText: null,
					};
				}

				const locName = match[1].trim();
				const extraText = locStr.replace(match[0], '').trim();
				let found = null;
				let groupName = null;
				for (const group in jsonData.locations) {
					const arr = jsonData.locations[group];
					found = arr.find(
						(l) => l.location.trim().toLowerCase() === locName.toLowerCase()
					);
					if (found) {
						groupName = group;
						break;
					}
				}
				return {
					location: locName,
					url: found?.url || null,
					locationType: found?.locationType || null,
					group: groupName,
					extraText: extraText || null,
				};
			});

			item.locationData.forEach((loc) => {
				if (!loc) return;
				const { location, url, locationType, group, extraText } = loc;
				const locWrapper = document.createElement('div');
				locWrapper.className = 'item-location-entry';
				locWrapper.title = group || 'Unknown location';

				let iconSrc = null;
				let iconAlt = 'Location';
				if (locationType && jsonData.locationIcons) {
					const icon = Object.values(jsonData.locationIcons).find(
						(i) =>
							i.name &&
							i.name.trim().toLowerCase() === locationType.trim().toLowerCase()
					);
					if (icon && icon.image) {
						iconSrc = IMAGE_PATH_PREFIX + '/' + icon.image;
						iconAlt = icon.name;
					}
				}

				if (iconSrc) {
					const iconImg = document.createElement('img');
					iconImg.src = iconSrc;
					iconImg.alt = iconAlt;
					iconImg.className = 'location-icon';
					locWrapper.appendChild(iconImg);
				} else {
					const fallback = document.createElement('span');
					fallback.textContent = '📍';
					fallback.className = 'location-fallback';
					locWrapper.appendChild(fallback);
				}

				if (url) {
					const link = document.createElement('a');
					link.href = url;
					link.target = '_blank';
					link.rel = 'noopener noreferrer';
					link.textContent = location;
					locWrapper.appendChild(link);
				} else {
					const textNode = document.createTextNode(location);
					locWrapper.appendChild(textNode);
				}

				if (extraText) {
					const extraNode = document.createTextNode(` ${extraText}`);
					locWrapper.appendChild(extraNode);
				}

				locationDiv.appendChild(locWrapper);
			});

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

export function closeLocationsSidebar() {
	document.getElementById('locationsSidebar')?.classList.remove('open');
}

export function toggleSettings() {
	const menu = document.getElementById('settingsMenu');
	if (!menu) return;
	menu.classList.toggle('open');
}

export function updateCategoryVisibility() {
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
