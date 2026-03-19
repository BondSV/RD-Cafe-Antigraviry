export const caseData = {
  staffRoster: [
    { role: 'Café Manager', schedule: 'Mon–Fri', hours: '10 AM – 6 PM', type: 'Full-time' },
    { role: 'Head Barista', schedule: 'Mon–Fri', hours: '9 AM – 5 PM', type: 'Full-time' },
    { role: 'Assistant Barista #1', schedule: 'Mon–Fri', hours: '7 AM – 3 PM', type: 'Full-time' },
    { role: 'Assistant Barista #2', schedule: 'Mon–Fri', hours: '1 PM – 9 PM', type: 'Full-time' },
    { role: 'Assistant Barista #3', schedule: 'Sat–Sun', hours: '10 AM – 6 PM', type: 'Part-time' },
  ],
  operatingHours: {
    weekdays: '7 AM – 9 PM',
    weekends: '10 AM – 6 PM',
  },
  footfall: { weekdays: '~350', weekends: '~100' },
  transactions: { weekdays: '~150', weekends: '~80' },
  averageTransaction: '£6.30',
  prepSpace: 'All food preparation and coffee-making happen in one small shared area behind the counter.',
  keyComplaints: [
    'Slow service and long queues',
    'Congestion around the counter',
    'Occasional stockouts of popular fillings',
    'Pastries not always fresh',
  ],
  positives: [
    'Friendly, approachable staff',
    'Good-quality coffee',
  ],
};
