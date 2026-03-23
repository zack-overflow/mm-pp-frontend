import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import BASE_SERVER_URL from '../config';
import ProjectionBulletCell, { getProjectionScaleMax } from './ProjectionBullet';
import Table from './Table';

function SummaryCard({ label, value, accent }) {
    return (
        <div className="analysis-card" style={{ borderTopColor: accent }}>
            <span className="analysis-card-label">{label}</span>
            <span className="analysis-card-value">{value}</span>
        </div>
    );
}

function formatNumber(value) {
    return Number(value || 0).toFixed(1);
}

function formatPercent(value) {
    return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function formatTeamSeed(team, seed) {
    if (!team) return '—';
    return seed !== undefined && seed !== null && seed !== '' ? `${team} (${seed})` : team;
}

function GamesDistributionCell({ distribution, unavailable = false }) {
    if (unavailable || !distribution?.length) {
        return (
            <div className="games-distribution-cell games-distribution-cell-empty">
                <div className="projection-range-empty-note">Unavailable</div>
            </div>
        );
    }

    return (
        <div className="games-distribution-cell">
            {distribution.map((bucket) => (
                <div key={bucket.games} className="games-distribution-row">
                    <span className="games-distribution-games">{bucket.games} more</span>
                    <div className="games-distribution-track">
                        <div
                            className="games-distribution-fill"
                            style={{ width: `${Math.max(4, Number(bucket.probability || 0) * 100)}%` }}
                        />
                    </div>
                    <span className="games-distribution-probability">{formatPercent(bucket.probability)}</span>
                </div>
            ))}
        </div>
    );
}

function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function buildEntrantRows(entrantJson, projectionRow, hasPlayerProjectionData) {
    const projectedPlayers = new Map(
        ((hasPlayerProjectionData && projectionRow?.player_projections) || []).map((playerRow) => [
            String(playerRow.player || '').trim().toUpperCase(),
            playerRow,
        ])
    );

    return Object.entries(entrantJson)
        .map(([name, info]) => {
            const projection = projectedPlayers.get(String(name).trim().toUpperCase()) || null;
            const actualPoints = info.pts === 'Not played yet'
                ? 0
                : info.pts.reduce((total, current) => total + current, 0);

            return {
                name,
                current_points: projection?.current_points ?? actualPoints,
                team: info.team,
                seed: info.seed,
                team_display: formatTeamSeed(info.team, info.seed),
                alive: info.alive ? 'Yes' : 'No',
                unavailable: !hasPlayerProjectionData,
                unresolved: hasPlayerProjectionData ? Boolean(projection?.unresolved) : false,
                projected_remaining_mean: projection?.projected_remaining_mean ?? null,
                projected_remaining_p10: projection?.projected_remaining_p10 ?? null,
                projected_remaining_p90: projection?.projected_remaining_p90 ?? null,
                projected_total_mean: projection?.projected_total_mean ?? null,
                projected_total_p10: projection?.projected_total_p10 ?? null,
                projected_total_p90: projection?.projected_total_p90 ?? null,
                remaining_games_distribution: projection?.remaining_games_distribution ?? [],
            };
        })
        .sort((a, b) => (
            (a.alive === 'Yes' && b.alive === 'No' ? -1 : 0)
            || (a.alive === 'No' && b.alive === 'Yes' ? 1 : 0)
            || (b.current_points - a.current_points)
            || a.name.localeCompare(b.name)
        ));
}

function EntrantProjectionDetail() {
    const { entrantName } = useParams();
    const entrantLabel = decodeURIComponent(entrantName || '');
    const [dataArray, setDataArray] = useState([]);
    const [projectionRow, setProjectionRow] = useState(null);
    const [projectionMeta, setProjectionMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const playerProjectionScaleMax = useMemo(
        () => getProjectionScaleMax(dataArray, {
            currentAccessor: (row) => row.current_points,
            meanAccessor: (row) => row.projected_total_mean,
            upperAccessor: (row) => row.projected_total_p90,
        }),
        [dataArray]
    );

    useEffect(() => {
        let cancelled = false;

        async function loadEntrantData() {
            try {
                const entrantResponse = await fetch(`${BASE_SERVER_URL}/entrant/${encodeURIComponent(entrantLabel)}`);
                if (!entrantResponse.ok) {
                    throw new Error('Network response was not ok');
                }
                const entrantJson = await entrantResponse.json();

                let projectionsJson = null;
                try {
                    const projectionsResponse = await fetch(`${BASE_SERVER_URL}/projections`);
                    if (projectionsResponse.ok) {
                        projectionsJson = await projectionsResponse.json();
                    }
                } catch {
                    projectionsJson = null;
                }

                if (cancelled) return;

                const matchedProjection = projectionsJson?.entrant_projections?.find(
                    (row) => row.entrant === entrantLabel
                ) || null;
                const hasPlayerProjectionData = Boolean(
                    matchedProjection
                    && Array.isArray(matchedProjection.player_projections)
                    && matchedProjection.player_projections.length > 0
                );

                setProjectionRow(matchedProjection);
                setProjectionMeta(
                    projectionsJson
                        ? {
                            generated_at: projectionsJson.generated_at,
                            n_sims: projectionsJson.n_sims,
                            has_player_projections: hasPlayerProjectionData,
                        }
                        : null
                );
                setDataArray(buildEntrantRows(entrantJson, matchedProjection, hasPlayerProjectionData));
                setLoading(false);
            } catch (err) {
                if (cancelled) return;
                setError(err);
                setLoading(false);
            }
        }

        loadEntrantData();

        return () => {
            cancelled = true;
        };
    }, [entrantLabel]);

    const columns = useMemo(
        () => [
            {
                Header: 'Player',
                accessor: 'name',
                Cell: ({ value, row }) => {
                    const urlName = encodeURIComponent(value.replace(/\s+/g, '-'));

                    return (
                        <div className="entrant-player-cell">
                            <Link to={`/player/${urlName}`} className="table-link">
                                {value}
                            </Link>
                            {row.original.unavailable && (
                                <span className="entrant-player-tag">Refresh projections to view</span>
                            )}
                            {row.original.unresolved && (
                                <span className="entrant-player-tag">No sim projection</span>
                            )}
                        </div>
                    );
                },
            },
            {
                Header: 'Team',
                accessor: 'team_display',
            },
            {
                Header: 'Projection',
                accessor: 'projected_total_mean',
                Cell: ({ row }) => (
                    <ProjectionBulletCell
                        currentScore={row.original.current_points}
                        mean={row.original.projected_total_mean}
                        p10={row.original.projected_total_p10}
                        p90={row.original.projected_total_p90}
                        scaleMax={playerProjectionScaleMax}
                        unavailable={row.original.unavailable || row.original.unresolved}
                        compact
                    />
                ),
            },
            {
                Header: 'Games Left %',
                accessor: 'remaining_games_distribution',
                Cell: ({ row }) => (
                    <GamesDistributionCell
                        distribution={row.original.remaining_games_distribution}
                        unavailable={row.original.unavailable || row.original.unresolved}
                    />
                ),
            },
        ],
        [playerProjectionScaleMax]
    );

    const unresolvedCount = dataArray.filter((row) => row.unresolved).length;

    if (loading) return <div className="loading-container">Loading data...</div>;
    if (error) return <div className="error-container">Error: {error.message}</div>;

    return (
        <div className="page-container entrant-projection-page">
            <Link to="/projections" className="back-link">← Back to Projections</Link>
            <h1 className="page-title">{entrantLabel}</h1>
            <p className="page-subtitle">
                {projectionMeta
                    ? `Player projections based on ${projectionMeta.n_sims || 0} simulations.`
                    : 'Current picks and actual points.'}
            </p>

            {projectionRow && (
                <div className="analysis-card-grid projection-summary-grid">
                    <SummaryCard label="Current Pts" value={formatNumber(projectionRow.current_score)} accent="#3949ab" />
                    <SummaryCard label="Projected Remaining" value={formatNumber(projectionRow.projected_remaining_mean)} accent="#ff8f00" />
                    <SummaryCard label="Projected Final" value={formatNumber(projectionRow.projected_total_mean)} accent="#2e7d32" />
                    <SummaryCard label="Win %" value={formatPercent(projectionRow.win_probability)} accent="#d84315" />
                </div>
            )}

            {projectionMeta && (
                <div className="projection-detail-note">
                    Snapshot started {formatTimestamp(projectionMeta.generated_at)}.
                </div>
            )}

            <div className="projection-status-legend">
                <span className="projection-status-swatch" />
                <span>Red highlight means the player is no longer alive.</span>
            </div>

            {projectionMeta && !projectionMeta.has_player_projections && (
                <div className="analysis-warning">
                    This snapshot does not include player-level projection detail yet. Rerun the projection pipeline once
                    to populate the player projections for each entrant.
                </div>
            )}

            {unresolvedCount > 0 && (
                <div className="analysis-warning">
                    {unresolvedCount} player{unresolvedCount === 1 ? '' : 's'} on this entry could not be projected, so
                    their remaining-point estimates are omitted.
                </div>
            )}

            <Table columns={columns} data={dataArray} tableClassName="entrant-projection-table" />
        </div>
    );
}

export default EntrantProjectionDetail;
