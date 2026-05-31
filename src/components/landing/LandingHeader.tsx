import React from 'react';
import { Play } from 'lucide-react';

type LandingHeaderProps = {
  active: 'overview' | 'how';
  onStart: () => void;
};

function StartButton({ onStart }: { onStart: () => void }) {
  return (
    <button
      type="button"
      onClick={onStart}
      className="inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-[14px] bg-[#16823A] px-5 py-3 text-base font-bold text-white shadow-[0_12px_28px_rgba(22,130,58,0.26)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#126C31] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16823A] focus-visible:ring-offset-2 sm:px-6 sm:text-lg"
    >
      <Play className="h-4 w-4 fill-white sm:h-5 sm:w-5" aria-hidden="true" />
      <span>Start the simulation</span>
    </button>
  );
}

export default function LandingHeader({ active, onStart }: LandingHeaderProps) {
  const activeLink = 'border-b-2 border-[#08295A] text-[#08295A]';
  const inactiveLink = 'border-b-2 border-transparent text-[#08295A] hover:text-[#8B4F16]';

  return (
    <header className="bg-white/95">
      <div className="mx-auto flex max-w-[1292px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-8 lg:flex-nowrap xl:px-0">
        <a href="/landing" className="flex min-w-0 items-center gap-4" aria-label="RainyDay Café overview">
          <img
            src="/assets/Logo.webp"
            alt=""
            className="h-[8.4rem] w-[8.4rem] shrink-0 object-contain sm:h-[9.8rem] sm:w-[9.8rem] lg:h-[8.4rem] lg:w-[8.4rem]"
          />
          <span className="hidden font-serif text-[2.6rem] font-bold leading-none tracking-normal text-[#08295A] sm:inline lg:text-[3rem]">
            RainyDay <span className="text-[#8B4F16]">Café</span>
          </span>
        </a>

        <nav
          className="order-3 flex w-full items-center justify-center gap-8 text-lg font-medium text-[#08295A] sm:gap-12 lg:order-none lg:w-auto lg:gap-16"
          aria-label="Landing page"
        >
          <a href="/landing" className={`px-1 pb-2 ${active === 'overview' ? activeLink : inactiveLink}`}>
            Overview
          </a>
          <a href="/how-it-works" className={`px-1 pb-2 ${active === 'how' ? activeLink : inactiveLink}`}>
            How it works
          </a>
        </nav>

        <div className="shrink-0">
          <StartButton onStart={onStart} />
        </div>
      </div>
    </header>
  );
}
