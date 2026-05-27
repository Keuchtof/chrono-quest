import { useState } from 'react'
import type { Store } from '../store'
import { COLORS } from '../constants'
import BlocFormModal from '../components/BlocFormModal'
import type { Bloc } from '../types'

interface Props { store: Store }

export default function BlocsTab({ store }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editBloc, setEditBloc] = useState<Bloc | null>(null)

  function handleEdit(bloc: Bloc) {
    setEditBloc(bloc)
    setShowForm(true)
  }

  function handleClose() {
    setShowForm(false)
    setEditBloc(null)
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">Mes blocs</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-xl"
        >
          <span>+</span> Nouveau
        </button>
      </div>

      <div className="space-y-2">
        {store.blocs.map(bloc => {
          const color = COLORS[bloc.color]
          return (
            <div
              key={bloc.id}
              className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3"
              style={{ borderLeft: `4px solid ${color.main}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: color.light }}>
                {bloc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{bloc.name}</p>
                <p className="text-xs text-gray-400">Objectif : {bloc.objectifJours} j/mois</p>
              </div>
              <button
                onClick={() => handleEdit(bloc)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >✏️</button>
              <button
                onClick={() => {
                  if (confirm(`Supprimer "${bloc.name}" ?`)) store.deleteBloc(bloc.id)
                }}
                className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
              >🗑</button>
            </div>
          )
        })}
      </div>

      {store.blocs.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          <p className="text-3xl mb-2">📦</p>
          <p>Aucun bloc pour l'instant</p>
          <p>Créez votre premier bloc !</p>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-blue-500 text-white text-2xl shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform"
      >+</button>

      <BlocFormModal
        open={showForm}
        bloc={editBloc}
        onSave={data => {
          if (editBloc) store.updateBloc(editBloc.id, data)
          else store.addBloc(data)
        }}
        onClose={handleClose}
      />
    </div>
  )
}
