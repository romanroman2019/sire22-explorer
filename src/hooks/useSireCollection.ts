import { useQuery } from '@tanstack/react-query'
import { sireCollectionRepository } from '@/lib/repositories/sireCollectionRepository'

export function useSireCollection(chapter: string | undefined) {
  return useQuery({
    queryKey: ['sire_collection', chapter],
    queryFn: () => sireCollectionRepository.getByChapter(chapter!),
    enabled: !!chapter,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}