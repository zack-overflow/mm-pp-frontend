import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import BASE_SERVER_URL from '../config';
import Table from './Table';

const BAR_COLORS = ['#3949ab', '#ff8f00', '#2e7d32', '#8e24aa', '#00838f', '#c62828'];

function toPlayerSlug(playerName) {
    return encodeURIComponent(
        String(playerName)
            .trim()
            .replace(/\s+/g, '-')
            .toUpperCase()
    );
}

function SummaryCard({ label, value, accent }) {
    return (
        <div className="analysis-card" style={{ borderTopColor: accent }}>
            <span className="analysis-card-label">{label}</span>
            <span className="analysis-card-value">{value}</span>
        </div>
    );
}

function EntrantList({ entrants }) {
    if (!entrants || entrants.length === 0) {
        return <span>—</span>;
    }

    return (
        <div className="analysis-chip-group">
            {entrants.map((entrant) => (
                <Link key={entrant} to={`/entrant/${entrant}`} className="ownership-name-chip">
                    {entrant}
                </Link>
            ))}
        </div>
    );
}

function PlayerChipList({ players, emptyLabel }) {
    if (!players || players.length === 0) {
        return <span className="analysis-empty-note">{emptyLabel}</span>;
    }

    return (
        <div className="analysis-chip-group">
            {players.map((player) => (
                <Link
                    key={`${player.player}-${player.seed}-${player.team}`}
                    to={`/player/${toPlayerSlug(player.player)}`}
                    className="analysis-player-chip"
                >
                    <strong>{player.player}</strong>
                    <span>{player.team} ({player.seed})</span>
                </Link>
            ))}
        </div>
    );
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="custom-tooltip">
            <p className="custom-tooltip-label">{label}</p>
            {payload.map((entry, index) => (
                <p key={index} style={{ color: entry.color, margin: '4px 0' }}>
                    {entry.name}: <strong>{entry.value}</strong>
                </p>
            ))}
        </div>
    );
}

function PickAnalysis() {
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${BASE_SERVER_URL}/pick_analysis`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                setAnalysisData(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err);
                setLoading(false);
            });
    }, []);

    const topPlayerColumns = useMemo(
        () => [
            {
                Header: 'Player',
                accessor: 'player',
                Cell: ({ value }) => (
                    <Link to={`/player/${toPlayerSlug(value)}`} className="table-link">
                        {value}
                    </Link>
                ),
            },
            {
                Header: 'Team',
                accessor: 'team',
            },
            {
                Header: 'Seed',
                accessor: 'seed',
            },
            {
                Header: 'Picked By',
                accessor: 'pick_count',
                Cell: ({ value }) => `${value}/${analysisData?.summary?.filled_entries || 0}`,
            },
            {
                Header: 'Ownership',
                accessor: 'ownership_pct',
                Cell: ({ value }) => `${value}%`,
            },
            {
                Header: 'Entrants',
                accessor: 'entrants',
                Cell: ({ value }) => <EntrantList entrants={value} />,
            },
        ],
        [analysisData]
    );

    const entrantColumns = useMemo(
        () => [
            {
                Header: 'Entrant',
                accessor: 'entrant',
                Cell: ({ value }) => (
                    <Link to={`/entrant/${value}`} className="table-link">
                        {value}
                    </Link>
                ),
            },
            {
                Header: 'Avg Seed',
                accessor: 'avg_seed',
            },
            {
                Header: 'Unique Picks',
                accessor: 'unique_picks',
            },
            {
                Header: 'Consensus Picks',
                accessor: 'consensus_picks',
            },
            {
                Header: 'High-Owned Picks',
                accessor: 'high_owned_picks',
            },
            {
                Header: 'Avg Shared Picks',
                accessor: 'avg_shared_picks',
            },
        ],
        []
    );

    const overlapColumns = useMemo(
        () => [
            {
                Header: 'Entrant A',
                accessor: 'entrant_a',
                Cell: ({ value }) => (
                    <Link to={`/entrant/${value}`} className="table-link">
                        {value}
                    </Link>
                ),
            },
            {
                Header: 'Entrant B',
                accessor: 'entrant_b',
                Cell: ({ value }) => (
                    <Link to={`/entrant/${value}`} className="table-link">
                        {value}
                    </Link>
                ),
            },
            {
                Header: 'Shared Picks',
                accessor: 'shared_picks',
            },
            {
                Header: 'Similarity',
                accessor: 'jaccard',
                Cell: ({ value }) => `${Math.round(value * 100)}%`,
            },
        ],
        []
    );

    const seedChartData = useMemo(
        () => (analysisData?.seed_breakdown || []).map((row) => ({
            seed: `S${row.seed}`,
            picks: row.pick_count,
        })),
        [analysisData]
    );

    const teamChartData = useMemo(
        () => (analysisData?.team_breakdown || []).slice(0, 8).map((row) => ({
            team: row.team,
            picks: row.pick_count,
        })),
        [analysisData]
    );

    if (loading) return <div className="loading-container">Loading pick analysis...</div>;
    if (error) return <div className="error-container">Error loading pick analysis: {error.message}</div>;
    if (!analysisData) return <div className="error-container">No analysis data available.</div>;

    const { summary } = analysisData;

    return (
        <div className="page-container">
            <Link to="/" className="back-link">← Back to Scoreboard</Link>

            <h1 className="page-title">Pick Analysis</h1>
            <p className="page-subtitle">
                More in-depth look at picks.
            </p>

            <div className="analysis-card-grid">
                <SummaryCard label="Entries" value={`${summary.filled_entries}/${summary.total_entrants}`} accent="#3949ab" />
                <SummaryCard label="Total Picks" value={summary.total_picks} accent="#ff8f00" />
                <SummaryCard label="Unique Players" value={summary.unique_players} accent="#2e7d32" />
                <SummaryCard label="Avg Seed" value={summary.average_seed} accent="#8e24aa" />
                <SummaryCard label="Median Seed" value={summary.median_seed} accent="#00838f" />
                <SummaryCard label="Favorite Seed" value={summary.favorite_seed ? `#${summary.favorite_seed}` : '—'} accent="#c62828" />
            </div>

            <div className="chart-section">
                <h2>Most Picked Players</h2>
                <p className="analysis-section-note">
                    The highest-owned players in the pool. Click a player or entrant name to jump into the detail pages.
                </p>
                <Table columns={topPlayerColumns} data={analysisData.top_players.slice(0, 15)} />
            </div>

            <div className="analysis-two-column">
                <div className="chart-section">
                    <h2>Seed Breakdown</h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={seedChartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                            <XAxis dataKey="seed" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="picks" name="Picks" radius={[6, 6, 0, 0]}>
                                {seedChartData.map((entry, index) => (
                                    <Cell key={entry.seed} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="analysis-stat-list">
                        {analysisData.seed_breakdown.map((row) => (
                            <div key={row.seed} className="analysis-stat-row">
                                <div>
                                    <strong>Seed {row.seed}</strong>
                                    <span>{row.pick_count} picks, {row.unique_players} unique players</span>
                                </div>
                                <span className="analysis-inline-note">
                                    {row.top_players.map((player) => `${player.player} (${player.pick_count})`).join(' • ')}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="analysis-footnote">
                        Unused seeds: {summary.missing_seeds.length ? summary.missing_seeds.join(', ') : 'none'}
                    </p>
                </div>

                <div className="chart-section">
                    <h2>Team Exposure</h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={teamChartData} layout="vertical" margin={{ top: 12, right: 12, left: 24, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                            <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                            <YAxis dataKey="team" type="category" width={80} tick={{ fontSize: 12 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="picks" name="Picks" fill="#ff8f00" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="analysis-stat-list">
                        {analysisData.team_breakdown.slice(0, 8).map((row) => (
                            <div key={row.team} className="analysis-stat-row">
                                <div>
                                    <strong>{row.team}</strong>
                                    <span>{row.pick_count} total picks</span>
                                </div>
                                <span className="analysis-inline-note">{row.unique_players} different players from this team</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="analysis-two-column">
                <div className="chart-section">
                    <h2>Consensus Core</h2>
                    <p className="analysis-section-note">Players everybody has, or close to it.</p>
                    <PlayerChipList
                        players={analysisData.consensus_picks}
                        emptyLabel="No unanimous picks yet."
                    />
                </div>

                <div className="chart-section">
                    <h2>Contrarian Corner</h2>
                    <p className="analysis-section-note">One-off picks that currently belong to a single entry.</p>
                    <div className="analysis-contrarian-list">
                        {analysisData.one_off_picks.length === 0 && (
                            <span className="analysis-empty-note">No one-off picks yet.</span>
                        )}
                        {analysisData.one_off_picks.slice(0, 10).map((player) => (
                            <div key={player.player} className="analysis-contrarian-item">
                                <Link to={`/player/${toPlayerSlug(player.player)}`} className="table-link">
                                    {player.player}
                                </Link>
                                <span>{player.team} ({player.seed})</span>
                                <Link to={`/entrant/${player.only_entrant}`} className="ownership-name-chip">
                                    {player.only_entrant}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="chart-section">
                <h2>Entrant Styles</h2>
                <p className="analysis-section-note">
                    Higher unique-pick counts mean a more contrarian board. Lower average shared picks means less overlap with the field.
                </p>
                <Table columns={entrantColumns} data={analysisData.entrant_profiles} />
            </div>

            <div className="chart-section">
                <h2>Closest Entry Pairs</h2>
                <p className="analysis-section-note">
                    The pairs below share the most picks with each other.
                </p>
                <Table columns={overlapColumns} data={analysisData.pairwise_overlap} />
            </div>

            {analysisData.missing_players.length > 0 && (
                <div className="analysis-warning">
                    Missing metadata for: {analysisData.missing_players.join(', ')}
                </div>
            )}
        </div>
    );
}

export default PickAnalysis;
