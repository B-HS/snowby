import { getAuthCookie } from '@/lib/services/auth'

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000'

export const getApiBaseUrl = () => BASE_URL

type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: Record<string, unknown>
    headers?: Record<string, string>
}

export const apiClient = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const { method = 'GET', body, headers = {} } = options
    const cookie = getAuthCookie()

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            Cookie: cookie,
            ...headers,
        },
        credentials: 'omit',
    }

    if (body) {
        config.body = JSON.stringify(body)
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config)
    console.log(`[API] ${method} ${endpoint} - ${response.status}`)

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }))
        throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
}
