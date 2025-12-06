import { createAuthClient } from 'better-auth/react'
import { expoClient } from '@better-auth/expo/client'
import * as SecureStore from 'expo-secure-store'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export const authClient = createAuthClient({
    baseURL: API_BASE_URL,
    plugins: [
        expoClient({
            scheme: 'snowby',
            storagePrefix: 'snowby',
            storage: SecureStore,
        }),
    ],
})

export const signInWithGoogle = async () => {
    return authClient.signIn.social({
        provider: 'google',
        callbackURL: '/user',
    })
}

export const signInWithApple = async () => {
    return authClient.signIn.social({
        provider: 'apple',
        callbackURL: '/user',
    })
}

export const signOut = async () => {
    return authClient.signOut()
}
