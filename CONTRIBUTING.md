# Contributing to API Hub

Thank you for helping keep this API directory alive! There are several ways to contribute.

## Reporting a Broken API

If you found an API that no longer works:

1. Go to **[Issues → New Issue](https://github.com/BEKO2210/API_directory/issues/new/choose)**
2. Select **"Report Broken API"**
3. Fill in the API name and what's wrong
4. Our automated workflow will process your report on the next run

## Suggesting a New API

Want to add a new free public API to the directory?

1. Go to **[Issues → New Issue](https://github.com/BEKO2210/API_directory/issues/new/choose)**
2. Select **"Submit New API"**
3. Fill in the required fields (name, URL, description, category, auth, HTTPS, CORS)
4. The API will be automatically added on the next workflow run if all fields are valid

## Direct Contributions via Pull Request

For more complex changes, you can submit a PR directly:

### Adding or Updating APIs

1. Fork this repository
2. Edit `src/data/community-apis.json`
3. Add your entry in the appropriate section:

```json
{
  "add": [
    {
      "name": "My API",
      "link": "https://api.example.com",
      "description": "What the API does",
      "category": "Development",
      "auth": "",
      "https": true,
      "cors": "yes"
    }
  ]
}
```

4. Submit a PR with a clear description

### Field Reference

| Field | Required | Values |
|-------|----------|--------|
| `name` | Yes | API name |
| `link` | Yes | URL to the API or its documentation |
| `description` | Yes | Short description of what it does |
| `category` | Yes | One of the existing categories (see website) |
| `auth` | Yes | `""` (none), `"apiKey"`, `"OAuth"`, `"X-Mashape-Key"`, `"User-Agent"` |
| `https` | Yes | `true` or `false` |
| `cors` | Yes | `"yes"`, `"no"`, or `"unknown"` |

### Website / Code Changes

1. Fork and clone the repository
2. `pnpm install` and `pnpm dev`
3. Make your changes
4. Run `pnpm build` to verify everything builds
5. Submit a PR

## Automated Processing

Issues created via the templates are automatically processed by our GitHub Actions workflow:

- **New API submissions**: Validated and added to `community-apis.json`, then merged into the dataset on the next build
- **Broken API reports**: Logged in `src/data/reported-issues.json` for review, and if marked for removal, processed automatically
- **Unprocessable issues**: Kept open for manual review

## Code of Conduct

Be respectful and constructive. This is a community project — we're all here to help developers find great APIs.
