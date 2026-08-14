const GOOGLE_REVIEW_URL = 'https://www.google.com/maps/place//data=!4m3!3m2!1s0x310951fe29423461:0x7c290418fc34a478!12e1';
const state = {
  selections: {},
  ratings: { overall: 0, food: 0, service: 0, atmosphere: 0 },
  overall: 0,
  photos: []
};
const screens = ['basic', 'feedback', 'complete'];
const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
let isSubmitting = false;

function showScreen(name) {
  screens.forEach(screen => { document.querySelector('#screen-' + screen).hidden = screen !== name; });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.chip[data-group]').forEach(button => button.addEventListener('click', () => {
  const group = button.dataset.group;
  document.querySelectorAll('[data-group="' + group + '"]').forEach(item => item.classList.remove('is-selected'));
  button.classList.add('is-selected');
  state.selections[group] = button.textContent.trim();
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
    button.setAttribute('aria-label', i + ' star' + (i === 1 ? '' : 's'));
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
    });
    container.appendChild(button);
  }
}
stars(document.querySelector('.overall-stars'), true);
document.querySelectorAll('.detail-stars').forEach(container => stars(container));

function summaryStars(rating) { return '★'.repeat(rating) + '☆'.repeat(5 - rating); }
function hasBasicSelections() { return ['partySize', 'visitFrequency', 'visitType'].every(key => state.selections[key]); }
function selectedValue(container) { return container?.querySelector('.is-selected')?.textContent.trim() || null; }
function selectedValues(container) { return [...(container?.querySelectorAll('.is-selected') || [])].map(item => item.textContent.trim()); }
function textValue(selector) { return document.querySelector(selector)?.value.trim() || null; }
function ratingValue(key) { return state.ratings[key] || null; }

function buildFeedbackPayload() {
  const cardValue = key => selectedValue(document.querySelector('[data-payload-field="' + key + '"]'));
  const cardValues = key => selectedValues(document.querySelector('[data-payload-field="' + key + '"]'));
  const parkingPanel = document.querySelector('[data-question-key="parking"] .accordion-panel');
  const parkingGroups = parkingPanel?.querySelectorAll('.chip-grid') || [];
  const accessibilityPanel = document.querySelector('[data-question-key="wheelchair-accessibility"] .accordion-panel');

  return {
    restaurant: {
      id: '0x310951fe29423461:0x7c290418fc34a478',
      name: 'Machida Shoten Japanese Ramen',
      location: 'Khalandale Mall'
    },
    visit: {
      partySize: state.selections.partySize || null,
      visitFrequency: state.selections.visitFrequency || null,
      diningWith: state.selections.visitType || null
    },
    rating: {
      overall: ratingValue('overall'),
      food: ratingValue('food'),
      service: ratingValue('service'),
      atmosphere: ratingValue('atmosphere')
    },
    review: {
      comment: textValue('#comment'),
      mealType: cardValue('mealType'),
      spendPerPerson: cardValue('spendPerPerson'),
      suitableGroupSizes: cardValues('suitableGroupSizes'),
      noiseLevel: cardValue('noiseLevel')
    },
    details: {
      vegetarianOptions: textValue('[data-question-key="vegetarian-options"] textarea'),
      dietaryRestrictions: textValue('[data-question-key="dietary-restrictions"] textarea'),
      parking: {
        difficulty: selectedValue(parkingGroups[0]),
        options: selectedValues(parkingGroups[1]),
        comment: textValue('[data-question-key="parking"] textarea')
      },
      kidFriendliness: textValue('[data-question-key="kid-friendliness"] textarea'),
      accessibility: {
        options: selectedValues(accessibilityPanel),
        comment: textValue('[data-question-key="wheelchair-accessibility"] textarea')
      }
    },
    meta: {
      submittedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      language: document.documentElement.lang || navigator.language || null
    }
  };
}

const photoInput = document.querySelector('#photoInput');
const photoButton = document.querySelector('#photoButton');
const photoPreview = document.querySelector('#photoPreview');
const photoError = document.querySelector('#photoError');
const photoCount = document.querySelector('#photoCount');

function setPhotoError(message) { photoError.textContent = message; }
function photoKey(file) { return file.name + ':' + file.size; }

function renderPhotoPreviews() {
  photoPreview.replaceChildren();
  state.photos.forEach((photo, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'photo-thumb';
    const image = document.createElement('img');
    image.src = photo.url;
    image.alt = photo.file.name;
    const remove = document.createElement('button');
    remove.className = 'photo-remove';
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Remove ' + photo.file.name);
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      const [removed] = state.photos.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      renderPhotoPreviews();
    });
    wrapper.append(image, remove);
    photoPreview.append(wrapper);
  });
  photoCount.textContent = state.photos.length ? state.photos.length + ' / ' + MAX_PHOTOS + ' photos selected' : '';
}

function addPhotos(files) {
  const messages = [];
  [...files].forEach(file => {
    if (state.photos.length >= MAX_PHOTOS) { messages.push('You can add up to ' + MAX_PHOTOS + ' photos.'); return; }
    if (!file.type.startsWith('image/')) { messages.push(file.name + ': image files only.'); return; }
    if (file.size > MAX_PHOTO_BYTES) { messages.push(file.name + ': maximum size is 10 MB.'); return; }
    if (state.photos.some(photo => photo.key === photoKey(file))) { messages.push(file.name + ': already added.'); return; }
    state.photos.push({ file, key: photoKey(file), url: URL.createObjectURL(file) });
  });
  photoInput.value = '';
  setPhotoError(messages.join(' '));
  renderPhotoPreviews();
}

photoButton.addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', event => addPhotos(event.target.files));

function releasePhotos() {
  state.photos.forEach(photo => URL.revokeObjectURL(photo.url));
  state.photos = [];
  renderPhotoPreviews();
}
window.addEventListener('beforeunload', () => state.photos.forEach(photo => URL.revokeObjectURL(photo.url)));

document.querySelector('#submitBasic').addEventListener('click', () => {
  if (!hasBasicSelections()) {
    const firstMissing = [...document.querySelectorAll('[data-required-group]')].find(group => !group.querySelector('.is-selected'));
    firstMissing?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (state.overall >= 4) window.location.assign(GOOGLE_REVIEW_URL);
  else {
    document.querySelector('#selectedOverall').textContent = summaryStars(state.overall);
    document.querySelector('#submissionStatus').textContent = '';
    showScreen('feedback');
  }
});

document.querySelector('#cancelFeedback').addEventListener('click', () => showScreen('basic'));
document.querySelector('#cancelFeedbackBottom').addEventListener('click', () => showScreen('basic'));

async function handlePost() {
  if (isSubmitting) return;
  isSubmitting = true;
  const postButton = document.querySelector('#postFeedback');
  const status = document.querySelector('#submissionStatus');
  postButton.disabled = true;
  status.className = 'submission-status';
  status.textContent = 'Sending…';
  try {
    await submitFeedback(buildFeedbackPayload(), state.photos.map(photo => photo.file));
    status.className = 'submission-status is-success';
    status.textContent = 'Sent';
    releasePhotos();
    showScreen('complete');
  } catch (error) {
    console.error('[feedback] submission failed', { message: error.message });
    status.className = 'submission-status is-error';
    status.textContent = 'Could not send. Please try again.';
    postButton.disabled = false;
    isSubmitting = false;
  }
}
document.querySelector('#postFeedback').addEventListener('click', handlePost);

document.querySelectorAll('.accordion-trigger').forEach(trigger => trigger.addEventListener('click', () => {
  const row = trigger.closest('.accordion');
  const panel = row.querySelector('.accordion-panel');
  const isOpen = row.classList.toggle('is-open');
  trigger.setAttribute('aria-expanded', String(isOpen));
  panel.hidden = !isOpen;
}));

window.buildFeedbackPayload = buildFeedbackPayload;
