import fs from 'fs';

const hookPath = './src/hooks/useCustomerFlowSimulation.ts';
const compPath = './src/components/game/CustomerFlowSimulation.tsx';

let hookContent = fs.readFileSync(hookPath, 'utf8');
const badHookIndex = hookContent.indexOf('export function useCustomerFlowSimulation(');

// The clean hook definition
const cleanHook = `export function useCustomerFlowSimulation(metrics: VisibleMetrics, flags: ActionFlags, triggerKey: number) {
  const simRef = useRef<SimState | null>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const [renderTick, setRenderTick] = useState(0);

  if (!simRef.current) {
    const rates = deriveSimRates(metrics, flags);
    simRef.current = createInitialState(rates);
  }

  useEffect(() => {
    if (!simRef.current) return;
    const newRates = deriveSimRates(metrics, flags);
    simRef.current.targetRates = newRates;
    simRef.current.transitioning = true;
    simRef.current.transitionStart = simRef.current.tick;

    simRef.current.staffTokens = initStaffTokens(newRates.staffConfig);
    simRef.current.tillBusyUntil = new Array(newRates.staffConfig.tillLanes).fill(0);
    simRef.current.prepBusyUntil = new Array(newRates.staffConfig.prepLanes).fill(0);
  }, [triggerKey, metrics, flags]);

  const animate = useCallback((timestamp: number) => {
    if (!simRef.current) return;

    const elapsed = timestamp - lastFrameRef.current;
    if (elapsed < 16) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }
    lastFrameRef.current = timestamp;

    if (simRef.current.transitioning) {
      const transitionProgress = Math.min(1, (simRef.current.tick - simRef.current.transitionStart) / 900);
      if (transitionProgress >= 1) {
        simRef.current.rates = simRef.current.targetRates;
        simRef.current.transitioning = false;
      } else {
        const r = simRef.current.rates;
        const t = simRef.current.targetRates;
        const p = transitionProgress;
        simRef.current.rates = {
          ...t,
          spawnInterval: Math.round(r.spawnInterval + (t.spawnInterval - r.spawnInterval) * p),
          bounceRate: r.bounceRate + (t.bounceRate - r.bounceRate) * p,
          targetQueue: Math.round(r.targetQueue + (t.targetQueue - r.targetQueue) * p),
          tillTime: Math.round(r.tillTime + (t.tillTime - r.tillTime) * p),
          tillCycleTime: Math.round(r.tillCycleTime + (t.tillCycleTime - r.tillCycleTime) * p),
          prepTime: Math.round(r.prepTime + (t.prepTime - r.prepTime) * p),
          consistencyFailRate: r.consistencyFailRate + (t.consistencyFailRate - r.consistencyFailRate) * p,
          stockBounceRate: r.stockBounceRate + (t.stockBounceRate - r.stockBounceRate) * p,
        };
      }
    }

    simRef.current = tickSimulation(simRef.current);

    if (simRef.current.tick % 2 === 0) {
      setRenderTick(simRef.current.tick);
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  return { state: simRef.current, renderTick };
}`;

hookContent = hookContent.substring(0, badHookIndex) + cleanHook + '\\n';
fs.writeFileSync(hookPath, hookContent);

let compContent = fs.readFileSync(compPath, 'utf8');
compContent = compContent.replace(/{backlog\.map\\(ticket => \\(/g, '{backlog.map((ticket: BacklogTicket) => (');
compContent = compContent.replace(/{staffTokens\.map\\(staff => \\(/g, '{staffTokens.map((staff: StaffToken) => (');
compContent = compContent.replace(/{tokens\.map\\(token => \\(/g, '{tokens.map((token: Token) => (');
compContent = compContent.replace(/tokens\.filter\\(t =>/g, 'tokens.filter((t: Token) =>');

fs.writeFileSync(compPath, compContent);
console.log('Repair complete');
