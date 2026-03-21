import { ActionFlags, VisibleMetrics } from '../types/game';

export type CardEffectFn = (flags: ActionFlags) => Partial<VisibleMetrics>;

// --- Shared helpers ---

export function staffCount(flags: ActionFlags): number {
  return [flags.headBaristaMovedEarlier, flags.managerMovedEarlier, flags.tempStaffAdded]
    .filter(Boolean).length;
}

export function prepOptimized(flags: ActionFlags): boolean {
  return flags.workZonesCreated || flags.menuSimplified ||
    flags.prepAheadEnabled || flags.peakTaskSpecialisation;
}

// --- CORE CARDS ---

// a7: Move cafe manager to 8 AM
function managerEarlierEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  if (flags.peakTaskSpecialisation) {
    return { serviceConsistency: 5, waitingTime: -3, throughput: 2 };
  }
  return { serviceConsistency: 3, waitingTime: -3 };
}

// a8: Move head barista to 8 AM
function headBaristaEarlierEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  if (flags.peakTaskSpecialisation) {
    return { throughput: 15, waitingTime: -15, serviceConsistency: 10, backlog: -12 };
  }
  if (flags.sopsEnabled) {
    return { throughput: 13, waitingTime: -13, serviceConsistency: 9, backlog: -10 };
  }
  return { throughput: 10, waitingTime: -10, serviceConsistency: 8, backlog: -8 };
}

// a9: Shorten late weekday hours
function shortenHoursEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { financialResults: 15, wasteTracker: -5 };
}

// a10: Buy another coffee machine
function coffeeMachineEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  const staff = staffCount(flags);

  if (staff === 0) {
    return { financialResults: -5 };
  }

  // Full utilisation: 2+ extra staff AND (specialisation OR SOPs)
  if (staff >= 2 && flags.peakTaskSpecialisation) {
    return { financialResults: -5, throughput: 15, backlog: -15, waitingTime: -12 };
  }
  if (staff >= 2 && flags.sopsEnabled) {
    return { financialResults: -5, throughput: 12, backlog: -12, waitingTime: -10 };
  }

  // Partial: someone uses it occasionally
  return { financialResults: -5, throughput: 3, backlog: -3, waitingTime: -3 };
}

// a11: Simplify the menu
function simplifyMenuEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return {
    throughput: 10, backlog: -10, serviceConsistency: 10,
    stockAvailability: 10, waitingTime: -10, wasteTracker: -18, financialResults: 3
  };
}

// a12: Prep popular ingredients ahead of peak hours
function prepAheadEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  if (flags.expandedMenu) {
    return { throughput: 5, backlog: -5, waitingTime: -3, serviceConsistency: 3, wasteTracker: 3 };
  }
  return { throughput: 10, backlog: -10, waitingTime: -6, serviceConsistency: 5 };
}

// a13: Create fixed work zones
function workZonesEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  const staff = staffCount(flags);
  if (staff === 0) {
    return { serviceConsistency: 2, throughput: 1 };
  }
  if (flags.peakTaskSpecialisation) {
    return { serviceConsistency: 8, throughput: 6, backlog: -3 };
  }
  return { serviceConsistency: 5, throughput: 4 };
}

// a14: Peak-hour task specialisation (WHO does what)
function taskSpecialisationEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  const staff = staffCount(flags);
  if (staff === 0) {
    return {};
  }
  if (flags.workZonesCreated) {
    return { throughput: 12, serviceConsistency: 12, waitingTime: -10, backlog: -5 };
  }
  if (flags.sopsEnabled) {
    // Diminished — SOPs carry the org load
    return { throughput: 8, serviceConsistency: 8, waitingTime: -6, backlog: -2 };
  }
  return { throughput: 10, serviceConsistency: 10, waitingTime: -8, backlog: -3 };
}

// a15: Introduce SOPs (HOW to do things) — CORE
function sopsEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  if (flags.peakTaskSpecialisation) {
    // Diminished — specialisation carries the org load
    return { throughput: 5, waitingTime: -4, backlog: -3, serviceConsistency: 10, wasteTracker: -5, financialResults: 1 };
  }
  return { throughput: 12, waitingTime: -12, backlog: -8, serviceConsistency: 12, wasteTracker: -5, financialResults: 1 };
}

// --- FLEX CARD ---

// a33: Remap the head barista and cafe manager roles
function rolesRemappedEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { serviceConsistency: 6, stockAvailability: 6, wasteTracker: -4, throughput: 2 };
}

// --- SUPPORT CARDS ---

// a16: Mark a clear queue path
function queuePathEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { congestion: -4 };
}

// a17: Separate pickup from ordering point
function pickupSeparatedEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { congestion: -4 };
}

// a18: Stock sheet and reorder routine
function stockRoutineEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { stockAvailability: 15, wasteTracker: -18, serviceConsistency: 5, financialResults: 2 };
}

// a20: Peak-hour task board
function taskBoardEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  if (flags.peakTaskSpecialisation) {
    return { serviceConsistency: 5, throughput: 3 };
  }
  return { serviceConsistency: 3, throughput: 2 };
}

// --- HARMFUL CARDS ---

// a1: Buy another till (TRAP)
function tillEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  const staff = staffCount(flags);
  const coffee = flags.extraCoffeeMachineInstalled;
  const specialised = flags.peakTaskSpecialisation;

  // With specialisation or nobody: till correctly unused, just waste
  if (specialised || staff === 0) {
    return { financialResults: -5, congestion: 3 };
  }

  // NIGHTMARE: 3+ people, no coffee, no specialisation
  // Both tills manned, orders flood in, single barista drowns — throughput drops under pressure
  if (staff >= 2 && !coffee) {
    return { financialResults: -5, backlog: 15, waitingTime: 10, congestion: 10, throughput: -3 };
  }

  // Context switching: staff float and try to use all equipment
  return { financialResults: -5, congestion: 3, throughput: -3, waitingTime: 3 };
}

// a2: Hire a part-time barista (HARMFUL)
function tempStaffEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  const hasSOPs = flags.sopsEnabled;
  const hasSpec = flags.peakTaskSpecialisation;

  if (hasSOPs && hasSpec) {
    return { financialResults: -15, serviceConsistency: -2, throughput: 3 };
  }
  if (hasSOPs || hasSpec) {
    return { financialResults: -15, serviceConsistency: -5 };
  }
  return { financialResults: -15, serviceConsistency: -10 };
}

// a3: Extend weekday opening hours (HARMFUL)
function extendHoursEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { financialResults: -12, serviceConsistency: -8, wasteTracker: 8 };
}

// a4: Run a discount promotion (HARMFUL)
function discountEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  if (prepOptimized(flags)) {
    return { congestion: 8, backlog: 5, waitingTime: 5, financialResults: 3 };
  }
  return { congestion: 12, backlog: 15, waitingTime: 15, financialResults: -10 };
}

// a5: Expand menu options (HARMFUL)
function expandMenuEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  if (flags.stockRoutineEnabled) {
    return {
      serviceConsistency: -10, throughput: -10, backlog: 10,
      stockAvailability: -5, waitingTime: 10, financialResults: -10, wasteTracker: 10
    };
  }
  return {
    serviceConsistency: -10, throughput: -10, backlog: 10,
    stockAvailability: -12, waitingTime: 10, financialResults: -10, wasteTracker: 15
  };
}

// a6: Self-service pastries (HARMFUL)
function selfServicePastriesEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { congestion: 4, stockAvailability: -3, wasteTracker: 5, financialResults: 1 };
}

// a19: Click & Collect app (HARMFUL)
// Digital orders bypass the till and flood the prep station. The barista can't make drinks
// any faster — throughput drops under pressure (mistakes, remaking, chaos).
// With full capacity (2 machines, 2+ staff, specialised), the extra orders are partially absorbed.
function clickCollectEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  const staff = staffCount(flags);
  if (flags.extraCoffeeMachineInstalled && staff >= 2 && flags.peakTaskSpecialisation) {
    return { backlog: 5, waitingTime: 5, serviceConsistency: -5, financialResults: 2, congestion: -5, throughput: -3 };
  }
  return { backlog: 15, waitingTime: 12, serviceConsistency: -12, financialResults: -5, throughput: -5 };
}

// a21: Partner with a delivery app service (HARMFUL)
// Delivery orders compete with walk-ins for the same prep capacity. The barista is split
// between two streams — throughput per stream drops, and the 30% commission destroys margin.
function deliveryAppEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { backlog: 12, waitingTime: 10, serviceConsistency: -8, financialResults: -8, congestion: 6, throughput: -5 };
}

// a22: Social media marketing campaign (HARMFUL)
function socialMediaEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  if (prepOptimized(flags)) {
    return { congestion: 5, backlog: 3, waitingTime: 3, financialResults: 2 };
  }
  return { congestion: 8, backlog: 8, waitingTime: 8, financialResults: -5 };
}

// a23: Premium coffee grinder (HARMFUL)
function premiumGrinderEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { financialResults: -5, serviceConsistency: 2, throughput: -2 };
}

// a24: Redesign cafe interior (HARMFUL)
function interiorRedesignEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { financialResults: -8 };
}

// a25: Free Wi-Fi (HARMFUL)
function freeWifiEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { congestion: 6, financialResults: -3 };
}

// --- SLOT-WASTER CARDS ---

// a26: Digital menu board
function digitalMenuEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { financialResults: -3, congestion: 2 };
}

// a27: Loyalty stamp card
function loyaltyCardEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { financialResults: 1 };
}

// a28: Barista training course
function baristaTrainingEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { serviceConsistency: 2, financialResults: -4 };
}

// a29: Customer feedback tablet
function feedbackTabletEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { congestion: 2, financialResults: -2, serviceConsistency: 2 };
}

// a30: Cheaper ingredient supplier
function cheaperSupplierEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { financialResults: 4, serviceConsistency: -8, stockAvailability: -5 };
}

// a31: Bulk-buy ingredients
function bulkBuyEffects(flags: ActionFlags): Partial<VisibleMetrics> {
  if (flags.stockRoutineEnabled) {
    return { financialResults: 1, wasteTracker: 3, stockAvailability: -2 };
  }
  return { financialResults: -2, wasteTracker: 8, stockAvailability: -4 };
}

// a32: Enterprise Resource Planning (ERP) system
function erpEffects(_flags: ActionFlags): Partial<VisibleMetrics> {
  return { financialResults: -35, stockAvailability: -5, serviceConsistency: -3 };
}

// --- Registry ---

export const cardEffectFns: Record<string, CardEffectFn> = {
  a1: tillEffects,
  a2: tempStaffEffects,
  a3: extendHoursEffects,
  a4: discountEffects,
  a5: expandMenuEffects,
  a6: selfServicePastriesEffects,
  a7: managerEarlierEffects,
  a8: headBaristaEarlierEffects,
  a9: shortenHoursEffects,
  a10: coffeeMachineEffects,
  a11: simplifyMenuEffects,
  a12: prepAheadEffects,
  a13: workZonesEffects,
  a14: taskSpecialisationEffects,
  a15: sopsEffects,
  a16: queuePathEffects,
  a17: pickupSeparatedEffects,
  a18: stockRoutineEffects,
  a19: clickCollectEffects,
  a20: taskBoardEffects,
  a21: deliveryAppEffects,
  a22: socialMediaEffects,
  a23: premiumGrinderEffects,
  a24: interiorRedesignEffects,
  a25: freeWifiEffects,
  a26: digitalMenuEffects,
  a27: loyaltyCardEffects,
  a28: baristaTrainingEffects,
  a29: feedbackTabletEffects,
  a30: cheaperSupplierEffects,
  a31: bulkBuyEffects,
  a32: erpEffects,
  a33: rolesRemappedEffects,
};
