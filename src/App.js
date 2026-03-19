import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import ballLogo from './ball.png';

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
        <header className="site-header">
          <Link to="/" className="site-title">
            <img src={ballLogo} alt="" className="site-logo" />
            March Madness Player Pool
          </Link>
          <nav>
            <Link to="/">Scoreboard</Link>
            <Link to="/perfect-bracket">Perfect Bracket</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Scoreboard />} />
          <Route path="/entrant/:entrantName" element={<EntrantDetail />} />
          <Route path="/player/:playerName" element={<PlayerDetail />} />
          <Route path="/picks" element={<PicksPage />} />
          <Route path="/perfect-bracket" element={<PerfectBracket />} />
          <Route path="*" element={
            <div className="not-found">
              <h1>404</h1>
              <p>Page not found</p>
              <Link to="/" className="back-link">Back to Scoreboard</Link>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
