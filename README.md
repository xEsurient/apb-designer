# APB Localization Designer

A web-based localization editor and color tool for APB: Reloaded. Built to run entirely in the browser as a static site hosted on GitHub Pages.

## Features

- **Localization Editor**: Load and edit `.txt` files directly in the browser, complete with syntax highlighting and color tag parsing.
- **Color Tools**: Convert between HEX and APB's unique RGBA format (0.0 to 1.0 scaling), and browse standard in-game `<col:TagName>` colors.
- **Rainbow Generator**: Generate dynamic per-character color gradients (either HSL full rainbow or linear interpolation between two colors) using APB's color tags.
- **Auto Data Sync**: Localization file templates are automatically generated from the APBDb REST API using GitHub Actions, ensuring zero client-side API requests.

## Setup & Development

[Vite](https://vitejs.dev/) with vanilla JavaScript.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## Credits

A huge thank you to the following community resources that made this tool possible:

- **[Speed](https://apbdb.com/)** — For maintaining the APBDb REST API, which provides the structured game data required to automatically generate accurate localization files.
- **[myami](https://myamai.neocities.org/apb/localization)** — For their comprehensive documentation on APB's custom color tags and localization syntax.
