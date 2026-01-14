import { useState, useCallback } from 'react'
import Toast, { ToastType } from '../components/Toast'

interface ToastState {
  message: string
  type: ToastType
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  const ToastComponent = toast ? (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={hideToast}
    />
  ) : null

  return { showToast, ToastComponent }
}
