import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom'
import Table from './Table';
import BASE_SERVER_URL from '../config';

function EntrantDetail() {
    const { entrantName } = useParams();
    const [dataArray, setDataArray] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${BASE_SERVER_URL}/entrant/${entrantName}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(jsonData => {
                const arrayData = Object.entries(jsonData).map(([name, info]) => ({
                    name,
                    shortName: `${name.split(' ')[0][0]}. ${name.split(' ').slice(1).join(' ')}`,
                    pts: info.pts === 'Not played yet' ? 'Not played yet' : info.pts.reduce((total, current) => total + current, 0),
                    pts_mult: info.pts_mult,
                    seed: info.seed,
                    team: info.team,
                    alive: info.alive ? 'Yes' : 'No',
                })).sort((a, b) => {
                    if (a.alive === 'Yes' && b.alive === 'No') return -1;
                    if (a.alive === 'No' && b.alive === 'Yes') return 1;
                    if (a.pts_mult === 'Not played yet' && b.pts_mult === 'Not played yet') return 0;
                    if (a.pts_mult === 'Not played yet') return 1;
                    if (b.pts_mult === 'Not played yet') return -1;
                    return b.pts_mult - a.pts_mult || a.name.localeCompare(b.name);
                });
                setDataArray(arrayData);
                setLoading(false);
            })
            .catch(err => {
                setError(err);
                setLoading(false);
            });
    }, [entrantName]);

    const columns = useMemo(
        () => [
            {
                Header: 'Name', accessor: 'name',
                Cell: ({ value }) => {
                    const urlName = value.replace(/\s+/g, '-');
                    return (
                        <Link to={`/player/${urlName}`} className="table-link">
                            {value}
                        </Link>
                    );
                }
            },
            { Header: 'Points', accessor: 'pts' },
            { Header: 'Points w/ Multiplier', accessor: 'pts_mult' },
            { Header: 'Seed', accessor: 'seed' },
            { Header: 'Team', accessor: 'team' },
            {
                Header: "Alive?", accessor: 'alive'
            },
        ],
        []
    );

    if (loading) return <div className="loading-container">Loading data...</div>;
    if (error) return <div className="error-container">Error: {error.message}</div>;

    return (
        <div className="page-container">
            <Link to="/" className="back-link">← Back to Scoreboard</Link>
            <h1 className="page-title">Players: {entrantName}</h1>
            <Table columns={columns} data={dataArray} />
        </div>
    );
}

export default EntrantDetail;
