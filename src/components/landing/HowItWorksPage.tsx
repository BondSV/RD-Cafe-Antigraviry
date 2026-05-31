import React from 'react';
import { ClipboardList, Gauge, LayoutDashboard, Trophy } from 'lucide-react';
import LandingHeader from './LandingHeader';

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#D8E1EC] bg-white px-6 py-5 shadow-[0_12px_28px_rgba(15,35,62,0.07)]">
      <div className="grid grid-cols-[54px_1fr] gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF1F9] text-[#08295A]">
          {icon}
        </div>
        <div>
          <h2 className="font-serif text-[1.65rem] font-bold leading-tight text-[#08295A]">{title}</h2>
          <div className="mt-3 text-[1.08rem] leading-[1.58] text-[#173865]">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function HowItWorksPage({ onStart }: { onStart: () => void }) {
  return (
    <main className="min-h-screen bg-white text-[#08295A]">
      <LandingHeader active="how" onStart={onStart} />

      <div className="mx-auto max-w-[1292px] px-4 pb-10 pt-2 sm:px-8 xl:px-0">
        <section className="grid gap-8 xl:grid-cols-[430px_1fr] xl:items-start">
          <div>
            <h1 className="font-serif text-[clamp(3rem,4vw,4.6rem)] font-bold leading-[0.98] text-[#08295A]">
              How it works
            </h1>
            <div className="mt-4 h-1 w-16 rounded-full bg-[#8B4F16]" />
            <p className="mt-5 text-[1.16rem] leading-[1.58] text-[#173865]">
              RainyDay Café is a turn-based business simulation about running an independent café during a difficult
              service period.
            </p>
            <p className="mt-4 text-[1.16rem] leading-[1.58] text-[#173865]">
              Each decision changes the operation, including customer flow, workload, service performance, and the final
              system score.
            </p>
          </div>

          <div className="grid gap-4">
            <SectionCard title="Goal" icon={<Trophy className="h-7 w-7" aria-hidden="true" />}>
              <p>
                Your goal is to improve the café operation over a short run of decisions. The simulation tracks how the
                café performs as a system, not just whether one individual metric changes.
              </p>
            </SectionCard>

            <SectionCard title="What you can do" icon={<ClipboardList className="h-7 w-7" aria-hidden="true" />}>
              <p>
                On each turn, choose one available intervention. After you choose, the simulation updates the operating
                state, shows the effect of that decision, and then lets you continue to the next turn.
              </p>
            </SectionCard>

            <SectionCard title="Interface" icon={<LayoutDashboard className="h-7 w-7" aria-hidden="true" />}>
              <p>
                The case panel contains background information about the café. The simulation view shows customer flow
                and operational pressure. The metrics panel reports performance indicators. The system map shows the
                wider operating relationships. The action area is where you select the intervention for the current turn.
              </p>
            </SectionCard>

            <SectionCard title="Rules and winning state" icon={<Gauge className="h-7 w-7" aria-hidden="true" />}>
              <ul className="list-disc space-y-2 pl-5">
                <li>The run lasts 7 turns.</li>
                <li>You can choose 1 intervention per turn.</li>
                <li>Each chosen intervention updates the café metrics and system score.</li>
                <li>The run ends with a final summary after the last turn.</li>
                <li>You win by reaching a final system score of 77.5 or above.</li>
              </ul>
            </SectionCard>
          </div>
        </section>
      </div>
    </main>
  );
}
