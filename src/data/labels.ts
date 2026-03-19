import { VisibleMetrics } from '../types/game';

export const metricLabels: Record<keyof VisibleMetrics, string> = {
  waitingTime: 'Service Speed',
  throughput: 'Orders Completed per Hour',
  backlog: 'Order Processing',
  congestion: 'Queue Flow',
  serviceConsistency: 'Service Consistency',
  stockAvailability: 'Stock Availability',
  financialResults: 'Cost Efficiency',
};
