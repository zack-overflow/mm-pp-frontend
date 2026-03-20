import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import BASE_SERVER_URL from '../config';
import Table from './Table';

function formatNumber(value) {
    return Number(value || 0).toFixed(1);
}

function formatPercent(value) {
    return `${(Number(value || 0) * 100).toFixed(1)}%`;
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

function clampPercent(value) {
    return Math.max(0, Math.min(100, value));
}

function isCoverageWarning(warning) {
    const normalized = String(warning || '').toLowerCase();
    return (
        normalized.includes('unresolved') ||
        normalized.includes('could not be resolved') ||
        normalized.includes('could not be projected') ||
        normalized.includes('remaining totals may be understated') ||
        normalized.includes('some picked players')
    );
}

function ProjectedTotalCell({ currentScore, projectedRemainingMean, projectedTotalMean, projectedTotalP10, projectedTotalP90 }) {
    const lockedPoints = Number(currentScore || 0);
    const projectedPoints = Math.max(Number(projectedRemainingMean || 0), 0);
    const totalPoints = Math.max(Number(projectedTotalMean || 0), 0.0001);

    const lockedPct = clampPercent((lockedPoints / totalPoints) * 100);
    const projectedPct = clampPercent(100 - lockedPct);

    const lower = Number(projectedTotalP10 || 0);
    const upper = Number(projectedTotalP90 || 0);
    const average = Number(projectedTotalMean || 0);
    const span = Math.max(upper - lower, 0.0001);
    const markerPct = clampPercent(((average - lower) / span) * 100);

    return (
        <div className="projection-total-cell">
            <div className="projection-range-header">
                <div className="projection-range-value">{formatNumber(projectedTotalMean)}</div>
                <div className="projection-range-spread">P10-P90</div>
            </div>
            <div className="projection-total-mix">
                <span className="projection-total-key projection-total-key-current">
                    <strong>{formatNumber(lockedPoints)}</strong> actual
                </span>
                <span className="projection-total-key projection-total-key-projected">
                    <strong>{formatNumber(projectedPoints)}</strong> projected
                </span>
            </div>
            <div className="projection-total-stack">
                <div className="projection-total-stack-current" style={{ width: `${lockedPct}%` }} />
                <div className="projection-total-stack-projected" style={{ width: `${projectedPct}%` }} />
            </div>
            <div className="projection-range-bar">
                <div className="projection-range-band" />
                <div className="projection-range-marker" style={{ left: `calc(${markerPct}% - 2px)` }} />
            </div>
            <div className="projection-range-label">
                <span>{formatNumber(lower)}</span>
                <span>{formatNumber(upper)}</span>
            </div>
        </div>
    );
}

function ProjectionsPage() {
    const [projectionData, setProjectionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${BASE_SERVER_URL}/projections`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(response.status === 404 ? 'Projection snapshot not available yet.' : 'Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                setProjectionData(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err);
                setLoading(false);
            });
    }, []);

    const stale = useMemo(() => {
        if (!projectionData?.generated_at || !projectionData?.cadence_minutes) return false;
        const generatedAt = new Date(projectionData.generated_at);
        if (Number.isNaN(generatedAt.getTime())) return false;
        const ageMs = Date.now() - generatedAt.getTime();
        return ageMs > (Number(projectionData.cadence_minutes) + 20) * 60 * 1000;
    }, [projectionData]);

    const columns = useMemo(
        () => [
            {
                Header: '#',
                accessor: 'rank',
                id: 'rank',
                Cell: ({ row }) => row.index + 1,
            },
            {
                Header: 'Entrant',
                accessor: 'entrant',
                Cell: ({ value }) => (
                    <Link to={`/projections/entrant/${encodeURIComponent(value)}`} className="table-link">
                        {value}
                    </Link>
                ),
            },
            {
                Header: 'Current Pts',
                accessor: 'current_score',
                Cell: ({ value }) => formatNumber(value),
            },
            {
                Header: 'Projected Total',
                accessor: 'projected_total_mean',
                Cell: ({ row }) => (
                    <ProjectedTotalCell
                        currentScore={row.original.current_score}
                        projectedRemainingMean={row.original.projected_remaining_mean}
                        projectedTotalMean={row.original.projected_total_mean}
                        projectedTotalP10={row.original.projected_total_p10}
                        projectedTotalP90={row.original.projected_total_p90}
                    />
                ),
            },
            {
                Header: 'Win %',
                accessor: 'win_probability',
                Cell: ({ value }) => formatPercent(value),
            },
            {
                Header: 'Top 3 %',
                accessor: 'top3_probability',
                Cell: ({ value }) => formatPercent(value),
            },
        ],
        []
    );

    if (loading) return <div className="loading-container">Loading projections...</div>;
    if (error) return <div className="error-container">Error loading projections: {error.message}</div>;
    if (!projectionData) return <div className="error-container">No projection data available.</div>;

    const warnings = (projectionData.warnings || []).filter((warning) => !isCoverageWarning(warning));
    if (stale) {
        warnings.unshift('This snapshot is older than the scheduled 90-minute cadence, so it may be stale.');
    }

    return (
        <div className="page-container">
            <Link to="/" className="back-link">← Back to Scoreboard</Link>

            <h1 className="page-title">Projections</h1>
            <p className="page-subtitle projection-page-note">
                <strong>
                    Projections based on {Math.floor((projectionData.n_sims || 0) / 1000)}k simulations run on {formatTimestamp(projectionData.generated_at)}. Win % numbers are based on the proportion of simulations where each entrant had the highest total score or was in the top three.
                </strong>
            </p>

            {warnings.length > 0 && (
                <div className="analysis-warning">
                    {warnings.map((warning) => (
                        <div key={warning}>{warning}</div>
                    ))}
                </div>
            )}

            <Table
                columns={columns}
                data={projectionData.entrant_projections || []}
                tableClassName="projections-table"
            />
        </div>
    );
}

export default ProjectionsPage;
