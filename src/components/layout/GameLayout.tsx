import React, { useState, useEffect } from 'react';
import TurnHeader from '../game/TurnHeader';
import CaseDataPanel from '../game/CaseDataPanel';
import SystemMap from '../game/SystemMap';
import MetricPanel from '../game/MetricPanel';
import ActionGrid from '../game/ActionGrid';
import ResultPanel from '../game/ResultPanel';
import CustomerFlowSimulation from '../game/CustomerFlowSimulation';
import CustomerFlowSimulationIso from '../game/CustomerFlowSimulationIso';
import CustomerFlowSimulationTopDown from '../game/CustomerFlowSimulationTopDown';
import { useGameStore } from '../../store/useGameStore';

export default function GameLayout() {
  const history = useGameStore(state => state.history);
  const metrics = useGameStore(state => state.metrics);
  const flags = useGameStore(state => state.flags);
  const [viewingResultFor, setViewingResultFor] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'actions' | 'case'>('actions');
  const [simTrigger, setSimTrigger] = useState(0);
  const [pendingSimTrigger, setPendingSimTrigger] = useState(false);

  useEffect(() => {
    if (history.length > 0 && viewingResultFor !== history[history.length - 1].turn) {
      setViewingResultFor(history[history.length - 1].turn);
      setPendingSimTrigger(true);
    }
  }, [history]);

  const closeResult = () => {
    setViewingResultFor(null);
    // On desktop (lg+), map is always visible — fire immediately
    // On mobile, only fire if map tab is active
    const isDesktop = window.innerWidth >= 1024;
    if (isDesktop || activeTab === 'map') {
      setSimTrigger(t => t + 1);
      setPendingSimTrigger(false);
    }
  };

  const handleTabSwitch = (tab: 'map' | 'actions' | 'case') => {
    setActiveTab(tab);
    if (tab === 'map' && pendingSimTrigger) {
      setSimTrigger(t => t + 1);
      setPendingSimTrigger(false);
    }
  };

  return (
    <div className="flex flex-col h-screen min-h-screen relative">
      <TurnHeader />
      
      <div className="flex lg:hidden bg-bg-surface border-b border-border-default">
        <button className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider ${activeTab === 'map' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary'}`} onClick={() => handleTabSwitch('map')}>Map</button>
        <button className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider ${activeTab === 'actions' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary'}`} onClick={() => handleTabSwitch('actions')}>Actions</button>
        <button className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider ${activeTab === 'case' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary'}`} onClick={() => handleTabSwitch('case')}>Case</button>
      </div>

      <div className="flex flex-1 overflow-hidden w-full max-w-[1400px] mx-auto p-0 lg:p-4 gap-4">
        <div className={`w-full lg:w-[260px] xl:w-[280px] flex-shrink-0 ${activeTab === 'case' ? 'block hover:overflow-y-auto' : 'hidden lg:block'}`}>
          <CaseDataPanel />
        </div>

        <div className={`flex-1 flex flex-col min-w-[300px] overflow-y-auto pt-4 lg:pt-0 pr-2 px-4 lg:px-0 ${activeTab === 'map' ? 'block' : 'hidden lg:flex'}`}>
          <div className="space-y-4">
            {/* <CustomerFlowSimulation metrics={metrics} flags={flags} triggerKey={simTrigger} /> */}
            <CustomerFlowSimulationIso metrics={metrics} flags={flags} triggerKey={simTrigger} />
            {/* <CustomerFlowSimulationTopDown metrics={metrics} flags={flags} triggerKey={simTrigger} /> */}
          </div>
          <div className="mt-4">
            <MetricPanel />
          </div>
          <div className="mt-4">
            <SystemMap />
          </div>
        </div>

        <div className={`w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 overflow-y-auto pt-4 lg:pt-0 pr-2 px-4 lg:px-0 pb-8 ${activeTab === 'actions' ? 'block' : 'hidden lg:block'}`}>
          <ActionGrid disabled={viewingResultFor !== null} />
        </div>
      </div>

      {viewingResultFor !== null && (
        <ResultPanel turnRecord={history.find(h => h.turn === viewingResultFor)!} onClose={closeResult} />
      )}
    </div>
  );
}
