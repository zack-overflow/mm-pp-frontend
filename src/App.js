import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// import components from components folder
import EntrantDetail from './components/EntrantDetail';
import PlayerDetail from './components/PlayerDetail';
import PerfectBracket from './components/PerfectBracket';
import Scoreboard from './components/Scoreboard';
import PicksPage from './components/PicksPage';

// Main App component with routes
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Scoreboard />} />
          <Route path="/entrant/:entrantName" element={<EntrantDetail />} />
          <Route path="/player/:playerName" element={<PlayerDetail />} />
          <Route path="/picks" element={<PicksPage />} />
          <Route path="/perfect-bracket" element={<PerfectBracket />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
