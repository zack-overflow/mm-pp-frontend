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
        if (picks.find(p => p.name === player.name)) return; // already picked
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
            <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
                <nav style={{ marginBottom: '20px' }}>
                    <Link to="/">← Back to Scoreboard</Link>
                </nav>
                <h1>Enter Your Picks</h1>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                    Create a new entry or log in to update your picks.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                        type="text"
                        placeholder="Your name"
                        value={entrantName}
                        onChange={e => setEntrantName(e.target.value)}
                        style={inputStyle}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleAuth('login');
                        }}
                        style={inputStyle}
                    />
                    {authError && (
                        <div style={{ color: '#d32f2f', fontSize: '14px' }}>{authError}</div>
                    )}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => handleAuth('create')}
                            disabled={!entrantName || !password || loading}
                            style={{ ...buttonStyle, background: '#1976d2' }}
                        >
                            Create Entry
                        </button>
                        <button
                            onClick={() => handleAuth('login')}
                            disabled={!entrantName || !password || loading}
                            style={{ ...buttonStyle, background: '#388e3c' }}
                        >
                            Log In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Picks screen
    return (
        <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
            <nav style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/">← Back to Scoreboard</Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>
                        Logged in as <strong>{entrantName}</strong>
                    </span>
                    <button onClick={handleLogout} style={{ ...buttonStyle, background: '#757575', padding: '4px 12px', fontSize: '13px' }}>
                        Log Out
                    </button>
                </div>
            </nav>

            <h1>Your Picks</h1>
            <p style={{ fontSize: '15px', color: picks.length === MAX_PICKS ? '#388e3c' : '#666', fontWeight: picks.length === MAX_PICKS ? 'bold' : 'normal' }}>
                {picks.length} / {MAX_PICKS} players selected
            </p>

            {/* Selected picks */}
            <div style={{ marginBottom: '24px' }}>
                {picks.length === 0 ? (
                    <p style={{ color: '#999', fontStyle: 'italic' }}>No players selected yet. Search below to add players.</p>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {picks.map(player => (
                            <div key={player.name} style={pickChipStyle}>
                                <span><strong>{player.name}</strong> — {player.team} ({player.seed})</span>
                                <button
                                    onClick={() => removePlayer(player.name)}
                                    style={removeButtonStyle}
                                    title="Remove player"
                                >
                                    x
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Save button */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                    onClick={savePicks}
                    disabled={saving || picks.length !== MAX_PICKS}
                    style={{ ...buttonStyle, background: picks.length === MAX_PICKS ? '#1976d2' : '#bbb', cursor: picks.length === MAX_PICKS ? 'pointer' : 'not-allowed' }}
                >
                    {saving ? 'Saving...' : 'Save Picks'}
                </button>
                {picks.length !== MAX_PICKS && picks.length > 0 && (
                    <span style={{ fontSize: '14px', color: '#d32f2f' }}>
                        Select exactly {MAX_PICKS} players to save
                    </span>
                )}
                {saveMessage && (
                    <span style={{ fontSize: '14px', color: saveMessage === 'Picks saved!' ? '#388e3c' : '#d32f2f' }}>
                        {saveMessage}
                    </span>
                )}
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
                <input
                    ref={searchRef}
                    type="text"
                    placeholder={picks.length >= MAX_PICKS ? `Maximum of ${MAX_PICKS} players reached` : 'Search players by name or team...'}
                    value={searchQuery}
                    onChange={e => { if (picks.length < MAX_PICKS) setSearchQuery(e.target.value); }}
                    disabled={picks.length >= MAX_PICKS}
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', ...(picks.length >= MAX_PICKS ? { background: '#f5f5f5', color: '#999' } : {}) }}
                />

                {/* Search results dropdown */}
                {filteredPlayers.length > 0 && (
                    <div style={dropdownStyle}>
                        {filteredPlayers.slice(0, 20).map(player => (
                            <div
                                key={player.name}
                                onClick={() => addPlayer(player)}
                                style={dropdownItemStyle}
                                onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                            >
                                <strong>{player.name}</strong>
                                <span style={{ color: '#666', marginLeft: '8px' }}>
                                    {player.team} ({player.seed})
                                </span>
                            </div>
                        ))}
                        {filteredPlayers.length > 20 && (
                            <div style={{ padding: '8px 12px', color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
                                {filteredPlayers.length - 20} more results — keep typing to narrow down
                            </div>
                        )}
                    </div>
                )}

                {searchQuery.trim().length > 0 && filteredPlayers.length === 0 && (
                    <div style={{ ...dropdownStyle, padding: '12px', color: '#999', fontStyle: 'italic' }}>
                        No matching players found.
                    </div>
                )}
            </div>
        </div>
    );
}

// Styles
const inputStyle = {
    padding: '10px 12px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
};

const buttonStyle = {
    padding: '10px 20px',
    fontSize: '15px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
};

const pickChipStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    background: '#e3f2fd',
    border: '1px solid #90caf9',
    borderRadius: '6px',
    fontSize: '14px',
};

const removeButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#d32f2f',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    lineHeight: '1',
    padding: '0 4px',
};

const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'white',
    border: '1px solid #ccc',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
};

const dropdownItemStyle = {
    padding: '10px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
};

export default PicksPage;
