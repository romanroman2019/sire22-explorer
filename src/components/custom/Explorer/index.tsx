import { useEffect, useMemo, useRef, useState } from 'react'
import { useMetadata } from '@/hooks/useMetadata'
import { useSireCollection } from '@/hooks/useSireCollection'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { ChapterPdf } from './ChapterPdf'
import { compareChapters } from '@/lib/sortChapters'
import { cn } from '@/lib/utils'
import type { SireCollectionDocument } from '@/lib/repositories/sireCollectionRepository'

type QuestionTypeFilter = 'all' | 'core' | 'rotational-1' | 'rotational-2'

const QUESTION_TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'core', label: 'Core' },
  { value: 'rotational-1', label: 'Rotational 1' },
  { value: 'rotational-2', label: 'Rotational 2' },
] satisfies Array<{ value: QuestionTypeFilter; label: string }>

const VESSEL_TYPE_FIELDS = ['Oil', 'Chemical', 'LNG', 'LPG'] as const
const QUESTION_DETAIL_FIELDS = [
  'Shortquestion',
  'Question',
  'IndustryNew',
  'Publications',
  'Inspection',
  'Suggested',
  'Expected',
  'Potential',
] as const

function getQuestionTypeLabel(
  question: SireCollectionDocument
): string | undefined {
  const value = question.QuestionType ?? question['Question Type']
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function getQuestionType(question: SireCollectionDocument): string {
  return getQuestionTypeLabel(question)?.toLowerCase() ?? ''
}

function getQuestionTypeBadgeClass(questionType: string): string {
  const normalizedType = questionType.toLowerCase()

  if (normalizedType === 'core') {
    return 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
  }

  if (normalizedType === 'rotational 1' || normalizedType === 'rotational 2') {
    return 'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300'
  }

  return ''
}

function getApplicableVesselTypes(
  question: SireCollectionDocument
): string[] {
  return VESSEL_TYPE_FIELDS.filter((field) => {
    const value = question[field]
    return value === true || (typeof value === 'string' && value.toLowerCase() === 'true')
  })
}

function matchesQuestionType(
  question: SireCollectionDocument,
  filter: QuestionTypeFilter
): boolean {
  if (filter === 'all') return true

  const normalizedType = getQuestionType(question)
  const selectedType = QUESTION_TYPE_OPTIONS.find(
    (option) => option.value === filter
  )

  return normalizedType === selectedType?.label.toLowerCase()
}

function compareQuestions(
  a: SireCollectionDocument,
  b: SireCollectionDocument
): number {
  const subA = a.Subchapter || ''
  const subB = b.Subchapter || ''
  if (subA !== subB) {
    return subA.localeCompare(subB, undefined, { numeric: true })
  }

  const questionA = a.Shortquestion || ''
  const questionB = b.Shortquestion || ''
  return questionA.localeCompare(questionB, undefined, { numeric: true })
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'

  let formattedValue: string
  if (typeof value === 'string') {
    formattedValue = value
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    formattedValue = String(value)
  } else {
    try {
      formattedValue = JSON.stringify(value, null, 2)
    } catch {
      return 'Unable to display this value'
    }
  }

  const plainText = formattedValue
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:div|h[1-6]|li|p|tr)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return plainText || '—'
}

interface ExplorerProps {
  targetQuestion?: SireCollectionDocument
}

export function Explorer({ targetQuestion }: ExplorerProps) {
  const [selectedChapter, setSelectedChapter] = useState<string>('')
  const [questionTypeFilter, setQuestionTypeFilter] =
    useState<QuestionTypeFilter>('all')
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('')
  const questionContentRef = useRef<HTMLDivElement>(null)
  const { data: appConfig, isLoading: metadataLoading, isError: metadataError, error: metadataErr } = useMetadata()
  const { data: questions, isLoading: questionsLoading, isError: questionsError, error: questionsErr } = useSireCollection(selectedChapter || undefined)

  useEffect(() => {
    if (!targetQuestion?.Chapter) return
    setSelectedChapter(targetQuestion.Chapter)
    setSelectedQuestionId(targetQuestion.id)
  }, [targetQuestion])

  const sortedQuestions = useMemo(() => {
    return (questions ?? [])
      .filter((question) => matchesQuestionType(question, questionTypeFilter))
      .sort(compareQuestions)
  }, [questionTypeFilter, questions])
  const selectedQuestion =
    sortedQuestions.find((question) => question.id === selectedQuestionId) ??
    sortedQuestions[0]

  function handleChapterChange(chapter: string): void {
    setSelectedChapter(chapter)
    setSelectedQuestionId('')
  }

  function handleQuestionSelect(questionId: string): void {
    setSelectedQuestionId(questionId)
    questionContentRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  if (metadataLoading) {
    return <div>Loading chapters...</div>
  }

  if (metadataError) {
    return <div>Error loading chapters: {metadataErr.message}</div>
  }

  const chapters: string[] =
    appConfig?.chapters?.slice().sort(compareChapters) ?? []

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Select Chapter</label>
          <Select value={selectedChapter} onValueChange={handleChapterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a chapter..." />
            </SelectTrigger>
            <SelectContent>
              {chapters.map((chapter) => (
                <SelectItem key={chapter} value={chapter}>
                  {chapter}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Question Type</label>
          <Select
            value={questionTypeFilter}
            onValueChange={(value: QuestionTypeFilter) => {
              setQuestionTypeFilter(value)
              setSelectedQuestionId('')
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedChapter && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Questions for Chapter: {selectedChapter}
            </h2>
            <PDFDownloadLink
              document={<ChapterPdf chapter={selectedChapter} questions={sortedQuestions} />}
              fileName={`chapter-${selectedChapter}.pdf`}
            >
              {({ loading }) => (
                <Button variant="outline" size="sm" disabled={loading}>
                  {loading ? 'Generating...' : 'Create PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          </div>

          {questionsLoading && <div>Loading questions...</div>}

          {questionsError && (
            <div>Error loading questions: {questionsErr.message}</div>
          )}

          {questions && questions.length === 0 && (
            <div>No questions found for this chapter.</div>
          )}

          {questions && questions.length > 0 && sortedQuestions.length === 0 && (
            <div>No questions found for the selected question type.</div>
          )}

          {sortedQuestions.length > 0 && (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(22rem,1fr)_minmax(0,1.4fr)]">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>
                    {sortedQuestions.length} questions in this chapter
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-1">
                  <ul className="space-y-3 px-1 pb-3 text-left">
                    {sortedQuestions.map((question) => {
                      const isSelected = selectedQuestion?.id === question.id
                      const questionType = getQuestionTypeLabel(question)
                      const vesselTypes = getApplicableVesselTypes(question)

                      return (
                        <li key={question.id}>
                          <Card
                            size="sm"
                            className={cn(
                              'gap-0 py-0 transition-colors hover:bg-accent',
                              isSelected && 'bg-accent ring-primary'
                            )}
                          >
                            <button
                              type="button"
                              aria-pressed={isSelected}
                              className="w-full rounded-xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={() => handleQuestionSelect(question.id)}
                            >
                              <span className="mb-1 block text-xs text-muted-foreground">
                                {question.Subchapter || 'No subchapter'}
                              </span>
                              <span className="block text-sm font-medium">
                                {question.Shortquestion ||
                                  'No short question available'}
                              </span>
                              {(questionType || vesselTypes.length > 0) && (
                                <span className="mt-2 flex flex-wrap gap-1.5">
                                  {questionType && (
                                    <Badge
                                      variant="outline"
                                      className={getQuestionTypeBadgeClass(questionType)}
                                    >
                                      {questionType}
                                    </Badge>
                                  )}
                                  {vesselTypes.map((vesselType) => (
                                    <Badge
                                      key={vesselType}
                                      variant="outline"
                                      className="border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                                    >
                                      {vesselType}
                                    </Badge>
                                  ))}
                                </span>
                              )}
                            </button>
                          </Card>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>

              <div
                ref={questionContentRef}
                className="min-w-0 scroll-mt-4 space-y-4 text-left"
              >
                <p className="whitespace-pre-wrap break-words px-1 text-xl font-bold leading-snug text-foreground sm:text-2xl">
                  {formatFieldValue(selectedQuestion?.Shortquestion)}
                </p>

                {QUESTION_DETAIL_FIELDS.filter(
                  (field) => field !== 'Shortquestion'
                ).map((field) => (
                  <Card key={field} size="sm">
                    <CardHeader className="border-b bg-muted/70">
                      <CardTitle>{field}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                        {formatFieldValue(selectedQuestion?.[field])}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}