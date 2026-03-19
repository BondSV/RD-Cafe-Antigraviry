import React, { useState } from 'react';
import { useGameStore } from './store/useGameStore';
import IntroScreen from './components/intro/IntroScreen';
import GameLayout from './components/layout/GameLayout';
import FinalSummary from './components/summary/FinalSummary';

function App() {
  const [started, setStarted] = useState(false);
  const outcome = useGameStore(state => state.outcome);

  if (!started) return <IntroScreen onStart={() => setStarted(true)} />;
  if (outcome) return <FinalSummary />;

  return <GameLayout />;
}

export default App;
