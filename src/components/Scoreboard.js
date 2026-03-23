import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Table from './Table';
import BASE_SERVER_URL from '../config'

const TOTAL_PICKS = 15;

// Inline sparkline: 15 dots showing alive (green) vs eliminated (gray)
function AliveSparkline({ aliveCount }) {
    return (
        <div className="alive-sparkline" aria-label={`${aliveCount} of ${TOTAL_PICKS} picks still alive`}>
            <div className="alive-dots">
                {Array.from({ length: TOTAL_PICKS }, (_, i) => (
                    <span
                        key={i}
                        className={`alive-dot ${i < aliveCount ? 'alive' : 'eliminated'}`}
                    />
                ))}
            </div>
            <span className="alive-count-label">{aliveCount}/{TOTAL_PICKS}</span>
            <span className="alive-count-chip">
                <span className="alive-count-chip-dot" aria-hidden="true" />
                <span>{aliveCount}/{TOTAL_PICKS}</span>
            </span>
        </div>
    );
}

function InProgressCount({ count }) {
    if (!count) {
        return <span className="live-count-none">-</span>;
    }

    return (
        <span className="live-count-badge" title={`${count} picked player(s) currently in progress`}>
            <span className="live-dot" aria-hidden="true" />
            <span>{count}</span>
        </span>
    );
}

// Scoreboard component that will be shown at the root route
function Scoreboard() {
    const [scoreboardData, setScoreboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${BASE_SERVER_URL}/scoreboard`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setScoreboardData(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err);
                setLoading(false);
            });
    }, []);

    // Define columns for scoreboard table with a link in the entrant name column
    const columns = useMemo(
        () => [
            {
                Header: '',
                accessor: 'entrantName',
                Cell: ({ value }) => (
                    <Link to={`/entrant/${encodeURIComponent(value)}`} className="table-link scoreboard-entrant-link">
                        {value}
                    </Link>
                )
            },
            {
                Header: 'Score',
                accessor: 'score',
                sortDescFirst: true
            },
            {
                Header: "Mult",
                accessor: 'sum_multiplier',
            },
            {
                Header: "Alive",
                accessor: 'alive_count',
                Cell: ({ value }) => <AliveSparkline aliveCount={value} />
            },
            {
                Header: "Live",
                accessor: 'in_progress_count',
                Cell: ({ value }) => <InProgressCount count={value} />,
            },
        ],
        []
    );

    // FIXED: Move useMemo before any conditional returns
    const scoreboardArray = useMemo(() => {
        if (!scoreboardData || typeof scoreboardData !== 'object') return [];
        return Object.entries(scoreboardData)
            .map(([entrantName, stats]) => ({
                entrantName,
                score: stats.score || 0,
                sum_multiplier: stats.sum_multiplier || 0,
                alive_count: stats.alive_count || 0,
                in_progress_count: stats.in_progress_count || 0,
            }))
            .sort((a, b) => b.score - a.score);
    }, [scoreboardData]);

    // Conditional rendering after hooks
    if (loading) return <div className="loading-container">Loading scoreboard...</div>;
    if (error) return <div className="error-container">Error loading scoreboard: {error.message}</div>;

    return (
        <div className="page-container">
            <h1 className="page-title">Scoreboard</h1>
            <p className="page-subtitle">Click an entrant name to view their picks</p>
            <Table columns={columns} data={scoreboardArray} tableClassName="scoreboard-table" />
        </div>
    );
}

export default Scoreboard;
