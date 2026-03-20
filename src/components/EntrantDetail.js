import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

import Table from './Table';
import BASE_SERVER_URL from '../config';

function EntrantDetail() {
    const { entrantName } = useParams();
    const [dataArray, setDataArray] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${BASE_SERVER_URL}/entrant/${encodeURIComponent(entrantName)}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((jsonData) => {
                const arrayData = Object.entries(jsonData).map(([name, info]) => ({
                    name,
                    shortName: `${name.split(' ')[0][0]}. ${name.split(' ').slice(1).join(' ')}`,
                    pts: info.pts === 'Not played yet' ? 'Not played yet' : info.pts.reduce((total, current) => total + current, 0),
                    pts_mult: info.pts_mult,
                    seed: info.seed,
                    team: info.team,
                    alive: info.alive ? 'Yes' : 'No',
                    in_progress: Boolean(info.in_progress),
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
            .catch((err) => {
                setError(err);
                setLoading(false);
            });
    }, [entrantName]);

    const columns = useMemo(
        () => [
            {
                Header: '',
                accessor: 'name',
                Cell: ({ value, row }) => {
                    const urlName = encodeURIComponent(value.replace(/\s+/g, '-'));
                    const isInProgress = Boolean(row?.original?.in_progress);
                    return (
                        <Link to={`/player/${urlName}`} className="table-link">
                            {isInProgress && <span className="live-dot" aria-hidden="true" />}
                            {value}
                        </Link>
                    );
                },
            },
            { Header: 'Points', accessor: 'pts' },
            { Header: 'Pts x Mult', accessor: 'pts_mult' },
            { Header: 'Seed', accessor: 'seed' },
            { Header: 'Team', accessor: 'team' },
            { Header: 'Alive?', accessor: 'alive' },
        ],
        []
    );

    if (loading) return <div className="loading-container">Loading data...</div>;
    if (error) return <div className="error-container">Error: {error.message}</div>;

    return (
        <div className="page-container">
            <Link to="/" className="back-link">← Back to Scoreboard</Link>
            <h1 className="page-title">Players: {decodeURIComponent(entrantName || '')}</h1>
            <Table columns={columns} data={dataArray} tableClassName="entrant-detail-table" />
        </div>
    );
}

export default EntrantDetail;
