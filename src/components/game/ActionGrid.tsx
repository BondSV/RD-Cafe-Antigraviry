import React from 'react';
import ActionCategoryAccordion from './ActionCategoryAccordion';
import ActionCard from './ActionCard';
import { actions } from '../../data/actions';

export default function ActionGrid({ disabled }: { disabled: boolean }) {
  const spaceActions = actions.filter(a => a.group === 'space');
  const staffActions = actions.filter(a => a.group === 'staff');
  const menuActions = actions.filter(a => a.group === 'menu');
  const orgActions = actions.filter(a => a.group === 'org');
  const revenueActions = actions.filter(a => a.group === 'revenue');

  return (
    <div className="flex flex-col h-full bg-bg-primary pt-2 md:pt-0">
      <h2 className="font-sans font-semibold text-lg text-text-primary mb-2 sticky top-0 bg-bg-primary z-10 py-2 hidden md:block">
        Interventions
      </h2>
      <div className="flex-1 overflow-y-auto px-4 md:px-0">
        <ActionCategoryAccordion title="Space & Equipment" defaultOpen={true}>
          {spaceActions.map(a => <ActionCard key={a.id} action={a} disabled={disabled} />)}
        </ActionCategoryAccordion>
        <ActionCategoryAccordion title="Staff & Processes" defaultOpen={false}>
          {staffActions.map(a => <ActionCard key={a.id} action={a} disabled={disabled} />)}
        </ActionCategoryAccordion>
        <ActionCategoryAccordion title="Menu & Stock" defaultOpen={false}>
          {menuActions.map(a => <ActionCard key={a.id} action={a} disabled={disabled} />)}
        </ActionCategoryAccordion>
        <ActionCategoryAccordion title="Organisational" defaultOpen={false}>
          {orgActions.map(a => <ActionCard key={a.id} action={a} disabled={disabled} />)}
        </ActionCategoryAccordion>
        <ActionCategoryAccordion title="Revenue" defaultOpen={false}>
          {revenueActions.map(a => <ActionCard key={a.id} action={a} disabled={disabled} />)}
        </ActionCategoryAccordion>
      </div>
    </div>
  );
}
