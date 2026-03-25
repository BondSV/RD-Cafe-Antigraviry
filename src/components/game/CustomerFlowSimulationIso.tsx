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
       
       {/* Optional Label floating on front face */}
       {label && (
         <g transform={`translate(${width/2}, ${depth + zHeight/2})`}>
            <rect x="-30" y="-12" width="60" height="24" rx="12" fill="rgba(0,0,0,0.4)" />
            <text textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold" fill="#FFF">{label}</text>
         </g>
       )}
    </g>
  );
}

// 3D Chrome Espresso Machine (Image 1 replica)
function EspressoMachine3D({ x, y, width, depth }: any) {
  return (
    <g transform={`translate(${x}, ${y})`}>
       {/* Main Chrome Body */}
       <rect x={10} y={15} width={Math.max(0, width-40)} height={Math.max(0, depth-25)} rx={4} fill="#E2E8F0" filter="url(#dropShadowSmooth)" />
       <rect x={10} y={15} width={Math.max(0, width-40)} height={Math.max(0, depth-25)} rx={4} fill="url(#glossHighlight)" />
       {/* Front Panel */}
       <rect x={12} y={17} width={Math.max(0, width-44)} height={12} rx={2} fill="#334155" />
       <rect x={12} y={30} width={Math.max(0, width-44)} height={Math.max(1, depth-32)} rx={2} fill="#94A3B8" />
       
       {/* Group heads directly dropping down */}
       <rect x={20} y={depth-12} width={12} height={12} rx={2} fill="#1E293B" filter="url(#dropShadowSmooth)" />
       <circle cx={26} cy={depth} r={3} fill="#E2E8F0" />
       
       <rect x={width-50} y={depth-12} width={12} height={12} rx={2} fill="#1E293B" filter="url(#dropShadowSmooth)" />
       <circle cx={width-44} cy={depth} r={3} fill="#E2E8F0" />
       
       {/* Tall Black Coffee Grinder (Hopper) */}
       <rect x={width-25} y={5} width={16} height={18} rx={2} fill="#0F172A" filter="url(#dropShadowSmooth)" />
       <polygon points={`${width-25},23 ${width-9},23 ${width-13},35 ${width-21},35`} fill="#0F172A" />
       <rect x={width-20} y={35} width={10} height={10} rx={1} fill="#E2E8F0" />
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

  // Sorting strictly by Y for beautiful 2.5D overlap (painters algorithm)
  const allEntities = [
    ...tokens.map(t => ({ ...t, sortY: t.y, typeCat: 'token' })),
    ...staffTokens.map(s => ({ ...s, sortY: s.y, typeCat: 'staff' })),
    ...backlog.map((b: any) => ({ ...b, sortY: b.y, typeCat: 'ticket' })),
  ].sort((a, b) => a.sortY - b.sortY);

  // We skew the background grid coordinates smoothly to map to Image 1's architecture.
  // Image 1 has: Prep (left, green top outline), Till (center, blue top outline), Coffee (right, yellow top outline, wood front).
  // I will adjust POS bounds softly here for the 3D diorama render without breaking engine logic.
  
  const COUNTER_Z = 35; // How tall the counters are

  return (
    <div className="w-full bg-[#1A1A1A] p-2 rounded-3xl mt-6 relative" style={{ borderRadius: '24px' }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-full rounded-2xl"
        style={{ height: 'auto', minHeight: 450, maxHeight: 650, backgroundColor: '#D4D4D4' }} // Smooth grey background matching Image 1
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Studio Vignette Floor */}
          <radialGradient id="floorVignette" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#E5E5E5" stopOpacity="1" />
            <stop offset="100%" stopColor="#A3A3A3" stopOpacity="1" />
          </radialGradient>

          {/* Lit 3D effect optimized for upright characters */}
          <filter id="clayLighting" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.8" specularExponent="30" lightingColor="#ffffff" result="specOut">
              <fePointLight x="-50" y="-100" z="200" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
            <feBlend in="specOut" in2="SourceGraphic" mode="screen" result="lit" />
          </filter>

          <filter id="heavyShadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="-5" dy="10" stdDeviation="6" floodColor="#000" floodOpacity="0.4" />
          </filter>

          <filter id="dropShadowSmooth" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="-2" dy="5" stdDeviation="3" floodColor="#000" floodOpacity="0.3" />
          </filter>

          <linearGradient id="glossHighlight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="20%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
          
          <clipPath id="frontClip"><rect width="800" height="200" rx="4" /></clipPath>
        </defs>

        {/* Gray Studio Backdrop (Replaces concrete) */}
        <rect x="0" y="0" width="100%" height="100%" fill="url(#floorVignette)" />

        {/* Pathing - Double lines replicating Image 1 exactly */}
        {/* Shadow under path */}
        <path
          d={`M${POS.enter.x},${POS.enter.y} L${POS.waiting.x},${POS.waiting.y} L${POS.waiting.x},${POS.exit.y} L${POS.exit.x},${POS.exit.y}`}
          stroke="rgba(0,0,0,0.1)" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(0, 3)"
        />
        {/* Solid white thick path */}
        <path
          d={`M${POS.enter.x},${POS.enter.y} L${POS.waiting.x},${POS.waiting.y} L${POS.waiting.x},${POS.exit.y} L${POS.exit.x},${POS.exit.y}`}
          stroke="#F8FAFC" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
        {/* Thin dashed line running alongside it */}
        <path
          d={`M${POS.enter.x},${POS.enter.y - 12} L${POS.waiting.x + 12},${POS.waiting.y - 12} L${POS.waiting.x + 12},${POS.exit.y + 12} L${POS.exit.x},${POS.exit.y + 12}`}
          stroke="#475569" strokeWidth={2} strokeDasharray="8 8" fill="none" opacity={0.6}
        />

        {/* 3D COUNTERS (Drawn BEFORE entities because avatars stand IN FRONT or ON TOP of flooring, waiting behind) */}
        
        {/* Food Prep (Green Outline Top, Wood Front) */}
        <g id="prep">
           <BlockCounter 
             x={POS.foodPrep.x - 70} y={POS.foodPrep.y - 15} width={150} depth={45} zHeight={COUNTER_Z}
             topColor="#F8FAFC" frontColor="#D4D4D4" showWood={true}
           />
           {/* Top Face Outline (Green base) */}
           <rect x={POS.foodPrep.x - 70} y={POS.foodPrep.y - 15} width={150} height={45} rx="2" fill="none" stroke="#22C55E" strokeWidth="3" />
           {/* Veggies */}
           <circle cx={POS.foodPrep.x - 40} cy={POS.foodPrep.y + 5} r={8} fill="#22C55E" filter="url(#dropShadowSmooth)" />
           <circle cx={POS.foodPrep.x - 20} cy={POS.foodPrep.y + 10} r={6} fill="#EF4444" filter="url(#dropShadowSmooth)" />
           <rect x={POS.foodPrep.x} y={POS.foodPrep.y} width={30} height={15} rx={2} fill="#FDE68A" filter="url(#dropShadowSmooth)" />
           
           <PhysicalBadge x={POS.foodPrep.x + 120} y={POS.foodPrep.y + 5} width={80} height={30} text="Food Prep" />
        </g>
        
        {/* Till (Blue Outline Top, Solid Front) */}
        <g id="till1">
           <BlockCounter 
             x={POS.tillStation.x - 50} y={POS.tillStation.y - 15} width={100} depth={45} zHeight={COUNTER_Z}
             topColor="#F8FAFC" frontColor="#BFDBFE" showWood={false}
           />
           <rect x={POS.tillStation.x - 50} y={POS.tillStation.y - 15} width={100} height={45} rx="2" fill="none" stroke="#3B82F6" strokeWidth="3" />
           {/* Monitor */}
           <rect x={POS.tillStation.x-10} y={POS.tillStation.y-10} width={20} height={15} rx={1} fill="#1E293B" filter="url(#dropShadowSmooth)" />
           
           <PhysicalBadge x={POS.tillStation.x} y={POS.tillStation.y + 5} width={60} height={30} text="Till" />
        </g>
        
        {/* Coffee (Yellow Top, Wood Front) */}
        <g id="coffee1">
           <BlockCounter 
             x={POS.machine1.x - 60} y={POS.machine1.y - 15} width={140} depth={45} zHeight={COUNTER_Z}
             topColor="#FEF08A" frontColor="#D4D4D4" showWood={true}
           />
           <rect x={POS.machine1.x - 60} y={POS.machine1.y - 15} width={140} height={45} rx="2" fill="none" stroke="#EAB308" strokeWidth="3" />
           
           <EspressoMachine3D x={POS.machine1.x - 40} y={POS.machine1.y - 25} width={90} depth={40} />
           
           <text x={POS.machine1.x + 10} y={POS.machine1.y + 40} textAnchor="middle" fontWeight="bold" fontSize="14" fill="#78350F">Coffee 1</text>
        </g>

        {showTill2 && (
          <g id="till2">
             <BlockCounter 
               x={POS.tillStation2.x - 50} y={POS.tillStation2.y - 15} width={100} depth={45} zHeight={COUNTER_Z}
               topColor="#F8FAFC" frontColor="#BFDBFE" showWood={false}
             />
             <rect x={POS.tillStation2.x - 50} y={POS.tillStation2.y - 15} width={100} height={45} rx="2" fill="none" stroke="#3B82F6" strokeWidth="3" />
             <rect x={POS.tillStation2.x-10} y={POS.tillStation2.y-10} width={20} height={15} rx={1} fill="#1E293B" filter="url(#dropShadowSmooth)" />
             <PhysicalBadge x={POS.tillStation2.x} y={POS.tillStation2.y + 5} width={60} height={30} text="Till 2" />
          </g>
        )}
        
        {showMachine2 && (
          <g id="coffee2">
             <BlockCounter 
               x={POS.machine2.x - 60} y={POS.machine2.y - 15} width={140} depth={45} zHeight={COUNTER_Z}
               topColor="#FEF08A" frontColor="#D4D4D4" showWood={true}
             />
             <rect x={POS.machine2.x - 60} y={POS.machine2.y - 15} width={140} height={45} rx="2" fill="none" stroke="#EAB308" strokeWidth="3" />
             <EspressoMachine3D x={POS.machine2.x - 40} y={POS.machine2.y - 25} width={90} depth={40} />
             <text x={POS.machine2.x + 10} y={POS.machine2.y + 40} textAnchor="middle" fontWeight="bold" fontSize="14" fill="#78350F">Coffee 2</text>
          </g>
        )}

        {/* ==================== Z-SORTED ENTITIES ==================== */}
        {allEntities.map((ent: any) => {
          if (ent.typeCat === 'staff') {
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

        {/* UI Stage Badges (3D Physical Pills sitting ON TOP of the avatars bounding path) */}
        {/* We push them down visually so avatars can walk *behind* them securely if needed */}
        <PhysicalBadge x={POS.enter.x} y={POS.enter.y + 65} width={70} height={30} text="Enter" />
        <PhysicalBadge x={POS.decision.x} y={POS.decision.y + 65} width={80} height={30} text="Decision" />
        <PhysicalBadge x={POS.queue.x} y={POS.queue.y + 65} width={70} height={30} text="Queue" />
        <PhysicalBadge x={POS.tillStation.x + 25} y={POS.tillStation.y + 65} width={60} height={30} text="Till" />
        <PhysicalBadge x={POS.waiting.x} y={POS.waiting.y + 65} width={80} height={30} text="Pickup" />
        <PhysicalBadge x={POS.exit.x} y={POS.exit.y + 65} width={70} height={30} text="Exit" />


        {/* Image 1 EXACT HUD REPLICA */}
        
        {/* Top-Left Floating Title */}
        <text x="3%" y="7%" dominantBaseline="middle" fontSize="22" fontWeight="800" fill="none" stroke="#E2E8F0" strokeWidth="1" letterSpacing="2px" filter="drop-shadow(2px 2px 2px rgba(0,0,0,0.5))">CUSTOMER FLOW — PEAK HOUR</text>
        <text x="3%" y="7%" dominantBaseline="middle" fontSize="22" fontWeight="800" fill="#FFF8F1" letterSpacing="2px" opacity={0.9}>CUSTOMER FLOW — PEAK HOUR</text>
        
        {/* Top-Right Pill Panel */}
        <g transform={`translate(${VB_W - 550}, 15)`}>
           {/* Floating glassy pill */}
           <rect width="530" height="40" rx="20" fill="#E2E8F0" opacity="0.9" filter="url(#heavyShadow)" />
           {/* Inner border */}
           <rect x="2" y="2" width="526" height="36" rx="18" fill="none" stroke="#FFF" strokeWidth="2" />
           <text x="265" y="20" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="600" fill="#0F172A" fontFamily="monospace">
             Queue: {tokens.filter(t => t.state === 'queuing').length}  |  Waiting: {tokens.filter(t => t.state === 'waiting').length}  |  Backlog: {backlog.length}
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
