import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import LandingPage from './components/landing/LandingPage';
import HowItWorksPage from './components/landing/HowItWorksPage';
import IntroScreen from './components/intro/IntroScreen';
import GameLayout from './components/layout/GameLayout';
import FinalSummary from './components/summary/FinalSummary';
import Questionnaire from './research/Questionnaire';
import StudyEntry from './research/StudyEntry';
import StudyBar from './research/StudyBar';
import CandidateDialog from './research/CandidateDialog';
import ResearchDashboard from './research/ResearchDashboard';
import { beginRun, initialiseResearch, useRecording } from './research/recording';
import { preloadSimulationSprites } from './utils/preloadSimulationSprites';


function App() {
  const [started, setStarted] = useState(false);
  const outcome = useGameStore(state => state.outcome);
  const acknowledgedTurn = useGameStore(state=>state.acknowledgedTurn);
  const recording = useRecording();
  useEffect(()=>{if(window.location.pathname!=='/research'&&window.location.pathname!=='/v2-sample')void initialiseResearch();},[]);
  const start=()=>{beginRun();setStarted(true);};
  useEffect(()=>{if(recording.phase==='practice'){useGameStore.getState().resetGame();setStarted(true);}},[recording.phase]);
  const routePath = window.location.pathname.replace(/\/$/, '');
  const isLandingRoute = routePath === '/landing';
  const isHowItWorksRoute = routePath === '/how-it-works';

  useEffect(() => {
    preloadSimulationSprites();
  }, [routePath]);


  if(routePath==='/research')return <ResearchDashboard/>;
  if(!recording.ready||recording.choice==='pending')return <StudyEntry/>;
  if(recording.phase==='finished')return <><StudyBar/><Questionnaire/></>;
  if (outcome && acknowledgedTurn>=7) return <><StudyBar/><FinalSummary /></>;
  if (!started) {
    const intro=isHowItWorksRoute?<HowItWorksPage onStart={start}/>:isLandingRoute?<LandingPage onStart={start}/>:<IntroScreen onStart={start}/>;
    return <><StudyBar/>{intro}</>;
  }

  return <div className="study-game-shell"><StudyBar/><GameLayout /><CandidateDialog/></div>;
}

export default App;
