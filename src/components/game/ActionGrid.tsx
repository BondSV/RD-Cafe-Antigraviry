import React from 'react';
import ActionCategoryAccordion from './ActionCategoryAccordion';
import ActionCard from './ActionCard';
import { actions } from '../../data/actions';

export default function ActionGrid({ disabled }: { disabled: boolean }) {
  const staffingActions = actions.filter(a => a.group === 'staffing');
  const layoutActions = actions.filter(a => a.group === 'layout');
  const menuActions = actions.filter(a => a.group === 'menu');
  const processActions = actions.filter(a => a.group === 'process');

  return (
    <div className="flex flex-col h-full bg-bg-primary pt-2 md:pt-0">
      <h2 className="font-sans font-semibold text-lg text-text-primary mb-2 sticky top-0 bg-bg-primary z-10 py-2 hidden md:block">
        Interventions
      </h2>
      <div className="flex-1 overflow-y-auto px-4 md:px-0">
        <ActionCategoryAccordion title="Staffing & Scheduling" defaultOpen={true}>
          {staffingActions.map(a => <ActionCard key={a.id} action={a} disabled={disabled} />)}
        </ActionCategoryAccordion>
        <ActionCategoryAccordion title="Layout & Equipment" defaultOpen={false}>
          {layoutActions.map(a => <ActionCard key={a.id} action={a} disabled={disabled} />)}
        </ActionCategoryAccordion>
        <ActionCategoryAccordion title="Menu & Inventory" defaultOpen={false}>
          {menuActions.map(a => <ActionCard key={a.id} action={a} disabled={disabled} />)}
        </ActionCategoryAccordion>
        <ActionCategoryAccordion title="Process & Promotion" defaultOpen={false}>
          {processActions.map(a => <ActionCard key={a.id} action={a} disabled={disabled} />)}
        </ActionCategoryAccordion>
      </div>
    </div>
  );
}
