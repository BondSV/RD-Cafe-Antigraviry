import { SystemMapNode, SystemMapConnection } from '../types/game';

export const systemNodes: SystemMapNode[] = [
  { id: 'orderPoint',    label: 'Order Point',    drivingMetrics: ['waitingTime', 'congestion'],         x: 50, y: 15 },
  { id: 'preparation',   label: 'Preparation',    drivingMetrics: ['throughput', 'backlog'],              x: 80, y: 40 },
  { id: 'customerFlow',  label: 'Customer Flow',  drivingMetrics: ['congestion', 'waitingTime'],         x: 20, y: 40 },
  { id: 'staffing',      label: 'Staffing',       drivingMetrics: ['serviceConsistency', 'throughput'],  x: 50, y: 55 },
  { id: 'menuStock',     label: 'Menu & Stock',   drivingMetrics: ['stockAvailability', 'serviceConsistency'], x: 80, y: 75 },
  { id: 'costs',         label: 'Costs',          drivingMetrics: ['budgetPressure'],                    x: 20, y: 75 },
];

export const systemConnections: SystemMapConnection[] = [
  { from: 'orderPoint',   to: 'preparation' },
  { from: 'orderPoint',   to: 'customerFlow' },
  { from: 'orderPoint',   to: 'costs' },
  { from: 'preparation',  to: 'staffing' },
  { from: 'preparation',  to: 'menuStock' },
  { from: 'staffing',     to: 'costs' },
  { from: 'menuStock',    to: 'costs' },
  { from: 'customerFlow', to: 'staffing' },
];
