import { useEffect, useState } from 'react'
import { useTrackingStore } from '@/lib/tracking/tracking.store'
import type { RecoveryOption } from '@/lib/tracking/tracking.types'

export const useCrashRecovery = (userId: string | null) => {
    const [showRecoveryModal, setShowRecoveryModal] = useState(false)
    const [recoveryError, setRecoveryError] = useState<string | null>(null)
    const { unfinishedSession, handleRecoveryOption, isInitialized } =
        useTrackingStore()

    useEffect(() => {
        if (!userId || !isInitialized) return

        if (unfinishedSession?.hasUnfinished) {
            setShowRecoveryModal(true)
        }
    }, [userId, isInitialized, unfinishedSession])

    const handleRecovery = async (option: RecoveryOption) => {
        if (!userId) return

        setRecoveryError(null)

        try {
            await handleRecoveryOption(option, userId)
            setShowRecoveryModal(false)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Recovery failed'
            setRecoveryError(errorMessage)
            console.error('[CrashRecovery] Error:', errorMessage)
        }
    }

    const dismissRecovery = () => {
        setShowRecoveryModal(false)
        setRecoveryError(null)
    }

    return {
        showRecoveryModal,
        unfinishedSession,
        handleRecovery,
        dismissRecovery,
        recoveryError,
    }
}
