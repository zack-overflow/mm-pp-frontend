import React, { useState } from 'react';
import BracketGameSlot from './BracketGameSlot';

const ROUND_NAMES = {
    1: 'R64', 2: 'R32', 3: 'Sweet 16', 4: 'Elite 8', 5: 'Final Four', 6: 'Championship',
};

function flattenBracket(node, result = []) {
    if (!node || node.type !== 'game') return result;
    flattenBracket(node.left, result);
    flattenBracket(node.right, result);
    result.push(node);
    return result;
}

function collectRegions(bracket) {
    if (!bracket || bracket.type !== 'game') return [];
    // Championship (round 6) -> two Final Four games (round 5) -> four Elite 8 region roots (round 4)
    const semifinal1 = bracket.left;
    const semifinal2 = bracket.right;

    // Each semifinal has two regions
    const regions = [];
    if (semifinal1 && semifinal1.type === 'game') {
        regions.push(semifinal1.left);  // Region 1
        regions.push(semifinal1.right); // Region 2
    }
    if (semifinal2 && semifinal2.type === 'game') {
        regions.push(semifinal2.left);  // Region 3
        regions.push(semifinal2.right); // Region 4
    }

    return { regions, semifinals: [semifinal1, semifinal2], championship: bracket };
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

    const { regions, semifinals, championship } = collectRegions(bracket);

    if (!regions || regions.length < 4) {
        return <div className="bracket-error">Unable to parse bracket structure</div>;
    }

    // Desktop layout
    const desktopView = (
        <div className="bracket-desktop">
            <div className="bracket-left-side">
                <RegionBracket region={regions[0]} regionIndex={0} selections={selections} ratings={ratings} ratingModel={ratingModel} onSelect={onSelect} side="left" />
                <RegionBracket region={regions[1]} regionIndex={1} selections={selections} ratings={ratings} ratingModel={ratingModel} onSelect={onSelect} side="left" />
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
                        onSelect={onSelect}
                    />
                </div>
            </div>
            <div className="bracket-right-side">
                <RegionBracket region={regions[2]} regionIndex={2} selections={selections} ratings={ratings} ratingModel={ratingModel} onSelect={onSelect} side="right" />
                <RegionBracket region={regions[3]} regionIndex={3} selections={selections} ratings={ratings} ratingModel={ratingModel} onSelect={onSelect} side="right" />
            </div>
        </div>
    );

    // Mobile layout - same bracket structure but horizontally scrollable
    const mobileView = (
        <div className="bracket-mobile">
            <div className="bracket-region-tabs">
                {regions.map((_, i) => (
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
                        region={regions[activeRegion]}
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
