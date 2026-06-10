import { join } from 'path'
import { writeFileSync, mkdirSync } from 'fs'
import { getAllTabs } from './db'
import { encryptLibrary } from './crypto'

function buildLibraryJson(): { exportedAt: string; json: string } {
  const tabs = getAllTabs()
  const exportedAt = new Date().toISOString()

  const data = {
    exportedAt,
    version: 1,
    tabs: tabs.map(t => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      type: t.type,
      url: t.url,
      content: t.content,
      chords: t.chords,
      key: t.key,
      capo: t.capo,
      tuning: t.tuning,
      addedAt: t.added_at
    }))
  }

  return { exportedAt, json: JSON.stringify(data, null, 2) }
}

export function exportLibraryJson(syncPath: string): string {
  const { exportedAt, json } = buildLibraryJson()
  mkdirSync(syncPath, { recursive: true })
  writeFileSync(join(syncPath, 'library.json'), json, 'utf8')
  return exportedAt
}

export async function syncToRepoFile(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  passphrase: string
): Promise<string> {
  const { exportedAt, json } = buildLibraryJson()
  const encrypted = encryptLibrary(json, passphrase)

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/library.enc`
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'GuitarTabReader'
  }

  let sha: string | undefined
  const getRes = await fetch(`${apiUrl}?ref=${branch}`, { headers })
  if (getRes.ok) {
    sha = ((await getRes.json()) as { sha: string }).sha
  } else if (getRes.status !== 404) {
    const text = await getRes.text()
    throw new Error(`GitHub error ${getRes.status}: ${text.slice(0, 200)}`)
  }

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Sync library — ${exportedAt}`,
      content: Buffer.from(encrypted, 'utf8').toString('base64'),
      branch,
      ...(sha ? { sha } : {})
    })
  })

  if (!putRes.ok) {
    const text = await putRes.text()
    throw new Error(`GitHub error ${putRes.status}: ${text.slice(0, 200)}`)
  }

  return exportedAt
}
