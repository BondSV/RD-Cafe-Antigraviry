import { SystemMapNode, SystemMapConnection } from '../types/game';

export const systemNodes: SystemMapNode[] = [
  { id: 'orderPoint',    label: 'Order Point',          drivingMetrics: ['waitingTime', 'congestion'],         x: 50, y: 25,
    insight: 'Relies on efficient staff and a simple menu. A fast till is useless if the kitchen downstream can\'t keep up with the incoming tickets.' },
  { id: 'preparation',   label: 'Preparation',          drivingMetrics: ['throughput', 'backlog'],             x: 82, y: 45,
    insight: 'The core bottleneck. Absorbs pressure from the till and converts it to revenue. Needs smart physical layout and prep-ahead to survive the rush.' },
  { id: 'inventory',     label: 'Inventory & Supply',   drivingMetrics: ['stockAvailability', 'wasteTracker'],                 x: 82, y: 70,
    insight: 'A core tension: ordering massive stock guarantees availability but creates catastrophic food waste. Good supply chains balance both.' },
  { id: 'financials',    label: 'Financials',           drivingMetrics: ['financialResults', 'throughput', 'waitingTime'], x: 50, y: 88,
    insight: 'The ultimate lagging metric. Financial health demands lean operating hours combined with massive peak volume and rapid customer turnover.' },
  { id: 'quality',       label: 'Product & Quality',    drivingMetrics: ['serviceConsistency', 'stockAvailability'], x: 18, y: 70,
    insight: 'Complex menus look great but destroy consistency. A tighter menu speeds up customer decisions and guarantees faster prep execution.' },
  { id: 'staffing',      label: 'Staff Efficiency',     drivingMetrics: ['serviceConsistency', 'throughput'],  x: 18, y: 45,
    insight: 'The human engine. Throwing temporary staff at a chaotic layout wastes money; true capacity comes from aligning rosters to peak demand.' },
];

export const systemConnections: SystemMapConnection[] = [
  // Core Operational Forward Routes
  { from: 'staffing',     to: 'orderPoint' },
  { from: 'staffing',     to: 'preparation' },
  { from: 'inventory',    to: 'preparation' },
  { from: 'quality',      to: 'preparation' },
  { from: 'orderPoint',   to: 'preparation' },
  
  // Secondary Structural Links
  { from: 'inventory',    to: 'quality' },       // Stock availability directly limits product quality execution
  { from: 'quality',      to: 'orderPoint' },    // Quality and consistency heavily impact the order experience
  
  // Financial Outcomes
  { from: 'orderPoint',   to: 'financials' },
  { from: 'preparation',  to: 'financials' },
  { from: 'staffing',     to: 'financials' },
  { from: 'inventory',    to: 'financials' },
];
