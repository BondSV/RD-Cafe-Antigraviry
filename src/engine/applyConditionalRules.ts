import { ActionFlags, VisibleMetrics, ActionConfig } from '../types/game';
import { clamp } from '../utils/clamp';

export function applyConditionalRules(
  action: ActionConfig,
  currentFlags: ActionFlags,
  currentMetrics: VisibleMetrics
): VisibleMetrics {
  const m = { ...currentMetrics };

  const update = (key: keyof VisibleMetrics, delta: number) => {
    m[key] = clamp(m[key] + delta, 0, 100);
  };

  // 1. Add another till
  if (action.id === 'a1') {
    const secondTillCanRun = currentFlags.tempStaffAdded || (currentFlags.managerMovedEarlier && currentFlags.headBaristaMovedEarlier);
    const prepSideImproved = currentFlags.extraCoffeeMachineInstalled || currentFlags.menuSimplified || currentFlags.prepAheadEnabled || currentFlags.workZonesCreated || currentFlags.peakTaskSpecialisation;

    if (secondTillCanRun) {
      if (!prepSideImproved) {
        update('throughput', 5);
        update('backlog', 15);
        update('waitingTime', 10);
        update('congestion', 10);
      } else {
        update('throughput', 10);
        update('waitingTime', -5);
      }
    }
  }

  // 2. Hire temporary staff
  if (action.id === 'a2') {
    if (currentFlags.extraTillInstalled) {
      const prepSideImproved = currentFlags.extraCoffeeMachineInstalled || currentFlags.menuSimplified || currentFlags.prepAheadEnabled || currentFlags.workZonesCreated || currentFlags.peakTaskSpecialisation;
      if (!prepSideImproved) {
        update('throughput', 5);
        update('backlog', 15);
        update('waitingTime', 10);
        update('congestion', 10);
      }
    }
    if (!currentFlags.lateHoursShortened) {
      update('financialResults', -5);
    }
  }

  // 4. Discount Promotion
  if (action.id === 'a4') {
    const capacityUpgraded = currentFlags.extraCoffeeMachineInstalled && currentFlags.workZonesCreated && currentFlags.menuSimplified;
    if (capacityUpgraded) {
      update('financialResults', 20); // Net +15
      update('backlog', -5); // Reduce penalty
      update('waitingTime', -5); // Reduce penalty
      update('throughput', 10); // Increase throughput slightly
    }
  }

  // 7. Manager earlier
  if (action.id === 'a7') {
    if (currentFlags.headBaristaMovedEarlier) { update('throughput', 5); update('congestion', -5); }
    if (!currentFlags.lateHoursShortened) { update('financialResults', -5); }
  }

  // 8. Head Barista earlier
  if (action.id === 'a8') {
    if (currentFlags.prepAheadEnabled) { update('throughput', 5); update('backlog', -5); }
    if (currentFlags.menuSimplified) { update('backlog', -5); update('waitingTime', -5); }
  }

  // 9. Shorten late hours
  if (action.id === 'a9') {
    if (currentFlags.managerMovedEarlier) { update('financialResults', 5); update('serviceConsistency', 5); }
    if (currentFlags.headBaristaMovedEarlier) { update('financialResults', 5); update('serviceConsistency', 5); }
  }

  // 10. Extra coffee machine
  if (action.id === 'a10') {
    if (currentFlags.menuSimplified) { update('throughput', 10); update('backlog', -5); }
    if (currentFlags.prepAheadEnabled) { update('throughput', 5); }
    if (!currentFlags.workZonesCreated) { update('congestion', 5); }
  }

  // 11. Simplify menu
  if (action.id === 'a11') {
    if (currentFlags.extraCoffeeMachineInstalled) { update('throughput', 10); update('waitingTime', -5); }
    if (currentFlags.prepAheadEnabled) { update('throughput', 5); update('serviceConsistency', 5); }
  }

  // 12. Prep ahead
  if (action.id === 'a12') {
    if (currentFlags.menuSimplified) { update('throughput', 5); update('backlog', -5); }
    if (currentFlags.headBaristaMovedEarlier) { update('throughput', 5); update('waitingTime', -5); }
  }

  // 13. Work zones
  if (action.id === 'a13') {
    if (currentFlags.peakTaskSpecialisation) { update('throughput', 5); update('serviceConsistency', 5); }
    if (currentFlags.extraCoffeeMachineInstalled) { update('congestion', -5); update('throughput', 5); }
  }

  // 14. Peak task specialisation
  if (action.id === 'a14') {
    const extraStaff = currentFlags.tempStaffAdded || currentFlags.managerMovedEarlier || currentFlags.headBaristaMovedEarlier;
    if (extraStaff) {
      update('throughput', 10);
      update('serviceConsistency', 10);
      update('congestion', -5);
      
      if (currentFlags.sopsEnabled) { update('serviceConsistency', 5); update('throughput', 5); }
      if (currentFlags.workZonesCreated) { update('throughput', 5); update('congestion', -5); }
      if (currentFlags.headBaristaMovedEarlier) { update('throughput', 10); update('waitingTime', -5); }
    } else {
      // No effect - one person cannot specialise
    }
  }

  // 15. SOPs
  if (action.id === 'a15') {
    if (currentFlags.peakTaskSpecialisation) { update('serviceConsistency', 5); }
    if (currentFlags.workZonesCreated) { update('throughput', 5); }
  }

  // 16. Queue path
  if (action.id === 'a16') {
    if (currentFlags.pickupSeparated) { update('congestion', -5); update('waitingTime', -5); }
  }

  // 17. Pickup separated
  if (action.id === 'a17') {
    if (currentFlags.queuePathMarked) { update('congestion', -5); update('waitingTime', -5); }
  }

  // 18. Stock routine
  if (action.id === 'a18') {
    if (currentFlags.menuSimplified) { update('stockAvailability', 5); update('serviceConsistency', 5); }
  }

  // 19. Click and Collect
  if (action.id === 'a19') {
    if (currentFlags.extraCoffeeMachineInstalled && currentFlags.workZonesCreated) {
      update('backlog', -5); // Less severe backlog since prep space is better
      update('waitingTime', -5); // Less severe wait time
    }
  }

  // 20. Task board
  if (action.id === 'a20') {
    if (currentFlags.sopsEnabled) { update('serviceConsistency', 5); }
    if (currentFlags.peakTaskSpecialisation) { update('serviceConsistency', 5); update('throughput', 5); }
  }

  return m;
}
