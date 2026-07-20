import { collection, getDocs, query, where, documentId } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface SireCollectionDocument {
  id: string
  Chapter?: string
  Level3Number?: number | string
  Subchapter?: string
  Shortquestion?: string
  [key: string]: unknown
}

export const sireCollectionRepository = {
  async getByLevel3Number(
    level3Number: string
  ): Promise<SireCollectionDocument | null> {
    const normalizedNumber = level3Number.trim()
    const numericNumber = Number(normalizedNumber)
    const values: Array<string | number> = [normalizedNumber]

    if (Number.isFinite(numericNumber)) {
      values.push(numericNumber)
    }

    const q = query(
      collection(db, 'sire_collection'),
      where('Level3Number', 'in', [...new Set(values)])
    )
    const querySnapshot = await getDocs(q)
    const matchingDocument = querySnapshot.docs[0]

    if (!matchingDocument) return null

    return {
      id: matchingDocument.id,
      ...matchingDocument.data(),
    }
  },

  async getByChapter(chapter: string): Promise<SireCollectionDocument[]> {
    const q = query(
      collection(db, 'sire_collection'),
      where('Chapter', '==', chapter)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  },

  async getByIds(ids: string[]): Promise<SireCollectionDocument[]> {
    if (ids.length === 0) return []

    // Firestore 'in' queries support up to 30 values
    const batches: string[][] = []
    for (let i = 0; i < ids.length; i += 30) {
      batches.push(ids.slice(i, i + 30))
    }

    const results = await Promise.all(
      batches.map((batch) => {
        const q = query(
          collection(db, 'sire_collection'),
          where(documentId(), 'in', batch)
        )
        return getDocs(q)
      })
    )

    return results.flatMap((snapshot) =>
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    )
  },

  async getUniqueChapters(): Promise<string[]> {
    const querySnapshot = await getDocs(collection(db, 'sire_collection'))
    const chapters = new Set<string>()
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.Chapter && typeof data.Chapter === 'string') {
        chapters.add(data.Chapter)
      }
    })
    return Array.from(chapters).sort()
  },
}
