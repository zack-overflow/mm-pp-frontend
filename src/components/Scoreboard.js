import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Table from './Table'; // Assuming you have a Table component
import BASE_SERVER_URL from '../config'


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
                Header: 'Entrant (click name for details)',
                accessor: 'entrantName',
                // Custom cell renderer to make the entrant name a clickable link
                Cell: ({ value }) => (
                    <Link to={`/entrant/${value}`} style={{ textDecoration: 'underline', color: 'blue' }}>
                        {value}
                    </Link>
                )
            },
            {
                Header: 'Score',
                accessor: 'score',
                // Sort by score in descending order (highest first)
                sortDescFirst: true
            },
            {
                Header: "Multiplier Sum",
                accessor: 'sum_multiplier',
            },
            {
                Header: "Players Alive",
                accessor: 'alive_count',

            },
            // {
            //     Header: "Projected Sum Games Remaining After R64",
            //     accessor: 'sum_games_projected'
            // },
            // {
            //     Header: "Projected Sum Games Remaining w/ Multiplier After R64",
            //     accessor: 'sum_games_projected_multiplier'
            // }
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
                // sum_games_projected: stats.sum_games_projected || 0,
                // sum_games_projected_multiplier: stats.sum_games_projected_multiplier || 0,
            }))
            .sort((a, b) => b.score - a.score); // Sort by score in descending order
    }, [scoreboardData]);

    // Conditional rendering after hooks
    if (loading) return <div>Loading scoreboard...</div>;
    if (error) return <div>Error loading scoreboard: {error.message}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>March Madness Scoreboard</h1>
            <Table columns={columns} data={scoreboardArray} />
            <nav style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
                <Link to="/perfect-bracket" style={{ textDecoration: 'underline', color: 'blue' }}>
                    View "Perfect Bracket"
                </Link>
                <Link to="/picks" style={{ textDecoration: 'underline', color: 'blue' }}>
                    Enter Your Picks
                </Link>
            </nav>
        </div>
    );
}

export default Scoreboard;