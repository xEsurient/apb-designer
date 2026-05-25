# APB Localization Designer

A web-based localization editor and color tool for APB: Reloaded. Built to run entirely in the browser as a static site hosted on GitHub Pages.

## Features

- **Localization Editor**: Load and edit `.txt` files directly in the browser, complete with syntax highlighting and color tag parsing.
- **Color Tools**: Convert between HEX and APB's unique RGBA format (0.0 to 1.0 scaling), and browse standard in-game `<col:TagName>` colors.
- **Rainbow Generator**: Generate dynamic per-character color gradients (either HSL full rainbow or linear interpolation between two colors) using APB's color tags.
- **Auto Data Sync**: Localization file templates are automatically generated from the APBDb REST API using GitHub Actions, ensuring zero client-side API requests.

## Credits
- **[Speed](https://apbdb.com/)** — APBDB (Provides the required data for the changes)
- **[myami](https://myamai.neocities.org/apb/localization)** — Documentation on APB's custom color tags (HEX,RGB,etc)
