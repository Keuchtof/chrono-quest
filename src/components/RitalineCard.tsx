import { useState } from 'react'
import type { Store } from '../store'
import type { RitalineCycle } from '../types'
import {
  calcRitalineStatus, ritalineGelules, formatDateShort, getDateStr,
  generateId, daysBetween, isPharmacyClosed, RITALINE_DUREE,
} from '../utils'

interface Props { store: Store }

const LONG_DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
function dayName(dateStr: string) { return LONG_DAYS[new Date(dateStr + 'T12:00:00').getDay()] }

/** « dans 5 j » / « il y a 2 j » / « aujourd'hui » */
function relDays(n: number): string {
  if (n === 0) return "aujourd'hui"
  if (n === 1) return 'demain'
  if (n === -1) return 'hier'
  return n > 0 ? `dans ${n} j` : `il y a ${-n} j`
}

export default function RitalineCard({ store }: Props) {
  const { settings, updateSettings } = store
  const [showConfig,  setShowConfig]  = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const st     = calcRitalineStatus(settings)
  const cycles = settings.ritalineCycles ?? []
  const today  = getDateStr()

  function patchLastCycle(patch: Partial<RitalineCycle>) {
    if (cycles.length === 0) return
    const next = cycles.map((c, i) => i === cycles.length - 1 ? { ...c, ...patch } : c)
    updateSettings({ ritalineCycles: next })
  }

  function newCycle() {
    updateSettings({
      ritalineCycles: [...cycles, { id: generateId(), ordonnance: today }],
    })
  }

  function deleteLastCycle() {
    if (!confirm('Supprimer le cycle en cours ?')) return
    updateSettings({ ritalineCycles: cycles.slice(0, -1) })
  }

  const configured = !!settings.ritalineOrdonnanceInitiale || cycles.length > 0

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 tracking-wider">GESTION RITALINE</p>
        <button onClick={() => setShowConfig(o => !o)}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded-lg">
          ⚙️ {showConfig ? 'Fermer' : 'Réglages'}
        </button>
      </div>

      {/* ── Réglages (ordonnance annuelle + relevé de stock) ──────────────── */}
      {showConfig && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">
              Ordonnance initiale (spécialiste, valable 1 an)
            </label>
            <input type="date" value={settings.ritalineOrdonnanceInitiale ?? ''}
              onChange={e => updateSettings({ ritalineOrdonnanceInitiale: e.target.value || undefined })}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Stock relevé</label>
              <input type="number" min="0" value={settings.ritalineStockInitial ?? ''}
                placeholder="ex : 20"
                onChange={e => updateSettings({
                  ritalineStockInitial: e.target.value === '' ? undefined : parseInt(e.target.value) || 0,
                })}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400" />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-gray-500 mb-1">À la date du</label>
              <input type="date" value={settings.ritalineStockDate ?? ''} max={today}
                onChange={e => updateSettings({ ritalineStockDate: e.target.value || undefined })}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400" />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Le stock diminue à chaque jour marqué 💊 dans l'onglet Jour et se recharge
            aux délivrances postérieures à cette date.
          </p>
        </div>
      )}

      {!configured && !showConfig && (
        <button onClick={() => setShowConfig(true)}
          className="w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
          Configurer le suivi de l'ordonnance
        </button>
      )}

      {/* ── Ordonnance annuelle ───────────────────────────────────────────── */}
      {st.annuelle && (
        <div className="border border-gray-100 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-600">📋 Ordonnance annuelle</span>
            <span className="text-[11px] text-gray-400 capitalize">
              {formatDateShort(st.annuelle.fin)}
            </span>
          </div>
          {st.annuelle.expiree ? (
            <p className="text-xs font-semibold text-red-600">
              ⚠️ Expirée — renouvellement spécialiste nécessaire
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-500">
                Reste <strong className="text-gray-800">
                  {st.annuelle.months > 0 && `${st.annuelle.months} mois `}
                  {st.annuelle.days} j
                </strong>
              </p>
              {st.annuelle.warning && (
                <p className="text-[11px] font-semibold text-amber-600 mt-1.5 bg-amber-50 rounded-lg px-2 py-1.5">
                  ⚠️ Prendre RDV avec le psychiatre pour le renouvellement annuel
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Cycle en cours ────────────────────────────────────────────────── */}
      {st.cycle ? (
        <div className="border border-gray-100 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">💊 Cycle en cours</span>
            <button onClick={deleteLastCycle}
              className="text-[10px] text-gray-300 hover:text-red-500">supprimer</button>
          </div>

          {/* Dates saisissables */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] text-gray-400 mb-0.5">Ordonnance</label>
              <input type="date" value={st.cycle.ordonnance}
                onChange={e => e.target.value && patchLastCycle({ ordonnance: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-gray-50 focus:outline-none focus:border-blue-400" />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-gray-400 mb-0.5">Délivrance</label>
              <input type="date" value={st.cycle.delivrance ?? ''} min={st.cycle.ordonnance}
                onChange={e => patchLastCycle({ delivrance: e.target.value || undefined })}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-gray-50 focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          {/* En attente de retrait */}
          {!st.cycle.delivrance && st.cycle.limiteRetrait && (
            <div className={`rounded-lg px-2.5 py-2 text-[11px] leading-relaxed ${
              (st.cycle.joursAvantPerte ?? 0) >= 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
            }`}>
              {(st.cycle.joursAvantPerte ?? 0) >= 0 ? (
                <>Retrait sans perte jusqu'au <strong>{formatDateShort(st.cycle.limiteRetrait)}</strong>
                  {' '}({relDays(st.cycle.joursAvantPerte ?? 0)})</>
              ) : (
                <>⚠️ Délai dépassé de {-(st.cycle.joursAvantPerte ?? 0)} j — délivrance réduite à{' '}
                  <strong>{Math.max(0, RITALINE_DUREE + (st.cycle.joursAvantPerte ?? 0))} gélules</strong> si retrait aujourd'hui</>
              )}
            </div>
          )}

          {/* Délivré */}
          {st.cycle.delivrance && (
            <>
              <div className="flex items-center gap-2 text-[11px]">
                <span className={`px-2 py-0.5 rounded-full font-semibold ${
                  st.cycle.gelules === RITALINE_DUREE ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {st.cycle.gelules} gélules
                </span>
                <span className="text-gray-400">
                  retrait à J+{st.cycle.retard}
                  {st.cycle.gelules !== RITALINE_DUREE && ` · ${RITALINE_DUREE - (st.cycle.gelules ?? 0)} perdues`}
                </span>
              </div>

              <div className="space-y-1 text-[11px] text-gray-500">
                <Row label="Fin de traitement (28ᵉ j)" value={st.cycle.finTraitement!} today={today} />
                <Row label="Retrait au plus tôt"       value={st.cycle.retraitAuPlusTot!} today={today} />
                {st.cycle.retraitDecale && (
                  <div className="flex justify-between items-baseline gap-2 bg-amber-50 rounded-lg px-2 py-1">
                    <span className="text-amber-700">✅ Retrait conseillé</span>
                    <span className="font-semibold text-amber-800 capitalize whitespace-nowrap">
                      {dayName(st.cycle.retraitConseille!)} {formatDateShort(st.cycle.retraitConseille!)}
                    </span>
                  </div>
                )}
              </div>
              {st.cycle.retraitDecale && (
                <p className="text-[10px] text-gray-400 italic leading-relaxed">
                  Décalé : le {formatDateShort(st.cycle.retraitAuPlusTot!)} est
                  {isPharmacyClosed(st.cycle.retraitAuPlusTot!) ? ' fermé' : ' sans jour de repli le lendemain'}.
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <button onClick={newCycle}
          className="w-full py-2.5 rounded-xl bg-blue-500 text-white text-xs font-semibold active:scale-[0.99] transition-transform">
          + Démarrer un cycle
        </button>
      )}

      {/* ── Prochain RDV ──────────────────────────────────────────────────── */}
      {st.cycle?.fenetreRdv && (
        <div className="border border-gray-100 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">📅 Prochain RDV médecin</span>
            <span className="text-[11px] text-gray-400">
              idéal {formatDateShort(st.cycle.fenetreRdv[0])} → {formatDateShort(st.cycle.fenetreRdv[1])}
            </span>
          </div>

          <input type="date" value={st.prochainRdv ?? ''}
            onChange={e => patchLastCycle({ prochainRdv: e.target.value || undefined })}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 focus:outline-none focus:border-blue-400" />

          {st.rdvVerdict === 'ok' && (
            <p className="text-[11px] text-green-700 bg-green-50 rounded-lg px-2.5 py-1.5">
              ✅ Dans la fenêtre — retrait prévu le{' '}
              <strong className="capitalize">{dayName(st.rdvRetraitPrevu!)} {formatDateShort(st.rdvRetraitPrevu!)}</strong>
            </p>
          )}
          {st.rdvVerdict === 'tot' && (
            <p className="text-[11px] text-red-700 bg-red-50 rounded-lg px-2.5 py-1.5 leading-relaxed">
              ⚠️ RDV trop tôt — le retrait ne peut avoir lieu qu'à partir du{' '}
              {formatDateShort(st.cycle.retraitAuPlusTot!)}, l'ordonnance aura trop vieilli :{' '}
              <strong>−{st.rdvGelulesPerdues} gélules</strong>.
              Décale-le au {formatDateShort(st.cycle.fenetreRdv[0])} ou après.
            </p>
          )}
          {st.rdvVerdict === 'tard' && (
            <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 leading-relaxed">
              ⏳ RDV tardif — retrait le{' '}
              <strong className="capitalize">{dayName(st.rdvRetraitPrevu!)} {formatDateShort(st.rdvRetraitPrevu!)}</strong>,
              soit {daysBetween(st.cycle.retraitAuPlusTot!, st.rdvRetraitPrevu!)} j après la date possible.
              {st.stock && (
                st.stock.finAuPire && st.rdvRetraitPrevu! <= st.stock.finAuPire
                  ? ' Ton stock couvre cette date.'
                  : ' ⚠️ Vérifie ton stock ci-dessous.'
              )}
            </p>
          )}
          {!st.prochainRdv && (
            <p className="text-[10px] text-gray-400 italic">
              Note ici le RDV pris chez le médecin : tu seras alerté s'il sort de la fenêtre après un décalage.
            </p>
          )}

          {/* Stock — info secondaire */}
          {st.stock && (
            <p className="text-[10px] text-gray-400 italic leading-relaxed pt-0.5 border-t border-gray-50">
              Stock : <strong className="text-gray-500 not-italic">{st.stock.restant} cachet{st.stock.restant > 1 ? 's' : ''}</strong>
              {st.stock.finAuPire && <> — tient jusqu'au {formatDateShort(st.stock.finAuPire)} au pire (1/j)</>}
              {st.stock.finAuRythme && <>, jusqu'au {formatDateShort(st.stock.finAuRythme)} au rythme actuel
                {' '}({(st.stock.rythme * 7).toFixed(1)}/sem.)</>}
              {st.stock.restant === 0 && ' — épuisé'}
            </p>
          )}
        </div>
      )}

      {/* Nouveau cycle une fois le précédent délivré */}
      {st.cycle?.delivrance && (
        <button onClick={newCycle}
          className="w-full py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          + Nouveau cycle (ordonnance obtenue)
        </button>
      )}

      {/* ── Historique ────────────────────────────────────────────────────── */}
      {cycles.length > 1 && (
        <div>
          <button onClick={() => setShowHistory(o => !o)}
            className="w-full flex items-center justify-between py-1.5 text-[11px] text-gray-400">
            <span>Historique ({cycles.length - 1} cycle{cycles.length > 2 ? 's' : ''})</span>
            <span>{showHistory ? '▲' : '▼'}</span>
          </button>
          {showHistory && (
            <div className="space-y-1">
              {[...cycles.slice(0, -1)].reverse().map(c => {
                const g = ritalineGelules(c)
                return (
                  <div key={c.id} className="flex items-center gap-2 text-[11px] bg-gray-50 rounded-lg px-2.5 py-1.5">
                    <span className="text-gray-500 capitalize">{formatDateShort(c.ordonnance)}</span>
                    <span className="text-gray-300">→</span>
                    <span className="text-gray-500 capitalize">
                      {c.delivrance ? formatDateShort(c.delivrance) : 'non retirée'}
                    </span>
                    {g !== null && (
                      <span className={`ml-auto font-semibold ${g === RITALINE_DUREE ? 'text-green-600' : 'text-amber-600'}`}>
                        {g} gél.
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value, today }: { label: string; value: string; today: string }) {
  const n = daysBetween(today, value)
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span>{label}</span>
      <span className="text-gray-700 font-medium whitespace-nowrap capitalize">
        {formatDateShort(value)}
        <span className="text-gray-300 font-normal ml-1 lowercase">({relDays(n)})</span>
      </span>
    </div>
  )
}
