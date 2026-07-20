import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  BookOpen,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useQuestionByNumber } from '@/hooks/useQuestionByNumber'
import { cn } from '@/lib/utils'
import type { SireCollectionDocument } from '@/lib/repositories/sireCollectionRepository'
import { AuthButton } from '@/components/custom/AuthButton'

interface DashboardLayoutProps {
  activeTab: 'dashboard' | 'explorer'
  onTabChange: (tab: 'dashboard' | 'explorer') => void
  onQuestionFound: (question: SireCollectionDocument) => void
  onShowCommentedQuestions: () => void
  children: React.ReactNode
}

export function DashboardLayout({
  activeTab,
  onTabChange,
  onQuestionFound,
  onShowCommentedQuestions,
  children,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [submittedNumber, setSubmittedNumber] = useState<string>()
  const [validationError, setValidationError] = useState('')
  const {
    data: foundQuestion,
    dataUpdatedAt,
    error: searchError,
    isError: isSearchError,
    isFetching: isSearching,
    refetch,
  } = useQuestionByNumber(submittedNumber)

  useEffect(() => {
    if (!dataUpdatedAt || !foundQuestion) return
    onQuestionFound(foundQuestion)
  }, [dataUpdatedAt, foundQuestion, onQuestionFound])

  function handleSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const normalizedValue = searchValue.trim()
    if (!normalizedValue) {
      setValidationError('Enter a question number.')
      return
    }

    setValidationError('')
    if (normalizedValue === submittedNumber) {
      void refetch()
    } else {
      setSubmittedNumber(normalizedValue)
    }
  }

  function handleMobileNavClick(tab: 'dashboard' | 'explorer'): void {
    onTabChange(tab)
    setMobileMenuOpen(false)
  }

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'explorer' as const,
      label: 'Explorer',
      icon: BookOpen,
    },
  ]

  const sidebarContent = (
    <>
      {/* Sidebar Header */}
      <div
        className={cn(
          'flex items-center h-16 px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5" />
            <span>Sire22</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden sm:inline-flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start',
                collapsed ? 'px-3' : 'px-3'
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </Button>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="flex-1 px-2 pt-3">
          <Separator className="mb-4" />
          <form className="space-y-2" onSubmit={handleSearch}>
            <label htmlFor="question-number" className="text-sm font-medium">
              Find question
            </label>
            <div className="flex gap-1.5">
              <Input
                id="question-number"
                inputMode="decimal"
                placeholder="Question number"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                aria-describedby="question-search-status"
                aria-invalid={!!validationError}
              />
              <Button
                type="submit"
                size="icon"
                variant="secondary"
                disabled={isSearching}
                aria-label="Find question by number"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <p
              id="question-search-status"
              role="status"
              className={cn(
                'min-h-4 text-xs text-muted-foreground',
                (validationError || isSearchError) && 'text-destructive'
              )}
            >
              {validationError ||
                (isSearchError
                  ? searchError.message
                  : isSearching
                    ? 'Searching...'
                    : submittedNumber && foundQuestion === null
                      ? `Question ${submittedNumber} not found.`
                      : '')}
            </p>
          </form>
          <Separator className="my-3" />
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={onShowCommentedQuestions}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Questions with comments</span>
          </Button>
        </div>
      )}

      {/* Sidebar Footer */}
      <div className="mt-auto">
        <Separator />
        <div
          className={cn(
            'flex items-center p-3',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <AuthButton collapsed={collapsed} />
          {!collapsed && (
            <span className="text-xs text-muted-foreground">v1.0</span>
          )}
        </div>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen min-w-0">
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-2 border-b bg-background px-4 sm:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5" />
          <span>Sire22</span>
        </div>
        <div className="flex-1" />
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => handleMobileNavClick(item.id)}
              aria-label={item.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          )
        })}
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'sticky top-0 hidden h-svh shrink-0 self-start flex-col overflow-y-auto border-r bg-muted/30 transition-all duration-200 sm:flex',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-4 pt-20 sm:p-8 sm:pt-8">
          {children}
        </div>
        <footer className="border-t py-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Sleepwalk Solutions LLC. All rights reserved.
        </footer>
      </main>
    </div>
  )
}
