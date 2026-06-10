import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { randomBytes } from 'crypto'

export interface Settings {
  syncPath: string | null
  githubToken: string | null
  repoOwner: string | null
  repoName: string | null
  repoBranch: string | null
  passphrase: string | null
  lastSyncedAt: string | null
}

const DEFAULTS: Settings = {
  syncPath: null,
  githubToken: null,
  repoOwner: null,
  repoName: null,
  repoBranch: 'main',
  passphrase: null,
  lastSyncedAt: null
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function generatePassphrase(): string {
  return randomBytes(18).toString('base64url')
}

export function loadSettings(): Settings {
  const p = settingsPath()
  let settings: Settings
  if (!existsSync(p)) {
    settings = { ...DEFAULTS }
  } else {
    try {
      const raw = JSON.parse(readFileSync(p, 'utf8'))
      // migrate old iCloudPath key
      if (raw.iCloudPath !== undefined && raw.syncPath === undefined) {
        raw.syncPath = raw.iCloudPath
      }
      settings = { ...DEFAULTS, ...raw }
    } catch {
      settings = { ...DEFAULTS }
    }
  }

  if (!settings.passphrase) {
    settings.passphrase = generatePassphrase()
    writeFileSync(p, JSON.stringify(settings, null, 2), 'utf8')
  }

  return settings
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const updated = { ...loadSettings(), ...patch }
  writeFileSync(settingsPath(), JSON.stringify(updated, null, 2), 'utf8')
  return updated
}

export function detectSyncPath(): string | null {
  const home = homedir()
  const candidates = [
    join(home, 'OneDrive'),
    join(home, 'OneDrive - Personal'),
    join(home, 'iCloud Drive'),
    join(home, 'iCloudDrive'),
  ]
  return candidates.find(p => existsSync(p)) ?? null
}
