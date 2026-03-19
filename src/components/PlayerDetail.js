import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom'
import BASE_SERVER_URL from '../config';

import {
    Line,
    Area,
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const DONUT_COLORS = ['#3949ab', '#e0e0e0'];

function OwnershipDonut({ pickedBy, totalEntrants }) {
    const pickCount = pickedBy.length;
    const notPicked = totalEntrants - pickCount;
    const pct = totalEntrants > 0 ? Math.round((pickCount / totalEntrants) * 100) : 0;

    const data = [
        { name: 'Picked', value: pickCount },
        { name: 'Not Picked', value: notPicked },
    ];

    return (
        <div className="ownership-section">
            <h2>Ownership</h2>
            <div className="ownership-layout">
                <div className="ownership-chart-wrap">
                    <ResponsiveContainer width={180} height={180}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={75}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                                stroke="none"
                            >
                                {data.map((_, i) => (
                                    <Cell key={i} fill={DONUT_COLORS[i]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="ownership-pct">{pct}%</div>
                </div>
                <div className="ownership-details">
                    <div className="ownership-stat">
                        <span className="ownership-stat-value">{pickCount}</span>
                        <span className="ownership-stat-label">of {totalEntrants} entrants</span>
                    </div>
                    {pickedBy.length > 0 && (
                        <div className="ownership-entrants">
                            <span className="ownership-stat-label">Picked by:</span>
                            <div className="ownership-names">
                                {pickedBy.map(name => (
                                    <Link key={name} to={`/entrant/${name}`} className="ownership-name-chip">
                                        {name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Custom tooltip for the performance chart
function ChartTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="custom-tooltip">
            <p className="custom-tooltip-label">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color, margin: '4px 0' }}>
                    {entry.name}: <strong>{entry.value}</strong>
                </p>
            ))}
        </div>
    );
}

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

    // Create chart data with cumulative totals
    const roundData = useMemo(() => {
        if (!playerData) return [];
        let cumPts = 0;
        let cumMult = 0;
        return playerData.pts.map((points, index) => {
            cumPts += points;
            cumMult += playerData.pts_mult_round[index] || 0;
            return {
                round: `R${index + 1}`,
                points: points,
                pointsWithMultiplier: playerData.pts_mult_round[index] || 0,
                cumPoints: cumPts,
                cumMultiplier: cumMult,
            };
        });
    }, [playerData]);

    if (loading) return <div className="loading-container">Loading player data...</div>;
    if (error) return <div className="error-container">Error loading player data: {error.message}</div>;
    if (!playerData) return <div className="error-container">No data available for this player.</div>;

    const totalPts = playerData.pts.reduce((sum, p) => sum + p, 0);
    const multiplierValue = playerData.pts_mult > 0 ? (playerData.pts_mult / Math.max(totalPts, 1)).toFixed(1) : '—';

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
                    <span className="player-info-value">{totalPts}</span>
                </div>
                <div className="player-info-item">
                    <span className="player-info-label">Points w/ Multiplier</span>
                    <span className="player-info-value">{playerData.pts_mult}</span>
                </div>
                <div className="player-info-item">
                    <span className="player-info-label">Multiplier</span>
                    <span className="player-info-value">{multiplierValue === '—' ? '—' : `${Math.round(multiplierValue)}x`}</span>
                </div>
            </div>

            {/* Ownership donut chart */}
            {playerData.picked_by && (
                <OwnershipDonut
                    pickedBy={playerData.picked_by}
                    totalEntrants={playerData.total_entrants}
                />
            )}

            {/* Improved round-by-round chart */}
            <div className="chart-section">
                <h2>Round-by-Round Performance</h2>
                <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart
                        data={roundData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3949ab" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#3949ab" stopOpacity={0.5} />
                            </linearGradient>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ff6f00" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#ff6f00" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                        <XAxis dataKey="round" tick={{ fontSize: 13 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend />
                        <Bar dataKey="points" name="Raw Points" fill="url(#barGrad)" barSize={32} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pointsWithMultiplier" name="Multiplied Points" fill="#ff6f00" barSize={32} radius={[4, 4, 0, 0]} fillOpacity={0.35} />
                        <Line dataKey="cumMultiplier" name="Cumulative (w/ Mult)" stroke="#ff6f00" strokeWidth={2.5} dot={{ r: 4, fill: '#ff6f00' }} />
                        <Area dataKey="cumMultiplier" fill="url(#areaGrad)" stroke="none" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Cumulative progression chart */}
            {roundData.length > 1 && (
                <div className="chart-section">
                    <h2>Cumulative Score Progression</h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart
                            data={roundData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <defs>
                                <linearGradient id="cumAreaRaw" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3949ab" stopOpacity={0.2} />
                                    <stop offset="100%" stopColor="#3949ab" stopOpacity={0.02} />
                                </linearGradient>
                                <linearGradient id="cumAreaMult" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ff6f00" stopOpacity={0.2} />
                                    <stop offset="100%" stopColor="#ff6f00" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                            <XAxis dataKey="round" tick={{ fontSize: 13 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend />
                            <Area dataKey="cumPoints" name="Cumulative Raw" fill="url(#cumAreaRaw)" stroke="#3949ab" strokeWidth={2} dot={{ r: 4, fill: '#3949ab' }} />
                            <Area dataKey="cumMultiplier" name="Cumulative w/ Mult" fill="url(#cumAreaMult)" stroke="#ff6f00" strokeWidth={2} dot={{ r: 4, fill: '#ff6f00' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

export default PlayerDetail;
