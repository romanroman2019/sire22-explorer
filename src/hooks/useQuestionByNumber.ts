import { useQuery } from '@tanstack/react-query'
import { sireCollectionRepository } from '@/lib/repositories/sireCollectionRepository'

export function useQuestionByNumber(level3Number: string | undefined) {
  return useQuery({
    queryKey: ['sire_collection', 'Level3Number', level3Number],
    queryFn: () => sireCollectionRepository.getByLevel3Number(level3Number!),
    enabled: !!level3Number,
    staleTime: 1000 * 60 * 5,
  })
}