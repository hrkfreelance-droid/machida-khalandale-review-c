# MACHIDA SHOTEN Khalandale Mall Review Prototype

## Current status

This is a static HTML/CSS/JavaScript prototype for internal review. The current GitHub Pages site is:

https://hrkfreelance-droid.github.io/machida-khalandale-review-c/

Completed in the frontend:

- Page 1 visit questions and existing screen transitions
- Overall, Food, Service, and Atmosphere ratings
- Existing Google review route
- Review modal with fixed Header/Footer and scrollable Body
- Restaurant detail questions and accordion controls
- Photo selection, preview, individual deletion, duplicate prevention, and validation
- Feedback payload generation
- ```multipart/form-data``` construction
- Submission Adapter with Mock mode
- GitHub Pages static hosting

## Backend is not connected

The prototype does not connect to a database, email service, Google API, or production API.

No credentials, passwords, private tokens, database URLs, or SMTP settings belong in this repository.

The production architecture should be:

```text
Browser
  -> HTTPS Company API
    -> Company backend
      -> Database
      -> Optional email notification
```

The browser must never connect directly to the database or send SMTP mail.

## IT connection point

Edit this one constant in ```submission.js```:

```js
const SUBMISSION_ENDPOINT = '';
```

Set it to the company HTTPS API endpoint. When it is empty, the prototype uses Mock mode. When it is set, ```submitFeedback(payload, photos)``` sends a ```POST``` request to that endpoint.

The adapter is intentionally isolated in ```submission.js```:

- ```buildSubmissionFormData(payload, photos)```
- ```submitFeedback(payload, photos)```

The UI calls only ```submitFeedback```. The frontend does not contain database or email implementation details.

## Request format

The request is ```multipart/form-data```. Do not manually set the ```Content-Type``` header; the browser adds the multipart boundary.

Parts:

- ```payload```: JSON Blob named ```payload.json```
- ```photos[]```: zero to five image ```File``` objects

Current payload shape:

```json
{
  "restaurant": {
    "id": "0x310951fe29423461:0x7c290418fc34a478",
    "name": "Machida Shoten Japanese Ramen",
    "location": "Khalandale Mall"
  },
  "visit": {
    "partySize": "1 person",
    "visitFrequency": "First time",
    "diningWith": "On my own"
  },
  "rating": {
    "overall": 1,
    "food": null,
    "service": null,
    "atmosphere": null
  },
  "review": {
    "comment": null,
    "mealType": null,
    "spendPerPerson": null,
    "suitableGroupSizes": [],
    "noiseLevel": null
  },
  "details": {
    "vegetarianOptions": null,
    "dietaryRestrictions": null,
    "parking": {
      "difficulty": null,
      "options": [],
      "comment": null
    },
    "kidFriendliness": null,
    "accessibility": {
      "options": [],
      "comment": null
    }
  },
  "meta": {
    "submittedAt": "ISO-8601 timestamp",
    "userAgent": "browser user agent",
    "language": "en"
  }
}
```

Optional unanswered text values are ```null```; multi-select values are ```[]```.

## Response and errors

Recommended success response:

```json
{
  "ok": true,
  "id": "server-generated-id"
}
```

Any non-2xx response is treated as a submission failure. The prototype keeps the entered values and re-enables ```Post``` so the user can retry.

## Photo rules

- ```accept="image/*"```
- Multiple selection enabled
- Maximum 5 photos
- Maximum 10 MB per file
- File/Blob URL previews only
- No Base64 conversion
- No localStorage persistence
- Object URLs are revoked when photos are deleted, submitted successfully, or the page unloads

## Recommended IT checklist

1. Create the HTTPS API endpoint.
2. Configure CORS for the GitHub Pages origin.
3. Add authentication or abuse protection on the backend as appropriate.
4. Validate all payload fields and uploaded file types/sizes server-side.
5. Store files outside the frontend and generate server-side identifiers.
6. Add database persistence and optional email notification in the backend.
7. Replace ```SUBMISSION_ENDPOINT``` in ```submission.js```.
8. Test success, validation failure, network failure, and retry behavior.
