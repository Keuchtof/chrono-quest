interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function Drawer({ open, onClose, title, children }: Props) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white rounded-t-2xl z-50 shadow-2xl transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="p-4 pb-6 max-h-[80vh] overflow-y-auto">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          {title && <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>}
          {children}
        </div>
      </div>
    </>
  )
}
