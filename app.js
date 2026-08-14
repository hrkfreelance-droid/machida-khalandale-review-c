const GOOGLE_REVIEW_URL = 'https://www.google.com/search?hl=en&q=MACHIDA+SHOTEN+Khalandale+Mall&ludocid=8946686640105235576#lrd=0x310951fe29423461:0x7c290418fc34a478,3,,,';
const state = { selections: {}, overall: 0 };
const screens = ['basic', 'feedback', 'complete'];

function showScreen(name) {
  screens.forEach(screen => { const element = document.querySelector(`#screen-${screen}`); const keepBasicBehindFeedback = name === 'feedback' && screen === 'basic'; element.hidden = screen !== name && !keepBasicBehindFeedback; });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.chip[data-group]').forEach(button => button.addEventListener('click', () => {
  const group = button.dataset.group;
  document.querySelectorAll(`[data-group="${group}"]`).forEach(item => item.classList.remove('is-selected'));
  button.classList.add('is-selected');
  state.selections[group] = button.textContent;
}));

document.querySelectorAll('.detail-chip,.multi-chip').forEach(button => button.addEventListener('click', () => {
  if (button.classList.contains('multi-chip')) button.classList.toggle('is-selected');
  else { button.parentElement.querySelectorAll('.detail-chip').forEach(item => item.classList.remove('is-selected')); button.classList.add('is-selected'); }
}));

function stars(container, changeOverall = false) {
  for (let i = 1; i <= 5; i += 1) {
    const button = document.createElement('button'); button.className = 'star'; button.type = 'button'; button.textContent = '☆'; button.setAttribute('aria-label', `${i} star${i === 1 ? '' : 's'}`);
    button.addEventListener('click', () => { container.querySelectorAll('.star').forEach((item, index) => { item.classList.toggle('is-selected', index < i); item.textContent = index < i ? '★' : '☆'; }); if (changeOverall) { state.overall = i; document.querySelector('#overallHint').textContent = `${i} / 5`; document.querySelector('#submitBasic').disabled = false; } });
    container.appendChild(button);
  }
}
stars(document.querySelector('.overall-stars'), true);
document.querySelectorAll('.detail-stars').forEach(container => stars(container));

function summaryStars(rating) { return '★'.repeat(rating) + '☆'.repeat(5 - rating); }
function hasBasicSelections() { return ['partySize', 'visitFrequency', 'visitType'].every(key => state.selections[key]); }

document.querySelector('#submitBasic').addEventListener('click', () => {
  if (!hasBasicSelections()) { const firstMissing = [...document.querySelectorAll('[data-required-group]')].find(group => !group.querySelector('.is-selected')); firstMissing?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  if (state.overall >= 4) window.location.href = GOOGLE_REVIEW_URL;
  else { document.querySelector('#selectedOverall').textContent = summaryStars(state.overall); showScreen('feedback'); }
});
document.querySelector('#cancelFeedback').addEventListener('click', () => showScreen('basic'));
document.querySelector('#cancelFeedbackBottom').addEventListener('click', () => showScreen('basic'));
document.querySelector('#postFeedback').addEventListener('click', () => showScreen('complete'));
document.querySelectorAll('.accordion').forEach(row => row.addEventListener('click', () => row.classList.toggle('is-open')));
