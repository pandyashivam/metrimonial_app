import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { AIScoreBadge } from '../AIScoreBadge.js';

describe('AIScoreBadge', () => {
  it.each([
    [95, 'Excellent Match'],
    [80, 'Great Match'],
    [60, 'Good Match'],
    [40, 'Potential Match'],
  ])('score %i → label "%s"', (score, expected) => {
    render(<AIScoreBadge score={score} />);
    expect(screen.getByText(expected)).toBeTruthy();
  });

  it('clamps out-of-range scores', () => {
    render(<AIScoreBadge score={-20} />);
    expect(screen.getByText('0')).toBeTruthy();
    render(<AIScoreBadge score={420} />);
    expect(screen.getByText('100')).toBeTruthy();
  });
});
