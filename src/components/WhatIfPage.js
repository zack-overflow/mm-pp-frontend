import React, { useEffect, useState, useCallback, useMemo } from 'react';
import BASE_SERVER_URL from '../config';
import BracketView from './BracketView';
import { resolveParticipant } from './BracketGameSlot';

function flattenGames(node, result = []) {
    if (!node || node.type !== 'game') return result;
    flattenGames(node.left, result);
    flattenGames(node.right, result);
    result.push(node);
    return result;
}

function findParentGames(bracket) {
    const parentMap = {};
    function walk(node) {
        if (!node || node.type !== 'game') return;
        if (node.left && node.left.type === 'game') {
            parentMap[node.left.label] = node.label;
            walk(node.left);
        }
        if (node.right && node.right.type === 'game') {
            parentMap[node.right.label] = node.label;
            walk(node.right);
        }
    }
    walk(bracket);
    return parentMap;
}

function getDownstreamLabels(parentMap, gameLabel) {
    const downstream = [];
    let current = gameLabel;
    while (parentMap[current]) {
        downstream.push(parentMap[current]);
        current = parentMap[current];
    }
    return downstream;
}

function findGameByLabel(node, label) {
    if (!node || node.type !== 'game') return null;
    if (node.label === label) return node;
    return findGameByLabel(node.left, label) || findGameByLabel(node.right, label);
}

function teamInSubtree(node, teamName) {
    if (!node) return false;
    if (node.type === 'team') return node.name === teamName;
    return teamInSubtree(node.left, teamName) || teamInSubtree(node.right, teamName);
}

function WhatIfPage() {
    const [bracketData, setBracketData] = useState(null);
    const [baselineProjections, setBaselineProjections] = useState(null);
    const [selections, setSelections] = useState({});
    const [whatIfProjections, setWhatIfProjections] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fetchError, setFetchError] = useState(null);
    const [nSims, setNSims] = useState(500);
    const model = 'silver';

    useEffect(() => {
        Promise.all([
            fetch(`${BASE_SERVER_URL}/bracket`).then(r => r.json()),
            fetch(`${BASE_SERVER_URL}/projections`).then(r => r.json()),
        ])
            .then(([bracket, projections]) => {
                setBracketData(bracket);
                setBaselineProjections(projections);
            })
            .catch(err => setFetchError(err.message));
    }, []);

    const parentMap = useMemo(() => {
        if (!bracketData?.bracket) return {};
        return findParentGames(bracketData.bracket);
    }, [bracketData]);

    const handleSelect = useCallback((gameLabel, teamName) => {
        setSelections(prev => {
            const next = { ...prev };

            if (!teamName) {
                delete next[gameLabel];
            } else {
                next[gameLabel] = teamName;
            }

            // Cascading reset: clear downstream selections that depend on the old pick
            const downstream = getDownstreamLabels(parentMap, gameLabel);
            for (const dsLabel of downstream) {
                if (next[dsLabel]) {
                    // Check if the downstream selection's team is still reachable
                    const dsGame = findGameByLabel(bracketData.bracket, dsLabel);
                    if (dsGame) {
                        const dsTeam = next[dsLabel];
                        // Resolve both sides with the current selections
                        const leftP = resolveParticipant(dsGame.left, next);
                        const rightP = resolveParticipant(dsGame.right, next);
                        const reachable = (leftP && leftP.name === dsTeam) || (rightP && rightP.name === dsTeam);
                        if (!reachable) {
                            delete next[dsLabel];
                        }
                    }
                }
            }

            return next;
        });
        setWhatIfProjections(null);
    }, [parentMap, bracketData]);

    const selectionCount = Object.keys(selections).length;

    const handleRunProjection = async () => {
        if (selectionCount === 0) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${BASE_SERVER_URL}/whatif`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ forced_winners: selections, n_sims: nSims, model }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Simulation failed');
            }
            const data = await response.json();
            setWhatIfProjections(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSelections({});
        setWhatIfProjections(null);
        setError(null);
    };

    const comparisonRows = useMemo(() => {
        if (!baselineProjections?.entrant_projections) return [];
        const baselineMap = {};
        baselineProjections.entrant_projections.forEach(row => {
            baselineMap[row.entrant] = row;
        });

        if (!whatIfProjections?.entrant_projections) {
            return baselineProjections.entrant_projections
                .slice(0, 30)
                .map(row => ({
                    entrant: row.entrant,
                    baselineWin: row.win_probability,
                    baselineTop3: row.top3_probability,
                    baselineTotal: row.projected_total_mean,
                    whatIfWin: null,
                    whatIfTop3: null,
                    whatIfTotal: null,
                    deltaWin: null,
                }));
        }

        // Use the paired baseline from the same what-if response for accurate comparison
        const pairedBaseline = whatIfProjections.baseline || [];
        const pairedBaselineMap = {};
        pairedBaseline.forEach(row => {
            pairedBaselineMap[row.entrant] = row;
        });

        return whatIfProjections.entrant_projections.map(row => {
            const base = pairedBaselineMap[row.entrant] || baselineMap[row.entrant] || {};
            return {
                entrant: row.entrant,
                baselineWin: base.win_probability || 0,
                baselineTop3: base.top3_probability || 0,
                baselineTotal: base.projected_total_mean || 0,
                whatIfWin: row.win_probability,
                whatIfTop3: row.top3_probability,
                whatIfTotal: row.projected_total_mean,
                deltaWin: row.win_probability - (base.win_probability || 0),
            };
        }).sort((a, b) => (b.whatIfWin || 0) - (a.whatIfWin || 0));
    }, [baselineProjections, whatIfProjections]);

    if (fetchError) {
        return <div className="whatif-error">Failed to load data: {fetchError}</div>;
    }

    if (!bracketData || !baselineProjections) {
        return <div className="whatif-loading">Loading bracket data...</div>;
    }

    const selectionSummary = Object.entries(selections).map(([label, team]) => team);

    return (
        <div className="whatif-page">
            <div className="whatif-header">
                <h1>Hypothetical Bracket</h1>
                <p className="whatif-subtitle">
                    Select winners for upcoming games, then run the projection to see how it changes the standings.
                </p>
            </div>
            <div className="whatif-layout">
                <div className="whatif-bracket-panel">
                    <BracketView
                        bracket={bracketData.bracket}
                        selections={selections}
                        ratings={model === 'silver' ? bracketData.silver_ratings : bracketData.ratings}
                        ratingModel={model}
                        onSelect={handleSelect}
                    />
                    <div className="whatif-controls">
                        {selectionCount > 0 && (
                            <div className="whatif-selection-summary">
                                <strong>{selectionCount} selection{selectionCount !== 1 ? 's' : ''}:</strong>{' '}
                                {selectionSummary.join(', ')}
                            </div>
                        )}
                        <div className="whatif-sim-slider">
                            <label htmlFor="nsims-slider">Simulations: <strong>{nSims}</strong></label>
                            <input
                                id="nsims-slider"
                                type="range"
                                min={100}
                                max={2000}
                                step={100}
                                value={nSims}
                                onChange={e => setNSims(Number(e.target.value))}
                            />
                            <span className="whatif-sim-note">~1 min per 200 sims</span>
                        </div>
                        <div className="whatif-buttons">
                            <button
                                className="whatif-run-btn"
                                onClick={handleRunProjection}
                                disabled={selectionCount === 0 || loading}
                            >
                                {loading ? 'Running Simulation...' : 'Run Projection'}
                            </button>
                            <button
                                className="whatif-reset-btn"
                                onClick={handleReset}
                                disabled={selectionCount === 0 && !whatIfProjections}
                            >
                                Reset
                            </button>
                        </div>
                        {error && <div className="whatif-error-msg">{error}</div>}
                        {whatIfProjections && (
                            <div className="whatif-sim-info">
                                
                            </div>
                        )}
                    </div>
                </div>
                <div className="whatif-projections-panel">
                    <h2>{whatIfProjections ? 'Projection Comparison' : 'Current Projections'}</h2>
                    <div className="whatif-table-wrapper">
                        <table className="whatif-table">
                            <thead>
                                <tr>
                                    <th>Entrant</th>
                                    <th className="whatif-col-num">Win %</th>
                                    {whatIfProjections && <th className="whatif-col-num whatif-col-delta">+/-</th>}
                                    <th className="whatif-col-num">Top 3 %</th>
                                    {whatIfProjections && <th className="whatif-col-num whatif-col-delta">+/-</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonRows.map(row => {
                                    const deltaTop3 = row.whatIfTop3 != null ? row.whatIfTop3 - row.baselineTop3 : null;
                                    return (
                                    <tr key={row.entrant}>
                                        <td className="whatif-entrant-name">{row.entrant}</td>
                                        <td className="whatif-col-num">
                                            {fmtPct(whatIfProjections ? row.whatIfWin : row.baselineWin)}
                                        </td>
                                        {whatIfProjections && (
                                            <td className={`whatif-col-num whatif-delta ${row.deltaWin > 0.001 ? 'whatif-delta-pos' : row.deltaWin < -0.001 ? 'whatif-delta-neg' : ''}`}>
                                                {fmtDelta(row.deltaWin)}
                                            </td>
                                        )}
                                        <td className="whatif-col-num">
                                            {fmtPct(whatIfProjections ? row.whatIfTop3 : row.baselineTop3)}
                                        </td>
                                        {whatIfProjections && (
                                            <td className={`whatif-col-num whatif-delta ${deltaTop3 > 0.001 ? 'whatif-delta-pos' : deltaTop3 < -0.001 ? 'whatif-delta-neg' : ''}`}>
                                                {fmtDelta(deltaTop3)}
                                            </td>
                                        )}
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function fmtPct(value) {
    if (value == null) return '-';
    return `${(value * 100).toFixed(1)}%`;
}

function fmtDelta(value) {
    if (value == null) return '-';
    const pct = (value * 100).toFixed(1);
    return value > 0 ? `+${pct}` : pct;
}

export default WhatIfPage;
