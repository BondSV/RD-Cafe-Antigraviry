import React from 'react';
import { VisibleMetrics, ActionFlags } from '../../types/game';
import { useCustomerFlowSimulation, Token, StaffToken, BacklogTicket, Face, VB_W, VB_H, POS, STAGE_LABELS, TOKEN_R, STAFF_R, TICKET_SIZE } from '../../hooks/useCustomerFlowSimulation';

// SVG RENDERING HELPERS
// ============================================================

const FACE_COLORS: Record<Face, string> = {
  happy: '#16A34A',
  neutral: '#D97706',
  sad: '#DC2626',
};

function TokenCircle({ token }: { token: Token }) {
  const color = FACE_COLORS[token.face];
  const r = TOKEN_R;

  if (token.type === 'courier') {
    return (
      <g opacity={token.opacity}>
        <rect
          x={token.x - r * 0.6} y={token.y - r * 0.6}
          width={r * 1.2} height={r * 1.2}
          rx={3} fill="#6366F1" stroke="#4338CA" strokeWidth={0.7}
        />
        <text x={token.x} y={token.y + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={r * 0.7} fill="white" fontWeight={700}>D</text>
      </g>
    );
  }

  const eyeY = token.y - r * 0.15;
  const mouthY = token.y + r * 0.2;
  const eyeSpread = r * 0.22;
  const eyeR = r * 0.09;
  const mouthW = r * 0.25;

  let mouthPath = '';
  if (token.face === 'happy') {
    mouthPath = `M${token.x - mouthW},${mouthY} Q${token.x},${mouthY + r * 0.2} ${token.x + mouthW},${mouthY}`;
  } else if (token.face === 'neutral') {
    mouthPath = `M${token.x - mouthW * 0.8},${mouthY + r * 0.05} L${token.x + mouthW * 0.8},${mouthY + r * 0.05}`;
  } else {
    mouthPath = `M${token.x - mouthW},${mouthY + r * 0.15} Q${token.x},${mouthY - r * 0.05} ${token.x + mouthW},${mouthY + r * 0.15}`;
  }

  return (
    <g opacity={token.opacity}>
      <circle cx={token.x} cy={token.y} r={r} fill={color} stroke={color} strokeWidth={0.5} fillOpacity={0.2} />
      <circle cx={token.x} cy={token.y} r={r} fill="none" stroke={color} strokeWidth={1.5} />
      <circle cx={token.x - eyeSpread} cy={eyeY} r={eyeR} fill={color} />
      <circle cx={token.x + eyeSpread} cy={eyeY} r={eyeR} fill={color} />
      <path d={mouthPath} fill="none" stroke={color} strokeWidth={1} strokeLinecap="round" />
      {token.type === 'cnc' && (
        <text x={token.x} y={token.y - r - 3} textAnchor="middle" fontSize={r * 0.6}
          fill="#6366F1" fontWeight={600} fontFamily="'JetBrains Mono', monospace">C&C</text>
      )}
    </g>
  );
}

function StaffCircle({ staff }: { staff: StaffToken }) {
  return (
    <g>
      <circle cx={staff.x} cy={staff.y} r={STAFF_R}
        fill="#3B82F6" fillOpacity={0.15} stroke="#3B82F6" strokeWidth={1.5} />
      <text x={staff.x} y={staff.y + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={STAFF_R * 0.6} fill="#3B82F6" fontWeight={700} fontFamily="'JetBrains Mono', monospace">
        {staff.label}
      </text>
    </g>
  );
}

function TicketIcon({ ticket }: { ticket: BacklogTicket }) {
  const s = TICKET_SIZE;
  return (
    <g opacity={ticket.opacity}>
      <rect x={ticket.x} y={ticket.y} width={s} height={s * 1.3}
        rx={2} fill="#FEF3C7" stroke="#D97706" strokeWidth={0.7} />
      <line x1={ticket.x + 3} y1={ticket.y + 4} x2={ticket.x + s - 3} y2={ticket.y + 4}
        stroke="#D97706" strokeWidth={0.5} />
      <line x1={ticket.x + 3} y1={ticket.y + 8} x2={ticket.x + s - 4} y2={ticket.y + 8}
        stroke="#D97706" strokeWidth={0.5} />
    </g>
  );
}

// ============================================================


// ============================================================
// MAIN COMPONENT
// ============================================================

interface Props {
  metrics: VisibleMetrics;
  flags: ActionFlags;
  triggerKey: number;
}

export default function CustomerFlowSimulation({ metrics, flags, triggerKey }: Props) {
  const { state } = useCustomerFlowSimulation(metrics, flags, triggerKey);

  if (!state) return null;

  const { tokens, staffTokens, backlog, rates, completedTicks, lostTicks } = state;
  const showMachine2 = rates.staffConfig.machines >= 2;
  const showTill2 = rates.staffConfig.tills >= 2;

  // Orders and lost per sim-hour (moving average, display after 10 sim-minutes)
  const SIM_HOUR = 9600;
  const MIN_DISPLAY_TICKS = 1600; // 10 sim-minutes
  let ordersPerHourText = '';
  let lostPerHourText = '';
  if (state.tick >= MIN_DISPLAY_TICKS) {
    const windowTicks = Math.min(state.tick, SIM_HOUR);
    const recentCount = completedTicks.filter((t: number) => t > state.tick - SIM_HOUR).length;
    ordersPerHourText = ` | Orders/hr: ${Math.round(recentCount * SIM_HOUR / windowTicks)}`;
    const recentLost = lostTicks.filter((t: number) => t > state.tick - SIM_HOUR).length;
    lostPerHourText = ` | Lost/hr: ${Math.round(recentLost * SIM_HOUR / windowTicks)}`;
  }

  return (
    <div className="w-full bg-white rounded-xl border border-border-default shadow-md overflow-hidden">
      <h3 className="px-4 py-2 font-sans text-xs font-semibold text-text-muted uppercase tracking-[0.12em] border-b border-border-default/50 bg-white">
        Customer Flow — Peak Hour
      </h3>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full"
        style={{ height: 'auto', minHeight: 240, maxHeight: 380 }}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width={VB_W} height={VB_H} fill="#FAFAFA" />

        {/* Counter line */}
        <line
          x1={POS.foodPrep.x - 40} y1={POS.counterY}
          x2={POS.machine2.x + 40} y2={POS.counterY}
          stroke="#94A3B8" strokeWidth={2} strokeDasharray="6 3"
        />
        <text x={(POS.foodPrep.x + POS.machine2.x) / 2} y={POS.counterY - 8}
          textAnchor="middle" fontSize={12} fill="#94A3B8"
          fontFamily="'JetBrains Mono', monospace" fontWeight={500} letterSpacing="0.15em">
          COUNTER
        </text>

        {/* Customer journey path (dotted line) */}
        <path
          d={`M${POS.enter.x},${POS.enter.y} L${POS.waiting.x},${POS.waiting.y}`}
          stroke="#E2E8F0" strokeWidth={1} strokeDasharray="4 4" fill="none"
        />
        {/* Return path: UP from waiting, then LEFT to exit — matches token movement */}
        <path
          d={`M${POS.waiting.x},${POS.waiting.y} L${POS.waiting.x},${POS.exit.y} L${POS.exit.x},${POS.exit.y}`}
          stroke="#E2E8F0" strokeWidth={1} strokeDasharray="4 4" fill="none"
        />
        {/* Bounce path: decision → exit */}
        <path
          d={`M${POS.decision.x},${POS.decision.y} L${POS.exit.x},${POS.exit.y}`}
          stroke="#FCA5A5" strokeWidth={0.5} strokeDasharray="3 3" fill="none" opacity={0.5}
        />

        {/* Stage labels — inside rounded rects, ~2x size */}
        {STAGE_LABELS.map(({ pos, label }) => (
          <g key={label}>
            <rect x={pos.x - 44} y={pos.y + 18} width={88} height={28} rx={6}
              fill="white" stroke="#CBD5E1" strokeWidth={0.7} />
            <text x={pos.x} y={pos.y + 32} textAnchor="middle" dominantBaseline="middle" fontSize={18}
              fill="#475569" fontFamily="'DM Sans', sans-serif" fontWeight={600}>
              {label}
            </text>
          </g>
        ))}

        {/* Till stage label — dynamically sized to cover 1 or 2 tills */}
        {(() => {
          const tillCenterX = showTill2 ? (POS.till.x + POS.till2.x) / 2 : POS.till.x;
          const tillWidth = showTill2 ? 160 : 88;
          return (
            <g>
              <rect x={tillCenterX - tillWidth / 2} y={POS.till.y + 18} width={tillWidth} height={28} rx={6}
                fill="white" stroke="#CBD5E1" strokeWidth={0.7} />
              <text x={tillCenterX} y={POS.till.y + 32} textAnchor="middle" dominantBaseline="middle" fontSize={18}
                fill="#475569" fontFamily="'DM Sans', sans-serif" fontWeight={600}>
                Till
              </text>
            </g>
          );
        })()}

        {/* Pickup stage label — wider to cover waiting positions */}
        <g>
          <rect x={POS.waiting.x - 10} y={POS.waiting.y + 18} width={130} height={28} rx={6}
            fill="white" stroke="#CBD5E1" strokeWidth={0.7} />
          <text x={POS.waiting.x + 55} y={POS.waiting.y + 32} textAnchor="middle" dominantBaseline="middle" fontSize={18}
            fill="#475569" fontFamily="'DM Sans', sans-serif" fontWeight={600}>
            Pickup
          </text>
        </g>

        {/* Behind-counter stations — labels inside rects, ~2x font size */}
        <rect x={POS.foodPrep.x - 48} y={POS.foodPrep.y - 22} width={96} height={44}
          rx={6} fill="#F0FDF4" stroke="#86EFAC" strokeWidth={1} />
        <text x={POS.foodPrep.x} y={POS.foodPrep.y} textAnchor="middle" dominantBaseline="middle"
          fontSize={18} fill="#22C55E" fontFamily="'DM Sans', sans-serif" fontWeight={600}>
          Food Prep
        </text>

        <rect x={POS.tillStation.x - 38} y={POS.tillStation.y - 22} width={76} height={44}
          rx={6} fill="#EFF6FF" stroke="#93C5FD" strokeWidth={1} />
        <text x={POS.tillStation.x} y={POS.tillStation.y} textAnchor="middle" dominantBaseline="middle"
          fontSize={18} fill="#3B82F6" fontFamily="'DM Sans', sans-serif" fontWeight={600}>
          {showTill2 ? 'Till 1' : 'Till'}
        </text>

        {showTill2 && (
          <>
            <rect x={POS.tillStation2.x - 38} y={POS.tillStation2.y - 22} width={76} height={44}
              rx={6} fill="#EFF6FF" stroke="#93C5FD" strokeWidth={1} />
            <text x={POS.tillStation2.x} y={POS.tillStation2.y} textAnchor="middle" dominantBaseline="middle"
              fontSize={18} fill="#3B82F6" fontFamily="'DM Sans', sans-serif" fontWeight={600}>
              Till 2
            </text>
          </>
        )}

        <rect x={POS.machine1.x - 38} y={POS.machine1.y - 22} width={76} height={44}
          rx={6} fill="#FEF3C7" stroke="#FCD34D" strokeWidth={1} />
        <text x={POS.machine1.x} y={POS.machine1.y} textAnchor="middle" dominantBaseline="middle"
          fontSize={18} fill="#D97706" fontFamily="'DM Sans', sans-serif" fontWeight={600}>
          Coffee 1
        </text>

        {showMachine2 && (
          <>
            <rect x={POS.machine2.x - 38} y={POS.machine2.y - 22} width={76} height={44}
              rx={6} fill="#FEF3C7" stroke="#FCD34D" strokeWidth={1} />
            <text x={POS.machine2.x} y={POS.machine2.y} textAnchor="middle" dominantBaseline="middle"
              fontSize={18} fill="#D97706" fontFamily="'DM Sans', sans-serif" fontWeight={600}>
              Coffee 2
            </text>
          </>
        )}

        {/* Backlog tickets */}
        {backlog.map((ticket: BacklogTicket) => (
          <TicketIcon key={ticket.id} ticket={ticket} />
        ))}

        {/* Staff tokens */}
        {staffTokens.map((staff: StaffToken) => (
          <StaffCircle key={staff.id} staff={staff} />
        ))}

        {/* Customer tokens */}
        {tokens.map((token: Token) => (
          <TokenCircle key={token.id} token={token} />
        ))}

        {/* Stats overlay — ~2x font size */}
        <text x={VB_W - 10} y={22} textAnchor="end" fontSize={20}
          fill="#94A3B8" fontFamily="'JetBrains Mono', monospace">
          Queue: {tokens.filter((t: Token) => t.state === 'queuing').length} |
          Waiting: {tokens.filter((t: Token) => t.state === 'waiting').length} |
          Backlog: {backlog.length}{ordersPerHourText}{lostPerHourText}
        </text>
      </svg>
    </div>
  );
}
