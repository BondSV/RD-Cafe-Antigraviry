import React from 'react';
import { AlertTriangle, Search, Target } from 'lucide-react';
import LandingHeader from './LandingHeader';

const challengeItems = [
  'Busy peak periods',
  'Long queues',
  'Delayed orders',
  'Stressed staff',
  'Customers leaving before being served',
  'Service quality becoming harder to maintain',
];

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#D8E1EC] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(15,35,62,0.07)] md:px-5">
      <div className="grid grid-cols-[54px_1fr] gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF1F9] text-[#08295A]">
          {icon}
        </div>
        <div>
          <h3 className="font-serif text-[1.55rem] font-bold leading-[1.02] text-[#08295A]">{title}</h3>
          {children}
        </div>
      </div>
    </section>
  );
}

function CafeArtwork() {
  return (
    <div className="relative h-full min-h-[260px] overflow-hidden rounded-[20px] bg-[#17202A] lg:min-h-[364px]">
      <img
        src="/assets/rd-cafe-landing-hero.png"
        alt="RainyDay Café interior with customers, counter service, plants, and seating"
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
    </div>
  );
}

export default function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <main className="min-h-screen bg-white text-[#08295A]">
      <LandingHeader active="overview" onStart={onStart} />

      <div id="overview" className="mx-auto max-w-[1400px] px-4 pb-4 pt-1 sm:px-8 lg:px-10 lg:pb-3 lg:pt-2">
        <section className="grid gap-5 xl:grid-cols-[560px_700px] xl:items-start xl:justify-center xl:gap-8">
          <div className="max-w-[560px]">
            <p className="whitespace-nowrap text-[0.95rem] font-bold uppercase tracking-[0.16em] text-[#385173] sm:text-base">
              Interactive Business Management Simulation
            </p>
            <div className="mt-3 h-1 w-16 rounded-full bg-[#8B4F16]" />

            <p className="mt-3.5 text-[1.28rem] font-bold leading-snug text-[#08295A]">
              RainyDay Café is an interactive case connected to themes from Operations &amp; Project Management module.
            </p>
            <p className="mt-3.5 text-[1.13rem] leading-[1.5] text-[#173865]">
              The simulation places users inside a fictional independent café facing growing operational pressure. The
              café has customer demand and a strong product offer, but daily service is becoming harder to manage.
            </p>
            <p className="mt-3.5 text-[1.13rem] leading-[1.5] text-[#173865]">
              Users can observe how customers move through the café, where pressure builds, and how operational decisions
              affect the wider system.
            </p>
          </div>

          <div className="aspect-[3/2] min-h-[240px] overflow-hidden rounded-[18px] border border-[#D7E0EA] bg-[#F8FAFC] shadow-[0_14px_34px_rgba(15,35,62,0.1)] xl:h-[336px] xl:w-[700px] xl:min-h-0">
            <CafeArtwork />
          </div>
        </section>

        <section id="how-it-works" className="mt-8 grid gap-4 lg:grid-cols-3">
          <InfoCard
            title="The challenge"
            icon={<AlertTriangle className="h-8 w-8 text-[#EF3A2D]" aria-hidden="true" />}
          >
            <ul className="mt-2.5 space-y-1 text-base leading-snug text-[#173865]">
              {challengeItems.map(item => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#EF3A2D]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InfoCard>

          <InfoCard
            title="What the simulation explores"
            icon={<Search className="h-8 w-8 text-[#08295A]" aria-hidden="true" />}
          >
            <p className="mt-2.5 text-base leading-[1.55] text-[#173865]">
              RainyDay Café shows that visible problems are often only symptoms. Users are encouraged to look deeper,
              test their assumptions, and think about how a business can improve performance across the whole operation.
            </p>
          </InfoCard>

          <InfoCard title="Purpose" icon={<Target className="h-8 w-8 text-[#08295A]" aria-hidden="true" />}>
            <p className="mt-2.5 text-base leading-[1.55] text-[#173865]">
              The aim is to support practical business thinking: diagnosing problems, understanding trade-offs, and
              designing improvements that work in a real operating environment.
            </p>
          </InfoCard>
        </section>

      </div>
    </main>
  );
}
