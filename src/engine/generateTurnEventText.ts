import { ActionConfig, ActionFlags, VisibleMetrics } from '../types/game';
import { staffCount, prepOptimized } from './cardEffects';

/**
 * Helper: builds a list of "ripple effect" notes for previously played cards
 * whose contributions have shifted because of the card just played.
 */
function buildRippleNotes(actionId: string, flags: ActionFlags): string {
  const notes: string[] = [];

  // --- a14 (specialisation) played: many cards shift ---
  if (actionId === 'a14') {
    if (flags.sopsEnabled) {
      notes.push("The SOPs' contribution has adjusted \u2014 with formal role assignments now carrying the organisational structure, the written procedures shift to a supporting role focused on execution quality.");
    }
    if (flags.headBaristaMovedEarlier) {
      notes.push("The head barista's effectiveness has increased \u2014 dedicated to the coffee machine with no floating, their output is now at its peak.");
    }
    if (flags.extraCoffeeMachineInstalled && staffCount(flags) >= 2) {
      notes.push("The second coffee machine is now fully utilised \u2014 with dedicated baristas assigned to each machine, drink output has jumped significantly.");
    }
    if (flags.workZonesCreated) {
      notes.push("The work zones are now working at full potential \u2014 fixed roles combined with physical zones mean each person stays in their area without crossing paths.");
    }
    if (flags.extraTillInstalled) {
      notes.push("The second till has been deliberately left closed \u2014 the role assignments made clear that one register is sufficient.");
    }
    if (flags.tempStaffAdded) {
      notes.push("The part-time barista's role is now clearer \u2014 with a defined assignment, they're causing less disruption.");
    }
    if (flags.managerMovedEarlier) {
      notes.push("The manager now has a clear role in the peak-hour system \u2014 their contribution has become more focused and effective.");
    }
  }

  // --- a15 (SOPs) played: several cards shift ---
  if (actionId === 'a15') {
    if (flags.peakTaskSpecialisation) {
      // Already covered in main observation ("complement the role assignments")
    }
    if (flags.headBaristaMovedEarlier && !flags.peakTaskSpecialisation) {
      notes.push("The head barista's effectiveness has increased \u2014 with clear procedures to follow, their workflow is more structured and consistent.");
    }
    if (flags.extraCoffeeMachineInstalled && staffCount(flags) >= 2 && !flags.peakTaskSpecialisation) {
      notes.push("The second coffee machine is now being used more effectively \u2014 the step-by-step procedures give the second barista confidence to operate independently.");
    }
    if (flags.peakTaskSpecialisation && flags.sopsEnabled) {
      // When SOPs played after specialisation — specialisation effects diminish
      notes.push("The specialisation system's contribution has adjusted slightly \u2014 with SOPs now handling process standards, there is some overlap in organisational structure.");
    }
    if (flags.tempStaffAdded && !flags.peakTaskSpecialisation) {
      notes.push("The part-time barista can now follow the written procedures \u2014 their quality impact has improved.");
    }
  }

  // --- Staffing cards (a8, a7, a2) affect coffee machine and till ---
  if (actionId === 'a8' || actionId === 'a7' || actionId === 'a2') {
    const staff = staffCount(flags);
    if (flags.extraCoffeeMachineInstalled) {
      if (staff >= 2 && (flags.peakTaskSpecialisation || flags.sopsEnabled)) {
        notes.push("With additional staff now available, the second coffee machine can be operated consistently \u2014 its contribution has increased significantly.");
      } else if (staff >= 1) {
        notes.push("The second coffee machine is now getting some use \u2014 with an extra person available, someone occasionally operates it.");
      }
    }
    if (flags.extraTillInstalled && !flags.peakTaskSpecialisation) {
      if (staff >= 2 && !flags.extraCoffeeMachineInstalled) {
        notes.push("Warning: with more staff and two tills but only one coffee machine, there is a risk of orders flooding faster than drinks can be prepared.");
      }
    }
    if (flags.peakTaskSpecialisation && actionId !== 'a2') {
      // Specialisation was zero-effect with 0 staff, now activates
      const prevStaff = staffCount({ ...flags,
        [actionId === 'a8' ? 'headBaristaMovedEarlier' : 'managerMovedEarlier']: false
      });
      if (prevStaff === 0) {
        notes.push("Task specialisation has now activated \u2014 with more than one person behind the counter, the role assignments can actually take effect.");
      }
    }
  }

  // --- a10 (coffee machine) played: till nightmare may be averted ---
  if (actionId === 'a10') {
    if (flags.extraTillInstalled && staffCount(flags) >= 2 && !flags.peakTaskSpecialisation) {
      notes.push("The second coffee machine has eased the pressure from the two tills \u2014 orders no longer pile up as badly at the prep station.");
    }
  }

  // --- a18 (stock routine) played: expand menu and bulk buy moderated ---
  if (actionId === 'a18') {
    if (flags.expandedMenu) {
      notes.push("The stock tracking has partially offset the expanded menu's inventory problems \u2014 ingredients are more reliably in stock, though the operational complexity remains.");
    }
    if (flags.bulkBuyEnabled) {
      notes.push("Bulk-purchased ingredients are now being tracked \u2014 less waste from forgotten stock at the back of the fridge.");
    }
  }

  // --- prepOptimized cards played: discount and social media moderated ---
  const isPrepOptCard = ['a13', 'a11', 'a12', 'a14'].includes(actionId);
  if (isPrepOptCard) {
    // Check if this card is the one that tips prepOptimized to true
    const wasPrepOptBefore = (() => {
      const prevFlags = { ...flags };
      if (actionId === 'a13') prevFlags.workZonesCreated = false;
      if (actionId === 'a11') prevFlags.menuSimplified = false;
      if (actionId === 'a12') prevFlags.prepAheadEnabled = false;
      if (actionId === 'a14') prevFlags.peakTaskSpecialisation = false;
      return prepOptimized(prevFlags);
    })();

    if (!wasPrepOptBefore && prepOptimized(flags)) {
      if (flags.discountPromotion) {
        notes.push("The discount promotion is now causing less damage \u2014 with improved prep capacity, the operation can absorb some of the extra demand.");
      }
      if (flags.socialMediaCampaign) {
        notes.push("The social media campaign's impact has shifted \u2014 with better operations, the extra foot traffic is being handled more effectively.");
      }
    }
  }

  // --- a5 (expand menu) played: prep ahead degrades ---
  if (actionId === 'a5') {
    if (flags.prepAheadEnabled) {
      notes.push("The prep-ahead routine is now less effective \u2014 with more menu items to prepare, some prepped ingredients go unused and create waste.");
    }
  }

  // --- a13 (work zones) played: specialisation boosts ---
  if (actionId === 'a13') {
    if (flags.peakTaskSpecialisation) {
      notes.push("Task specialisation is now more effective \u2014 the physical zones reinforce the role assignments, keeping each person in their designated area.");
    }
  }

  if (notes.length === 0) return '';
  return '\n\n' + notes.join(' ');
}

export function generateTurnEventText(
  action: ActionConfig,
  flags: ActionFlags,
  _metricsBefore: VisibleMetrics,
  _metricsAfter: VisibleMetrics
): string {
  let mainText = '';

  // --- a1: Buy another till ---
  if (action.id === 'a1') {
    const staff = staffCount(flags);
    const coffee = flags.extraCoffeeMachineInstalled;
    const specialised = flags.peakTaskSpecialisation;

    if (staff === 0) {
      mainText = "A second till now sits at the counter. During the morning rush it stayed dark \u2014 nobody was free to operate it. The counter feels a touch more cramped.";
    } else if (specialised && !coffee) {
      mainText = "The second till is installed, but with task specialisation in place, the roles are clear: one person takes orders, one runs the coffee machine, and the third handles food prep and restocking. The second till stays closed \u2014 the team recognised that one register is enough when the real bottleneck is drink preparation.";
    } else if (specialised && coffee) {
      mainText = "The task board assigns one person to orders and two to the coffee machines. The second till stays dark \u2014 one register easily keeps pace with two baristas.";
    } else if (staff >= 2 && !coffee) {
      mainText = "Both tills are now manned and orders are flying in. But with only one coffee machine, tickets are stacking up faster than the barista can pull shots. The queue has moved from the counter to the pickup area \u2014 customers are visibly frustrated waiting for drinks.";
    } else if (staff === 1) {
      mainText = "Both staff members try to run their own orders and coffees in parallel, shuffling between the two tills and the coffee machine. The constant switching back and forth is visibly slower than just splitting the roles.";
    } else {
      mainText = "With three staff, two tills, and two coffee machines but no clear role assignment, the team drifts between stations. Some rushes see both tills manned and a coffee machine idle; other moments it works \u2014 but the inconsistency costs time.";
    }
  }

  // --- a2: Hire a part-time barista ---
  else if (action.id === 'a2') {
    if (flags.sopsEnabled && flags.peakTaskSpecialisation) {
      mainText = "The task board assigns the part-time barista to sandwich prep and restocking. With the SOP cards to follow, they keep the food station running \u2014 though the wage bill has ballooned.";
    } else if (flags.sopsEnabled) {
      mainText = "The part-time barista reads the instruction cards above the prep bench. They're slow but following the right steps.";
    } else if (flags.peakTaskSpecialisation) {
      mainText = "The part-time barista is assigned a clear role on the task board. They're not fast, but at least they're not getting in anyone's way.";
    } else {
      mainText = "A part-time barista arrives for the morning shift. Without clear instructions, they spend most of the time asking what to do. The coffee quality is noticeably uneven.";
    }
  }

  // --- a3: Extend weekday opening hours ---
  else if (action.id === 'a3') {
    if (flags.lateHoursShortened) {
      mainText = "The schedule says close at 7 PM AND stay open until 10 PM. Nobody knows what's happening. The evening shift is chaos.";
    } else {
      mainText = "The cafe stayed open until 10 PM. The last hour saw two customers. Staff were visibly tired, and the sandwiches prepped for the evening rush went in the bin.";
    }
  }

  // --- a4: Run a discount promotion ---
  else if (action.id === 'a4') {
    if (prepOptimized(flags)) {
      mainText = "The discount brought a surge of customers. The streamlined operation kept up better than expected, but margins are thin and the queue is still long.";
    } else {
      mainText = "The 20% discount pulled a massive crowd through the doorway. Staff are overwhelmed, tickets are piling up, and the line is out the door.";
    }
  }

  // --- a5: Expand menu options ---
  else if (action.id === 'a5') {
    if (flags.stockRoutineEnabled) {
      mainText = "The clipboard now tracks twice as many items. Ingredients are at least in stock, but the assembly bench is a bottleneck as staff navigate the expanded range.";
    } else {
      mainText = "New sandwich and drink variants line the board. Customers stare at the expanded menu, assembly is slower, and ingredients are already running out.";
    }
  }

  // --- a6: Self-service pastries ---
  else if (action.id === 'a6') {
    mainText = "A pastry stand sits near the till. A few customers grab one while queuing, but the space near the counter feels more pinched. Several pastries went unsold and had to be binned.";
  }

  // --- a7: Move cafe manager earlier ---
  else if (action.id === 'a7') {
    if (flags.peakTaskSpecialisation) {
      mainText = "The manager steps into the order-taking role at 8 AM, freeing the baristas to focus entirely on coffee. The handover is smooth.";
    } else {
      mainText = "The manager arrives at 8 AM and starts directing traffic behind the counter. Staff seem more coordinated, though the early 7 AM peak is still tight.";
    }
  }

  // --- a8: Move head barista earlier ---
  else if (action.id === 'a8') {
    if (flags.extraTillInstalled && !flags.peakTaskSpecialisation) {
      mainText = "The head barista arrives at 8 AM. With two tills and no clear assignment, both staff sometimes end up taking orders at the same time, leaving the coffee machine idle.";
    } else if (flags.peakTaskSpecialisation) {
      mainText = "The head barista is at the coffee machine from 8 AM, focused on one thing: drinks. Orders are flying off the counter.";
    } else if (flags.sopsEnabled) {
      mainText = "The head barista starts at 8 AM and immediately falls into the rhythm laid out by the procedure cards. Every drink follows the same steps, no hesitation \u2014 the combination of skill and structured process is noticeably faster than improvising under pressure.";
    } else {
      mainText = "The head barista starts pulling shots at 8 AM. Drinks are coming out noticeably faster and the queue moves more steadily.";
    }
  }

  // --- a9: Shorten late weekday hours ---
  else if (action.id === 'a9') {
    if (flags.extendedHours) {
      mainText = "The schedule says close at 7 PM AND stay open until 10 PM. Nobody knows what's happening. The evening shift is chaos.";
    } else {
      mainText = "The cafe closes at 7 PM. The quietest hours are gone \u2014 the weekly wage bill is noticeably lighter and less food is going in the bin.";
    }
  }

  // --- a10: Buy another coffee machine ---
  else if (action.id === 'a10') {
    const staff = staffCount(flags);
    if (staff === 0) {
      mainText = "A second espresso machine sits on the counter, gleaming but unused. Nobody is free to operate it during the rush.";
    } else if (staff >= 2 && flags.peakTaskSpecialisation) {
      mainText = "Two baristas, two machines. Shots are pulling in parallel and drinks are flying off the counter.";
    } else if (staff >= 2 && flags.sopsEnabled) {
      mainText = "Two baristas follow the step-by-step procedure cards, one per machine. Drinks are flowing steadily from both stations.";
    } else {
      mainText = "A second espresso machine is hooked up. Occasionally someone switches to it, but without clear assignments it gets sporadic use.";
    }
  }

  // --- a11: Simplify the menu ---
  else if (action.id === 'a11') {
    mainText = "The menu board is cleaner and shorter. Staff reach for the same few ingredients, assembly is quicker, and nothing has run out all morning.";
  }

  // --- a12: Prep popular ingredients before peak ---
  else if (action.id === 'a12') {
    if (flags.expandedMenu) {
      mainText = "The team tried to prep everything but with so many options, half the trays were barely touched. Some had to be binned.";
    } else {
      mainText = "Trays of pre-sliced meats and cheeses are stacked in the fridge before doors open. Sandwiches fly together during the rush.";
    }
  }

  // --- a13: Create fixed work zones ---
  else if (action.id === 'a13') {
    const staff = staffCount(flags);
    if (staff === 0) {
      mainText = "Tape on the floor marks off zones. Even with one person, the equipment layout makes more sense now.";
    } else if (flags.peakTaskSpecialisation) {
      mainText = "Each person stays in their zone. The coffee station, food bench, and service counter are three separate worlds. Handovers are clean.";
    } else {
      mainText = "The zones have cut down on collisions, but staff still drift between areas when it gets hectic.";
    }
  }

  // --- a14: Peak-hour task specialisation ---
  else if (action.id === 'a14') {
    const staff = staffCount(flags);
    if (staff === 0) {
      mainText = "The rule was announced, but with only one person behind the counter during the rush, they still have to do everything themselves. Nothing changed.";
    } else if (flags.extraTillInstalled && staff >= 2 && !flags.extraCoffeeMachineInstalled) {
      mainText = "The task board now assigns one person to orders, one to coffee, and one to food prep. The second till stays deliberately closed \u2014 the specialisation made clear that one register handles intake fine. The real constraint was always drink preparation.";
    } else if (flags.extraTillInstalled && staff >= 2 && flags.extraCoffeeMachineInstalled) {
      mainText = "The task board assigns one person to orders and two to the coffee machines. The second till stays dark \u2014 the team recognised that one register easily keeps pace with two baristas.";
    } else if (flags.workZonesCreated) {
      mainText = "Each person has a zone and a role. The handover of cups from coffee station to counter is smooth. Nobody is crossing paths.";
    } else {
      mainText = "Clear roles stop the floating. One person always at the counter, the other on coffee. Customers never wait for someone to appear.";
    }
  }

  // --- a15: Introduce SOPs ---
  else if (action.id === 'a15') {
    if (flags.peakTaskSpecialisation) {
      mainText = "The procedure cards complement the role assignments. Staff know both WHERE to be and HOW to do each task. Quality is rock-solid.";
    } else {
      mainText = "Short instruction cards are taped above the prep benches. Every latte follows the same steps. Staff look up once, then execute \u2014 less guesswork, more consistency. The procedures have brought order to what was previously improvised chaos.";
    }
  }

  // --- a16: Mark a clear queue path ---
  else if (action.id === 'a16') {
    mainText = "A rope barrier guides the queue away from the pickup area. Customers line up in an orderly path instead of clustering at the counter.";
  }

  // --- a17: Separate pickup from ordering ---
  else if (action.id === 'a17') {
    mainText = "The collection point has moved to the far end of the counter. The knot of people waiting for lattes has shifted away from the ordering queue.";
  }

  // --- a18: Stock sheet and reorder routine ---
  else if (action.id === 'a18') {
    mainText = "A clipboard tracks daily ingredient counts. The fridge was fully stocked this morning before the rush \u2014 no more mid-shift scrambles for missing ingredients.";
  }

  // --- a19: Click & Collect app ---
  else if (action.id === 'a19') {
    const staff = staffCount(flags);
    if (flags.extraCoffeeMachineInstalled && staff >= 2 && flags.peakTaskSpecialisation) {
      mainText = "The app orders flow in alongside walk-ins. The dual coffee machines keep up, but some app orders sit on the counter going lukewarm. Customers who ordered customisations didn't get what they expected.";
    } else {
      mainText = "Customers arrive expecting their click-and-collect order to be ready. Instead they find a growing pile of digital tickets and a barista drowning in orders. Walk-in and app customers are both furious.";
    }
  }

  // --- a20: Peak-hour task board ---
  else if (action.id === 'a20') {
    if (flags.peakTaskSpecialisation) {
      mainText = "The task board makes the role assignments crystal clear. Nobody is left guessing. When the rush starts, everyone knows exactly where to stand.";
    } else {
      mainText = "A whiteboard shows suggested roles for each hour. Staff glance at it \u2014 it helps, but without formal specialisation, people still drift.";
    }
  }

  // --- a21: Partner with a delivery app service ---
  else if (action.id === 'a21') {
    mainText = "Delivery riders in branded jackets crowd the pickup area, checking phones impatiently. The counter is processing walk-in orders AND delivery tickets simultaneously \u2014 neither stream gets proper attention. The platform's 30% commission means the cafe is working harder for less. Delivery platforms work well for high-volume operations with spare capacity. This cafe has neither.";
  }

  // --- a22: Social media marketing campaign ---
  else if (action.id === 'a22') {
    if (prepOptimized(flags)) {
      mainText = "The campaign brought new faces. The streamlined operation handled the extra volume reasonably well, and the till rang more often \u2014 though the queue was still longer than ideal. This would have been a smart move once operations were fully sorted.";
    } else {
      mainText = "The posts went viral \u2014 and the queue went out the door. Staff are drowning in orders they can't fulfil fast enough. Customers who came expecting the Instagram experience are leaving frustrated, some posting one-star reviews. The campaign drove demand into an operation that couldn't handle what it already had.";
    }
  }

  // --- a23: Premium coffee grinder ---
  else if (action.id === 'a23') {
    mainText = "The new grinder produces a noticeably smoother shot. Regulars comment on the difference. But the finer grind takes a few seconds longer per dose \u2014 seconds that add up during a rush. A worthwhile upgrade once the speed problem is solved.";
  }

  // --- a24: Redesign cafe interior ---
  else if (action.id === 'a24') {
    mainText = "The cafe looks wonderful. Fresh paint, new chairs, better lighting. Customers compliment the space \u2014 then join the same long queue and wait just as long for their coffee.";
  }

  // --- a25: Free Wi-Fi ---
  else if (action.id === 'a25') {
    mainText = "Laptop users settle in for the morning, nursing a single flat white for two hours. The tables are full but the till is quiet. The Wi-Fi crowd love it \u2014 the lunchtime regulars who can't find a seat, less so.";
  }

  // --- a26: Digital menu board ---
  else if (action.id === 'a26') {
    mainText = "The rotating display catches eyes, but customers stand staring at it waiting for their item to cycle back around. A printed board they could scan in two seconds might have been more practical \u2014 though the screen does look professional.";
  }

  // --- a27: Loyalty stamp card ---
  else if (action.id === 'a27') {
    mainText = "Regulars collect stamps with quiet determination. A few new faces return specifically to fill their card. It's building a loyal base \u2014 though several loyal customers mention they'd visit more often if the wait weren't so long.";
  }

  // --- a28: Barista training course ---
  else if (action.id === 'a28') {
    mainText = "The team returned from the course with better latte art and a keener eye for extraction. The improvement is real but marginal \u2014 the head barista was already skilled. The problem was never technique; it was having one pair of hands doing everything.";
  }

  // --- a29: Customer feedback tablet ---
  else if (action.id === 'a29') {
    mainText = "A handful of customers tap ratings on the way out. The data confirms what's obvious: wait times are the main complaint. One review mentioned an inconsistent sandwich, which prompted a quick fix. Useful in principle \u2014 though acting on the feedback requires capacity the team doesn't have yet.";
  }

  // --- a30: Cheaper ingredient supplier ---
  else if (action.id === 'a30') {
    mainText = "The new supplier is cheaper \u2014 noticeably so. Unfortunately, the quality has dropped to match. The espresso blend has changed and regulars are commenting. Some deliveries arrive with substitutions, and the portion sizes aren't what they used to be.";
  }

  // --- a31: Bulk-buy ingredients ---
  else if (action.id === 'a31') {
    if (flags.stockRoutineEnabled) {
      mainText = "The stock sheet helps track what's been bulk-ordered and when it expires. Less waste than it could have been, but the cramped fridge still slows people down during the rush.";
    } else {
      mainText = "Cases of milk and bags of beans fill every shelf. The fridge is a Tetris game. Staff spend ages finding ingredients in the back, and the oat milk delivered last week has gone off \u2014 nobody tracked when it arrived.";
    }
  }

  // --- a32: Enterprise Resource Planning (ERP) system ---
  else if (action.id === 'a32') {
    mainText = "The ERP system is live. The login screen greets staff every morning with a dashboard designed for a warehouse operation. Nobody has figured out how to set up automated reorder alerts \u2014 the supplier module alone has 47 configuration fields. The head barista used to know exactly what to order from memory; now they're clicking through dropdown menus. The monthly software bill arrived: it's more than the cafe spends on coffee beans.";
  }

  // --- a33: Remap head barista and cafe manager roles ---
  else if (action.id === 'a33') {
    mainText = "The responsibilities have been redrawn. The cafe manager now owns the supplier relationship, stock ordering, and menu planning \u2014 tasks that should always have sat with them. The head barista's morning is different: no more checking delivery schedules between shots, no more squeezing in a supplier call during a quiet moment. They arrive, set up the machine, and focus on what they do best. With the admin load lifted, they've started coaching the assistant baristas on technique \u2014 something there was never time for before. The manager, meanwhile, has been given clear ownership of operational processes: inventory levels are tracked properly, orders are placed on time, and the menu gets the strategic attention it deserves. Two roles that were broken \u2014 one overloaded, one hollow \u2014 now both function as they should.";
  }

  else {
    mainText = "Changes were implemented and observable results were tracked during the operational shift.";
  }

  // Append ripple-effect notes about previously played cards whose contributions shifted
  const rippleNotes = buildRippleNotes(action.id, flags);
  return mainText + rippleNotes;
}
