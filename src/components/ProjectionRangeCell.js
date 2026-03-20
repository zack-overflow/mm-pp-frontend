import React from 'react';

function formatNumber(value) {
    return Number(value || 0).toFixed(1);
}

function clampPercent(value) {
    return Math.max(0, Math.min(100, value));
}

function ProjectionRangeCell({ mean, p10, p90, unavailable = false }) {
    if (unavailable) {
        return (
            <div className="projection-range-cell projection-range-cell-empty">
                <div className="projection-range-value">Unavailable</div>
                <div className="projection-range-empty-note">Projection unavailable for this pick.</div>
            </div>
        );
    }

    const lower = Number(p10 || 0);
    const upper = Number(p90 || 0);
    const average = Number(mean || 0);
    const span = Math.max(upper - lower, 0.0001);
    const markerPct = clampPercent(((average - lower) / span) * 100);

    return (
        <div className="projection-range-cell">
            <div className="projection-range-header">
                <div className="projection-range-value">{formatNumber(average)}</div>
                <div className="projection-range-spread">P10-P90</div>
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

export default ProjectionRangeCell;
