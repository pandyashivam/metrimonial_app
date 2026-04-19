import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { GunaRing } from '../GunaRing.js';

describe('GunaRing', () => {
  it.each([
    [30, 'Excellent'],
    [24, 'Good'],
    [18, 'Average'],
    [10, 'Not recommended'],
  ])('%i/36 → "%s"', (points, label) => {
    render(<GunaRing totalPoints={points} />);
    expect(screen.getByText(label)).toBeTruthy();
  });

  it('clamps totals above 36', () => {
    render(<GunaRing totalPoints={99} />);
    expect(screen.getByText('36')).toBeTruthy();
  });
});
