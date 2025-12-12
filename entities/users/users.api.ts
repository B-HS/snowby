import { apiClient, getApiBaseUrl } from '@/entities/api-client'
import { getAuthCookie } from '@/lib/services/auth'
import type { UserProfile, UserSummary } from '@/lib/types'

export const fetchMe = () => apiClient<UserProfile>('/api/users/me')

export const fetchUserProfile = (userId: string) =>
    apiClient<UserProfile>(`/api/users/profile/${userId}`)

export const fetchUserSummary = (userId: string) =>
    apiClient<UserSummary>(`/api/users/summary/${userId}`)

export const updateUserProfile = (profile: Partial<UserProfile>) =>
    apiClient<UserProfile>('/api/users/profile', {
        method: 'PATCH',
        body: profile as Record<string, unknown>,
    })

export const uploadAvatar = async (imageUri: string) => {
    const formData = new FormData()

    const filename = imageUri.split('/').pop() || 'avatar.jpg'
    const match = /\.(\w+)$/.exec(filename)
    const type = match ? `image/${match[1]}` : 'image/jpeg'

    formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
    } as unknown as Blob)

    const cookie = getAuthCookie()

    console.log('[Upload] Uploading avatar:', imageUri)
    console.log('[Upload] Cookie present:', !!cookie)

    const response = await fetch(`${getApiBaseUrl()}/api/users/avatar`, {
        method: 'POST',
        headers: {
            cookie,
        },
        body: formData,
    })

    console.log('[Upload] Response status:', response.status)

    if (!response.ok) {
        const error = await response.json()
        console.log('[Upload] Error:', error)
        throw new Error(error.message || 'Upload failed')
    }

    const result = await response.json() as { image: string }
    console.log('[Upload] Success:', result)
    return { image: `${getApiBaseUrl()}${result.image}` }
}
