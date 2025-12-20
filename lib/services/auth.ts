import { createAuthClient } from 'better-auth/react'
import { expoClient } from '@better-auth/expo/client'
import * as SecureStore from 'expo-secure-store'

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL
const STORAGE_PREFIX = 'snowby'

export const authClient = createAuthClient({
    baseURL: API_BASE_URL,
    fetchOptions: {
        headers: {
            Origin: API_BASE_URL!,
        },
    },
    plugins: [
        expoClient({
            scheme: 'snowby',
            storagePrefix: STORAGE_PREFIX,
            storage: SecureStore,
        }),
    ],
    sessionOptions: {
        refetchOnWindowFocus: false,
        refetchInterval: 0,
        refetchWhenOffline: false,
    },
})

export const getAuthCookie = () => {
    return authClient.getCookie() || ''
}

export const signInWithGoogle = async () => {
    return authClient.signIn.social({
        provider: 'google',
        callbackURL: 'snowby://',
    })
}

export const signInWithApple = async () => {
    return authClient.signIn.social({
        provider: 'apple',
        callbackURL: 'snowby://',
    })
}

export const signOut = async () => {
    return authClient.signOut()
}

export const useSession = authClient.useSession
