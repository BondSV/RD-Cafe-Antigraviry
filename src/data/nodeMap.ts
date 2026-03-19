import { SystemMapNode, SystemMapConnection } from '../types/game';

export const systemNodes: SystemMapNode[] = [
  { id: 'orderPoint',    label: 'Order Point',    drivingMetrics: ['waitingTime', 'congestion'],         x: 50, y: 15 },
  { id: 'preparation',   label: 'Preparation',    drivingMetrics: ['throughput', 'backlog'],              x: 82, y: 35 },
  { id: 'menuStock',     label: 'Menu & Stock',   drivingMetrics: ['stockAvailability', 'serviceConsistency'], x: 82, y: 75 },
  { id: 'costs',         label: 'Financials',     drivingMetrics: ['financialResults'],                    x: 50, y: 85 },
  { id: 'staffing',      label: 'Staffing',       drivingMetrics: ['serviceConsistency', 'throughput'],  x: 18, y: 75 },
  { id: 'customerFlow',  label: 'Customer Flow',  drivingMetrics: ['congestion', 'waitingTime'],         x: 18, y: 35 },
];

export const systemConnections: SystemMapConnection[] = [
  // Inputs driving processes
  { from: 'staffing',     to: 'orderPoint' },
  { from: 'staffing',     to: 'preparation' },
  { from: 'menuStock',    to: 'orderPoint' },
  { from: 'menuStock',    to: 'preparation' },
  
  // Midstream processes
  { from: 'orderPoint',   to: 'preparation' },
  
  // Outcomes
  { from: 'orderPoint',   to: 'customerFlow' },
  { from: 'preparation',  to: 'customerFlow' },
  { from: 'staffing',     to: 'costs' },
  { from: 'menuStock',    to: 'costs' },
  { from: 'customerFlow', to: 'costs' },

  // Bidirectional stress loops
  // Queue forces rushed transactions or causes abandonment
  { from: 'customerFlow', to: 'orderPoint' },
  // Queue panic bleeds into the kitchen, causing chaos and mistakes
  { from: 'customerFlow', to: 'preparation' },
];
