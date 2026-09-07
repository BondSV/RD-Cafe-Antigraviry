import React from 'react';
import { VisibleMetrics, ActionFlags } from '../../types/game';
import { useCustomerFlowSimulation, Token, StaffToken, BacklogTicket, Face, VB_W, VB_H, POS } from '../../hooks/useCustomerFlowSimulation';

// Independent cutouts preserve appliance proportions when the worktop depth changes.
const staffEquipment = [
  { name: 'press', x: 193.56, y: 733.6, width: 68.89, height: 70.4 },
  { name: 'cups', x: 298.26, y: 738, width: 41.48, height: 62 },
  { name: 'syrups', x: 353.89, y: 751, width: 34.23, height: 49 },
  { name: 'stirrers', x: 400.03, y: 770, width: 15.94, height: 30 },
  { name: 'sink', x: 458.45, y: 752, width: 101.09, height: 58 },
];

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
     
     spritePath = `/assets/sprites/staff-${staffIndex}.webp`;
  } else if (token.type === 'courier') {
    const seed = numId % 12; // 12 GoGusto courier variations
    spritePath = `/assets/sprites/courier-${seed}.webp`;
  } else {
    const seed = numId % 78; // Customers use a larger pool
    spritePath = `/assets/sprites/customer-${seed}.webp`;
  }
  
  const isBusy = isStaff && (token.animState === 'serving' || token.animState === 'making');

  // Track velocity to flip character direction
  const prevX = React.useRef(token.x);
  const prevY = React.useRef(token.y);
  const facesAway = React.useRef(false);
  const isFlipped = React.useRef(false);
  const rearPath = !isStaff && token.type !== 'courier'
    ? `/assets/cutout-study/customer-rears/customer-${numId % 78}-rear.png`
    : '';
  const [loadedRear, setLoadedRear] = React.useState('');
  React.useEffect(() => {
    if (!rearPath) return;
    const image = new Image();
    image.onload = () => setLoadedRear(rearPath);
    image.src = rearPath;
    return () => { image.onload = null; };
  }, [rearPath]);

  if (rearPath) {
    const dy = token.y - prevY.current;
    if (dy < -0.03) facesAway.current = true;
    else if (dy > 0.03) facesAway.current = false;
  }
  const showRear = !!rearPath && loadedRear === rearPath && facesAway.current;
  if (showRear) spritePath = rearPath;
  prevY.current = token.y;

  if (!isStaff && token.state === 'queuing' && token.isStationary) {
    isFlipped.current = false;
  } else if (token.state === 'leaving') {
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
          x={showRear ? -36 : -25}
          y={avatarY}
          width={showRear ? 72 : 50}
          height={avatarH}
          preserveAspectRatio="xMidYMid meet"
          transform={isStaff ? 'translate(0 5) scale(1.02) translate(0 -5)' : undefined}
          filter="url(#dropShadowSmooth)"
          style={{
            pointerEvents: 'none',
          }}
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
           <image href="/assets/wood_texture.webp" x="0" y="0" width={width} height={zHeight} preserveAspectRatio="none" opacity={0.6} style={{ mixBlendMode: 'multiply' }} clipPath="url(#frontClip)" />
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

  const { tokens, staffTokens, backlog, rates, completedTicks, lostTicks } = state;
  const showMachine2 = rates.staffConfig.machines >= 2;
  const showTill2 = rates.staffConfig.tills >= 2;

  // Orders and lost per sim-hour (moving average, display after 10 sim-minutes)
  const SIM_HOUR = 9600;
  const MIN_DISPLAY_TICKS = 1600; // 10 sim-minutes
  let ordersPerHour = 0;
  let lostSalesPerHour = 0;
  if (state.tick >= MIN_DISPLAY_TICKS) {
    const windowTicks = Math.min(state.tick, SIM_HOUR);
    const recentCount = completedTicks.filter((t: number) => t > state.tick - SIM_HOUR).length;
    ordersPerHour = Math.round(recentCount * SIM_HOUR / windowTicks);
    const recentLost = lostTicks.filter((t: number) => t > state.tick - SIM_HOUR).length;
    lostSalesPerHour = Math.round(recentLost * SIM_HOUR / windowTicks);
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
    <div className="w-full relative rounded-[2rem] overflow-hidden bg-[#F1F5F9] shadow-inner border border-slate-200 mt-6">
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

          <filter id="ticketContactShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0.6" stdDeviation="0.45" floodColor="#24170e" floodOpacity="0.3" />
          </filter>

        </defs>

        {/* Visual-overhaul background stack. These assets are aligned as a single plate; gameplay geometry stays code-driven. */}
        <rect x="-20%" y="-20%" width="140%" height="140%" fill="url(#floorVignette)" />
        <image
          href="/assets/visual-overhaul/Main%20Layer.webp"
          x="0"
          y="0"
          width={VB_W}
          height={VB_H}
          preserveAspectRatio="xMidYMid slice"
        />
        <image
          href="/assets/visual-overhaul/Carpet%20and%20Shadows.webp"
          x="0"
          y="0"
          width={VB_W}
          height={VB_H}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* ==================== UNITY Z-SORTED ENTITIES & COUNTERS ==================== */}
        <g pointerEvents="none">
          <defs>
            <clipPath id="staffFridgeClip"><rect x="0" y="0" width="195" height="820" /></clipPath>
            <clipPath id="staffPlantClip"><rect x="604" y="0" width="296" height="751" /><rect x="875" y="751" width="25" height="69" /></clipPath>
            <clipPath id="staffPlantCrownClip"><rect x="604" y="0" width="296" height="751" /></clipPath>
          </defs>
          <g transform="translate(12 0)">
            {/* Keep the approved back edge and ticket coordinates; reduce furniture depth separately. */}
            <svg x="163" y="751" width="411" height="85.5" viewBox="116 318 974 242" preserveAspectRatio="none">
              <image href="/assets/cutout-study/staff-work-area-bare.png" width="1774" height="887" />
            </svg>
            <svg x="574" y="751" width="301" height="108.3" viewBox="1090 318 602 242" preserveAspectRatio="none">
              <image href="/assets/cutout-study/staff-work-area-bare.png" width="1774" height="887" />
            </svg>
            {/* A shallow engraving on the tray, clear of both receipt rows. */}
            <g aria-label="Orders backlog" transform="translate(725 768) scale(1 0.85)" fontFamily="Georgia, serif" fontSize="12" fontWeight="bold" letterSpacing="1" textAnchor="middle" pointerEvents="none">
              <text y="0.7" fill="#edc995" opacity="0.45">ORDERS BACKLOG</text>
              <text y="0" fill="#2c170e">ORDERS BACKLOG</text>
            </g>
            {staffEquipment.map(({ name, ...placement }) => (
              <image key={name} href={`/assets/cutout-study/equipment/${name}.png`} {...placement} preserveAspectRatio="xMidYMid meet" filter="url(#ticketContactShadow)" />
            ))}
          </g>
        </g>
        {allEntities.map((ent: any) => {
          if (ent.typeCat === 'counter') {
             if (ent.id === 'prep') {
               return (
                 <g key="counter-and-prep-assets">
                   <image
                     href="/assets/visual-overhaul/Counter%20SM.webp"
                     x="0"
                     y="0"
                     width={VB_W}
                     height={VB_H}
                     preserveAspectRatio="xMidYMid slice"
                     pointerEvents="none"
                   />
                   <image
                     href="/assets/visual-overhaul/Pastry.webp"
                     x="0"
                     y="0"
                     width={VB_W}
                     height={VB_H}
                     preserveAspectRatio="xMidYMid slice"
                     pointerEvents="none"
                   />
                 </g>
               );
             }
             if (ent.id === 'till1') {
               return (
                 <image
                   key={ent.id}
                   href="/assets/visual-overhaul/Till%201.webp"
                   x="0"
                   y="0"
                   width={VB_W}
                   height={VB_H}
                   preserveAspectRatio="xMidYMid slice"
                   pointerEvents="none"
                 />
               );
             }
             if (ent.id === 'till2') {
               return showTill2 ? (
                 <image
                   key={ent.id}
                   href="/assets/visual-overhaul/Till%202.webp"
                   x="0"
                   y="0"
                   width={VB_W}
                   height={VB_H}
                   preserveAspectRatio="xMidYMid slice"
                   pointerEvents="none"
                 />
               ) : null;
             }
             if (ent.id === 'coffee1') {
               return (
                 <g key={ent.id}>
                   <image
                     href={flags.premiumGrinderInstalled ? "/assets/visual-overhaul/fancy%20grinder%201.webp" : "/assets/visual-overhaul/Grinder%201.webp"}
                     x="0"
                     y="0"
                     width={VB_W}
                     height={VB_H}
                     preserveAspectRatio="xMidYMid slice"
                     pointerEvents="none"
                   />
                   <image
                     href="/assets/visual-overhaul/Espresso%201.webp"
                     x="0"
                     y="0"
                     width={VB_W}
                     height={VB_H}
                     preserveAspectRatio="xMidYMid slice"
                     pointerEvents="none"
                   />
                 </g>
               );
             }
             if (ent.id === 'coffee2') {
               return showMachine2 ? (
                 <g key={ent.id}>
                   <image
                     href={flags.premiumGrinderInstalled ? "/assets/visual-overhaul/fancy%20grinder%202.webp" : "/assets/visual-overhaul/Grinder%202.webp"}
                     x="0"
                     y="0"
                     width={VB_W}
                     height={VB_H}
                     preserveAspectRatio="xMidYMid slice"
                     pointerEvents="none"
                   />
                   <image
                     href="/assets/visual-overhaul/Espresso%202.webp"
                     x="0"
                     y="0"
                     width={VB_W}
                     height={VB_H}
                     preserveAspectRatio="xMidYMid slice"
                     pointerEvents="none"
                   />
                 </g>
               ) : null;
             }
             return null;
          } else if (ent.typeCat === 'staff') {
             // Offset staff Y downwards so they stand correctly behind / inside the counter zones
             return <StandingAvatar key={`s-${ent.id}`} token={{...ent, y: ent.y + 60}} isStaff={true} />;
          } else if (ent.typeCat === 'token') {
             // Offset tokens so their feet align with the path
             return <StandingAvatar key={`t-${ent.id}`} token={{...ent, y: ent.y + 50}} isStaff={false} />;
          } else if (ent.typeCat === 'ticket') {
             return (
              <g key={`b-${ent.id}`} data-backlog-receipt={ent.id} opacity={ent.opacity} transform={`translate(${ent.x}, ${ent.y + 50})`}>
                <path d="M-8-10 H8 V9 L6.4 10 L4.8 9 L3.2 10 L1.6 9 L0 10 L-1.6 9 L-3.2 10 L-4.8 9 L-6.4 10 L-8 9 Z" fill="#fffaf0" stroke="#c8b99f" strokeWidth="0.35" filter="url(#ticketContactShadow)" />
                <g fill="#443d33" fontFamily="monospace" textAnchor="middle">
                  <text y="-6" fontSize="3.1" fontWeight="bold">RD CAFE</text>
                  <text y="-2.5" fontSize="2.5">#{String(ent.id).padStart(3, '0')}</text>
                </g>
                <path d="M-5.5-1 H5.5 M-5.5 1.5 H1.5 M3 1.5 H5.5 M-5.5 3.7 H0 M3 3.7 H5.5 M-5.5 6.5 H5.5" stroke="#655b4d" strokeWidth="0.7" opacity="0.88" />
                <path d="M-5.5 5.2 H5.5" stroke="#8a7e6c" strokeWidth="0.35" strokeDasharray="1 0.7" />
              </g>
             );
          }
          return null;
        })}

        <g pointerEvents="none">
          {/* Separate counter section continues beyond the left edge, behind the fridge. */}
          <svg x="-8" y="751" width="70" height="85.5" viewBox="280 318 166 242" preserveAspectRatio="none">
            <image href="/assets/cutout-study/staff-work-area-bare.png" width="1774" height="887" />
          </svg>
          <image href="/assets/cutout-study/retail-coffee-bags.png" x="4" y="735" width="32" height="42" preserveAspectRatio="xMidYMid meet" filter="url(#ticketContactShadow)" />
          <image href="/assets/cutout-study/retail-coffee-bags.png" x="1" y="764" width="32" height="42" preserveAspectRatio="xMidYMid meet" filter="url(#ticketContactShadow)" />
          {/* Keep the fridge proportional and aligned with the adjoining worktop. */}
          <g transform="translate(175 820) scale(0.9) translate(-155 -820) translate(-30 18)">
            <image href="/assets/cutout-study/staff-work-area-floor-v2.png" x="0" y={751 - 399 * 106 / 209} width="900" height={887 * 106 / 209} preserveAspectRatio="none" clipPath="url(#staffFridgeClip)" />
          </g>
          <g transform="translate(450 410) scale(0.5)">
            <g transform="translate(-12 8)">
              <image href="/assets/cutout-study/staff-work-area-floor-v2.png" x="0" y={751 - 399 * 134 / 209} width="900" height={887 * 134 / 209} preserveAspectRatio="none" clipPath="url(#staffPlantCrownClip)" />
            </g>
            <image href="/assets/cutout-study/staff-work-area-floor-v2.png" x="0" y={751 - 399 * 134 / 209} width="900" height={887 * 134 / 209} preserveAspectRatio="none" clipPath="url(#staffPlantClip)" />
          </g>
        </g>

        {/* Foreground environmental overlays: these sit above actors to create real occlusion depth. */}
        <image
          href="/assets/visual-overhaul/Central%20seating%20without%20corner.webp"
          x="0"
          y="0"
          width={VB_W}
          height={VB_H}
          preserveAspectRatio="xMidYMid slice"
          pointerEvents="none"
        />
        <image
          href="/assets/visual-overhaul/Lights.webp"
          x="0"
          y="0"
          width={VB_W}
          height={VB_H}
          preserveAspectRatio="xMidYMid slice"
          opacity="0.72"
          pointerEvents="none"
        />

      </svg>

      <div className="pointer-events-none absolute top-0 left-6 flex flex-col items-start gap-px rounded-b-lg border border-t-0 border-white/10 bg-stone-950/75 px-1.5 py-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.35),inset_0_-1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:top-1.5 sm:left-3 sm:gap-0.5 sm:rounded-full sm:border-t sm:px-3 sm:py-1.5 sm:shadow-[0_6px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="whitespace-nowrap text-[5px] font-semibold uppercase leading-none tracking-[0.16em] text-amber-200/70 sm:text-[8px] sm:tracking-[0.22em]">
          Peak Hour Simulation
        </div>
        <div className="whitespace-nowrap text-[8px] font-bold uppercase leading-none tracking-[0.12em] text-white sm:text-[11px] sm:tracking-[0.18em]">
          Customer Flow
        </div>
      </div>

      <div className="pointer-events-none absolute top-0 right-6 flex items-center gap-0.5 sm:top-1.5 sm:right-3 sm:gap-2">
        <div className="flex items-center gap-1 rounded-b-lg border border-t-0 border-white/10 bg-stone-950/75 px-1.5 py-1 shadow-[0_4px_12px_rgba(0,0,0,0.35),inset_0_-1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:gap-2 sm:rounded-full sm:border-t sm:px-3 sm:py-1.5 sm:shadow-[0_6px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.7)] sm:h-1.5 sm:w-1.5 sm:shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
          <div className="whitespace-nowrap text-[6px] font-semibold uppercase tracking-[0.12em] text-stone-300 sm:text-[9px] sm:tracking-[0.18em]">
            Orders / hr
          </div>
          <div className="font-mono text-[10px] font-semibold leading-none tabular-nums text-emerald-300 sm:text-[15px]">
            {ordersPerHour}
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-b-lg border border-t-0 border-white/10 bg-stone-950/75 px-1.5 py-1 shadow-[0_4px_12px_rgba(0,0,0,0.35),inset_0_-1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:gap-2 sm:rounded-full sm:border-t sm:px-3 sm:py-1.5 sm:shadow-[0_6px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="h-1 w-1 rounded-full bg-rose-400 shadow-[0_0_4px_rgba(251,113,133,0.7)] sm:h-1.5 sm:w-1.5 sm:shadow-[0_0_6px_rgba(251,113,133,0.7)]" />
          <div className="whitespace-nowrap text-[6px] font-semibold uppercase tracking-[0.12em] text-stone-300 sm:text-[9px] sm:tracking-[0.18em]">
            Lost sales / hr
          </div>
          <div className="font-mono text-[10px] font-semibold leading-none tabular-nums text-rose-300 sm:text-[15px]">
            {lostSalesPerHour}
          </div>
        </div>
      </div>

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
