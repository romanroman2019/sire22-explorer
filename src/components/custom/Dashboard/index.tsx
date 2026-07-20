import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { metadataRepository } from '@/lib/repositories/metadataRepository'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { BookOpen, FileText, Layers, TrendingUp } from 'lucide-react'

function useAppStat() {
  return useQuery({
    queryKey: ['metadata', 'app_stat'],
    queryFn: () => metadataRepository.getAppStat(),
    staleTime: 1000 * 60 * 5,
  })
}

interface DashboardProps {
  onChapterSelect?: (chapter: string) => void
}

export function Dashboard({ onChapterSelect }: DashboardProps) {
  const {
    data: appStat,
    error,
    isError,
    isLoading,
  } = useAppStat()

  const totalChapters = appStat?.totalChapters ?? 0
  const totalEntries = appStat?.totalEntries ?? 0
  const totalSubchapters = appStat?.subchapters ?? 0
  const avgPerChapter = appStat?.avgPerChapter ?? 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Unable to load the dashboard</CardTitle>
          <CardDescription>
            {error instanceof Error
              ? error.message
              : 'Please refresh the page and try again.'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of the Sire22 collection — {totalEntries} documents across{' '}
          {totalChapters} chapters
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalChapters}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available chapters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Entries
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEntries}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Documents in the collection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Subchapters
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSubchapters}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique subchapters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. per Chapter
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgPerChapter}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average entries per chapter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chapters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Chapters Overview</CardTitle>
          <CardDescription>
            All chapters in the Sire22 collection with entry counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead>Chapter</TableHead>
                <TableHead className="text-right">Entries</TableHead>
                <TableHead className="text-right">Subchapters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appStat?.chapters.map((chapter, index) => (
                <TableRow
                  key={chapter.title}
                  className={cn(
                    "cursor-pointer",
                    onChapterSelect && "hover:bg-muted/50"
                  )}
                  onClick={() => onChapterSelect?.(chapter.title)}
                >
                  <TableCell className="text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {chapter.title}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{chapter.entries}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {chapter.subchapters}
                  </TableCell>
                </TableRow>
              ))}
              {(!appStat?.chapters || appStat.chapters.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No chapters found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}