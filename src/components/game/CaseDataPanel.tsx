import React, { useState } from 'react';
import { caseData } from '../../data/caseData';
import { FileText, ThumbsDown, ThumbsUp, X, ChevronRight } from 'lucide-react';

export default function CaseDataPanel() {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 bg-bg-surface border-r border-border-default w-12 cursor-pointer hover:bg-bg-hover transition-colors" onClick={() => setCollapsed(false)}>
        <FileText className="w-5 h-5 text-text-secondary mb-4" />
        <ChevronRight className="w-4 h-4 text-text-secondary" />
        <div className="mt-8 font-sans text-xs uppercase tracking-[0.12em] text-text-secondary transform -rotate-90 whitespace-nowrap">
          Case Data
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-transparent flex flex-col pb-4 px-4 overflow-y-auto">
      <div className="sticky top-0 bg-bg-primary z-10 py-4 flex justify-between items-center border-b border-border-default mb-4">
        <h3 className="font-sans text-xs font-semibold text-text-muted uppercase tracking-[0.12em] flex items-center">
          <FileText className="w-4 h-4 mr-2" />
          Case Data
        </h3>
        <button onClick={() => setCollapsed(true)} className="hidden md:block text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface focus-visible:ring-accent-blue rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        <section>
          <h4 className="font-sans font-semibold text-sm text-text-primary mb-2">Operating Hours</h4>
          <div className="text-sm font-sans text-text-secondary">
            <div className="flex justify-between"><span>Weekdays:</span> <span className="font-mono text-text-primary">{caseData.operatingHours.weekdays}</span></div>
            <div className="flex justify-between"><span>Weekends:</span> <span className="font-mono text-text-primary">{caseData.operatingHours.weekends}</span></div>
          </div>
        </section>

        <section>
          <h4 className="font-sans font-semibold text-sm text-text-primary mb-2">Key Metrics</h4>
          <div className="text-sm font-sans text-text-secondary space-y-1">
            <div className="flex justify-between"><span>Footfall (Wkdy):</span> <span className="font-mono text-text-primary">{caseData.footfall.weekdays}</span></div>
            <div className="flex justify-between"><span>Transactions (Wkdy):</span> <span className="font-mono text-text-primary">{caseData.transactions.weekdays}</span></div>
            <div className="flex justify-between mt-1"><span>Footfall (Wknd):</span> <span className="font-mono text-text-primary">{caseData.footfall.weekends}</span></div>
            <div className="flex justify-between"><span>Transactions (Wknd):</span> <span className="font-mono text-text-primary">{caseData.transactions.weekends}</span></div>
            <div className="flex justify-between mt-2 pt-2 border-t border-border-default"><span>Average £:</span> <span className="font-mono text-text-primary">{caseData.averageTransaction}</span></div>
          </div>
        </section>

        <section>
          <h4 className="font-sans font-semibold text-sm text-text-primary mb-2">Staff Roster</h4>
          <div className="space-y-2">
            {caseData.staffRoster.map((staff, i) => (
              <div key={i} className={`p-2 rounded bg-white/70 border border-border-default`}>
                <div className="font-sans text-sm font-medium text-text-primary">{staff.role}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="font-sans text-xs text-text-secondary">{staff.schedule}</span>
                  <span className="font-mono text-xs text-text-primary">{staff.hours}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h4 className="font-sans font-semibold text-sm text-text-primary mb-2">Environment</h4>
          <p className="font-sans text-sm text-text-secondary leading-relaxed bg-bg-surface-alt p-3 rounded">
            {caseData.prepSpace}
          </p>
        </section>

        <section>
          <h4 className="font-sans font-semibold text-sm text-text-primary mb-2">Customer Feedback</h4>
          <ul className="space-y-2">
            {caseData.keyComplaints.map((c, i) => (
              <li key={i} className="flex text-sm font-sans text-text-secondary items-start">
                <ThumbsDown className="w-4 h-4 mr-2 text-accent-red mt-0.5 flex-shrink-0" />
                <span>{c}</span>
              </li>
            ))}
            {caseData.positives.map((p, i) => (
              <li key={i} className="flex text-sm font-sans text-text-secondary items-start mt-2">
                <ThumbsUp className="w-4 h-4 mr-2 text-accent-green mt-0.5 flex-shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
