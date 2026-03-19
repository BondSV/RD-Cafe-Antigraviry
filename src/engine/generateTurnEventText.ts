import { ActionConfig, ActionFlags, VisibleMetrics } from '../types/game';

export function generateTurnEventText(
  action: ActionConfig, 
  flags: ActionFlags, 
  metricsBefore: VisibleMetrics, 
  metricsAfter: VisibleMetrics
): string {
  if (action.id === 'a1') {
    if (!flags.tempStaffAdded && !flags.rotaRedesigned && !(flags.managerMovedEarlier && flags.headBaristaMovedEarlier)) {
      return "A second till is now in place at the counter. During the morning rush, it sat mostly unused and the area felt more cramped.";
    }
    return "The second till is now staffed. The front line moves quicker, but cups build up fast by the espresso machine.";
  }
  if (action.id === 'a2') {
    return "An extra team member bumps up staffing from 7 to 10 AM. It looks busy behind the counter, but the wage bill is visibly higher.";
  }
  
  if (action.id === 'a14') {
    if (flags.tempStaffAdded || flags.managerMovedEarlier || flags.headBaristaMovedEarlier) {
      return "With sufficient staff now on the floor, the strict zone assignments keep the handover of cups and plates smooth.";
    }
    return "The rule was announced, but with only one person behind the counter during the rush, they still have to do everything themselves. Nothing changed.";
  }
  
  if (action.id === 'a19') {
    if (flags.lateHoursShortened) {
      return "By cutting the quiet evening hours, the new schedule comfortably supports the morning rush without blowing the budget.";
    }
    return "The new schedule better aligns shifts with the morning rush. The peak is less stressful, but the overall wage bill hasn't dropped.";
  }
  
  const texts: Record<string, string> = {
    a3: "The café stays open until 10 PM. Sales dropped off heavily after sunset, leaving staff wiping empty tables.",
    a4: "The 20% discount pulled a massive crowd into the doorway. Staff look overwhelmed trying to keep up with the tickets.",
    a5: "The new sandwich and drink variants are on display. Customers spend more time staring at the menu, and orders take longer to assemble.",
    a6: "A pastry stand sits near the till. Customers occasionally grab one, but the queue path feels a bit more pinched.",
    a7: "The manager is now on the floor at 8 AM. Staff seem more coordinated, though the early peak at 7 AM is still tight.",
    a8: "The head barista starts pulling shots at 7 AM. Drinks are coming out noticeably faster and the queue moves more steadily.",
    a9: "The café closed at 7 PM tonight. The quietest shifts were pruned, noticeably easing the weekly wage bill.",
    a10: "A second espresso machine is hooked up in the shared space. Shots can be pulled faster, provided staff don't trip over each other.",
    a11: "The menu board is cleaner and shorter. Staff are reaching for the same few ingredients, making assembly much quicker.",
    a12: "Trays of pre-sliced meats and cheeses are stacked in the fridge before the doors open. Sandwiches fly together faster.",
    a13: "Tape on the floor divides the space into coffee, food, and till zones. Staff are crossing paths far less often.",
    a14: "During the rush, staff stay glued to their assigned stations. The handover of cups and plates looks much smoother.",
    a15: "Short instruction cards are taped above the prep benches. New staff are looking up slightly less often.",
    a16: "A rope barrier guides the queue away from the pickup area. Waiting customers are no longer standing on top of people eating.",
    a17: "The collection point moved to the far end of the counter. The knot of people waiting for lattes has shifted away from the till.",
    a18: "A clipboard tracks daily ingredient counts. The fridge was fully stocked this morning before the rush.",
    a19: "The new rota matches bodies to peak transaction times. 8 AM feels fully staffed, while the slow afternoons are running lean.",
    a20: "A whiteboard shows everyone's role for each hour of the morning. Nobody is left guessing what they should be doing."
  };

  return texts[action.id] || "Changes were implemented and observable results were tracked during the operational shift.";
}
