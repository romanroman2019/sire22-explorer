import { useState } from 'react'
import { Dashboard } from '@/components/custom/Dashboard'
import { DashboardLayout } from '@/components/custom/DashboardLayout'
import { Explorer } from '@/components/custom/Explorer'
import type { SireCollectionDocument } from '@/lib/repositories/sireCollectionRepository'

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explorer'>('dashboard')
  const [targetQuestion, setTargetQuestion] =
    useState<SireCollectionDocument>()
  const [targetChapter, setTargetChapter] = useState<string>('')
  const [showCommentedQuestions, setShowCommentedQuestions] = useState(false)

  function handleQuestionFound(question: SireCollectionDocument): void {
    setTargetQuestion(question)
    setTargetChapter('')
    setShowCommentedQuestions(false)
    setActiveTab('explorer')
  }

  function handleChapterSelect(chapter: string): void {
    setTargetChapter(chapter)
    setTargetQuestion(undefined)
    setShowCommentedQuestions(false)
    setActiveTab('explorer')
  }

  function handleShowCommentedQuestions(): void {
    setShowCommentedQuestions(true)
    setTargetQuestion(undefined)
    setTargetChapter('')
    setActiveTab('explorer')
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab)
        if (tab !== 'explorer') {
          setShowCommentedQuestions(false)
        }
      }}
      onQuestionFound={handleQuestionFound}
      onShowCommentedQuestions={handleShowCommentedQuestions}
    >
      {activeTab === 'dashboard' ? (
        <Dashboard onChapterSelect={handleChapterSelect} />
      ) : (
        <Explorer
          targetQuestion={targetQuestion}
          targetChapter={targetChapter}
          showCommentedQuestions={showCommentedQuestions}
        />
      )}
    </DashboardLayout>
  )
}

export default App
