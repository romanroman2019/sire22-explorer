import { useQuery } from '@tanstack/react-query'
import { metadataRepository } from '@/lib/repositories/metadataRepository'

export function useMetadata() {
  return useQuery({
    queryKey: ['metadata', 'app_config'],
    queryFn: () => metadataRepository.getAppConfig(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}