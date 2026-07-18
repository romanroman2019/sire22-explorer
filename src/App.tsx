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

  function handleQuestionFound(question: SireCollectionDocument): void {
    setTargetQuestion(question)
    setTargetChapter('')
    setActiveTab('explorer')
  }

  function handleChapterSelect(chapter: string): void {
    setTargetChapter(chapter)
    setTargetQuestion(undefined)
    setActiveTab('explorer')
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onQuestionFound={handleQuestionFound}
    >
      {activeTab === 'dashboard' ? (
        <Dashboard onChapterSelect={handleChapterSelect} />
      ) : (
        <Explorer
          targetQuestion={targetQuestion}
          targetChapter={targetChapter}
        />
      )}
    </DashboardLayout>
  )
}

export default App
