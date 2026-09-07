import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import TurnHeader from '../game/TurnHeader';
import CaseDataPanel from '../game/CaseDataPanel';
import SystemMap from '../game/SystemMap';
import MetricPanel from '../game/MetricPanel';
import ActionGrid from '../game/ActionGrid';
import ResultPanel from '../game/ResultPanel';
import CustomerFlowSimulation from '../game/CustomerFlowSimulation';
import CustomerFlowSimulationIso from '../game/CustomerFlowSimulationIso';
import CustomerFlowSimulationTopDown from '../game/CustomerFlowSimulationTopDown';
import { VB_W, VB_H } from '../../hooks/useCustomerFlowSimulation';
import { useGameStore } from '../../store/useGameStore';

export default function GameLayout() {
  const history = useGameStore(state => state.history);
  const metrics = useGameStore(state => state.metrics);
  const flags = useGameStore(state => state.flags);
  const [viewingResultFor, setViewingResultFor] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'actions' | 'case'>('map');
  const [simTrigger, setSimTrigger] = useState(0);
  const [pendingSimTrigger, setPendingSimTrigger] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);
  const [sideGrowth, setSideGrowth] = useState(0);
  const centreRef = useRef<HTMLDivElement>(null);
  const [cafeWidth, setCafeWidth] = useState<number>();
  const [sceneHeight, setSceneHeight] = useState<number>();

  useLayoutEffect(() => {
    const centre = centreRef.current;
    const layout = layoutRef.current;
    if (!centre || !layout) return;
    const fitCafe = () => {
      const desktop = window.innerWidth >= 1024;
      if (!layout.clientWidth || !layout.clientHeight || (!desktop && !centre.clientHeight)) return;
      const css = getComputedStyle(centre);
      const layoutCss = getComputedStyle(layout);
      const horizontalPadding = parseFloat(css.paddingLeft) + parseFloat(css.paddingRight);
      // Account for the scene's 1px border when fitting its 900:820 interior.
      const widthForHeight = (height: number) => Math.max(2, (height - 2) * VB_W / VB_H + 2);
      if (desktop) {
        const availableHeight = layout.clientHeight - parseFloat(layoutCss.paddingTop) - parseFloat(layoutCss.paddingBottom);
        const heightLimitedWidth = widthForHeight(availableHeight);
        const baseCaseWidth = parseFloat(layoutCss.getPropertyValue('--case-width'));
        const baseActionsWidth = parseFloat(layoutCss.getPropertyValue('--actions-width'));
        const baseCentreWidth = layout.clientWidth - parseFloat(layoutCss.paddingLeft) - parseFloat(layoutCss.paddingRight)
          - baseCaseWidth - baseActionsWidth - 2 * parseFloat(layoutCss.columnGap) - horizontalPadding;
        const unusedWidth = Math.max(0, baseCentreWidth - heightLimitedWidth);
        const fittedWidth = Math.min(baseCentreWidth, heightLimitedWidth);
        // Use baseline widths and the outer layout height to avoid resize feedback.
        setSideGrowth(unusedWidth / 4);
        setCafeWidth(fittedWidth);
        setSceneHeight((fittedWidth - 2) * VB_H / VB_W + 2);
      } else {
        const availableHeight = Math.max(0, centre.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom) - 24 - 11);
        setSideGrowth(0);
        setSceneHeight(undefined);
        setCafeWidth(Math.min(centre.clientWidth - horizontalPadding, widthForHeight(availableHeight)));
      }
    };
    const observer = new ResizeObserver(fitCafe);
    observer.observe(layout);
    observer.observe(centre);
    fitCafe();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (history.length > 0 && viewingResultFor !== history[history.length - 1].turn) {
      setViewingResultFor(history[history.length - 1].turn);
      setPendingSimTrigger(true);
    }
  }, [history]);

  const closeResult = () => {
    setViewingResultFor(null);
    // On desktop (lg+), the simulation is always visible - fire immediately.
    // On mobile, only fire if the simulation tab is active.
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
    <div className="flex flex-col h-screen h-[100dvh] min-h-0 relative">
      <TurnHeader />
      
      <div className="sticky top-[88px] sm:top-[52px] z-20 flex shrink-0 lg:hidden bg-bg-surface/95 backdrop-blur-sm border-b border-border-default shadow-sm">
        <button className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider ${activeTab === 'map' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary'}`} onClick={() => handleTabSwitch('map')}>Simulation</button>
        <button className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider ${activeTab === 'actions' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary'}`} onClick={() => handleTabSwitch('actions')}>Actions</button>
        <button className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider ${activeTab === 'case' ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary'}`} onClick={() => handleTabSwitch('case')}>Case</button>
      </div>

      <div ref={layoutRef} style={{ '--side-growth': `${sideGrowth}px`, '--scene-height': sceneHeight === undefined ? 'auto' : `${sceneHeight}px` } as React.CSSProperties} className="game-columns flex flex-1 overflow-hidden w-full max-w-[1600px] mx-auto min-h-0 gap-4">
        <div className={`case-panel w-full flex-shrink-0 ${activeTab === 'case' ? 'block hover:overflow-y-auto' : 'hidden lg:block'}`}>
          <CaseDataPanel />
        </div>

        <div ref={centreRef} className={`centre-panel flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto pt-4 lg:pt-0 pr-2 px-4 lg:px-0 ${activeTab === 'map' ? 'block' : 'hidden lg:flex'}`}>
          <div className="centre-content mx-auto max-w-full shrink-0" style={{ width: cafeWidth ?? '100%', '--cafe-hud-scale': Math.min(1, (cafeWidth ?? 520) / 520), '--cafe-mobile-hud-scale': Math.min(1, (cafeWidth ?? 360) / 360) } as React.CSSProperties}>
            <div className="cafe-stage w-full">
            <CustomerFlowSimulationIso metrics={metrics} flags={flags} triggerKey={simTrigger} />

          </div>
          <div className="mt-4">
            <MetricPanel />
          </div>
          <div className="mt-4">
            <SystemMap />
          </div>
          </div>
        </div>

        <div className={`interventions-panel w-full flex-shrink-0 overflow-y-auto pt-4 lg:pt-0 pr-2 px-4 lg:px-0 pb-8 ${activeTab === 'actions' ? 'block' : 'hidden lg:block'}`}>
          <ActionGrid disabled={viewingResultFor !== null} />
        </div>
      </div>

      {viewingResultFor !== null && (
        <ResultPanel turnRecord={history.find(h => h.turn === viewingResultFor)!} onClose={closeResult} />
      )}
    </div>
  );
}
