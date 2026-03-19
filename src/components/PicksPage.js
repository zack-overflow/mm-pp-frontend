import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import BASE_SERVER_URL from '../config';

const MAX_PICKS = 15;

function PicksPage() {
    // Auth state
    const [entrantName, setEntrantName] = useState('');
    const [password, setPassword] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);
    const [authError, setAuthError] = useState(null);

    // Players state
    const [allPlayers, setAllPlayers] = useState([]);
    const [picks, setPicks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const searchRef = useRef(null);

    // Fetch all players once logged in
    useEffect(() => {
        if (!loggedIn) return;
        fetch(`${BASE_SERVER_URL}/players`)
            .then(res => res.json())
            .then(data => setAllPlayers(data))
            .catch(() => setAllPlayers([]));
    }, [loggedIn]);

    // Focus search input after login
    useEffect(() => {
        if (loggedIn && searchRef.current) {
            searchRef.current.focus();
        }
    }, [loggedIn]);

    const handleAuth = (action) => {
        setAuthError(null);
        setLoading(true);
        const endpoint = action === 'create' ? '/entry/create' : '/entry/login';

        fetch(`${BASE_SERVER_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: entrantName, password }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setLoggedIn(true);
                    if (data.picks) {
                        setPicks(data.picks);
                    }
                } else {
                    setAuthError(data.message || 'Something went wrong.');
                }
                setLoading(false);
            })
            .catch(() => {
                setAuthError('Could not connect to server.');
                setLoading(false);
            });
    };

    const addPlayer = (player) => {
        if (picks.length >= MAX_PICKS) return;
        if (picks.find(p => p.name === player.name)) return;
        setPicks(prev => [...prev, player]);
        setSearchQuery('');
        searchRef.current?.focus();
    };

    const removePlayer = (playerName) => {
        setPicks(prev => prev.filter(p => p.name !== playerName));
    };

    const savePicks = () => {
        setSaving(true);
        setSaveMessage(null);
        fetch(`${BASE_SERVER_URL}/entry/picks`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: entrantName,
                password,
                picks: picks.map(p => p.name),
            }),
        })
            .then(res => res.json())
            .then(data => {
                setSaveMessage(data.success ? 'Picks saved!' : (data.message || 'Error saving picks.'));
                setSaving(false);
            })
            .catch(() => {
                setSaveMessage('Could not connect to server.');
                setSaving(false);
            });
    };

    const handleLogout = () => {
        setLoggedIn(false);
        setEntrantName('');
        setPassword('');
        setPicks([]);
        setAllPlayers([]);
        setSaveMessage(null);
        setSearchQuery('');
    };

    // Filter players based on search query, excluding already-picked players
    const filteredPlayers = searchQuery.trim().length > 0
        ? allPlayers.filter(p => {
            const q = searchQuery.toLowerCase();
            const alreadyPicked = picks.some(pick => pick.name === p.name);
            return !alreadyPicked && (
                p.name.toLowerCase().includes(q) ||
                p.team.toLowerCase().includes(q)
            );
        })
        : [];

    // Auth screen
    if (!loggedIn) {
        return (
            <div className="picks-auth-container">
                <div className="auth-card">
                    <h1 className="page-title">Enter Your Picks</h1>
                    <p className="page-subtitle">
                        Create a new entry or log in to update your picks.
                    </p>
                    <div className="auth-form">
                        <input
                            type="text"
                            placeholder="Your name"
                            value={entrantName}
                            onChange={e => setEntrantName(e.target.value)}
                            className="input-field"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleAuth('login');
                            }}
                            className="input-field"
                        />
                        {authError && (
                            <div className="auth-error">{authError}</div>
                        )}
                        <div className="auth-buttons">
                            <button
                                onClick={() => handleAuth('create')}
                                disabled={!entrantName || !password || loading}
                                className="btn btn-primary"
                            >
                                Create Entry
                            </button>
                            <button
                                onClick={() => handleAuth('login')}
                                disabled={!entrantName || !password || loading}
                                className="btn btn-success"
                            >
                                Log In
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Picks screen
    return (
        <div className="picks-container">
            <div className="user-bar">
                <span className="user-bar-name">
                    Logged in as <strong>{entrantName}</strong>
                </span>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '13px' }}>
                    Log Out
                </button>
            </div>

            <h1 className="page-title">Your Picks</h1>
            <p className={`picks-counter${picks.length === MAX_PICKS ? ' complete' : ''}`}>
                {picks.length} / {MAX_PICKS} players selected
            </p>

            {/* Selected picks */}
            <div className="picks-grid">
                {picks.length === 0 ? (
                    <p className="empty-picks">No players selected yet. Search below to add players.</p>
                ) : (
                    picks.map(player => (
                        <div key={player.name} className="pick-chip">
                            <span><strong>{player.name}</strong> — {player.team} ({player.seed})</span>
                            <button
                                onClick={() => removePlayer(player.name)}
                                className="pick-remove-btn"
                                title="Remove player"
                            >
                                x
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Save button */}
            <div className="save-section">
                <button
                    onClick={savePicks}
                    disabled={saving || picks.length !== MAX_PICKS}
                    className={`btn ${picks.length === MAX_PICKS ? 'btn-primary' : 'btn-disabled-gray'}`}
                >
                    {saving ? 'Saving...' : 'Save Picks'}
                </button>
                {picks.length !== MAX_PICKS && picks.length > 0 && (
                    <span className="save-msg-error">
                        Select exactly {MAX_PICKS} players to save
                    </span>
                )}
                {saveMessage && (
                    <span className={saveMessage === 'Picks saved!' ? 'save-msg-success' : 'save-msg-error'}>
                        {saveMessage}
                    </span>
                )}
            </div>

            {/* Search */}
            <div className="search-container">
                <input
                    ref={searchRef}
                    type="text"
                    placeholder={picks.length >= MAX_PICKS ? `Maximum of ${MAX_PICKS} players reached` : 'Search players by name or team...'}
                    value={searchQuery}
                    onChange={e => { if (picks.length < MAX_PICKS) setSearchQuery(e.target.value); }}
                    disabled={picks.length >= MAX_PICKS}
                    className="input-field"
                />

                {/* Search results dropdown */}
                {filteredPlayers.length > 0 && (
                    <div className="dropdown">
                        {filteredPlayers.slice(0, 20).map(player => (
                            <div
                                key={player.name}
                                onClick={() => addPlayer(player)}
                                className="dropdown-item"
                            >
                                <strong>{player.name}</strong>
                                <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                                    {player.team} ({player.seed})
                                </span>
                            </div>
                        ))}
                        {filteredPlayers.length > 20 && (
                            <div className="dropdown-more">
                                {filteredPlayers.length - 20} more results — keep typing to narrow down
                            </div>
                        )}
                    </div>
                )}

                {searchQuery.trim().length > 0 && filteredPlayers.length === 0 && (
                    <div className="dropdown">
                        <div className="dropdown-empty">
                            No matching players found.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PicksPage;
