import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { SireCollectionDocument } from '@/lib/repositories/sireCollectionRepository'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 20,
    marginBottom: 24,
    color: '#0f172a',
  },
  item: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subchapter: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  question: {
    fontSize: 12,
    color: '#0f172a',
    lineHeight: 1.5,
  },
})

function sortQuestions(questions: SireCollectionDocument[]): SireCollectionDocument[] {
  return [...questions].sort((a, b) => {
    const subA = a.Subchapter || ''
    const subB = b.Subchapter || ''
    if (subA !== subB) return subA.localeCompare(subB)
    const numA = (a.Shortquestion || '').match(/^(\d+(?:\.\d+)*)/)?.[1] || ''
    const numB = (b.Shortquestion || '').match(/^(\d+(?:\.\d+)*)/)?.[1] || ''
    const partsA = numA.split('.').map(Number)
    const partsB = numB.split('.').map(Number)
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const pA = partsA[i] ?? 0
      const pB = partsB[i] ?? 0
      if (pA !== pB) return pA - pB
    }
    return 0
  })
}

interface ChapterPdfProps {
  chapter: string
  questions: SireCollectionDocument[]
}

export function ChapterPdf({ chapter, questions }: ChapterPdfProps) {
  const sortedQuestions = sortQuestions(questions)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Chapter {chapter}</Text>
        {sortedQuestions.map((q) => (
          <View key={q.id} style={styles.item}>
            <Text style={styles.subchapter}>
              Subchapter: {q.Subchapter || 'N/A'}
            </Text>
            <Text style={styles.question}>
              {q.Shortquestion || 'No short question available'}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  )
}