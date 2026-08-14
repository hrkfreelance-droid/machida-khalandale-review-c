# MACHIDA SHOTEN Khalandale Mall — Version C

This is an internal review prototype. Page 1 collects five customer attributes and an overall rating. Ratings 1–3 open the private store feedback flow; ratings 4–5 navigate directly to the existing Google review URL.

The interface supports Khmer (`km`), English (`en`), and Simplified Chinese (`zh-CN`). Khmer is the default language for a first visit. Translation strings are maintained in `translations.js`, while submission values remain language-independent.

## Local preview

```bash
python3 -m http.server 4178
```

Open `http://127.0.0.1:4178/` in a browser.
