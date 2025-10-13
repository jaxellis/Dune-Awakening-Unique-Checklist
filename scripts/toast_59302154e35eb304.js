let toastTimeout = null;

export function showToast(message, ms = 2200) {
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
