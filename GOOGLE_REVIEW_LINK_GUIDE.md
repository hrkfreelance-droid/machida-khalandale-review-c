# Google Review Link Guide

## 1. Purpose

This guide helps the IT team:

- Find a Google review submission link.
- Confirm that the link points to the correct restaurant and branch.
- Add a new restaurant safely.
- Replace a link when it stops working or points to the wrong listing.

This document separates the links currently confirmed for this project from the recommended API-based approach for a future production system.

## 2. Get a Link from Google Business Profile

Use this method when the restaurant's Google Business Profile can be managed:

1. Open the restaurant's Google Business Profile.
2. Open **Reviews** or **Read reviews**.
3. Select **Get more reviews**.
4. Copy the review link.
5. Test the link on desktop and on a real mobile device before using it.

Always confirm the restaurant name, branch, and address before copying the link into project configuration.

## 3. When Business Profile Access Is Not Available

Use the Google Place ID to identify the listing precisely.

- Do not identify a location by restaurant name alone.
- Confirm the full address and branch location.
- Do not confuse another branch of the same brand with the target restaurant.
- Store the verified Place ID together with the restaurant configuration.

The Place ID should be treated as the stable location identifier used to verify the listing and generate a review link.

## 4. Recommended Production Approach

For a future production system, use the Google Places API and obtain:

`googleMapsLinks.writeAReviewUri`

Recommended flow:

```text
Restaurant / Google Maps URL
  -> Identify the Place ID
  -> Retrieve Place Details
  -> Obtain googleMapsLinks.writeAReviewUri
  -> Store it in the database or application configuration
  -> Use it for the Google Review button
```

The Places API is not implemented in the current prototype. This section is a future recommendation only.

## 5. Current Project Reference: Manually Confirmed Links

The following three links are current project references and were manually confirmed for use by the IT team. They are intentionally kept separate from the future API-based approach above.

### Khalandale Mall

Place ID:

`ChIJYTRCKf5RCTEReKQ0_BgEKXw`

Direct Review URL:

`https://search.google.com/local/writereview?placeid=ChIJYTRCKf5RCTEReKQ0_BgEKXw`

### BKK1

Place ID:

`ChIJkQCdDOBRCTERgMzwbgSuFF0`

Direct Review URL:

`https://search.google.com/local/writereview?placeid=ChIJkQCdDOBRCTERgMzwbgSuFF0`

### Sorya Mall

Place ID:

`ChIJzSKJ7odRCTERYEm98a1EY-s`

Direct Review URL:

`https://search.google.com/local/writereview?placeid=ChIJzSKJ7odRCTERYEm98a1EY-s`

Important: do not replace the current application URL automatically with these references. The current application code remains unchanged by this guide.

## 6. Link Verification Checklist

Before registering a new URL or replacing an existing one, verify:

- Correct restaurant name.
- Correct branch and location.
- Correct address and map listing.
- Review form opens successfully.
- A different branch is not displayed.
- Desktop browser behavior.
- iPhone Safari behavior.
- Android Chrome behavior, if available.
- Logged-in and logged-out behavior where practical.
- The link still opens after a fresh browser session.

Record the test date, tester, device, browser, and confirmed Place ID when maintaining a production configuration.

## 7. iPhone and Universal Link Behavior

Google Maps URLs may be handled as iOS Universal Links. Depending on the device and installed apps, an iPhone may open the Google Maps app instead of staying in Safari or another browser.

Frontend code cannot always fully control this operating-system behavior. The final URL must therefore be tested on a real iPhone. Do not treat desktop browser testing as proof that the link will remain in the mobile browser.

## 8. Data Required for a New Restaurant

At minimum, maintain the following configuration fields for each restaurant:

- `restaurantName`
- `internalRestaurantId`
- `googleMapsUrl`
- `googlePlaceId`
- `googleReviewUrl`

The preferred future structure is one where adding a restaurant only requires adding these configuration values, without changing the UI or review-flow logic.

## 9. Maintenance

Review and update the configuration when:

- The restaurant moves to a new location.
- The Google listing changes.
- Listings are merged.
- The review URL stops working.
- The link opens the wrong restaurant or branch.

Update procedure:

1. Confirm the correct Google listing.
2. Reconfirm the Place ID and address.
3. Obtain a new review URL.
4. Test it on desktop and real mobile devices.
5. Update only the configuration or database value.

Do not modify unrelated UI or review-flow code during link maintenance.

## 10. Security

Never store any of the following for Google review links:

- Google account passwords.
- Gmail passwords.
- Google Business Profile passwords.
- API secrets in frontend code.
- Private tokens.
- Credentials.

A Google review link does not require storing the restaurant's Google account password. Keep credentials and API secrets on the appropriate secured backend or secret-management system.
