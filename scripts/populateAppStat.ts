import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const serviceAccountPath = path.resolve(__dirname, '..', 'servceAccountKey.json')
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'))

admin.initializeApp({
  credential: admin.cert(serviceAccount),
})

const db = getFirestore()

/** Sorts chapter labels by their leading integer, then alphabetically. */
function compareChapters(a: string, b: string): number {
  const numA = Number.parseInt(a, 10)
  const numB = Number.parseInt(b, 10)
  const hasNumA = !Number.isNaN(numA)
  const hasNumB = !Number.isNaN(numB)

  if (hasNumA && hasNumB && numA !== numB) return numA - numB
  if (hasNumA !== hasNumB) return hasNumA ? -1 : 1

  return a.localeCompare(b, undefined, { numeric: true })
}

async function populateAppStat() {
  console.log('Fetching all documents from sire_collection...')

  const snapshot = await db.collection('sire_collection').get()
  const totalEntries = snapshot.size
  console.log(`Total documents fetched: ${totalEntries}`)

  // Group documents by chapter
  const chapterMap = new Map<string, { entries: number; subchapters: Set<string> }>()

  snapshot.docs.forEach((doc) => {
    const data = doc.data()
    const chapter = data.Chapter
    if (!chapter || typeof chapter !== 'string') return

    if (!chapterMap.has(chapter)) {
      chapterMap.set(chapter, { entries: 0, subchapters: new Set() })
    }

    const entry = chapterMap.get(chapter)!
    entry.entries += 1

    const subchapter = data.Subchapter
    if (subchapter && typeof subchapter === 'string') {
      entry.subchapters.add(subchapter)
    }
  })

  // Build sorted chapters array
  const sortedChapterTitles = Array.from(chapterMap.keys()).sort(compareChapters)

  const chapters = sortedChapterTitles.map((title) => {
    const entry = chapterMap.get(title)!
    return {
      title,
      entries: entry.entries,
      subchapters: entry.subchapters.size,
    }
  })

  const totalChapters = chapters.length
  const totalSubchapters = chapters.reduce((sum, ch) => sum + ch.subchapters, 0)
  const avgPerChapter = totalChapters > 0 ? Math.round(totalEntries / totalChapters) : 0

  const appStatData = {
    totalChapters,
    totalEntries,
    subchapters: totalSubchapters,
    avgPerChapter,
    chapters,
  }

  console.log('\nComputed app_stat data:')
  console.log(JSON.stringify(appStatData, null, 2))

  // Write to Firestore
  await db.collection('metadata').doc('app_stat').set(appStatData)

  console.log('\nSuccessfully wrote app_stat document to metadata/app_stat.')
  process.exit(0)
}

populateAppStat().catch((error) => {
  console.error('Error populating app_stat:', error)
  process.exit(1)
})