# Guitar Tab Reader (Mobile)

An Expo (React Native) companion app for reading your Guitar Tab Reader library on your phone. It connects to the same library you manage in the Windows app via a synced GitHub repo.

---

## Setup

1. In the Windows app, open **Settings → Phone Sync (GitHub Repo)**, follow the one-time setup steps there, then click **Sync Now**.
2. Copy the **Library URL** and **Passphrase** shown below the Sync button.
3. Open this app and paste both into the setup screen, then tap **Connect Library**.

The library is fetched and decrypted on-device. Pull to refresh on the library screen to re-sync after future changes.

---

## Development

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- [Expo Go](https://expo.dev/go) installed on your phone

### Install

```
npm install
```

### Run

Double-click `start.bat` (Windows) or run `./start.sh` (Mac/Linux), or:

```
npx expo start
```

Scan the QR code with Expo Go to load the app on your phone.

---

## Notes

- The library URL points to an encrypted `library.enc` file in your GitHub repo; the passphrase decrypts it on-device. Nothing is stored unencrypted remotely.
- Until a library is connected, the app falls back to an empty bundled library (`src/data/library.json`).
