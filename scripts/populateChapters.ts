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

async function populateChapters() {
  console.log('Fetching documents from sire_collection...')

  const snapshot = await db.collection('sire_collection').get()
  const chaptersSet = new Set<string>()

  snapshot.docs.forEach((doc) => {
    const data = doc.data()
    if (data.Chapter && typeof data.Chapter === 'string') {
      chaptersSet.add(data.Chapter)
    }
  })

  const sortedChapters = Array.from(chaptersSet).sort()
  console.log(`Found ${sortedChapters.length} unique chapters.`)

  const chapters = sortedChapters

  await db.collection('metadata').doc('app_config').set(
    { chapters: chapters },
    { merge: true }
  )

  console.log('Successfully wrote chapters array to metadata/app_config.')
  console.log('Chapters:', JSON.stringify(chapters, null, 2))

  process.exit(0)
}

populateChapters().catch((error) => {
  console.error('Error populating chapters:', error)
  process.exit(1)
})