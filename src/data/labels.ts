import { VisibleMetrics } from '../types/game';

export const metricLabels: Record<keyof VisibleMetrics, string> = {
  waitingTime: 'Customer Waiting Time',
  throughput: 'Orders Completed / Hour',
  backlog: 'Order Backlog',
  congestion: 'Counter Congestion',
  serviceConsistency: 'Service Consistency',
  stockAvailability: 'Stock Availability',
  budgetPressure: 'Budget Pressure',
};
