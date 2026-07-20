import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface AppConfigDocument {
  chapters?: string[]
  [key: string]: unknown
}

export interface AppStatChapter {
  title: string
  entries: number
  subchapters: number
}

export interface AppStatDocument {
  id: string
  totalChapters: number
  totalEntries: number
  subchapters: number
  avgPerChapter: number
  chapters: AppStatChapter[]
}

export const metadataRepository = {
  async getAppConfig(): Promise<AppConfigDocument | null> {
    const docSnap = await getDoc(doc(db, 'metadata', 'app_config'))
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as AppConfigDocument
  },

  async getAppStat(): Promise<AppStatDocument | null> {
    const docSnap = await getDoc(doc(db, 'metadata', 'app_stat'))
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as AppStatDocument
  },

  async updateChapters(chapters: string[]): Promise<void> {
    await setDoc(doc(db, 'metadata', 'app_config'), { chapters }, { merge: true })
  },
}
