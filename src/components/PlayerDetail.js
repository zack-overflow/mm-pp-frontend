import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom'
import BASE_SERVER_URL from '../config';

import {
    Line,
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';


// New component to display details for a specific player
function PlayerDetail() {
    const { playerName } = useParams();
    const [playerData, setPlayerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${BASE_SERVER_URL}/player/${encodeURIComponent(playerName)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setPlayerData(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err);
                setLoading(false);
            });
    }, [playerName]);

    if (loading) return <div className="loading-container">Loading player data...</div>;
    if (error) return <div className="error-container">Error loading player data: {error.message}</div>;
    if (!playerData) return <div className="error-container">No data available for this player.</div>;

    // Create data for round-by-round chart
    const roundData = playerData.pts.map((points, index) => ({
        round: `Round ${index + 1}`,
        points: points,
        pointsWithMultiplier: playerData.pts_mult_round[index] || 0,
    }));

    return (
        <div className="page-container">
            <Link to="/" className="back-link">← Back to Scoreboard</Link>

            <h1 className="page-title">{playerData.player}</h1>

            <div className={`player-info-card${playerData.alive ? '' : ' eliminated'}`}>
                <div className="player-info-item">
                    <span className="player-info-label">Team</span>
                    <span className="player-info-value">{playerData.team}</span>
                </div>
                <div className="player-info-item">
                    <span className="player-info-label">Seed</span>
                    <span className="player-info-value">{playerData.seed}</span>
                </div>
                <div className="player-info-item">
                    <span className="player-info-label">Status</span>
                    <span className={`player-info-value ${playerData.alive ? 'status-alive' : 'status-eliminated'}`}>
                        {playerData.alive ? 'Still Alive' : 'Eliminated'}
                    </span>
                </div>
                <div className="player-info-item">
                    <span className="player-info-label">Total Points</span>
                    <span className="player-info-value">{playerData.pts.reduce((sum, p) => sum + p, 0)}</span>
                </div>
                <div className="player-info-item">
                    <span className="player-info-label">Points w/ Multiplier</span>
                    <span className="player-info-value">{playerData.pts_mult}</span>
                </div>
            </div>

            <div className="chart-section">
                <h2>Round-by-Round Performance</h2>
                <ResponsiveContainer width={'100%'} height={350}>
                    <ComposedChart
                        width={window.innerWidth - 50}
                        height={400}
                        data={roundData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="round" />
                        <YAxis />
                        <Tooltip
                            formatter={(value, name) => [value, name]}
                            labelFormatter={(label) => label}
                        />
                        <Legend />
                        <Bar dataKey="points" name="Points" fill="#3949ab" barSize={30} />
                        <Line dataKey="pointsWithMultiplier" name="Points w/ Multiplier" stroke="#ff6f00" strokeWidth={2} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default PlayerDetail;
