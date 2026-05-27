import { useState } from 'react'
import { isSupabaseConfigured } from '../lib/sync'

interface Props {
  onLogin: (username: string) => void
  loading: boolean
}

export default function LoginScreen({ onLogin, loading }: Props) {
  const [name, setName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) return
    onLogin(trimmed)
  }

  return (
    <div className="h-full w-full max-w-md mx-auto bg-gray-50 flex flex-col items-center justify-center px-6 shadow-2xl">
      <div className="w-full max-w-xs space-y-8">

        {/* Logo */}
        <div className="text-center">
          <div className="text-6xl mb-4 select-none">⏱️</div>
          <h1 className="text-2xl font-bold text-gray-900">Chrono Quest</h1>
          <p className="text-sm text-gray-400 mt-1">Votre tracker de temps personnel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Identifiant
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex : christophe"
              autoFocus
              autoCapitalize="none"
              disabled={loading}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={name.trim().length < 2 || loading}
            className="w-full py-3 rounded-2xl bg-blue-500 text-white font-semibold text-sm disabled:opacity-40 transition-all active:scale-[0.98]">
            {loading ? '⏳ Chargement…' : 'Commencer →'}
          </button>
        </form>

        {/* Sync note */}
        <div className="text-center space-y-1.5">
          {isSupabaseConfigured ? (
            <p className="text-xs text-gray-400 leading-relaxed">
              ☁️ Entrez le même identifiant sur tous vos appareils<br />
              pour retrouver vos données.
            </p>
          ) : (
            <p className="text-xs text-gray-400 leading-relaxed">
              💾 Données stockées localement sur cet appareil.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
