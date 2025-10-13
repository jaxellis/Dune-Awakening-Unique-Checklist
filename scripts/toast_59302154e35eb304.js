let toastTimer = null;
let fadeTimer = null;

export function showToast(message, ms = 2200) {
	const el = document.getElementById('toast');
	if (!el) return;

	clearTimeout(toastTimer);
	clearTimeout(fadeTimer);

	el.textContent = message ?? '';
	el.classList.remove('hidden');
	void el.offsetWidth;
	el.classList.add('show');

	toastTimer = setTimeout(() => {
		el.classList.remove('show');
		fadeTimer = setTimeout(() => el.classList.add('hidden'), 220);
	}, ms);
}
