// IT handoff point: set this to the company's HTTPS API endpoint when ready.
const SUBMISSION_ENDPOINT = '';

function buildSubmissionFormData(payload, photos) {
  const formData = new FormData();
  formData.append('payload', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'payload.json');
  photos.forEach(photo => formData.append('photos[]', photo, photo.name));
  return formData;
}

async function mockSubmission(payload, photos) {
  buildSubmissionFormData(payload, photos);
  console.info('[feedback] mock submission prepared', { photoCount: photos.length, payloadSections: Object.keys(payload) });
  await new Promise(resolve => window.setTimeout(resolve, 350));
  return { ok: true, mode: 'mock' };
}

async function submitFeedback(payload, photos) {
  if (!SUBMISSION_ENDPOINT) return mockSubmission(payload, photos);

  const response = await fetch(SUBMISSION_ENDPOINT, {
    method: 'POST',
    body: buildSubmissionFormData(payload, photos)
  });
  if (!response.ok) throw new Error('Submission failed');
  return response.json();
}

window.buildSubmissionFormData = buildSubmissionFormData;
window.submitFeedback = submitFeedback;
