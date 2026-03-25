import React from 'react';
import { VisibleMetrics, ActionFlags } from '../../types/game';
import { useCustomerFlowSimulation, Token, StaffToken, BacklogTicket, Face, VB_W, VB_H, POS } from '../../hooks/useCustomerFlowSimulation';

// ============================================================
// IMAGE 1 EXACT REPLICA (STANDING 3D DIORAMA)
// ============================================================

const FACE_COLORS: Record<Face, string> = {
  happy: '#FCD34D',
  neutral: '#EAC54F',
  sad: '#D9B749',
};

// Represents the thick, white physical plastic labels on the floor
function PhysicalBadge({ x, y, width, height, text }: { x: number, y: number, width: number, height: number, text: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-width/2} y={-height/2} width={Math.max(0, width)} height={Math.max(0, height)} rx={Math.max(0, height / 2)} fill="#F8FAFC" filter="url(#dropShadowSmooth)" />
      {/* Glossy inner bevel */}
      <rect x={-width/2} y={-height/2} width={Math.max(0, width)} height={Math.max(0, height)} rx={Math.max(0, height / 2)} fill="url(#glossHighlight)" />
      {/* 3D lip */}
      <path d={`M${-width/2+height/2},${height/2-2} L${width/2-height/2},${height/2-2} A${height/2-2},${height/2-2} 0 0,0 ${width/2-2},0 L${-width/2+2},0 A${height/2-2},${height/2-2} 0 0,0 ${-width/2+height/2},${height/2-2}`} fill="rgba(0,0,0,0.05)" />
      
      <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight="600" fill="#1E293B">{text}</text>
    </g>
  );
}
// Generates a standing 2D sprite based on the processed texture atlas
// Generates a standing 2D sprite based on the processed texture atlas
function StandingAvatar({ token, isStaff = false }: { token: any, isStaff?: boolean }) {
  const opacity = token.state === 'exited' ? token.opacity : (token.state === 'arriving' ? (Math.min(100, 100 - token.x)/100 || 1) : 1);
  
  // Hash string IDs (staff) or use numeric IDs (customers) to create a consistent deterministic seed
  const numId = typeof token.id === 'string' ? token.id.split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0) : token.id;
  const seed = numId % (isStaff ? 4 : 78);
  const spritePath = isStaff ? `/assets/sprites/staff-${seed}.png` : `/assets/sprites/customer-${seed}.png`;
  
  const isBusy = isStaff && (token.animState === 'serving' || token.animState === 'making');

  // Track velocity to flip character direction
  const prevX = React.useRef(token.x);
  const isFlipped = React.useRef(false);

  if (token.x < prevX.current - 0.1) {
    // Moving Left
    isFlipped.current = isStaff ? false : true; // Staff faces Top-Left naturally. Customers face Bottom-Right naturally.
  } else if (token.x > prevX.current + 0.1) {
    // Moving Right
    isFlipped.current = isStaff ? true : false;
  }
  prevX.current = token.x;

  // We anchor the image's bottom center to their feet at (0,0)
  return (
    <g opacity={opacity} transform={`translate(${token.x}, ${token.y})`}>
      {/* Dynamic floor shadow stretching slightly left/back (like Image 1) */}
      <ellipse cx={-4} cy={2} rx={14} ry={6} fill="rgba(0,0,0,0.5)" filter="blur(3px)" transform="rotate(-15)" />
      
      {/* Sprite Image wrapped in foreignObject for reliable rendering */}
      <foreignObject x={-20} y={-85} width={40} height={90}>
        <img 
           src={spritePath} 
           alt="sprite"
           style={{
             width: '100%',
             height: '100%',
             objectFit: 'contain',
             objectPosition: 'bottom center',
             // Mirror based on active frame velocity
             transform: isFlipped.current ? 'scaleX(-1)' : 'none'
           }}
        />
      </foreignObject>
      
      {/* Badges/Moods hovering over head */}
      {!isStaff && token.face && (
        <circle cx={-12} cy={-60} r={5} fill={FACE_COLORS[token.face as Face]} />
      )}
      
      {!isStaff && token.type === 'cnc' && (
        <rect x={-10} y={-68} width={20} height={10} rx={2} fill="#6366F1" />
      )}
      {!isStaff && token.type === 'courier' && (
        <rect x={-10} y={-68} width={20} height={10} rx={2} fill="#8B5CF6" />
      )}

      {isStaff && (
        <text x={0} y={-70} textAnchor="middle" fontSize={10} fill="#FFF" fontWeight="bold" filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.8))">
          {token.label}
        </text>
      )}

      {isBusy && (
        <g transform="translate(-15, 12)">
          <rect x={0} y={0} width={30} height={4} rx={2} fill="#E2E8F0" stroke="#94A3B8" strokeWidth={1} />
          <rect x={0} y={0} width={30} height={4} rx={2} fill="#3B82F6">
             <animate attributeName="width" values="0; 30" dur="1.5s" repeatCount="indefinite" />
          </rect>
        </g>
      )}
    </g>
  );
}

// 3D Counter Block: Draws the top face and front face.
function BlockCounter({ x, y, width, depth, zHeight, topColor, frontColor, showWood = false, label }: any) {
  // x, y is the top-left of the top face.
  // The front face drops down from the bottom edge of the top face.
  return (
    <g transform={`translate(${x}, ${y})`}>
       {/* Heavy drop shadow of the whole counter */}
       <rect x={-5} y={5} width={width} height={depth + zHeight} rx={4} fill="transparent" filter="url(#heavyShadow)" />
       
       {/* Front Face (Drops down) */}
       <g transform={`translate(0, ${depth})`}>
         <rect width={width} height={zHeight} rx={4} fill={frontColor} />
         {showWood && (
           <image href="/assets/wood_texture.png" x="0" y="0" width={width} height={zHeight} preserveAspectRatio="none" opacity={0.6} style={{ mixBlendMode: 'multiply' }} clipPath="url(#frontClip)" />
         )}
         {/* Base trim */}
         <rect x="0" y={zHeight - 5} width={width} height="5" fill="rgba(0,0,0,0.3)" />
       </g>

       {/* Top Face */}
       <rect width={Math.max(0, width)} height={Math.max(0, depth)} rx={2} fill={topColor} />
       {/* Top Face inner bevel */}
       <rect x="1" y="1" width={Math.max(0, width-2)} height={Math.max(0, depth-2)} rx="2" fill="url(#glossHighlight)" />
       <rect width={Math.max(0, width)} height={Math.max(0, depth)} rx={2} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
       <rect x={x} y={y} width={width} height={depth} rx={4} fill={topColor} />
       
       {/* Premium Bevel Line connecting top to front */}
       <line x1={x} y1={y + depth - 2} x2={x + width} y2={y + depth - 2} stroke="#FFFFFF" strokeWidth={1} opacity={0.5} />
       
       {/* Front Face Extrusion */}
       <rect x={x} y={y + depth - 2} width={width} height={zHeight} fill={frontColor} />
       
       {/* Internal Shadow for depth on front face */}
       <rect x={x} y={y + depth - 2} width={width} height={8} fill="url(#gradientShadow)" />

       {/* Optional Wood Panel inset */}
       {showWood && (
         <rect x={x + 4} y={y + depth} width={width - 8} height={zHeight - 4} rx={2} fill="#A16207" />
       )}

       {/* Elegant integrated typography (replaces PhysicalBadge) */}
       {label && (
         <text x={x + width / 2} y={y + depth + zHeight / 2} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="700" fill={showWood ? "#FEF3C7" : "#0F172A"} opacity={0.8} letterSpacing="1px" className="uppercase">{label}</text>
       )}
    </g>
  );
}

// Sleek Premium Espresso Machine (Silver & Matte Black)
function EspressoMachine3D({ x, y, width, depth }: any) {
  return (
    <g transform={`translate(${x}, ${y})`}>
       {/* Machine Base Shadow */}
       <rect x={2} y={15} width={width-4} height={12} rx={2} fill="rgba(0,0,0,0.3)" filter="url(#dropShadowSmooth)" />
       
       {/* Shiny Metallic Body */}
       <rect x={0} y={10} width={width} height={depth-10} rx={4} fill="#94A3B8" />
       
       {/* Top Heating Tray (Matte Black) */}
       <rect x={2} y={10} width={width-4} height={depth-16} fill="#334155" />
       
       {/* Front Chrome Panel */}
       <rect x={0} y={depth-2} width={width} height={16} rx={2} fill="#CBD5E1" />
       <rect x={0} y={depth-2} width={width} height={4} fill="rgba(255,255,255,0.4)" />
       
       {/* Group Heads */}
       <rect x={20} y={depth+2} width={12} height={8} rx={2} fill="#0F172A" />
       <circle cx={26} cy={depth+12} r={3} fill="#64748B" />
       
       <rect x={width-32} y={depth+2} width={12} height={8} rx={2} fill="#0F172A" />
       <circle cx={width-26} cy={depth+12} r={3} fill="#64748B" />
       
       {/* Matte Black Grinder Tower */}
       <rect x={width-60} y={0} width={16} height={20} rx={2} fill="#1E293B" filter="url(#dropShadowSmooth)" />
       <polygon points={`${width-60},20 ${width-50},20 ${width-54},32 ${width-56},32`} fill="#0F172A" />
       <rect x={width-58} y={32} width={12} height={8} rx={1} fill="#64748B" />
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

class DioramaErrorBoundary extends React.Component<{children: any}, {error: any}> {
  constructor(props: any) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: any) { return { error }; }
  render() {
    if (this.state.error) return (
      <div className="w-full bg-red-900 text-white p-4 rounded-3xl mt-6">
        <h2 className="text-xl font-bold">Diorama Render Crash</h2>
        <pre className="mt-4 text-xs overflow-auto">{this.state.error.message}</pre>
        <pre className="mt-2 text-xs overflow-auto text-red-300">{this.state.error.stack}</pre>
      </div>
    );
    return this.props.children;
  }
}

export default function CustomerFlowSimulationIsoWrapper(props: Props) {
  return <DioramaErrorBoundary><CustomerFlowSimulationIso {...props} /></DioramaErrorBoundary>;
}

function CustomerFlowSimulationIso({ metrics, flags, triggerKey }: Props) {
  const { state } = useCustomerFlowSimulation(metrics, flags, triggerKey);

  if (!state) return null;
  console.log("3D Diorama render triggered normally.");

  const { tokens, staffTokens, backlog, rates } = state;
  const showMachine2 = rates.staffConfig.machines >= 2;
  const showTill2 = rates.staffConfig.tills >= 2;

  // We skew the background grid coordinates smoothly to map to Image 1's architecture.
  
  const COUNTER_Z = 35; // How tall the counters are
  // Pushing path +100 brings the inbound queue (y=270) right behind the counters (y=295), 
  // and the return path (y=150) comfortably into the playing field.
  const PATH_Y_OFFSET = 100;

  // Sorting strictly by physical visual baseline Y for flawless 2.5D occlusion
  const allEntities = [
    // Customers visual feet: y + 50 + 100 = y + 150
    ...tokens.map(t => ({ ...t, sortY: t.y + 50 + PATH_Y_OFFSET, typeCat: 'token' })),
    // Staff visual feet: y + 60
    ...staffTokens.map(s => ({ ...s, sortY: s.y + 60, typeCat: 'staff' })),
    // Backlog ticket visual baseline: y + 50 + 100 = y + 150
    ...backlog.map((b: any) => ({ ...b, sortY: b.y + 50 + PATH_Y_OFFSET, typeCat: 'ticket' })),
    // Counters conceptual baseline is y + depth (depth is 50, POS.y - 15 + 50 = POS.y + 35)
    { id: 'prep', sortY: POS.foodPrep.y + 35, typeCat: 'counter' },
    { id: 'till1', sortY: POS.tillStation.y + 35, typeCat: 'counter' },
    { id: 'coffee1', sortY: POS.machine1.y + 35, typeCat: 'counter' },
    ...(showTill2 ? [{ id: 'till2', sortY: POS.tillStation2.y + 35, typeCat: 'counter' }] : []),
    ...(showMachine2 ? [{ id: 'coffee2', sortY: POS.machine2.y + 35, typeCat: 'counter' }] : []),
  ].sort((a, b) => a.sortY - b.sortY);

  return (
    <div className="w-full relative rounded-[2rem] overflow-hidden bg-[#F1F5F9] shadow-inner border border-slate-200 mt-6 pb-2">
      <svg
        viewBox={`0 -60 ${VB_W} ${VB_H + 110}`}
        className="w-full h-auto block"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Simple crisp architectural solid floor */}
          <linearGradient id="floorVignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Core shadows */}
          <filter id="heavyShadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="-2" dy="8" stdDeviation="5" floodColor="#000" floodOpacity="0.2" />
          </filter>

          <filter id="dropShadowSmooth" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="-1" dy="3" stdDeviation="2" floodColor="#000" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Crisp Studio Backdrop */}
        <rect x="-20%" y="-20%" width="140%" height="140%" fill="url(#floorVignette)" />

        {/* Pathing - Shifted so queue lines up behind counters */}
        <g transform={`translate(0, ${PATH_Y_OFFSET})`}>
          <path
            d={`M${POS.enter.x},${POS.enter.y} L${POS.waiting.x},${POS.waiting.y} L${POS.waiting.x},${POS.exit.y} L${POS.exit.x},${POS.exit.y}`}
            stroke="rgba(0,0,0,0.1)" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(0, 3)"
          />
          <path
            d={`M${POS.enter.x},${POS.enter.y} L${POS.waiting.x},${POS.waiting.y} L${POS.waiting.x},${POS.exit.y} L${POS.exit.x},${POS.exit.y}`}
            stroke="#F8FAFC" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none"
          />
          <path
            d={`M${POS.enter.x},${POS.enter.y - 12} L${POS.waiting.x + 12},${POS.waiting.y - 12} L${POS.waiting.x + 12},${POS.exit.y + 12} L${POS.exit.x},${POS.exit.y + 12}`}
            stroke="#475569" strokeWidth={2} strokeDasharray="8 8" fill="none" opacity={0.6}
          />
          
          <PhysicalBadge x={POS.enter.x} y={POS.enter.y + 35} width={80} height={30} text="ENTER" />
          <PhysicalBadge x={POS.exit.x} y={POS.exit.y - 35} width={80} height={30} text="EXIT" />
        </g>

        {/* ==================== UNITY Z-SORTED ENTITIES & COUNTERS ==================== */}
        {allEntities.map((ent: any) => {
          if (ent.typeCat === 'counter') {
             if (ent.id === 'prep') return (
                <g key={ent.id} id="prep">
                   <BlockCounter x={POS.foodPrep.x - 70} y={POS.foodPrep.y - 15} width={150} depth={50} zHeight={COUNTER_Z} topColor="#F8FAFC" frontColor="#D4D4D4" showWood={true} label="Food Prep" />
                   <circle cx={POS.foodPrep.x - 40} cy={POS.foodPrep.y + 5} r={8} fill="#22C55E" filter="url(#dropShadowSmooth)" />
                   <circle cx={POS.foodPrep.x - 20} cy={POS.foodPrep.y + 10} r={6} fill="#EF4444" filter="url(#dropShadowSmooth)" />
                   <rect x={POS.foodPrep.x} y={POS.foodPrep.y} width={30} height={15} rx={2} fill="#FDE68A" filter="url(#dropShadowSmooth)" />
                </g>
             );
             if (ent.id === 'till1') return (
                <g key={ent.id} id="till1">
                   <BlockCounter x={POS.tillStation.x - 50} y={POS.tillStation.y - 15} width={100} depth={50} zHeight={COUNTER_Z} topColor="#F8FAFC" frontColor="#DBEAFE" label="Checkout" />
                   <rect x={POS.tillStation.x-10} y={POS.tillStation.y-10} width={20} height={15} rx={2} fill="#1E293B" filter="url(#dropShadowSmooth)" />
                </g>
             );
             if (ent.id === 'till2') return (
                <g key={ent.id} id="till2">
                   <BlockCounter x={POS.tillStation2.x - 50} y={POS.tillStation2.y - 15} width={100} depth={50} zHeight={COUNTER_Z} topColor="#F8FAFC" frontColor="#DBEAFE" label="Checkout II" />
                   <rect x={POS.tillStation2.x-10} y={POS.tillStation2.y-10} width={20} height={15} rx={2} fill="#1E293B" filter="url(#dropShadowSmooth)" />
                </g>
             );
             if (ent.id === 'coffee1') return (
                <g key={ent.id} id="coffee1">
                   <BlockCounter x={POS.machine1.x - 60} y={POS.machine1.y - 15} width={140} depth={50} zHeight={COUNTER_Z} topColor="#F8FAFC" frontColor="#D4D4D4" showWood={true} label="Espresso I" />
                   <EspressoMachine3D x={POS.machine1.x - 40} y={POS.machine1.y - 25} width={80} depth={35} />
                </g>
             );
             if (ent.id === 'coffee2') return (
                <g key={ent.id} id="coffee2">
                   <BlockCounter x={POS.machine2.x - 60} y={POS.machine2.y - 15} width={140} depth={50} zHeight={COUNTER_Z} topColor="#F8FAFC" frontColor="#D4D4D4" showWood={true} label="Espresso II" />
                   <EspressoMachine3D x={POS.machine2.x - 40} y={POS.machine2.y - 25} width={80} depth={35} />
                </g>
             );
          } else if (ent.typeCat === 'staff') {
             // Offset staff Y downwards so they stand correctly behind / inside the counter zones
             return <StandingAvatar key={`s-${ent.id}`} token={{...ent, y: ent.y + 60}} isStaff={true} />;
          } else if (ent.typeCat === 'token') {
             // Offset tokens so their feet align with the shifted path
             return <StandingAvatar key={`t-${ent.id}`} token={{...ent, y: ent.y + 50 + PATH_Y_OFFSET}} isStaff={false} />;
          } else if (ent.typeCat === 'ticket') {
             return (
              <g key={`b-${ent.id}`} opacity={ent.opacity} transform={`translate(${ent.x}, ${ent.y + 50 + PATH_Y_OFFSET})`}>
                <rect x={-8} y={-10} width={16} height={20} fill="#FFF" filter="url(#dropShadowSmooth)" />
                <line x1={-4} y1={-6} x2={4} y2={-6} stroke="#CBD5E1" strokeWidth={1} />
                <line x1={-4} y1={-2} x2={4} y2={-2} stroke="#CBD5E1" strokeWidth={1} />
              </g>
             );
          }
          return null;
        })}

        {/* Sleek Minimalist Top Header (replaces clunky pill/badges) */}
        <g transform="translate(40, -10)">
           <text x="0" y="0" fontSize="24" fontWeight="800" fill="#0F172A" letterSpacing="1px" className="uppercase">Customer Flow</text>
           <text x="0" y="24" fontSize="14" fontWeight="600" fill="#64748B" letterSpacing="2px" className="uppercase">Peak Hour Simulation</text>
        </g>
        
        <g transform={`translate(${VB_W - 450}, -10)`}>
           <rect x="0" y="-20" width="410" height="50" rx="8" fill="#F8FAFC" fillOpacity="0.8" stroke="#E2E8F0" strokeWidth="1" />
           <text x="205" y="8" textAnchor="middle" fontSize="15" fontWeight="600" fill="#334155" fontFamily="monospace">
             QUEUE: {tokens.filter(t => t.state === 'queuing').length}  |  WAITING: {tokens.filter(t => t.state === 'waiting').length}  |  BACKLOG: {backlog.length}
           </text>
        </g>
        
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
