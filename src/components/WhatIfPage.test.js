import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

import WhatIfPage from './WhatIfPage';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('./BracketView', () => function MockBracketView({ onSelect }) {
  return (
    <div>
      <button onClick={() => onSelect('region-4-r64-Clemson-Iowa', 'Iowa')}>Advance Iowa R64</button>
      <button onClick={() => onSelect('region-4-r32-1', 'Iowa')}>Advance Iowa R32</button>
    </div>
  );
});

const bracketResponse = {
  bracket: {
    type: 'game',
    label: 'championship',
    round_number: 6,
    locked_winner: null,
    left: {
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
    },
    right: {
      type: 'game',
      label: 'f4-2',
      round_number: 5,
      locked_winner: null,
      left: { type: 'team', name: 'Duke', seed: 1 },
      right: { type: 'team', name: 'Houston', seed: 1 },
    },
  },
  ratings: {},
  silver_ratings: {},
};

const projectionsResponse = {
  entrant_projections: [
    {
      entrant: 'Test Entry',
      win_probability: 0.2,
      top3_probability: 0.4,
      projected_total_mean: 100,
    },
  ],
};

const whatIfResponse = {
  entrant_projections: [
    {
      entrant: 'Test Entry',
      win_probability: 0.25,
      top3_probability: 0.45,
      projected_total_mean: 102,
    },
  ],
  baseline: projectionsResponse.entrant_projections,
};

describe('WhatIfPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(bracketResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(projectionsResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(whatIfResponse),
      });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('posts stepwise forced winners and shows round-qualified selections', async () => {
    const div = document.createElement('div');
    const root = createRoot(div);
    document.body.appendChild(div);

    await act(async () => {
      root.render(<WhatIfPage />);
    });

    const buttons = Array.from(div.querySelectorAll('button'));
    const advanceR64 = buttons.find(button => button.textContent === 'Advance Iowa R64');
    const advanceR32 = buttons.find(button => button.textContent === 'Advance Iowa R32');

    act(() => {
      advanceR64.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      advanceR32.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(div.textContent).toContain('Iowa (Round of 64)');
    expect(div.textContent).toContain('Iowa (Round of 32)');

    const runButton = buttons.find(button => button.textContent === 'Run Projection');
    await act(async () => {
      runButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const postCall = global.fetch.mock.calls[2];
    expect(postCall[0]).toBe('/whatif');
    expect(JSON.parse(postCall[1].body)).toEqual({
      forced_winners: {
        'region-4-r64-Clemson-Iowa': 'Iowa',
        'region-4-r32-1': 'Iowa',
      },
      n_sims: 200,
      model: 'silver',
    });

    await act(async () => {
      root.unmount();
    });
    div.remove();
  });
});
