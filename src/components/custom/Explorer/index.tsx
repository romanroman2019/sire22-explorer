import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMetadata } from '@/hooks/useMetadata'
import { useSireCollection } from '@/hooks/useSireCollection'
import { useQuestionsWithComments } from '@/hooks/useQuestionsWithComments'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CommentsDialog } from '@/components/custom/CommentsDialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { compareChapters } from '@/lib/sortChapters'
import { cn } from '@/lib/utils'
import type { SireCollectionDocument } from '@/lib/repositories/sireCollectionRepository'

// Load dictionary mappings from dictionary.txt at build time
// Format: FieldName-DisplayLabel;
import dictionaryContent from '@/../dictionary.txt?raw'

const FIELD_LABELS: Record<string, string> = {}
for (const line of dictionaryContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed) continue
  const match = trimmed.match(/^(.+?)-(.+?);$/)
  if (match) {
    FIELD_LABELS[match[1].trim()] = match[2].trim()
  }
}

function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field
}

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
  const chapterA = a.Chapter || ''
  const chapterB = b.Chapter || ''
  if (chapterA !== chapterB) {
    return chapterA.localeCompare(chapterB, undefined, { numeric: true })
  }

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

  // Replace "o" or "?" at the beginning of a line with a bullet mark
  const withBullets = plainText.replace(/^(o|\?)/gm, '•')

  return withBullets || '—'
}

interface ExplorerProps {
  targetQuestion?: SireCollectionDocument
  targetChapter?: string
  showCommentedQuestions?: boolean
}

export function Explorer({ targetQuestion, targetChapter, showCommentedQuestions }: ExplorerProps) {
  const [selectedChapter, setSelectedChapter] = useState<string>('')
  const [questionTypeFilter, setQuestionTypeFilter] =
    useState<QuestionTypeFilter>('all')
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('')
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const questionContentRef = useRef<HTMLDivElement>(null)
  const carouselFields = QUESTION_DETAIL_FIELDS.filter(
    (field) => field !== 'Shortquestion'
  )

  const resizeCarouselToActiveSlide = useCallback((api: CarouselApi | null) => {
    if (!api) return

    const activeSlide = api.slideNodes()[api.selectedScrollSnap()]
    const viewport = api.rootNode()
    if (!activeSlide || !viewport) return

    window.requestAnimationFrame(() => {
      const activeSlideHeight = activeSlide.getBoundingClientRect().height
      if (activeSlideHeight <= 0) return

      viewport.style.height = `${Math.ceil(activeSlideHeight)}px`
    })
  }, [])

  const onCarouselSelect = useCallback((api: CarouselApi | null) => {
    if (!api) return
    setCurrentSlide(api.selectedScrollSnap())
    resizeCarouselToActiveSlide(api)
  }, [resizeCarouselToActiveSlide])

  useEffect(() => {
    if (!carouselApi) return

    const viewport = carouselApi.rootNode()
    viewport.style.transition = 'height 200ms ease'

    const resizeObserver = new ResizeObserver(() => {
      resizeCarouselToActiveSlide(carouselApi)
    })

    carouselApi.slideNodes().forEach((slide) => resizeObserver.observe(slide))
    onCarouselSelect(carouselApi)
    carouselApi.on("select", onCarouselSelect)
    carouselApi.on("reInit", onCarouselSelect)

    return () => {
      carouselApi.off("select", onCarouselSelect)
      carouselApi.off("reInit", onCarouselSelect)
      resizeObserver.disconnect()
      viewport.style.height = ''
      viewport.style.transition = ''
    }
  }, [carouselApi, onCarouselSelect, resizeCarouselToActiveSlide])

  useEffect(() => {
    if (!carouselApi) return
    carouselApi.scrollTo(0, true)
    setCurrentSlide(0)

    const frame = window.requestAnimationFrame(() => {
      carouselApi.reInit()
      carouselApi.scrollTo(0, true)
      resizeCarouselToActiveSlide(carouselApi)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [selectedQuestionId, carouselApi, resizeCarouselToActiveSlide])

  const { data: appConfig, isLoading: metadataLoading, isError: metadataError, error: metadataErr } = useMetadata()
  const { data: questions, isLoading: questionsLoading, isError: questionsError, error: questionsErr } = useSireCollection(selectedChapter || undefined)
  const {
    data: commentedQuestions = [],
    isLoading: commentedLoading,
    isError: commentedError,
    error: commentedErr,
  } = useQuestionsWithComments(showCommentedQuestions ?? false)

  useEffect(() => {
    if (showCommentedQuestions) {
      setSelectedChapter('')
      setSelectedQuestionId('')
      return
    }
    if (!targetQuestion?.Chapter) return
    setSelectedChapter(targetQuestion.Chapter)
    setSelectedQuestionId(targetQuestion.id)
  }, [targetQuestion, showCommentedQuestions])

  useEffect(() => {
    if (!targetChapter) return
    setSelectedChapter(targetChapter)
    setSelectedQuestionId('')
  }, [targetChapter])

  // When showCommentedQuestions switches to true, clear local chapter/selection
  useEffect(() => {
    if (showCommentedQuestions) {
      setSelectedChapter('')
      setSelectedQuestionId('')
    }
  }, [showCommentedQuestions])

  const sortedQuestions = useMemo(() => {
    return (questions ?? [])
      .filter((question) => matchesQuestionType(question, questionTypeFilter))
      .sort(compareQuestions)
  }, [questionTypeFilter, questions])

  const sortedCommentedQuestions = useMemo(() => {
    return (commentedQuestions ?? []).sort(compareQuestions)
  }, [commentedQuestions])

  const displayQuestions = showCommentedQuestions ? sortedCommentedQuestions : sortedQuestions
  const selectedQuestion =
    displayQuestions.find((question) => question.id === selectedQuestionId) ??
    displayQuestions[0]

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
          <label className="mb-2 block text-sm font-medium text-foreground">Select Chapter</label>
          <Select
            value={showCommentedQuestions ? '' : selectedChapter}
            onValueChange={handleChapterChange}
            disabled={showCommentedQuestions}
          >
            <SelectTrigger className="w-full data-[disabled]:opacity-100">
              <SelectValue
                placeholder={
                  showCommentedQuestions
                    ? 'All chapters (comments mode)'
                    : 'Choose a chapter...'
                }
              />
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
          <label className="mb-2 block text-sm font-medium text-foreground">Question Type</label>
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

      {showCommentedQuestions && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Questions with Comments Across All Chapters
            </h2>
          </div>

          {commentedLoading && <div>Loading questions with comments...</div>}

          {commentedError && (
            <div>Error loading questions with comments: {commentedErr.message}</div>
          )}

          {!commentedLoading && !commentedError && displayQuestions.length === 0 && (
            <div>No questions with comments found.</div>
          )}

          {displayQuestions.length > 0 && (
            <div className="grid items-start gap-6 md:grid-cols-1 lg:grid-cols-[minmax(22rem,1fr)_minmax(0,1.4fr)]">
              <div
                ref={questionContentRef}
                className="min-w-0 scroll-mt-4 space-y-4 text-left lg:order-2"
              >
                <div className="space-y-2 px-1">
                  <p className="whitespace-pre-wrap break-words text-xl font-bold leading-snug text-foreground sm:text-2xl">
                    {formatFieldValue(selectedQuestion?.Shortquestion)}
                  </p>
                  <div className="pt-0">
                    <CommentsDialog
                      questionId={selectedQuestion?.id}
                      questionTitle={formatFieldValue(selectedQuestion?.Shortquestion)}
                    />
                  </div>
                </div>

                  <Carousel
                    className="w-full"
                    opts={{ containScroll: "trimSnaps" }}
                    setApi={setCarouselApi}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {getFieldLabel(carouselFields[currentSlide] ?? carouselFields[0])}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {currentSlide + 1} / {carouselFields.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CarouselPrevious className="static size-8 translate-y-0 rounded-md" />
                        <CarouselNext className="static size-8 translate-y-0 rounded-md" />
                      </div>
                    </div>
                  <CarouselContent className="items-start">
                    {carouselFields.map((field) => (
                      <CarouselItem key={field} className="h-auto self-start">
                        <div className="rounded-xl bg-muted/50 p-6">
                          <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                            {formatFieldValue(selectedQuestion?.[field])}
                          </p>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  </Carousel>
                </div>

                <Card className="min-w-0 lg:order-1">
                  <CardHeader>
                    <CardTitle>Questions</CardTitle>
                    <CardDescription>
                      {displayQuestions.length} questions with comments
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-1">
                  <ul className="space-y-3 px-1 pb-3 text-left">
                    {displayQuestions.map((question) => {
                      const isSelected = selectedQuestion?.id === question.id
                      const questionType = getQuestionTypeLabel(question)
                      const vesselTypes = getApplicableVesselTypes(question)

                      return (
                        <li key={question.id}>
                          <Card
                            size="sm"
                            className={cn(
                              'gap-0 py-0 transition-colors hover:bg-accent',
                              isSelected && 'bg-muted'
                            )}
                          >
                            <button
                              type="button"
                              aria-pressed={isSelected}
                              className="w-full rounded-xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={() => handleQuestionSelect(question.id)}
                            >
                              <span className="mb-1 block text-xs text-muted-foreground">
                                {question.Chapter || 'No chapter'} — {question.Subchapter || 'No subchapter'}
                              </span>
                              <span className="block text-sm font-medium">
                                {question.Shortquestion ||
                                  'No short question available'}
                              </span>
                              {(questionType || vesselTypes.length > 0) && (
                                <span className="mt-2 flex flex-wrap gap-1.5">
                                  {questionType && (
                                    <Badge variant="outline">
                                      {questionType}
                                    </Badge>
                                  )}
                                  {vesselTypes.map((vesselType) => (
                                    <Badge key={vesselType} variant="outline">
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
            </div>
          )}
        </div>
      )}

        {!showCommentedQuestions && selectedChapter && (
        <div>

          {questionsLoading && <div>Loading questions...</div>}

          {questionsError && (
            <div>Error loading questions: {questionsErr.message}</div>
          )}

          {questions && questions.length === 0 && (
            <div>No questions found for this chapter.</div>
          )}

          {questions && questions.length > 0 && sortedQuestions.length === 0 && (
            <div>No questions match the selected filters.</div>
          )}

          {sortedQuestions.length > 0 && (
            <>
              <div className="grid items-start gap-6 md:grid-cols-1 lg:grid-cols-[minmax(22rem,1fr)_minmax(0,1.4fr)]">
              <div
                ref={questionContentRef}
                className="min-w-0 scroll-mt-4 space-y-4 text-left lg:order-2"
              >
                <div className="space-y-2 px-1">
                  <p className="whitespace-pre-wrap break-words text-xl font-bold leading-snug text-foreground sm:text-2xl">
                    {formatFieldValue(selectedQuestion?.Shortquestion)}
                  </p>
                  <div className="pt-0">
                    <CommentsDialog
                      questionId={selectedQuestion?.id}
                      questionTitle={formatFieldValue(selectedQuestion?.Shortquestion)}
                    />
                  </div>
                </div>

                <Carousel
                  className="w-full"
                  opts={{ containScroll: "trimSnaps" }}
                  setApi={setCarouselApi}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {getFieldLabel(carouselFields[currentSlide] ?? carouselFields[0])}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {currentSlide + 1} / {carouselFields.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CarouselPrevious className="static size-8 translate-y-0 rounded-md" />
                      <CarouselNext className="static size-8 translate-y-0 rounded-md" />
                    </div>
                  </div>
                  <CarouselContent className="items-start">
                    {carouselFields.map((field) => (
                      <CarouselItem key={field} className="h-auto self-start">
                        <div className="rounded-xl bg-muted/50 p-6">
                          <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                            {formatFieldValue(selectedQuestion?.[field])}
                          </p>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  </Carousel>
                </div>

                <div className="lg:hidden">
                  <Separator />
                </div>

                <h2 className="text-lg font-semibold text-foreground lg:hidden">
                  Questions for Chapter: {selectedChapter}
                </h2>

                <div className="min-w-0 lg:order-1">
                  <p className="mb-4 text-sm text-muted-foreground">
                    {sortedQuestions.length} questions in this chapter
                  </p>
                  <ul className="space-y-3 text-left">
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
                              isSelected && 'bg-muted'
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
                                    <Badge variant="outline">
                                      {questionType}
                                    </Badge>
                                  )}
                                  {vesselTypes.map((vesselType) => (
                                    <Badge key={vesselType} variant="outline">
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
                </div>

              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}