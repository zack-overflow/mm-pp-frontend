import React, { useState } from 'react';
import BracketGameSlot from './BracketGameSlot';

const ROUND_NAMES = {
    1: 'R64', 2: 'R32', 3: 'Sweet 16', 4: 'Elite 8', 5: 'Final Four', 6: 'Championship',
};

function collectBracketLayout(bracket) {
    if (!bracket || bracket.type !== 'game') return null;
    // Keep the displayed regions aligned to the semifinal slots:
    // top-left vs top-right, bottom-left vs bottom-right.
    const semifinal1 = bracket.left;
    const semifinal2 = bracket.right;
    if (!semifinal1 || semifinal1.type !== 'game' || !semifinal2 || semifinal2.type !== 'game') {
        return null;
    }

    const topLeft = semifinal1.left;
    const topRight = semifinal1.right;
    const bottomLeft = semifinal2.left;
    const bottomRight = semifinal2.right;

    return {
        leftRegions: [topLeft, bottomLeft],
        rightRegions: [topRight, bottomRight],
        mobileRegions: [topLeft, topRight, bottomLeft, bottomRight],
        semifinals: [semifinal1, semifinal2],
        championship: bracket,
    };
}

function collectGamesInRound(regionRoot, targetRound) {
    const games = [];
    function walk(node) {
        if (!node || node.type !== 'game') return;
        if (node.round_number === targetRound) {
            games.push(node);
            return;
        }
        walk(node.left);
        walk(node.right);
    }
    walk(regionRoot);
    return games;
}

function RegionBracket({ region, regionIndex, selections, ratings, ratingModel, onSelect, side }) {
    if (!region || region.type !== 'game') return null;

    // Collect games for rounds 1-4 within this region
    const roundGames = {};
    for (let r = 1; r <= 4; r++) {
        roundGames[r] = collectGamesInRound(region, r);
    }

    const rounds = side === 'left' ? [1, 2, 3, 4] : [4, 3, 2, 1];

    return (
        <div className={`bracket-region bracket-region-${side}`}>
            <div className="bracket-region-rounds">
                {rounds.map((r) => (
                    <div key={r} className={`bracket-round bracket-round-${r}`}>
                        <div className="bracket-round-label">{ROUND_NAMES[r]}</div>
                        <div className="bracket-round-games">
                            {roundGames[r].map((game) => (
                                <BracketGameSlot
                                    key={game.label}
                                    game={game}
                                    selections={selections}
                                    ratings={ratings}
                                    ratingModel={ratingModel}
                                    onSelect={onSelect}
                                    compact={r === 1}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function BracketView({ bracket, selections, ratings, ratingModel, onSelect }) {
    const [activeRegion, setActiveRegion] = useState(0);

    if (!bracket) return null;

    const layout = collectBracketLayout(bracket);
    if (!layout) {
        return <div className="bracket-error">Unable to parse bracket structure</div>;
    }

    const {
        leftRegions,
        rightRegions,
        mobileRegions,
        semifinals,
        championship,
    } = layout;

    if (leftRegions.length < 2 || rightRegions.length < 2 || mobileRegions.length < 4) {
        return <div className="bracket-error">Unable to parse bracket structure</div>;
    }

    // Desktop layout
    const desktopView = (
        <div className="bracket-desktop">
            <div className="bracket-left-side">
                <RegionBracket region={leftRegions[0]} regionIndex={0} selections={selections} ratings={ratings} ratingModel={ratingModel} onSelect={onSelect} side="left" />
                <RegionBracket region={leftRegions[1]} regionIndex={1} selections={selections} ratings={ratings} ratingModel={ratingModel} onSelect={onSelect} side="left" />
            </div>
            <div className="bracket-center">
                <div className="bracket-final-four">
                    <div className="bracket-ff-label">Final Four</div>
                    {semifinals.map((sf) => (
                        <BracketGameSlot
                            key={sf.label}
                            game={sf}
                            selections={selections}
                            ratings={ratings}
                            ratingModel={ratingModel}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
                <div className="bracket-championship">
                    <div className="bracket-champ-label">Championship</div>
                    <BracketGameSlot
                        game={championship}
                        selections={selections}
                        ratings={ratings}
                        ratingModel={ratingModel}
                        onSelect={onSelect}
                    />
                </div>
            </div>
            <div className="bracket-right-side">
                <RegionBracket region={rightRegions[0]} regionIndex={2} selections={selections} ratings={ratings} ratingModel={ratingModel} onSelect={onSelect} side="right" />
                <RegionBracket region={rightRegions[1]} regionIndex={3} selections={selections} ratings={ratings} ratingModel={ratingModel} onSelect={onSelect} side="right" />
            </div>
        </div>
    );

    // Mobile layout - same bracket structure but horizontally scrollable
    const mobileView = (
        <div className="bracket-mobile">
            <div className="bracket-region-tabs">
                {mobileRegions.map((_, i) => (
                    <button
                        key={i}
                        className={`bracket-tab ${activeRegion === i ? 'bracket-tab-active' : ''}`}
                        onClick={() => setActiveRegion(i)}
                    >
                        Region {i + 1}
                    </button>
                ))}
                <button
                    className={`bracket-tab ${activeRegion === 4 ? 'bracket-tab-active' : ''}`}
                    onClick={() => setActiveRegion(4)}
                >
                    Final 4
                </button>
            </div>
            <div className="bracket-mobile-scroll">
                {activeRegion < 4 ? (
                    <RegionBracket
                        region={mobileRegions[activeRegion]}
                        regionIndex={activeRegion}
                        selections={selections}
                        ratings={ratings}
                        ratingModel={ratingModel}
                        onSelect={onSelect}
                        side="left"
                    />
                ) : (
                    <div className="bracket-center-mobile">
                        <div className="bracket-final-four">
                            <div className="bracket-ff-label">Final Four</div>
                            {semifinals.map(sf => (
                                <BracketGameSlot
                                    key={sf.label}
                                    game={sf}
                                    selections={selections}
                                    ratings={ratings}
                                    ratingModel={ratingModel}
                                    onSelect={onSelect}
                                />
                            ))}
                        </div>
                        <div className="bracket-championship">
                            <div className="bracket-champ-label">Championship</div>
                            <BracketGameSlot
                                game={championship}
                                selections={selections}
                                ratings={ratings}
                                ratingModel={ratingModel}
                                onSelect={onSelect}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="bracket-view">
            {desktopView}
            {mobileView}
        </div>
    );
}

export default BracketView;
