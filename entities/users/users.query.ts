import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMe, fetchUserProfile, fetchUserSummary, updateUserProfile, uploadAvatar } from './users.api'

export const userKeys = {
    me: () => ['user', 'me'] as const,
    profile: (userId: string) => ['user', 'profile', userId] as const,
    summary: (userId: string) => ['user', 'summary', userId] as const,
}

export const useMe = () =>
    useQuery({
        queryKey: userKeys.me(),
        queryFn: fetchMe,
    })

export const useUserProfile = (userId: string) =>
    useQuery({
        queryKey: userKeys.profile(userId),
        queryFn: () => fetchUserProfile(userId),
        enabled: !!userId,
    })

export const useUserSummary = (userId: string) =>
    useQuery({
        queryKey: userKeys.summary(userId),
        queryFn: () => fetchUserSummary(userId),
        enabled: !!userId,
    })

export const useUpdateProfile = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateUserProfile,
        onSuccess: (data) => {
            queryClient.setQueryData(userKeys.me(), data)
        },
    })
}

export const useUploadAvatar = () => {
    return useMutation({
        mutationFn: uploadAvatar,
    })
}
