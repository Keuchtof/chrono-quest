import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="p-5">
          {title && <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>}
          {children}
        </div>
      </div>
    </div>
  )
}
