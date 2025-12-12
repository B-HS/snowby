import { apiClient } from '@/entities/api-client'
import type { UserProfile } from '@/lib/types'

export const followUser = (userId: string) =>
    apiClient<{ success: boolean }>(`/api/social/follow/${userId}`, {
        method: 'POST',
    })

export const unfollowUser = (userId: string) =>
    apiClient<{ success: boolean }>(`/api/social/follow/${userId}`, {
        method: 'DELETE',
    })

export const hideUser = (userId: string) =>
    apiClient<{ success: boolean }>(`/api/social/hide/${userId}`, {
        method: 'POST',
    })

export const unhideUser = (userId: string) =>
    apiClient<{ success: boolean }>(`/api/social/hide/${userId}`, {
        method: 'DELETE',
    })

export const reportUser = (userId: string, reason: string) =>
    apiClient<{ success: boolean }>(`/api/social/report/${userId}`, {
        method: 'POST',
        body: { reason },
    })

export const fetchFollowers = (userId: string) =>
    apiClient<UserProfile[]>(`/api/social/followers/${userId}`)

export const fetchFollowing = (userId: string) =>
    apiClient<UserProfile[]>(`/api/social/following/${userId}`)

export const checkIsFollowing = (userId: string) =>
    apiClient<{ isFollowing: boolean }>(`/api/social/is-following/${userId}`)
