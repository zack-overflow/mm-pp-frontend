import React, { useEffect, useState, useMemo } from 'react';
import Table from "./Table";
import { Link } from 'react-router-dom';
import BASE_SERVER_URL from '../config'

// New component for Perfect Bracket
function PerfectBracket() {
    const [bracketData, setBracketData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${BASE_SERVER_URL}/perfect_bracket`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setBracketData(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err);
                setLoading(false);
            });
    }, []);

    const columns = useMemo(
        () => [
            {
                Header: 'Rank',
                accessor: 'rank',
                id: 'rank',
                Cell: ({ row }) => row.index + 1
            },
            {
                Header: 'Player',
                accessor: 'player',
            },
            {
                Header: 'Points w/ Multiplier',
                accessor: 'pts_mult',
            },
            {
                Header: 'Team',
                accessor: 'team',
            },
            {
                Header: 'Picked By',
                accessor: 'entrants',
                Cell: ({ value }) => (value ? value : '')
            }
        ],
        []
    );

    if (loading) return <div className="loading-container">Loading perfect bracket data...</div>;
    if (error) return <div className="error-container">Error loading perfect bracket: {error.message}</div>;

    return (
        <div className="page-container">
            <Link to="/" className="back-link">← Back to Scoreboard</Link>
            <h1 className="page-title">Perfect Bracket</h1>
            <p className="page-subtitle">The top 15 players in the tournament and who picked them</p>
            <Table columns={columns} data={bracketData} />
        </div>
    );
}

export default PerfectBracket;
