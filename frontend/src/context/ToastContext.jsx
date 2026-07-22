import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showError = useCallback((message) => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const value = { showError }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className="rounded-lg border px-4 py-3 text-sm shadow-lg"
            style={{
              borderColor: 'var(--color-danger)',
              background: 'var(--color-paper-soft)',
              color: 'var(--color-ink)',
              boxShadow: '0 1px 2px rgba(30,42,56,0.06), 0 14px 28px -14px rgba(30,42,56,0.35)',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast는 ToastProvider 내부에서만 사용 가능합니다')
  return ctx
}
