import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Chip } from '../Chip.js';

describe('Chip', () => {
  it('renders the label', () => {
    render(<Chip label="Verified" tone="success" />);
    expect(screen.getByText('Verified')).toBeTruthy();
  });

  it('accepts all tone variants without throwing', () => {
    const tones = ['neutral', 'primary', 'success', 'warn', 'danger', 'info', 'accent'] as const;
    for (const tone of tones) {
      render(<Chip label={tone} tone={tone} />);
      expect(screen.getByText(tone)).toBeTruthy();
    }
  });
});
