import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

import BracketGameSlot from './BracketGameSlot';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('BracketGameSlot', () => {
  it('allows selecting a known team against TBD without showing probabilities', () => {
    const onSelect = jest.fn();
    const div = document.createElement('div');
    const root = createRoot(div);
    document.body.appendChild(div);

    const game = {
      type: 'game',
      label: 'region-4-r32-1',
      round_number: 2,
      locked_winner: null,
      left: {
        type: 'game',
        label: 'region-4-r64-Clemson-Iowa',
        round_number: 1,
        locked_winner: null,
        left: { type: 'team', name: 'Clemson', seed: 8 },
        right: { type: 'team', name: 'Iowa', seed: 9 },
      },
      right: {
        type: 'game',
        label: 'region-4-r64-Florida-Prairie View A&M',
        round_number: 1,
        locked_winner: null,
        left: { type: 'team', name: 'Florida', seed: 1 },
        right: { type: 'team', name: 'Prairie View A&M', seed: 16 },
      },
    };

    act(() => {
      root.render(
        <BracketGameSlot
          game={game}
          selections={{ 'region-4-r64-Clemson-Iowa': 'Iowa' }}
          ratings={{ Iowa: 1500, Florida: 1700 }}
          ratingModel="silver"
          onSelect={onSelect}
        />
      );
    });

    const buttons = div.querySelectorAll('[role="button"]');
    expect(buttons).toHaveLength(1);
    expect(div.querySelector('.bracket-team-tbd')).not.toBeNull();
    expect(div.querySelector('.bracket-team-prob')).toBeNull();

    act(() => {
      buttons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSelect).toHaveBeenCalledWith('region-4-r32-1', 'Iowa');

    act(() => {
      root.unmount();
    });
    div.remove();
  });
});
