# Guitar Tab Reader

A Windows desktop app for saving and reading guitar tabs from Ultimate Guitar.

Import any free tab by URL. Tabs are stored locally with a PDF copy, displayed with chords highlighted above lyrics, and can be transposed on the fly.

---

## Installing (end users)

1. Go to the [Releases page](../../releases) and download `Guitar Tab Reader Setup x.x.x.exe` from the latest release
2. Run the installer — it will add the app to your Start Menu and desktop
3. Launch **Guitar Tab Reader**

No account or internet connection needed after import. All data is stored locally.

---

## Using the app

### Import a Tab

Paste a URL from [ultimate-guitar.com](https://www.ultimate-guitar.com) and click **Import**.

- Free tabs only — Pro tabs will show an error
- A PDF of the tab page is saved automatically alongside the structured data

**Bulk import:** Switch to the **Bulk** tab and paste one URL per line. The app checks for duplicates before scraping and skips any URLs already in your library, then processes the rest one by one with a live status list.

### My Library

All imported tabs are listed here. You can:

- **Search** by title or artist
- **Filter by key** — dropdown appears once you have tabs with key data
- **Filter by capo** — dropdown appears once you have tabs with capo data
- **Sort** by Title, Artist, or Date Added (click again to reverse)
- **Click any tab** to open it
- **Delete** a tab by hovering over it and clicking Delete (this also removes the PDF)

### Reading a Tab

Chords appear in orange above the lyrics. Section headers (Verse, Chorus, Bridge, etc.) are labelled in orange.

**Transpose:** Use the − and + buttons to shift all chords up or down by semitone. Toggle **Use flats** to prefer flat notation (Bb instead of A#). Click **Reset** to return to the original key.

**Open PDF:** Opens the saved PDF in your default PDF viewer.

---

## Building from source

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- npm v9 or later

### Install

```
npm install
```

Run this from the project root. It installs dependencies for all workspaces.

> **Note:** `better-sqlite3` is a native module. After install, if you see a SQLite error on first launch, run:
> ```
> cd windows
> npx electron-rebuild -f -w better-sqlite3
> ```

### Development

Double-click `dev.bat` (or run it from a terminal). This starts the Electron app with hot reload — changes to the renderer update instantly, changes to the main process require a restart.

### Production build

Double-click `build.bat`. This compiles the source and packages a Windows NSIS installer into `releases/`.

```
GuitarTabReader/
  dev.bat          ← development launcher
  build.bat        ← production build
  releases/        ← installer .exe output
  windows/         ← Electron app source
  shared/          ← shared TypeScript (types, transpose logic)
  ios/             ← Expo (React Native) companion app — see ios/README.md
```

---

## Notes

- Tabs are stored in `%APPDATA%\guitar-tab-reader\tabs.db` (SQLite)
- PDFs are stored in `%APPDATA%\guitar-tab-reader\pdfs\`
- The scraper opens a hidden browser window to load the UG page — this is normal and required to bypass Cloudflare. It closes automatically after import.
- Only tabs on free accounts are supported. Pro tabs cannot be imported.
