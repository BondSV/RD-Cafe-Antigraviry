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
  // Deterministic avatar selection based on ID
  let spritePath = '';
  if (isStaff) {
     const role = String(token.id).toLowerCase();
     let staffIndex = 1;
     // Sprite Mappings: 0=Girl white shirt, 1=Guy black shirt, 2=Green apron (HB), 3=Guy suit (MGR)
     if (role.includes('ab1')) staffIndex = 1;
     else if (role.includes('ab2') || role.includes('pt')) staffIndex = 0;
     else if (role.includes('hb')) staffIndex = 2;
     else if (role.includes('mgr')) staffIndex = 3;
     else staffIndex = numId % 4; // Fallback pseudorandom
     
     spritePath = `/assets/sprites/staff-${staffIndex}.png`;
  } else if (token.type === 'courier') {
    const seed = numId % 12; // 12 GoGusto courier variations
    spritePath = `/assets/sprites/courier-${seed}.png`;
  } else {
    const seed = numId % 78; // Customers use a larger pool
    spritePath = `/assets/sprites/customer-${seed}.png`;
  }
  
  const isBusy = isStaff && (token.animState === 'serving' || token.animState === 'making');

  // Track velocity to flip character direction
  const prevX = React.useRef(token.x);
  const isFlipped = React.useRef(false);

  if (token.state === 'leaving') {
    // Face mathematically toward exit
    isFlipped.current = isStaff ? false : true; 
  } else if (token.state !== 'deciding') {
    if (token.x < prevX.current - 0.1) {
      // Moving Left
      isFlipped.current = isStaff ? false : true;
    } else if (token.x > prevX.current + 0.1) {
      // Moving Right
      isFlipped.current = isStaff ? true : false;
    } else if (token.state === 'waiting' && token.waitIndex !== undefined && !isStaff && token.isStationary) {
      // Stationary inside the pickup queue:
      const waitRow = Math.floor(token.waitIndex / 4);
      const isOddRow = waitRow % 2 !== 0;
      
      if (token.waitIndex === 0) {
        isFlipped.current = true; // Index 0 faces left (focus on machine)
      } else if (isOddRow) {
        isFlipped.current = true; // Odd rows face left (snaking leftward)
      } else {
        isFlipped.current = false; // Even rows face right (snaking rightward)
      }
    }
  }
  prevX.current = token.x;

  // We anchor the image's bottom center to their feet at (0,0)
  // Couriers use slightly reduced height to compensate for less top-padding in their sprites
  const avatarH = (!isStaff && token.type === 'courier') ? 110 : 112;
  const avatarY = -(avatarH - 5); // Keeps feet anchor at y=+5 regardless of height
  return (
    <g opacity={opacity} transform={`translate(${token.x}, ${token.y})`}>
      {/* Dynamic floor shadow stretching slightly left/back */}
      <ellipse cx={-5} cy={2} rx={18} ry={8} fill="rgba(0,0,0,0.5)" filter="blur(3px)" transform="rotate(-15)" />

      {/* Pure SVG image rendering is substantially more reliable than HTML inside foreignObject on mobile browsers */}
      <g transform={isFlipped.current ? 'scale(-1 1)' : undefined}>
        <image
          href={spritePath}
          xlinkHref={spritePath}
          x={-25}
          y={avatarY}
          width={50}
          height={avatarH}
          preserveAspectRatio="xMidYMid meet"
          filter="url(#dropShadowSmooth)"
          style={{ pointerEvents: 'none' }}
        />
      </g>

      {isStaff && (
        <text x={0} y={24} textAnchor="middle" fontSize={10} fill="#475569" fontWeight="700">
          {token.label}
        </text>
      )}

      {/* Thought Bubble for Decision Scanning and Bouncing */}
      {(token.state === 'deciding' || token.state === 'bouncing') && token.decidingProgress !== undefined && (
         <g transform={`translate(30, -115)`}>
            {/* Bubble backing */}
            <ellipse cx={0} cy={0} rx={18} ry={13} fill="#FFF" filter="url(#dropShadowSmooth)" stroke="#E2E8F0" strokeWidth={1} />
            <circle cx={-10} cy={16} r={3} fill="#FFF" />
            <circle cx={-16} cy={22} r={1.5} fill="#FFF" />
            
            {/* Animated internals */}
            {token.state === 'bouncing' ? (
              // Big Red Cross for rejected queue at the door
              <g transform="translate(0, 1)">
                <path d="M-4,-4 L4,4 M4,-4 L-4,4" stroke="#EF4444" strokeWidth={3} strokeLinecap="round" />
              </g>
            ) : token.willLeave && token.decidingProgress! >= 0.65 ? (
              // 3 Overlapping figures representing a crowd check (Only shows if they plan to bounce)
              <g transform="translate(-5, -6) scale(0.9)">
                <path d="M-6,9 A4,4 0 0,1 2,9 Z M-2,3 A2.5,2.5 0 1,1 -2,-2 A2.5,2.5 0 1,1 -2,3 Z" fill="#94A3B8" />
                <path d="M-1,10 A4.5,4.5 0 0,1 9,10 Z M4,4 A3,3 0 1,1 4,-2 A3,3 0 1,1 4,4 Z" fill="#64748B" />
                <path d="M5,11 A5,5 0 0,1 15,11 Z M10,5 A3.5,3.5 0 1,1 10,-2 A3.5,3.5 0 1,1 10,5 Z" fill="#475569" />
              </g>
            ) : (
              // Scanning Eyes (Default for deciding, perfectly scaled so it fills the wait time)
              <g transform="translate(0, -1)">
                {/* Whites of the eyes with distinct dark outlines to pop off the white bubble */}
                <circle cx={-5} cy={0} r={4.5} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={1} />
                <circle cx={5} cy={0} r={4.5} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth={1} />
                
                {/* Darting pupils */}
                <g transform={`translate(${Math.sin((token.decidingProgress || 0) * (Math.PI * 4 / (token.willLeave ? 0.65 : 1))) * 2}, 0)`}>
                  <circle cx={-5} cy={0} r={2} fill="#0F172A" />
                  <circle cx={5} cy={0} r={2} fill="#0F172A" />
                </g>
              </g>
            )}
         </g>
      )}

      {/* Active Wait / Mood Thought Bubbles */}
      {!isStaff && token.state !== 'deciding' && token.state !== 'bouncing' && (
        (() => {
           let bubbleIcon = null;
           if (token.state === 'leaving') {
              if (token.face === 'happy') bubbleIcon = "😊";
              else if (token.face === 'sad') bubbleIcon = "🙁";
           } else if (token.state === 'queuing' || token.state === 'ordering' || token.state === 'waiting') {
              if (token.face === 'sad') bubbleIcon = "⏳";
           }

           if (!bubbleIcon) return null;
           return (
             <g transform={`translate(30, -115)`}>
                <ellipse cx={0} cy={0} rx={18} ry={13} fill="#FFF" filter="url(#dropShadowSmooth)" stroke="#E2E8F0" strokeWidth={1} />
                <circle cx={-10} cy={16} r={3} fill="#FFF" />
                <circle cx={-16} cy={22} r={1.5} fill="#FFF" />
                <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" fontSize={16}>{bubbleIcon}</text>
             </g>
           );
        })()
      )}

      {!isStaff && token.type === 'cnc' && (
        <rect x={-12} y={-88} width={24} height={12} rx={3} fill="#6366F1" />
      )}
      {!isStaff && token.type === 'courier' && (
        <rect x={-12} y={-88} width={24} height={12} rx={3} fill="#8B5CF6" />
      )}
      
      {isBusy && (
        <g transform="translate(-15, 12)">
          <rect x={0} y={0} width={30} height={4} rx={2} fill="#E2E8F0" stroke="#94A3B8" strokeWidth={1} />
          <rect x={0} y={0} width={Math.max(0, Math.min(30, (token.animProgress || 0) * 30))} height={4} rx={2} fill="#3B82F6" />
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
    ordersPerHourText = ` | ORDERS/HR: ${Math.round(recentCount * SIM_HOUR / windowTicks)}`;
    const recentLost = lostTicks.filter((t: number) => t > state.tick - SIM_HOUR).length;
    lostPerHourText = ` | LOST/HR: ${Math.round(recentLost * SIM_HOUR / windowTicks)}`;
  }

  const COUNTER_Z = 45; // How tall the counters are (bigger in new layout)
  const COUNTER_DEPTH = 65;

  // Sorting strictly by physical visual baseline Y for flawless 2.5D occlusion
  const allEntities = [
    // Customers visual feet: y + 50
    ...tokens.map(t => ({ ...t, sortY: t.y + 50, typeCat: 'token' })),
    // Staff visual feet: y + 60
    ...staffTokens.map(s => ({ ...s, sortY: s.y + 60, typeCat: 'staff' })),
    // Backlog ticket visual baseline: y + 50
    ...backlog.map((b: any) => ({ ...b, sortY: b.y + 50, typeCat: 'ticket' })),
    // Counters conceptual baseline is counterY + depth
    // Always render all 5 counter blocks for wall-to-wall look
    { id: 'prep', sortY: POS.counterY + COUNTER_DEPTH, typeCat: 'counter' },
    { id: 'till2', sortY: POS.counterY + COUNTER_DEPTH, typeCat: 'counter' },
    { id: 'till1', sortY: POS.counterY + COUNTER_DEPTH, typeCat: 'counter' },
    { id: 'coffee1', sortY: POS.counterY + COUNTER_DEPTH, typeCat: 'counter' },
    { id: 'coffee2', sortY: POS.counterY + COUNTER_DEPTH, typeCat: 'counter' },
  ].sort((a, b) => a.sortY - b.sortY);

  return (
    <div className="w-full relative rounded-[2rem] overflow-hidden bg-[#F1F5F9] shadow-inner border border-slate-200 mt-6 pb-2">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
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

        {/* Path Y offset: sprites render at y+50 (feet position), paths must match */}
        {(() => {
          const F = 50; // feet offset — paths must be drawn at logical Y + F
          // The visual path drawn on floor
          const postDecisionY = POS.decision.y + 40;
          const postDecisionX = POS.decision.x - Math.round(40 * (150/110));
          const pathB = `M${POS.enter.x},${POS.enter.y+F} L${POS.decision.x},${POS.decision.y+F} L${postDecisionX},${postDecisionY+F} L${POS.queueTrackCorner.x},${POS.queueTrackCorner.y+F} L${POS.queue.x},${POS.queue.y+F} L${POS.till.x},${POS.till.y+F} L${POS.waiting.x},${POS.waiting.y+F} L${POS.exitCorner.x},${POS.exitCorner.y+F} L${POS.exit.x},${POS.exit.y+F}`;
          const pathA = `M${POS.decision.x},${POS.decision.y+F} Q${POS.decision.x + 130},${POS.decision.y + F} ${POS.exit.x},${POS.exit.y+F}`;
          return (<>
            {/* === PATH A: Bounce Route (dashed, subtle green, sagging curve) === */}
            <path d={pathA} stroke="rgba(0,0,0,0.07)" strokeWidth={10} strokeLinecap="round" fill="none" transform="translate(0,3)" strokeDasharray="8 6" />
            <path d={pathA} stroke="#D1FAE5" strokeWidth={10} strokeLinecap="round" fill="none" strokeDasharray="8 6" />

            {/* === PATH B: Main Customer Journey (Bézier curves) === */}
            <path d={pathB} stroke="rgba(0,0,0,0.1)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(0,3)" />
            <path d={pathB} stroke="#F8FAFC" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>);
        })()}

        {/* ==================== UNITY Z-SORTED ENTITIES & COUNTERS ==================== */}
        {allEntities.map((ent: any) => {
          if (ent.typeCat === 'counter') {
             if (ent.id === 'prep') return (
                <g key={ent.id} id="prep">
                   <BlockCounter x={0} y={POS.counterY} width={170} depth={COUNTER_DEPTH} zHeight={COUNTER_Z} topColor="#F8FAFC" frontColor="#D4D4D4" showWood={true} label="Food Prep" />
                   <circle cx={50} cy={POS.counterY + 15} r={10} fill="#22C55E" filter="url(#dropShadowSmooth)" />
                   <circle cx={80} cy={POS.counterY + 20} r={8} fill="#EF4444" filter="url(#dropShadowSmooth)" />
                   <rect x={105} y={POS.counterY + 10} width={40} height={20} rx={3} fill="#FDE68A" filter="url(#dropShadowSmooth)" />
                </g>
             );
             if (ent.id === 'till1') return (
                <g key={ent.id} id="till1">
                   <BlockCounter x={340} y={POS.counterY} width={170} depth={COUNTER_DEPTH} zHeight={COUNTER_Z} topColor="#F8FAFC" frontColor="#DBEAFE" label="Checkout" />
                   <rect x={410} y={POS.counterY + 10} width={28} height={20} rx={3} fill="#1E293B" filter="url(#dropShadowSmooth)" />
                </g>
             );
             if (ent.id === 'till2') return (
                <g key={ent.id} id="till2">
                   <BlockCounter x={170} y={POS.counterY} width={170} depth={COUNTER_DEPTH} zHeight={COUNTER_Z} topColor={showTill2 ? "#F8FAFC" : "#F1F5F9"} frontColor={showTill2 ? "#DBEAFE" : "#E2E8F0"} label={showTill2 ? "Checkout II" : ""} />
                   {showTill2 && <rect x={310} y={POS.counterY + 10} width={28} height={20} rx={3} fill="#1E293B" filter="url(#dropShadowSmooth)" />}
                </g>
             );
             if (ent.id === 'coffee1') return (
                <g key={ent.id} id="coffee1">
                   <BlockCounter x={510} y={POS.counterY} width={195} depth={COUNTER_DEPTH} zHeight={COUNTER_Z} topColor="#F8FAFC" frontColor="#D4D4D4" showWood={true} label="Espresso I" />
                   <EspressoMachine3D x={545} y={POS.counterY - 10} width={100} depth={45} />
                </g>
             );
             if (ent.id === 'coffee2') return (
                <g key={ent.id} id="coffee2">
                   <BlockCounter x={705} y={POS.counterY} width={195} depth={COUNTER_DEPTH} zHeight={COUNTER_Z} topColor={showMachine2 ? "#F8FAFC" : "#F1F5F9"} frontColor={showMachine2 ? "#D4D4D4" : "#E2E8F0"} showWood={showMachine2} label={showMachine2 ? "Espresso II" : ""} />
                   {showMachine2 && <EspressoMachine3D x={740} y={POS.counterY - 10} width={100} depth={45} />}
                </g>
             );
          } else if (ent.typeCat === 'staff') {
             // Offset staff Y downwards so they stand correctly behind / inside the counter zones
             return <StandingAvatar key={`s-${ent.id}`} token={{...ent, y: ent.y + 60}} isStaff={true} />;
          } else if (ent.typeCat === 'token') {
             // Offset tokens so their feet align with the path
             return <StandingAvatar key={`t-${ent.id}`} token={{...ent, y: ent.y + 50}} isStaff={false} />;
          } else if (ent.typeCat === 'ticket') {
             return (
              <g key={`b-${ent.id}`} opacity={ent.opacity} transform={`translate(${ent.x}, ${ent.y + 50})`}>
                <rect x={-8} y={-10} width={16} height={20} fill="#FFF" filter="url(#dropShadowSmooth)" />
                <line x1={-4} y1={-6} x2={4} y2={-6} stroke="#CBD5E1" strokeWidth={1} />
                <line x1={-4} y1={-2} x2={4} y2={-2} stroke="#CBD5E1" strokeWidth={1} />
              </g>
             );
          }
          return null;
        })}

        {/* Sleek Minimalist Top Header */}
        <g transform="translate(40, 25)">
           <text x="0" y="0" fontSize="24" fontWeight="800" fill="#0F172A" letterSpacing="1px" className="uppercase">Customer Flow</text>
           <text x="0" y="24" fontSize="14" fontWeight="600" fill="#64748B" letterSpacing="2px" className="uppercase">Peak Hour Simulation</text>
        </g>

        <g transform={`translate(${VB_W - 640}, 25)`}>
           <rect x="0" y="-20" width="610" height="50" rx="8" fill="#F8FAFC" fillOpacity="0.8" stroke="#E2E8F0" strokeWidth="1" />
           <text x="305" y="8" textAnchor="middle" fontSize="13" fontWeight="600" fill="#334155" fontFamily="monospace">
             QUEUE: {tokens.filter(t => t.state === 'queuing').length}  |  WAITING: {tokens.filter(t => t.state === 'waiting').length} {ordersPerHourText} {lostPerHourText}
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
