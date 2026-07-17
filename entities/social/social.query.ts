import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { checkIsFollowing, fetchFollowers, fetchFollowing, followUser, hideUser, reportUser, unfollowUser, unhideUser } from './social.api'
import { activityKeys } from '@/entities/activities/activities.query'

export const socialKeys = {
    followers: (userId: string) => ['social', 'followers', userId] as const,
    following: (userId: string) => ['social', 'following', userId] as const,
    isFollowing: (userId: string) => ['social', 'isFollowing', userId] as const,
}

export const useFollowers = (userId: string) =>
    useQuery({
        queryKey: socialKeys.followers(userId),
        queryFn: () => fetchFollowers(userId),
        enabled: !!userId,
    })

export const useFollowing = (userId: string) =>
    useQuery({
        queryKey: socialKeys.following(userId),
        queryFn: () => fetchFollowing(userId),
        enabled: !!userId,
    })

export const useIsFollowing = (userId: string) =>
    useQuery({
        queryKey: socialKeys.isFollowing(userId),
        queryFn: () => checkIsFollowing(userId),
        enabled: !!userId,
    })

export const useFollowUser = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: followUser,
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: activityKeys.feedAll() })
            queryClient.invalidateQueries({ queryKey: socialKeys.isFollowing(userId) })
            queryClient.invalidateQueries({ queryKey: ['social'] })
        },
    })
}

export const useUnfollowUser = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: unfollowUser,
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: activityKeys.feedAll() })
            queryClient.invalidateQueries({ queryKey: socialKeys.isFollowing(userId) })
            queryClient.invalidateQueries({ queryKey: ['social'] })
        },
    })
}

export const useHideUser = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: hideUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: activityKeys.feedAll() })
        },
    })
}

export const useUnhideUser = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: unhideUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: activityKeys.feedAll() })
        },
    })
}

export const useReportUser = () =>
    useMutation({
        mutationFn: ({ userId, reason }: { userId: string; reason: string }) => reportUser(userId, reason),
    })
