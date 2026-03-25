import React from 'react';
import { VisibleMetrics, ActionFlags } from '../../types/game';
import { useCustomerFlowSimulation, Token, StaffToken, BacklogTicket, Face, VB_W, VB_H, POS, STAGE_LABELS, TOKEN_R, STAFF_R } from '../../hooks/useCustomerFlowSimulation';

// ============================================================
// TOP DOWN HIGH FIDELITY RENDERER
// ============================================================

const FACE_THEME: Record<Face, string> = {
  happy: '#22C55E', 
  neutral: '#F59E0B', 
  sad: '#EF4444', 
};

// Generates an illustrative top-down avatar (Overcooked style)
function IllustrativeAvatar({ token, isStaff = false }: { token: any, isStaff?: boolean }) {
  const rRound = isStaff ? STAFF_R + 8 : TOKEN_R + 6;
  const opacity = token.opacity ?? 1;

  // Colors
  const skinTone = '#FCD34D'; // Simple generic skin tone
  const shirtColor = isStaff ? '#3B82F6' : (token.type === 'courier' ? '#8B5CF6' : (FACE_THEME[token.face as Face] || '#94A3B8'));
  const headSize = rRound * 0.55;
  const shoulderWidth = rRound * 1.6;
  const shoulderHeight = rRound * 0.8;

  const isBusy = isStaff && (token.animState === 'serving' || token.animState === 'making');

  return (
    <g opacity={opacity} transform={`translate(${token.x}, ${token.y})`}>
      {/* Soft drop shadow */}
      <ellipse cx={0} cy={6} rx={rRound * 0.9} ry={rRound * 0.9} fill="rgba(0,0,0,0.15)" filter="blur(3px)" />
      
      {/* Shoulders (Shirt) */}
      <rect x={-shoulderWidth / 2} y={-shoulderHeight / 2} width={shoulderWidth} height={shoulderHeight} rx={shoulderHeight / 2} fill={shirtColor} stroke="rgba(0,0,0,0.1)" strokeWidth={1} />
      
      {/* Apron for staff */}
      {isStaff && (
        <path d={`M${-shoulderWidth * 0.3},${-shoulderHeight * 0.4} Q0,${-shoulderHeight * 0.6} ${shoulderWidth * 0.3},${-shoulderHeight * 0.4} L${shoulderWidth * 0.4},${shoulderHeight * 0.5} L${-shoulderWidth * 0.4},${shoulderHeight * 0.5} Z`} fill="#FFFFFF" opacity={0.9} />
      )}

      {/* Head */}
      <circle cx={0} cy={0} r={headSize} fill={skinTone} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />

      {/* Face (optional or abstracted, let's keep it clean, maybe just a hat for staff) */}
      {isStaff && (
        <path d={`M${-headSize * 0.8},${-headSize * 0.2} Q0,${-headSize * 1.5} ${headSize * 0.8},${-headSize * 0.2} Z`} fill="#1E40AF" />
      )}

      {/* Customer Mood Indicator (floating above head) */}
      {!isStaff && token.face && (
        <circle cx={0} cy={-headSize - 6} r={4} fill={FACE_THEME[token.face as Face]} />
      )}

      {/* Courier/C&C Badges */}
      {!isStaff && token.type === 'cnc' && (
        <g transform="translate(0, -18)">
          <rect x={-12} y={-6} width={24} height={12} rx={2} fill="#6366F1" />
          <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="white" fontWeight="bold">C&C</text>
        </g>
      )}
      {!isStaff && token.type === 'courier' && (
        <g transform="translate(0, 0)">
           <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="white" fontWeight="bold">D</text>
        </g>
      )}

      {isStaff && (
        <text x={0} y={isBusy ? -rRound : rRound + 12} textAnchor="middle" fontSize={10} fill="#475569" fontWeight="bold">
          {token.label}
        </text>
      )}

      {/* Busy indicator for staff */}
      {isBusy && (
        <circle cx={0} cy={0} r={rRound * 1.3} fill="none" stroke="#3B82F6" strokeWidth={2} strokeDasharray="4 4" className="spinner-animation" />
      )}
    </g>
  );
}

// Highly detailed vector station graphics
function IllustrativePrepStation({ x, y, width, height }: any) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={width} height={height} rx={6} fill="#E1C699" stroke="#C2A370" strokeWidth={2} />
      {/* Cutting board */}
      <rect x={10} y={10} width={30} height={40} rx={4} fill="#FDE68A" stroke="#D97706" />
      <line x1={20} y1={20} x2={35} y2={20} stroke="#92400E" strokeWidth={2} strokeLinecap="round" />
      <line x1={20} y1={25} x2={30} y2={25} stroke="#92400E" strokeWidth={2} strokeLinecap="round" />
      {/* Knife */}
      <path d="M12,40 L16,40 L16,30 L14,25 L12,25 Z" fill="#94A3B8" />
      <rect x={13} y={35} width={2} height={8} fill="#475569" />
      {/* Bowls */}
      <circle cx={60} cy={20} r={10} fill="#FFFFFF" stroke="#CBD5E1" />
      <circle cx={60} cy={20} r={6} fill="#EF4444" />
      <circle cx={80} cy={40} r={12} fill="#FFFFFF" stroke="#CBD5E1" />
      <circle cx={80} cy={40} r={8} fill="#10B981" />
      <text x={width/2} y={height + 15} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#64748B">PREP STATION</text>
    </g>
  );
}

function IllustrativeTillStation({ x, y, width, height, label }: any) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={width} height={height} rx={6} fill="#E1C699" stroke="#C2A370" strokeWidth={2} />
      {/* Cash Register / POS iPad */}
      <rect x={width/2 - 20} y={height/2 - 15} width={40} height={30} rx={2} fill="#1E293B" />
      <rect x={width/2 - 18} y={height/2 - 13} width={36} height={26} fill="#FFFFFF" />
      {/* UI lines on screen */}
      <line x1={width/2 - 14} y1={height/2 - 8} x2={width/2 + 14} y2={height/2 - 8} stroke="#E2E8F0" strokeWidth={2} />
      <line x1={width/2 - 14} y1={height/2 - 2} x2={width/2 + 5} y2={height/2 - 2} stroke="#E2E8F0" strokeWidth={2} />
      <rect x={width/2 - 14} y={height/2 + 4} width={10} height={6} rx={1} fill="#3B82F6" />
      
      {/* Payment Terminal */}
      <rect x={width/2 + 25} y={height/2} width={12} height={20} rx={2} fill="#475569" />
      <rect x={width/2 + 26} y={height/2 + 2} width={10} height={8} fill="#94A3B8" />

      <text x={width/2} y={height + 15} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#64748B">{label}</text>
    </g>
  );
}

function IllustrativeCoffeeMachine({ x, y, width, height, label }: any) {
  return (
    <g transform={`translate(${x}, ${y})`}>
       <rect width={width} height={height} rx={6} fill="#E1C699" stroke="#C2A370" strokeWidth={2} />
       {/* Machine Body */}
       <rect x={10} y={10} width={width-20} height={height-20} rx={4} fill="#CBD5E1" stroke="#94A3B8" strokeWidth={2} />
       <rect x={15} y={15} width={width-30} height={15} fill="#475569" />
       {/* Drip Tray */}
       <rect x={20} y={height-20} width={width-40} height={10} fill="#94A3B8" />
       {/* Portafilters & Group Heads */}
       <circle cx={35} cy={height-20} r={6} fill="#334155" />
       <rect x={32} y={height-15} width={6} height={12} fill="#1E293B" />
       <circle cx={width-35} cy={height-20} r={6} fill="#334155" />
       <rect x={width-38} y={height-15} width={6} height={12} fill="#1E293B" />
       {/* Steam Wand */}
       <path d={`M${width-15},25 Q${width-5},35 ${width-15},45`} stroke="#E2E8F0" strokeWidth={3} fill="none" strokeLinecap="round" />

       <text x={width/2} y={height + 15} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#64748B">{label}</text>
    </g>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

interface Props {
  metrics: VisibleMetrics;
  flags: ActionFlags;
  triggerKey: number;
}

export default function CustomerFlowSimulationTopDown({ metrics, flags, triggerKey }: Props) {
  const { state } = useCustomerFlowSimulation(metrics, flags, triggerKey);

  if (!state) return null;

  const { tokens, staffTokens, backlog, rates } = state;
  const showMachine2 = rates.staffConfig.machines >= 2;
  const showTill2 = rates.staffConfig.tills >= 2;

  return (
    <div className="w-full bg-white rounded-xl border border-border-default shadow-md overflow-hidden mt-6 relative">
      <h3 className="px-4 py-2 font-sans text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-border-default/50 bg-white absolute top-0 w-full z-10 flex justify-between">
        <span>Illustrative High-Fidelity Simulator</span>
        <span>Queue: {tokens.filter(t => t.state === 'queuing').length}</span>
      </h3>
      
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-full"
        style={{ height: 'auto', minHeight: 400, maxHeight: 550, marginTop: '30px' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Rich Tiled Floor Pattern */}
          <pattern id="overcookedTile" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#FFF7ED" />
            <rect width="20" height="20" fill="#FFE4E6" />
            <rect x="20" y="20" width="20" height="20" fill="#FFE4E6" />
            <line x1="0" y1="20" x2="40" y2="20" stroke="#FFEDD5" strokeWidth="1" />
            <line x1="20" y1="0" x2="20" y2="40" stroke="#FFEDD5" strokeWidth="1" />
          </pattern>
          {/* Wood Floor Pattern for back area */}
          <pattern id="woodFloor" x="0" y="0" width="20" height="60" patternUnits="userSpaceOnUse">
            <rect width="20" height="60" fill="#FDE68A" stroke="#D97706" strokeWidth={0.5} />
          </pattern>
        </defs>
        
        {/* Playable Area Floor */}
        <rect width="100%" height="100%" fill="url(#overcookedTile)" />

        {/* Cafe Back-Area Floor */}
        <rect x={POS.foodPrep.x - 70} y={POS.counterY - 10} width={VB_W} height={VB_H} fill="url(#woodFloor)" />

        {/* Counter dividing line & overhang */}
        <rect
          x={POS.foodPrep.x - 70} y={POS.counterY - 10}
          width={VB_W - POS.foodPrep.x + 70} height={20}
          fill="#B45309" stroke="#92400E" strokeWidth={2}
          rx={4}
        />

        {/* Route Paths */}
        <path
          d={`M${POS.enter.x},${POS.enter.y} L${POS.waiting.x},${POS.waiting.y}`}
          stroke="#CBD5E1" strokeWidth={3} strokeDasharray="6 6" fill="none"
        />

        {/* Detailed Stations */}
        <IllustrativePrepStation x={POS.foodPrep.x - 50} y={POS.foodPrep.y - 30} width={100} height={60} />
        
        <IllustrativeTillStation x={POS.tillStation.x - 45} y={POS.tillStation.y - 30} width={90} height={60} label={showTill2 ? "TILL 1" : "TILL"} />
        {showTill2 && (
          <IllustrativeTillStation x={POS.tillStation2.x - 45} y={POS.tillStation2.y - 30} width={90} height={60} label="TILL 2" />
        )}
        
        <IllustrativeCoffeeMachine x={POS.machine1.x - 45} y={POS.machine1.y - 30} width={90} height={60} label="ESPRESSO 1" />
        {showMachine2 && (
          <IllustrativeCoffeeMachine x={POS.machine2.x - 45} y={POS.machine2.y - 30} width={90} height={60} label="ESPRESSO 2" />
        )}

        {/* Tickets */}
        {backlog.map((ticket: any) => (
          <g key={`tkt-${ticket.id}`} opacity={ticket.opacity} transform={`translate(${ticket.x}, ${ticket.y})`}>
            <rect x={-8} y={-10} width={16} height={20} rx={1} fill="#FFF" stroke="#CBD5E1" filter="drop-shadow(1px 2px 2px rgba(0,0,0,0.1))" />
            <line x1={-4} y1={-4} x2={4} y2={-4} stroke="#94A3B8" strokeWidth={1} />
            <line x1={-4} y1={0} x2={2} y2={0} stroke="#94A3B8" strokeWidth={1} />
          </g>
        ))}

        {/* Staff & Tokens */}
        {staffTokens.map(staff => (
          <IllustrativeAvatar key={`staff-${staff.id}`} token={staff} isStaff />
        ))}
        {tokens.map(token => (
          <IllustrativeAvatar key={`tok-${token.id}`} token={token} />
        ))}

      </svg>
      <style>{`
        @keyframes spinPulse {
          0% { transform: rotate(0deg); opacity: 1; }
          50% { opacity: 0.5; }
          100% { transform: rotate(360deg); opacity: 1; }
        }
        .spinner-animation {
          animation: spinPulse 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
