interface Segment {
  value: number
  color: string
  id: string
}

interface Props {
  segments: Segment[]
  size?: number
  thickness?: number
  centerLabel?: string
  onSegmentClick?: (id: string) => void
  activeId?: string | null
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function arcPath(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number): string {
  const span = endDeg - startDeg
  if (span >= 359.9) {
    // Full circle: draw two half-arcs
    const [ox1, oy1] = polarToXY(cx, cy, outerR, startDeg)
    const [ox2, oy2] = polarToXY(cx, cy, outerR, startDeg + 180)
    const [ix1, iy1] = polarToXY(cx, cy, innerR, startDeg)
    const [ix2, iy2] = polarToXY(cx, cy, innerR, startDeg + 180)
    return `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 1 1 ${ox2} ${oy2} A ${outerR} ${outerR} 0 1 1 ${ox1} ${oy1} M ${ix1} ${iy1} A ${innerR} ${innerR} 0 1 0 ${ix2} ${iy2} A ${innerR} ${innerR} 0 1 0 ${ix1} ${iy1} Z`
  }
  const large = span > 180 ? 1 : 0
  const [ox1, oy1] = polarToXY(cx, cy, outerR, startDeg)
  const [ox2, oy2] = polarToXY(cx, cy, outerR, endDeg)
  const [ix1, iy1] = polarToXY(cx, cy, innerR, startDeg)
  const [ix2, iy2] = polarToXY(cx, cy, innerR, endDeg)
  return `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`
}

export default function DonutChart({ segments, size = 140, thickness = 28, centerLabel, onSegmentClick, activeId }: Props) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const cx = size / 2
  const cy = size / 2
  const outerR = (size - 8) / 2
  const innerR = outerR - thickness

  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#E5E7EB" strokeWidth={thickness} />
        {centerLabel && <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-gray-500 text-sm font-semibold" fontSize="14" fontWeight="600">{centerLabel}</text>}
      </svg>
    )
  }

  let cursor = 0
  const paths = segments
    .filter(s => s.value > 0)
    .map(seg => {
      const span = (seg.value / total) * 360
      const startDeg = cursor
      const endDeg = cursor + span
      cursor += span
      const isActive = activeId === seg.id
      return { seg, startDeg, endDeg, isActive }
    })

  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#F3F4F6" strokeWidth={thickness} />
      {paths.map(({ seg, startDeg, endDeg, isActive }) => (
        <path
          key={seg.id}
          d={arcPath(cx, cy, outerR + (isActive ? 4 : 0), innerR - (isActive ? 2 : 0), startDeg, endDeg)}
          fill={seg.color}
          opacity={activeId && !isActive ? 0.4 : 1}
          onClick={() => onSegmentClick?.(seg.id)}
          style={{ cursor: onSegmentClick ? 'pointer' : 'default', transition: 'opacity 0.2s' }}
        />
      ))}
      {centerLabel && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="15" fontWeight="700" fill="#111827">
          {centerLabel}
        </text>
      )}
    </svg>
  )
}
