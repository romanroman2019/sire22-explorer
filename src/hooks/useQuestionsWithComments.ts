import { useQuery } from '@tanstack/react-query'
import { sireCollectionRepository } from '@/lib/repositories/sireCollectionRepository'
import { commentRepository } from '@/lib/repositories/commentRepository'
import type { SireCollectionDocument } from '@/lib/repositories/sireCollectionRepository'

export function useQuestionsWithComments(enabled: boolean) {
  return useQuery({
    queryKey: ['questionsWithComments', enabled],
    queryFn: async (): Promise<SireCollectionDocument[]> => {
      const questionIds = await commentRepository.getAllQuestionIdsWithComments()
      if (questionIds.length === 0) return []
      return sireCollectionRepository.getByIds(questionIds)
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}