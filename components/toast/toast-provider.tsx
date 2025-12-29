"use client"

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react"

export type ToastVariant = "success" | "warning" | "error" | "info"

export type ToastInput = {
  title?: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastItem = ToastInput & {
  id: string
  createdAt: number
}

type ToastContextValue = {
  toast: (input: ToastInput) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION = 3500
const MAX_TOASTS = 4

function uid() {
  // suficientemente único para UI
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function variantStyles(variant: ToastVariant) {
  // Colores complementarios al rojo (sin verdes/amarillos chillones)
  // + buen contraste en light y dark
  switch (variant) {
    case "success":
      return {
        wrap:
          "border-emerald-200/60 bg-white/90 text-slate-900 shadow-xl shadow-emerald-500/10 " +
          "dark:border-emerald-900/50 dark:bg-slate-950/80 dark:text-slate-50 dark:shadow-emerald-500/10",
        icon: "text-emerald-600 dark:text-emerald-400",
        bar: "bg-emerald-500/90",
      }
    case "warning":
      return {
        wrap:
          "border-fuchsia-200/60 bg-white/90 text-slate-900 shadow-xl shadow-fuchsia-500/10 " +
          "dark:border-fuchsia-900/50 dark:bg-slate-950/80 dark:text-slate-50 dark:shadow-fuchsia-500/10",
        icon: "text-fuchsia-600 dark:text-fuchsia-400",
        bar: "bg-fuchsia-500/90",
      }
    case "error":
      return {
        wrap:
          "border-rose-200/60 bg-white/90 text-slate-900 shadow-xl shadow-rose-500/10 " +
          "dark:border-rose-900/50 dark:bg-slate-950/80 dark:text-slate-50 dark:shadow-rose-500/10",
        icon: "text-rose-600 dark:text-rose-400",
        bar: "bg-rose-500/90",
      }
    case "info":
    default:
      return {
        wrap:
          "border-indigo-200/60 bg-white/90 text-slate-900 shadow-xl shadow-indigo-500/10 " +
          "dark:border-indigo-900/50 dark:bg-slate-950/80 dark:text-slate-50 dark:shadow-indigo-500/10",
        icon: "text-indigo-600 dark:text-indigo-400",
        bar: "bg-indigo-500/90",
      }
  }
}

function VariantIcon({ variant }: { variant: ToastVariant }) {
  const cls = "h-5 w-5"
  switch (variant) {
    case "success":
      return <CheckCircle2 className={cls} />
    case "warning":
      return <AlertTriangle className={cls} />
    case "error":
      return <AlertCircle className={cls} />
    case "info":
    default:
      return <Info className={cls} />
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Record<string, number>>({})

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current[id]
    if (timer) {
      window.clearTimeout(timer)
      delete timersRef.current[id]
    }
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
    Object.values(timersRef.current).forEach((t) => window.clearTimeout(t))
    timersRef.current = {}
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const item: ToastItem = {
        id: uid(),
        createdAt: Date.now(),
        title: input.title,
        description: input.description,
        variant: input.variant ?? "info",
        durationMs: input.durationMs ?? DEFAULT_DURATION,
      }

      setToasts((prev) => {
        const next = [item, ...prev]
        return next.slice(0, MAX_TOASTS)
      })

      timersRef.current[item.id] = window.setTimeout(() => dismiss(item.id), item.durationMs)
    },
    [dismiss]
  )

  const value = useMemo(() => ({ toast, dismiss, dismissAll }), [toast, dismiss, dismissAll])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return createPortal(
    <div
      aria-live="polite"
      aria-relevant="additions removals"
      className="fixed inset-0 pointer-events-none z-[9999]"
    >
      <div className="absolute top-4 right-4 left-4 sm:left-auto flex flex-col gap-3 sm:w-[420px]">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </div>
    </div>,
    document.body
  )
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: string) => void
}) {
  const v = toast.variant ?? "info"
  const s = variantStyles(v)

  return (
    <div
      className={[
        "pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur",
        "p-4 sm:p-5",
        "animate-in fade-in slide-in-from-top-2 duration-200",
        s.wrap,
      ].join(" ")}
    >
      {/* Accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1.5 ${s.bar}`} />

      <div className="flex gap-3">
        <div className={`mt-0.5 ${s.icon}`}>
          <VariantIcon variant={v} />
        </div>

        <div className="min-w-0 flex-1">
          {toast.title && (
            <div className="text-sm sm:text-[0.95rem] font-semibold leading-5 truncate">
              {toast.title}
            </div>
          )}
          {toast.description && (
            <div className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-5 break-words">
              {toast.description}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-xl
                     text-slate-500 hover:text-slate-900 hover:bg-slate-900/5
                     dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10
                     transition"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de <ToastProvider />")
  }
  return ctx
}