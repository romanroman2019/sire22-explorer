import { useState } from 'react'
import { Dashboard } from '@/components/custom/Dashboard'
import { DashboardLayout } from '@/components/custom/DashboardLayout'
import { Explorer } from '@/components/custom/Explorer'
import type { SireCollectionDocument } from '@/lib/repositories/sireCollectionRepository'

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explorer'>('dashboard')
  const [targetQuestion, setTargetQuestion] =
    useState<SireCollectionDocument>()

  function handleQuestionFound(question: SireCollectionDocument): void {
    setTargetQuestion(question)
    setActiveTab('explorer')
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onQuestionFound={handleQuestionFound}
    >
      {activeTab === 'dashboard' ? (
        <Dashboard />
      ) : (
        <Explorer targetQuestion={targetQuestion} />
      )}
    </DashboardLayout>
  )
}

export default App
