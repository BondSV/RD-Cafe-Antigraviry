import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import LandingPage from './components/landing/LandingPage';
import HowItWorksPage from './components/landing/HowItWorksPage';
import IntroScreen from './components/intro/IntroScreen';
import GameLayout from './components/layout/GameLayout';
import FinalSummary from './components/summary/FinalSummary';
import { preloadSimulationSprites } from './utils/preloadSimulationSprites';

function App() {
  const [started, setStarted] = useState(false);
  const outcome = useGameStore(state => state.outcome);
  const routePath = window.location.pathname.replace(/\/$/, '');
  const isLandingRoute = routePath === '/landing';
  const isHowItWorksRoute = routePath === '/how-it-works';

  useEffect(() => {
    preloadSimulationSprites();
  }, []);

  if (outcome) return <FinalSummary />;
  if (!started) {
    if (isHowItWorksRoute) return <HowItWorksPage onStart={() => setStarted(true)} />;
    return isLandingRoute
      ? <LandingPage onStart={() => setStarted(true)} />
      : <IntroScreen onStart={() => setStarted(true)} />;
  }

  return <GameLayout />;
}

export default App;
