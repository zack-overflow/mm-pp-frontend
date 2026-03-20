import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';

import ProjectionsPage from './ProjectionsPage';

const mockResponse = {
  generated_at: '2026-03-19T12:00:00Z',
  model: 'KenPom',
  n_sims: 5000,
  cadence_minutes: 90,
  coverage: {
    matched_picks: 14,
    total_picks: 15,
    unmatched_picks: 1,
    unresolved_players: ['Boopie Miller'],
  },
  warnings: ['Some picked players could not be resolved for projections.'],
  entrant_projections: [
    {
      entrant: 'Zack Gottesman',
      current_score: 120,
      projected_remaining_mean: 180,
      projected_remaining_p10: 120,
      projected_remaining_p90: 240,
      projected_total_mean: 300,
      projected_total_p10: 250,
      projected_total_p90: 360,
      win_probability: 0.42,
      top3_probability: 0.88,
      alive_count: 10,
      matched_picks: 15,
      total_picks: 15,
      unresolved_players: [],
    },
  ],
};

describe('ProjectionsPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders projection snapshot data', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    await act(async () => {
      ReactDOM.render(
        <MemoryRouter>
          <ProjectionsPage />
        </MemoryRouter>,
        div
      );
    });

    expect(div.textContent).toContain('Projections');
    expect(div.textContent).toContain('Projected Total');
    expect(div.textContent).toContain('Top 3 %');
    expect(div.textContent).toContain('Zack Gottesman');
    expect(div.textContent).not.toContain('Some picked players could not be resolved for projections.');
    expect(div.textContent).not.toContain('Boopie Miller');

    ReactDOM.unmountComponentAtNode(div);
    div.remove();
  });
});
