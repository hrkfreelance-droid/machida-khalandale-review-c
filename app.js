const GOOGLE_REVIEW_URL = 'https://www.google.com/maps/place//data=!4m3!3m2!1s0x310951fe29423461:0x7c290418fc34a478!12e1';
const LANGUAGE_STORAGE_KEY = 'machida-review-language';
const SUPPORTED_LANGUAGES = ['km', 'en', 'zh-CN'];
const state = {
  language: loadLanguage(),
  selections: {},
  ratings: { overall: 0, food: 0, service: 0, atmosphere: 0 },
  overall: 0,
  photos: []
};
const screens = ['basic', 'feedback', 'complete'];
const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
let isSubmitting = false;

function loadLanguage() {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : 'km';
  } catch { return 'km'; }
}
function t(key) { return translationValue(state.language, key); }
function formatMessage(key, values = {}) {
  return Object.entries(values).reduce((message, [name, value]) => message.replaceAll('{' + name + '}', value), t(key));
}
function persistLanguage() {
  try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language); } catch { /* optional browser storage */ }
}

function applyLanguage() {
  document.documentElement.lang = state.language;
  document.title = t('meta.title');
  document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => { element.placeholder = t(element.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-aria]').forEach(element => { element.setAttribute('aria-label', t(element.dataset.i18nAria)); });
  document.querySelectorAll('.language-button').forEach(button => {
    const active = button.dataset.language === state.language;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('.star').forEach((button, index) => {
    const number = (index % 5) + 1;
    button.setAttribute('aria-label', number + ' ' + t('action.star') + (number === 1 ? '' : state.language === 'en' ? 's' : ''));
  });
  if (!state.overall) document.querySelector('#overallHint').textContent = t('action.selectRating');
  renderPhotoPreviews();
}

document.querySelectorAll('.language-button').forEach(button => button.addEventListener('click', () => {
  state.language = button.dataset.language;
  persistLanguage();
  applyLanguage();
}));

function showScreen(name) {
  screens.forEach(screen => { document.querySelector('#screen-' + screen).hidden = screen !== name; });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.chip[data-group]').forEach(button => button.addEventListener('click', () => {
  const group = button.dataset.group;
  document.querySelectorAll('[data-group="' + group + '"]').forEach(item => item.classList.remove('is-selected'));
  button.classList.add('is-selected');
  state.selections[group] = button.dataset.value || button.textContent.trim();
  const validation = document.querySelector('#basicValidation');
  if (validation) validation.textContent = '';
}));

document.querySelectorAll('.detail-chip,.multi-chip').forEach(button => button.addEventListener('click', () => {
  if (button.classList.contains('multi-chip')) button.classList.toggle('is-selected');
  else {
    button.parentElement.querySelectorAll('.detail-chip').forEach(item => item.classList.remove('is-selected'));
    button.classList.add('is-selected');
  }
}));

function stars(container, changeOverall = false) {
  for (let i = 1; i <= 5; i += 1) {
    const button = document.createElement('button');
    button.className = 'star';
    button.type = 'button';
    button.textContent = '☆';
    button.addEventListener('click', () => {
      container.querySelectorAll('.star').forEach((item, index) => {
        item.classList.toggle('is-selected', index < i);
        item.textContent = index < i ? '★' : '☆';
      });
      const ratingKey = container.dataset.rating;
      state.ratings[ratingKey] = i;
      if (changeOverall) {
        state.overall = i;
        document.querySelector('#overallHint').textContent = i + ' / 5';
        document.querySelector('#submitBasic').disabled = false;
      }
      applyLanguage();
    });
    container.appendChild(button);
  }
}
stars(document.querySelector('.overall-stars'), true);
document.querySelectorAll('.detail-stars').forEach(container => stars(container));

function summaryStars(rating) { return '★'.repeat(rating) + '☆'.repeat(5 - rating); }
function hasBasicSelections() { return ['partySize', 'visitFrequency', 'visitType', 'ageGroup', 'gender'].every(key => state.selections[key]); }
function selectedValue(container) { return container?.querySelector('.is-selected')?.dataset.value || null; }
function selectedValues(container) { return [...(container?.querySelectorAll('.is-selected') || [])].map(item => item.dataset.value || item.textContent.trim()); }
function textValue(selector) { return document.querySelector(selector)?.value.trim() || null; }
function ratingValue(key) { return state.ratings[key] || null; }

function buildFeedbackPayload() {
  const cardValue = key => selectedValue(document.querySelector('[data-payload-field="' + key + '"]'));
  const cardValues = key => selectedValues(document.querySelector('[data-payload-field="' + key + '"]'));
  const parkingPanel = document.querySelector('[data-question-key="parking"] .accordion-panel');
  const parkingGroups = parkingPanel?.querySelectorAll('.chip-grid') || [];
  const accessibilityPanel = document.querySelector('[data-question-key="wheelchair-accessibility"] .accordion-panel');
  return {
    restaurant: { id: '0x310951fe29423461:0x7c290418fc34a478', name: 'Machida Shoten Japanese Ramen', location: 'Khalandale Mall' },
    visit: {
      partySize: state.selections.partySize || null,
      visitFrequency: state.selections.visitFrequency || null,
      diningWith: state.selections.visitType || null,
      ageGroup: state.selections.ageGroup || null,
      gender: state.selections.gender || null
    },
    rating: { overall: ratingValue('overall'), food: ratingValue('food'), service: ratingValue('service'), atmosphere: ratingValue('atmosphere') },
    review: { comment: textValue('#comment'), mealType: cardValue('mealType'), spendPerPerson: cardValue('spendPerPerson'), suitableGroupSizes: cardValues('suitableGroupSizes'), noiseLevel: cardValue('noiseLevel') },
    details: {
      vegetarianOptions: textValue('[data-question-key="vegetarian-options"] textarea'),
      dietaryRestrictions: textValue('[data-question-key="dietary-restrictions"] textarea'),
      parking: { difficulty: selectedValue(parkingGroups[0]), options: selectedValues(parkingGroups[1]), comment: textValue('[data-question-key="parking"] textarea') },
      kidFriendliness: textValue('[data-question-key="kid-friendliness"] textarea'),
      accessibility: { options: selectedValues(accessibilityPanel), comment: textValue('[data-question-key="wheelchair-accessibility"] textarea') }
    },
    meta: { submittedAt: new Date().toISOString(), userAgent: navigator.userAgent, language: state.language }
  };
}

const photoInput = document.querySelector('#photoInput');
const photoButton = document.querySelector('#photoButton');
const photoPreview = document.querySelector('#photoPreview');
const photoError = document.querySelector('#photoError');
const photoCount = document.querySelector('#photoCount');
let photoErrorItems = [];
function photoKey(file) { return file.name + ':' + file.size; }
function renderPhotoPreviews() {
  photoPreview.replaceChildren();
  state.photos.forEach((photo, index) => {
    const wrapper = document.createElement('div'); wrapper.className = 'photo-thumb';
    const image = document.createElement('img'); image.src = photo.url; image.alt = photo.file.name;
    const remove = document.createElement('button'); remove.className = 'photo-remove'; remove.type = 'button'; remove.textContent = '×';
    remove.setAttribute('aria-label', formatMessage('errors.remove', { name: photo.file.name }));
    remove.addEventListener('click', () => { const [removed] = state.photos.splice(index, 1); if (removed) URL.revokeObjectURL(removed.url); renderPhotoPreviews(); });
    wrapper.append(image, remove); photoPreview.append(wrapper);
  });
  photoError.textContent = photoErrorItems.map(item => formatMessage(item.key, item.values)).join(' ');
  photoCount.textContent = state.photos.length ? formatMessage('errors.photoCount', { count: state.photos.length, max: MAX_PHOTOS }) : '';
}
function addPhotos(files) {
  photoErrorItems = [];
  [...files].forEach(file => {
    if (state.photos.length >= MAX_PHOTOS) { photoErrorItems.push({ key: 'errors.maxPhotos', values: { count: MAX_PHOTOS } }); return; }
    if (!file.type.startsWith('image/')) { photoErrorItems.push({ key: 'errors.imagesOnly', values: { name: file.name } }); return; }
    if (file.size > MAX_PHOTO_BYTES) { photoErrorItems.push({ key: 'errors.maxSize', values: { name: file.name } }); return; }
    if (state.photos.some(photo => photo.key === photoKey(file))) { photoErrorItems.push({ key: 'errors.duplicate', values: { name: file.name } }); return; }
    state.photos.push({ file, key: photoKey(file), url: URL.createObjectURL(file) });
  });
  photoInput.value = ''; renderPhotoPreviews();
}
photoButton.addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', event => addPhotos(event.target.files));
function releasePhotos() { state.photos.forEach(photo => URL.revokeObjectURL(photo.url)); state.photos = []; photoErrorItems = []; renderPhotoPreviews(); }
window.addEventListener('beforeunload', () => state.photos.forEach(photo => URL.revokeObjectURL(photo.url)));

document.querySelector('#submitBasic').addEventListener('click', () => {
  if (!hasBasicSelections()) {
    const validation = document.querySelector('#basicValidation');
    if (validation) validation.textContent = t('errors.completeQuestions');
    const firstMissing = [...document.querySelectorAll('[data-required-group]')].find(group => !group.querySelector('.is-selected'));
    firstMissing?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
  }
  if (state.overall >= 4) window.location.assign(GOOGLE_REVIEW_URL);
  else { document.querySelector('#selectedOverall').textContent = summaryStars(state.overall); document.querySelector('#submissionStatus').textContent = ''; showScreen('feedback'); }
});
document.querySelector('#cancelFeedback').addEventListener('click', () => showScreen('basic'));
document.querySelector('#cancelFeedbackBottom').addEventListener('click', () => showScreen('basic'));

async function handlePost() {
  if (isSubmitting) return;
  isSubmitting = true;
  const postButton = document.querySelector('#postFeedback'); const status = document.querySelector('#submissionStatus');
  postButton.disabled = true; status.className = 'submission-status'; status.textContent = t('action.sending');
  try {
    await submitFeedback(buildFeedbackPayload(), state.photos.map(photo => photo.file));
    status.className = 'submission-status is-success'; status.textContent = t('action.sent'); releasePhotos(); showScreen('complete');
  } catch (error) {
    console.error('[feedback] submission failed', { message: error.message });
    status.className = 'submission-status is-error'; status.textContent = t('action.retry'); postButton.disabled = false; isSubmitting = false;
  }
}
document.querySelector('#postFeedback').addEventListener('click', handlePost);
document.querySelectorAll('.accordion-trigger').forEach(trigger => trigger.addEventListener('click', () => {
  const row = trigger.closest('.accordion'); const panel = row.querySelector('.accordion-panel'); const isOpen = row.classList.toggle('is-open');
  trigger.setAttribute('aria-expanded', String(isOpen)); panel.hidden = !isOpen;
}));

applyLanguage();
window.buildFeedbackPayload = buildFeedbackPayload;
