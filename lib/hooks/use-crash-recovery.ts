import { useEffect, useState } from 'react'
import { useTrackingStore } from '@/lib/tracking/tracking.store'
import type { UnfinishedSessionInfo, RecoveryOption } from '@/lib/tracking/tracking.types'

export const useCrashRecovery = (userId: string | null) => {
    const [showRecoveryModal, setShowRecoveryModal] = useState(false)
    const { unfinishedSession, checkUnfinishedSession, handleRecoveryOption, isInitialized } =
        useTrackingStore()

    useEffect(() => {
        if (!userId || !isInitialized) return

        if (unfinishedSession?.hasUnfinished) {
            setShowRecoveryModal(true)
        }
    }, [userId, isInitialized, unfinishedSession])

    const handleRecovery = async (option: RecoveryOption) => {
        if (!userId) return
        await handleRecoveryOption(option, userId)
        setShowRecoveryModal(false)
    }

    const dismissRecovery = () => {
        setShowRecoveryModal(false)
    }

    return {
        showRecoveryModal,
        unfinishedSession,
        handleRecovery,
        dismissRecovery,
    }
}
