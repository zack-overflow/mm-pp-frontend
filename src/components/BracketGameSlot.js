import React from 'react';

function winProbabilityKenpom(rating1, rating2) {
    const diff = (rating1 - rating2) / 11.0;
    // Approximate erf using Horner form (Abramowitz & Stegun 7.1.28)
    const x = diff;
    const t = 1.0 / (1.0 + 0.3275911 * Math.abs(x));
    const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
    const erf = 1.0 - poly * Math.exp(-x * x);
    const sign = x >= 0 ? 1 : -1;
    return 0.5 * (1.0 + sign * erf);
}

function winProbabilitySilver(rating1, rating2) {
    return 1.0 / (1.0 + Math.pow(10, -(rating1 - rating2) / 400.0));
}

function winProbability(rating1, rating2, model) {
    if (model === 'silver') return winProbabilitySilver(rating1, rating2);
    return winProbabilityKenpom(rating1, rating2);
}

function resolveParticipant(node, selections) {
    if (!node) return null;
    if (node.type === 'team') return { name: node.name, seed: node.seed };
    if (node.locked_winner) {
        const seed = findSeedInTree(node, node.locked_winner);
        return { name: node.locked_winner, seed };
    }
    if (selections[node.label]) {
        const seed = findSeedInTree(node, selections[node.label]);
        return { name: selections[node.label], seed };
    }
    return null;
}

function findSeedInTree(node, teamName) {
    if (!node) return null;
    if (node.type === 'team') return node.name === teamName ? node.seed : null;
    const left = findSeedInTree(node.left, teamName);
    if (left !== null) return left;
    return findSeedInTree(node.right, teamName);
}

function BracketGameSlot({ game, selections, ratings, ratingModel, onSelect, compact }) {
    if (!game || game.type !== 'game') return null;

    const leftParticipant = resolveParticipant(game.left, selections);
    const rightParticipant = resolveParticipant(game.right, selections);

    const isLocked = !!game.locked_winner;
    const hasSelection = !isLocked && !!selections[game.label];
    const selectedTeam = isLocked ? game.locked_winner : selections[game.label] || null;

    const bothKnown = leftParticipant && rightParticipant;

    let leftProb = null;
    let rightProb = null;
    if (!isLocked && bothKnown && ratings && ratings[leftParticipant.name] != null && ratings[rightParticipant.name] != null) {
        leftProb = winProbability(ratings[leftParticipant.name], ratings[rightParticipant.name], ratingModel);
        rightProb = 1 - leftProb;
    }

    const handleClick = (teamName, selectable) => {
        if (!selectable || !onSelect) return;
        if (selectedTeam === teamName) {
            onSelect(game.label, null);
        } else {
            onSelect(game.label, teamName);
        }
    };

    const renderTeamRow = (participant, isTop) => {
        if (!participant) {
            return (
                <div className={`bracket-team bracket-team-tbd ${isTop ? 'bracket-team-top' : 'bracket-team-bottom'}`}>
                    <span className="bracket-seed">-</span>
                    <span className="bracket-team-name">TBD</span>
                </div>
            );
        }

        const isWinner = selectedTeam === participant.name;
        const isLoser = selectedTeam && selectedTeam !== participant.name;
        const prob = isTop ? leftProb : rightProb;
        const isSelectable = !isLocked;

        let classes = 'bracket-team';
        if (isTop) classes += ' bracket-team-top';
        else classes += ' bracket-team-bottom';
        if (isLocked && isWinner) classes += ' bracket-team-locked-winner';
        if (isLocked && isLoser) classes += ' bracket-team-locked-loser';
        if (!isLocked && isWinner) classes += ' bracket-team-selected';
        if (isSelectable) classes += ' bracket-team-selectable';

        const isFavorite = prob !== null && prob >= 0.5;

        return (
            <div
                className={classes}
                onClick={() => handleClick(participant.name, isSelectable)}
                role={isSelectable ? 'button' : undefined}
                tabIndex={isSelectable ? 0 : undefined}
                onKeyDown={isSelectable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(participant.name, isSelectable); } : undefined}
            >
                <span className="bracket-seed">{participant.seed}</span>
                <span className="bracket-team-name">{participant.name}</span>
                {prob !== null && !compact && (
                    <span className={`bracket-team-prob ${isFavorite ? 'bracket-team-prob-fav' : 'bracket-team-prob-dog'}`}>
                        {Math.round(prob * 100)}%
                    </span>
                )}
            </div>
        );
    };

    let slotClass = 'bracket-game-slot';
    if (isLocked) slotClass += ' bracket-game-locked';
    if (hasSelection) slotClass += ' bracket-game-selected';
    if (!bothKnown && !isLocked) slotClass += ' bracket-game-tbd';

    return (
        <div className={slotClass}>
            {renderTeamRow(leftParticipant, true)}
            {renderTeamRow(rightParticipant, false)}
        </div>
    );
}

export { resolveParticipant, findSeedInTree };
export default BracketGameSlot;
