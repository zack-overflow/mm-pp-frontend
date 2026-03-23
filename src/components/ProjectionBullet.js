import React from 'react';

function toNumber(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
}

function clampPercent(value) {
    return Math.max(0, Math.min(100, value));
}

export function formatProjectionNumber(value) {
    return toNumber(value).toFixed(1);
}

function getNiceScaleStep(value) {
    if (value <= 100) return 5;
    if (value <= 250) return 10;
    if (value <= 500) return 25;
    if (value <= 1000) return 50;
    if (value <= 2000) return 100;
    if (value <= 5000) return 250;
    if (value <= 10000) return 500;
    return 1000;
}

export function getProjectionScaleMax(
    rows,
    {
        currentAccessor = (row) => row.current_score ?? row.current_points,
        meanAccessor = (row) => row.projected_total_mean,
        upperAccessor = (row) => row.projected_total_p90,
        headroomRatio = 0.02,
    } = {}
) {
    const maxValue = (rows || []).reduce((runningMax, row) => (
        Math.max(
            runningMax,
            toNumber(currentAccessor(row)),
            toNumber(meanAccessor(row)),
            toNumber(upperAccessor(row))
        )
    ), 0);

    if (maxValue <= 0) {
        return 1;
    }

    const paddedMax = maxValue * (1 + headroomRatio);
    const step = getNiceScaleStep(paddedMax);
    return Math.ceil(paddedMax / step) * step;
}

function buildProjectionMetrics({ currentScore, mean, p10, p90, scaleMax }) {
    const current = Math.max(toNumber(currentScore), 0);
    const lower = Math.max(toNumber(p10), current);
    const upper = Math.max(toNumber(p90), lower);
    const average = Math.max(toNumber(mean), current);
    const maxValue = Math.max(toNumber(scaleMax), upper, average, current, 1);

    return {
        current,
        lower,
        upper,
        average,
        currentPct: clampPercent((current / maxValue) * 100),
        lowerPct: clampPercent((lower / maxValue) * 100),
        upperPct: clampPercent((upper / maxValue) * 100),
        averagePct: clampPercent((average / maxValue) * 100),
    };
}

function getRangeLabelStyle(lowerPercent, upperPercent) {
    const midpoint = clampPercent((lowerPercent + upperPercent) / 2);

    if (lowerPercent <= 10) {
        return { left: `${lowerPercent}%`, transform: 'translateX(0)' };
    }

    if (upperPercent >= 90) {
        return { left: `${upperPercent}%`, transform: 'translateX(-100%)' };
    }

    return { left: `${midpoint}%`, transform: 'translateX(-50%)' };
}

export function ProjectionBulletLegend({ currentValue = null, showCurrentValue = true, className = '' }) {
    return (
        <div className={`projection-bullet-legend ${className}`.trim()}>
            <span className="projection-bullet-key projection-bullet-key-current">
                {showCurrentValue && currentValue !== null ? (
                    <>
                        <strong>{formatProjectionNumber(currentValue)}</strong> scored so far
                    </>
                ) : (
                    'scored so far'
                )}
            </span>
            <span className="projection-bullet-key projection-bullet-key-range">P10-P90</span>
            <span className="projection-bullet-key projection-bullet-key-ev">EV</span>
        </div>
    );
}

export function ProjectionBulletBar({
    currentScore,
    mean,
    p10,
    p90,
    scaleMax,
    unavailable = false,
    showRangeLabel = true,
    className = '',
}) {
    if (unavailable) {
        return (
            <div className={`projection-bullet-empty ${className}`.trim()}>
                <div className="projection-range-empty-note">Unavailable</div>
            </div>
        );
    }

    const {
        currentPct,
        lowerPct,
        upperPct,
        averagePct,
        lower,
        upper,
    } = buildProjectionMetrics({ currentScore, mean, p10, p90, scaleMax });

    return (
        <div className={`projection-bullet-group ${className}`.trim()}>
            <div className="projection-bullet-bar">
                <div className="projection-bullet-track" />
                <div className="projection-bullet-actual" style={{ width: `${currentPct}%` }} />
                <div
                    className="projection-bullet-range"
                    style={{ left: `${lowerPct}%`, right: `${Math.max(0, 100 - upperPct)}%` }}
                />
                <div className="projection-bullet-cap" style={{ left: `${lowerPct}%` }} />
                <div className="projection-bullet-cap" style={{ left: `${upperPct}%` }} />
                <div className="projection-bullet-ev" style={{ left: `${averagePct}%` }} />
            </div>
            {showRangeLabel && (
                <div className="projection-bullet-scale">
                    <span
                        className="projection-bullet-scale-label"
                        style={getRangeLabelStyle(lowerPct, upperPct)}
                    >
                        {formatProjectionNumber(lower)}-{formatProjectionNumber(upper)}
                    </span>
                </div>
            )}
        </div>
    );
}

function ProjectionBulletCell({
    currentScore,
    mean,
    p10,
    p90,
    scaleMax,
    unavailable = false,
    compact = false,
    showLegend = true,
    className = '',
}) {
    if (unavailable) {
        return (
            <div className={`projection-bullet-cell projection-bullet-cell-empty ${compact ? 'projection-bullet-cell-compact' : ''} ${className}`.trim()}>
                <div className="projection-bullet-value">Unavailable</div>
                <div className="projection-range-empty-note">Projection unavailable for this row.</div>
            </div>
        );
    }

    const current = Math.max(toNumber(currentScore), 0);

    return (
        <div className={`projection-bullet-cell ${compact ? 'projection-bullet-cell-compact' : ''} ${className}`.trim()}>
            <div className="projection-bullet-header">
                <div className="projection-bullet-value">{formatProjectionNumber(mean)}</div>
                <div className="projection-bullet-spread">EV + P10-P90</div>
            </div>
            {showLegend && <ProjectionBulletLegend currentValue={current} />}
            <ProjectionBulletBar
                currentScore={currentScore}
                mean={mean}
                p10={p10}
                p90={p90}
                scaleMax={scaleMax}
            />
        </div>
    );
}

export default ProjectionBulletCell;
