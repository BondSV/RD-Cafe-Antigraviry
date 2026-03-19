import { SystemMapNode, SystemMapConnection } from '../types/game';

export const systemNodes: SystemMapNode[] = [
  { id: 'orderPoint',    label: 'Order Point',          drivingMetrics: ['waitingTime', 'congestion'],         x: 50, y: 25 },
  { id: 'preparation',   label: 'Preparation',          drivingMetrics: ['throughput', 'backlog'],             x: 82, y: 45 },
  { id: 'inventory',     label: 'Inventory & Supply',   drivingMetrics: ['stockAvailability'],                 x: 82, y: 70 },
  { id: 'financials',    label: 'Financials',           drivingMetrics: ['financialResults', 'throughput', 'waitingTime'], x: 50, y: 88 },
  { id: 'quality',       label: 'Product & Quality',    drivingMetrics: ['serviceConsistency', 'stockAvailability'], x: 18, y: 70 },
  { id: 'staffing',      label: 'Staff Efficiency',     drivingMetrics: ['serviceConsistency', 'throughput'],  x: 18, y: 45 },
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
