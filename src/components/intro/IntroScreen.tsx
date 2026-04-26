import React from 'react';

export default function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-[600px] w-full flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold font-sans text-text-primary text-center mb-2">Fix RainyDay Café</h1>
        <h2 className="text-sm font-mono text-text-secondary uppercase tracking-[0.15em] mb-8">A Systems Thinking Game</h2>
        
        <p className="text-base text-text-secondary text-center leading-relaxed mb-8">
          You already know the RainyDay Café case from the module. This simulation lets you test interventions
          and see how changes affect the live operation.
        </p>

        <div className="bg-bg-surface border border-border-default rounded-xl p-5 w-full mb-8">
          <h3 className="text-xs uppercase tracking-[0.12em] text-accent-blue mb-4 font-semibold">How it works</h3>
          <ul className="text-sm text-text-secondary space-y-3 list-decimal list-inside">
            <li>You have exactly 7 turns.</li>
            <li>Each turn, choose 1 intervention from 33 available options.</li>
            <li>After each choice, the score, performance metrics, and café simulation update.</li>
            <li>You win by reaching a score of 77.5 or above.</li>
          </ul>
        </div>

        <button 
          onClick={onStart}
          className="bg-accent-blue hover:bg-blue-600 text-white font-bold py-3 px-10 rounded-lg text-lg transition-transform transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-blue focus-visible:ring-offset-bg-primary"
        >
          Start Simulation
        </button>
      </div>
    </div>
  );
}
