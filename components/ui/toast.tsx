"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react"

type ToastVariant = "success" | "error" | "warning" | "info"

type ToastItem = {
  id: string
  title?: string
  description?: string
  variant: ToastVariant
  duration?: number
}

type ToastInput = Omit<ToastItem, "id"> & { id?: string }

type ToastContextValue = {
  toast: (input: ToastInput) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const variantStyles: Record<ToastVariant, { wrap: string; icon: React.ReactNode; pill: string }> = {
  success: {
    wrap:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50 ring-1 ring-emerald-500/10",
    pill: "bg-emerald-600 text-white",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
  },
  error: {
    wrap: "border-red-500/25 bg-red-500/10 text-red-950 dark:text-red-50 ring-1 ring-red-500/10",
    pill: "bg-red-600 text-white",
    icon: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
  },
  warning: {
    wrap:
      "border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-50 ring-1 ring-amber-500/10",
    pill: "bg-amber-600 text-white",
    icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
  },
  info: {
    wrap: "border-sky-500/25 bg-sky-500/10 text-sky-950 dark:text-sky-50 ring-1 ring-sky-500/10",
    pill: "bg-sky-600 text-white",
    icon: <Info className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
  },
}

function ToastViewport({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return createPortal(
    <div
      className={[
        "fixed z-[9999] pointer-events-none",
        "top-4 right-4",
        "flex flex-col gap-3",
        "w-[calc(100vw-2rem)] sm:w-[420px]",
      ].join(" ")}
    >
      {children}
    </div>,
    document.body,
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const timers = useRef<Record<string, number>>({})

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
    const t = timers.current[id]
    if (t) window.clearTimeout(t)
    delete timers.current[id]
  }, [])

  const dismissAll = useCallback(() => {
    Object.values(timers.current).forEach((t) => window.clearTimeout(t))
    timers.current = {}
    setItems([])
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = input.id ?? uid()
      const duration = input.duration ?? 3500

      setItems((prev) => {
        // máximo 4 toasts visibles
        const next = [{ id, variant: input.variant ?? "info", title: input.title, description: input.description, duration }, ...prev]
        return next.slice(0, 4)
      })

      if (duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), duration)
        timers.current[id] = timer
      }
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast, dismiss, dismissAll }), [toast, dismiss, dismissAll])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <ToastViewport>
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onClose={() => dismiss(t.id)} />
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  )
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const s = variantStyles[item.variant]

  return (
    <div
      className={[
        "pointer-events-auto",
        "rounded-2xl border shadow-lg backdrop-blur",
        "bg-background/70 dark:bg-background/40",
        "overflow-hidden",
        "animate-in fade-in slide-in-from-top-2 duration-200",
      ].join(" ")}
    >
      <div className={["p-4", s.wrap].join(" ")}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{s.icon}</div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={["px-2 py-0.5 rounded-full text-[11px] font-semibold", s.pill].join(" ")}>
                    {item.variant === "success"
                      ? "Éxito"
                      : item.variant === "error"
                        ? "Error"
                        : item.variant === "warning"
                          ? "Atención"
                          : "Info"}
                  </span>

                  {item.title && (
                    <p className="font-semibold text-sm text-foreground truncate">
                      {item.title}
                    </p>
                  )}
                </div>

                {item.description && (
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed break-words">
                    {item.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4 text-foreground/70" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>")
  return ctx
}