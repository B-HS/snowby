import { apiClient } from '@/entities/api-client'
import type { ResortsResponse } from '@/lib/types'

export const fetchResorts = () => {
    return apiClient<ResortsResponse>('/api/resorts')
}

export const fetchResortsVersion = () => {
    return apiClient<{ version: string; updatedAt: string }>('/api/resorts/version')
}
