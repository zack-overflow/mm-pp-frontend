import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import BASE_SERVER_URL from '../config';
import ProjectionBulletCell, {
    ProjectionBulletBar,
    ProjectionBulletLegend,
    getProjectionScaleMax,
} from './ProjectionBullet';
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

function ProjectionOverview({ rows, scaleMax }) {
    if (!rows.length) {
        return null;
    }

    return (
        <section className="projection-overview-card">
            <ProjectionBulletLegend
                className="projection-overview-legend"
                showCurrentValue={false}
            />
            <div className="projection-overview-list">
                {rows.map((row, index) => (
                    <div key={row.entrant} className="projection-overview-row">
                        <span className="projection-overview-rank">{index + 1}</span>
                        <Link
                            to={`/projections/entrant/${encodeURIComponent(row.entrant)}`}
                            className="projection-overview-name table-link"
                        >
                            {row.entrant}
                        </Link>
                        <ProjectionBulletBar
                            currentScore={row.current_score}
                            mean={row.projected_total_mean}
                            p10={row.projected_total_p10}
                            p90={row.projected_total_p90}
                            scaleMax={scaleMax}
                            showRangeLabel={false}
                            className="projection-overview-bullet"
                        />
                        <span className="projection-overview-value">{formatNumber(row.projected_total_mean)}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ProjectionsPage() {
    const [projectionData, setProjectionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const entrantRows = useMemo(
        () => projectionData?.entrant_projections ?? [],
        [projectionData]
    );
    const sharedScaleMax = useMemo(
        () => getProjectionScaleMax(entrantRows, {
            currentAccessor: (row) => row.current_score,
            meanAccessor: (row) => row.projected_total_mean,
            upperAccessor: (row) => row.projected_total_p90,
        }),
        [entrantRows]
    );

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
                Header: 'Projected Total',
                accessor: 'projected_total_mean',
                Cell: ({ row }) => (
                    <ProjectionBulletCell
                        currentScore={row.original.current_score}
                        mean={row.original.projected_total_mean}
                        p10={row.original.projected_total_p10}
                        p90={row.original.projected_total_p90}
                        scaleMax={sharedScaleMax}
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
        [sharedScaleMax]
    );

    if (loading) return <div className="loading-container">Loading projections...</div>;
    if (error) return <div className="error-container">Error loading projections: {error.message}</div>;
    if (!projectionData) return <div className="error-container">No projection data available.</div>;

    const warnings = (projectionData.warnings || []).filter((warning) => !isCoverageWarning(warning));

    return (
        <div className="page-container">
            {/* <Link to="/" className="back-link">← Back to Scoreboard</Link> */}

            <h1 className="page-title">Projections</h1>
            <div className="projection-run-card">
                <span className="projection-run-label">Simulation Run</span>
                <span className="projection-run-value">{formatTimestamp(projectionData.generated_at)}</span>
                <span className="projection-run-meta">{Math.floor((projectionData.n_sims || 0) / 1000)}k simulations</span>
            </div>
            <div className="page-subtitle projection-page-note">
                <span>Win % numbers are based on the proportion of simulations where each entrant had the highest total score.</span>
                <span>Top 3 % numbers are based on the proportion of simulations where each entrant finished in the top three.</span>
            </div>

            <ProjectionOverview rows={entrantRows} scaleMax={sharedScaleMax} />

            {warnings.length > 0 && (
                <div className="analysis-warning">
                    {warnings.map((warning) => (
                        <div key={warning}>{warning}</div>
                    ))}
                </div>
            )}

            <Table
                columns={columns}
                data={entrantRows}
                tableClassName="projections-table"
            />
        </div>
    );
}

export default ProjectionsPage;
