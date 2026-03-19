import { ActionConfig } from '../types/game';

export const actions: ActionConfig[] = [
  // STAFFING & SCHEDULING
  {
    id: 'a2',
    title: 'Hire temporary staff for morning peak',
    category: 'harmful',
    group: 'staffing',
    description: 'Bring in an extra team member for the 7–10 AM window to add capacity during the busiest hours.',
    setFlag: 'tempStaffAdded',
    baseEffects: { financialResults: -15, serviceConsistency: -5 }
  },
  {
    id: 'a7',
    title: 'Move the café manager earlier',
    category: 'core',
    group: 'staffing',
    description: 'The café manager currently starts at 10 AM. Move them to start at 8 AM to provide leadership during the morning peak.',
    setFlag: 'managerMovedEarlier',
    baseEffects: { serviceConsistency: 10, congestion: -5, waitingTime: -5 }
  },
  {
    id: 'a8',
    title: 'Move the head barista earlier',
    category: 'core',
    group: 'staffing',
    description: 'The head barista currently starts at 9 AM, an hour after the café opens. Move them to start at 7 AM alongside Assistant Barista #1.',
    setFlag: 'headBaristaMovedEarlier',
    baseEffects: { throughput: 10, waitingTime: -10, serviceConsistency: 10, backlog: -10 }
  },
  {
    id: 'a9',
    title: 'Shorten late weekday opening hours',
    category: 'core',
    group: 'staffing',
    description: 'The café currently stays open until 9 PM on weekdays. Close at 7 PM instead and reallocate the saved hours and cost.',
    setFlag: 'lateHoursShortened',
    baseEffects: { financialResults: 15 }
  },
  {
    id: 'a14',
    title: 'Introduce peak-hour task specialisation',
    category: 'core',
    group: 'staffing',
    description: 'Instead of floating between all tasks, assign each staff member a fixed role during peak hours: one on till, one on coffee, one on food.',
    setFlag: 'peakTaskSpecialisation',
    baseEffects: {}
  },
  {
    id: 'a19',
    title: 'Launch a Click & Collect app',
    category: 'harmful',
    group: 'process',
    description: 'Allow customers to order and pay on their phones to avoid the till queue, sending tickets straight to the barista.',
    setFlag: 'clickAndCollectEnabled',
    baseEffects: { congestion: -10, backlog: 15, waitingTime: 10, serviceConsistency: -20 }
  },

  // LAYOUT & EQUIPMENT
  {
    id: 'a1',
    title: 'Add another till',
    category: 'harmful',
    group: 'layout',
    description: 'Install a second till at the counter to handle ordering during busy periods.',
    setFlag: 'extraTillInstalled',
    baseEffects: { financialResults: -5, congestion: 5 }
  },
  {
    id: 'a10',
    title: 'Add another coffee machine',
    category: 'core',
    group: 'layout',
    description: 'Install a second espresso machine to increase drink preparation capacity in the shared workspace.',
    setFlag: 'extraCoffeeMachineInstalled',
    baseEffects: { throughput: 10, backlog: -10, waitingTime: -10 }
  },
  {
    id: 'a13',
    title: 'Create fixed work zones behind the counter',
    category: 'core',
    group: 'layout',
    description: 'Divide the shared prep space into defined zones: a coffee station, a food assembly area, and a service/till area.',
    setFlag: 'workZonesCreated',
    baseEffects: { congestion: -10, serviceConsistency: 10, throughput: 5 }
  },
  {
    id: 'a16',
    title: 'Mark a clear queue path',
    category: 'support',
    group: 'layout',
    description: 'Use floor markings or barriers to create a visible queue line that separates waiting customers from the counter area.',
    setFlag: 'queuePathMarked',
    baseEffects: { congestion: -10, waitingTime: -5 }
  },
  {
    id: 'a17',
    title: 'Separate the pickup point from the ordering point',
    category: 'support',
    group: 'layout',
    description: 'Move the collection point to the other end of the counter so that customers picking up orders do not block those still queuing.',
    setFlag: 'pickupSeparated',
    baseEffects: { congestion: -10, waitingTime: -5 }
  },

  // MENU & INVENTORY
  {
    id: 'a5',
    title: 'Expand menu options',
    category: 'harmful',
    group: 'menu',
    description: 'Add new sandwich fillings and drink options to broaden the product range and appeal.',
    setFlag: 'expandedMenu',
    baseEffects: { serviceConsistency: -10, throughput: -10, backlog: 10, stockAvailability: -10, waitingTime: 10, financialResults: -10 }
  },
  {
    id: 'a6',
    title: 'Add self-service pastries near the till',
    category: 'harmful',
    group: 'menu',
    description: 'Place a pastry display next to the till for customers to grab while queuing.',
    setFlag: 'selfServicePastries',
    baseEffects: { congestion: 5, stockAvailability: -5 }
  },
  {
    id: 'a11',
    title: 'Simplify the menu',
    category: 'core',
    group: 'menu',
    description: 'Reduce the range of sandwich fillings, drink variations, and snack options to focus on the most popular items.',
    setFlag: 'menuSimplified',
    baseEffects: { throughput: 10, backlog: -10, serviceConsistency: 10, stockAvailability: 10, waitingTime: -10 }
  },
  {
    id: 'a12',
    title: 'Prep popular ingredients before peak',
    category: 'core',
    group: 'menu',
    description: 'Pre-portion and partially prepare the most commonly ordered sandwich fillings and snack items before the morning rush begins.',
    setFlag: 'prepAheadEnabled',
    baseEffects: { throughput: 10, backlog: -10, waitingTime: -5, serviceConsistency: 5 }
  },
  {
    id: 'a18',
    title: 'Add a basic stock sheet and reorder routine',
    category: 'support',
    group: 'menu',
    description: 'Introduce a simple daily checklist for ingredient levels and a fixed reorder schedule tied to delivery days.',
    setFlag: 'stockRoutineEnabled',
    baseEffects: { stockAvailability: 10, serviceConsistency: 5 }
  },

  // PROCESS & PROMOTION
  {
    id: 'a3',
    title: 'Extend weekday opening hours',
    category: 'harmful',
    group: 'process',
    description: 'Keep the café open until 10 PM on weekdays instead of 9 PM to capture more evening trade.',
    setFlag: 'extendedHours',
    baseEffects: { financialResults: -15, serviceConsistency: -5 }
  },
  {
    id: 'a4',
    title: 'Run a discount promotion',
    category: 'harmful',
    group: 'process',
    description: 'Launch a 20% off promotion to attract customers back and boost transaction volume.',
    setFlag: 'discountPromotion',
    baseEffects: { backlog: 10, congestion: 10, waitingTime: 10, financialResults: -5 }
  },
  {
    id: 'a15',
    title: 'Introduce SOPs for core tasks',
    category: 'support',
    group: 'process',
    description: 'Write and post simple step-by-step procedures for the most common drink and food orders so that every team member follows the same sequence.',
    setFlag: 'sopsEnabled',
    baseEffects: { serviceConsistency: 10, throughput: 5 }
  },
  {
    id: 'a20',
    title: 'Introduce a simple peak-hour task board',
    category: 'support',
    group: 'process',
    description: 'Put a whiteboard or printed sheet behind the counter showing who does what during each hour of the morning peak.',
    setFlag: 'peakTaskBoardEnabled',
    baseEffects: { serviceConsistency: 5, throughput: 5 }
  }
];
