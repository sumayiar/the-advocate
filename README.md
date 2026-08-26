# The Advocate

A static editorial website, ready to publish with GitHub Pages. It has no build step or package dependencies.

## Migrated archive

The site includes the complete public export from `gcadvocate.com`: 474 posts, 3 standalone pages, 37 categories, 82 tags, and 289 public comments. `data/catalog.json` is the fast browse index; the original article bodies and comments are split into `data/articles/<year>.json` and load only when a reader opens an article.

## Publish

1. Create a GitHub repository and push these files.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select `main` (or your publishing branch) and the `/ (root)` folder, then save.

GitHub will publish `index.html` automatically. No build step is needed.
