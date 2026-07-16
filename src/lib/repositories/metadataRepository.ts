import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface AppConfigDocument {
  chapters?: string[]
  [key: string]: unknown
}

export const metadataRepository = {
  async getAppConfig(): Promise<AppConfigDocument | null> {
    const docSnap = await getDoc(doc(db, 'metadata', 'app_config'))
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as AppConfigDocument
  },

  async updateChapters(chapters: string[]): Promise<void> {
    await setDoc(doc(db, 'metadata', 'app_config'), { chapters }, { merge: true })
  },
}