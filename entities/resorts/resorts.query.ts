import { useQuery } from '@tanstack/react-query'
import { fetchResorts, fetchResortsVersion } from './resorts.api'

export const resortKeys = {
    all: ['resorts'] as const,
    version: ['resorts', 'version'] as const,
}

export const useResorts = () =>
    useQuery({
        queryKey: resortKeys.all,
        queryFn: fetchResorts,
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24 * 7,
    })

export const useResortsVersion = () =>
    useQuery({
        queryKey: resortKeys.version,
        queryFn: fetchResortsVersion,
        staleTime: 1000 * 60 * 60,
    })
