import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { VerificationBadge } from '../VerificationBadge.js';

describe('VerificationBadge', () => {
  it('shows the full label for each tier', () => {
    const { rerender } = render(<VerificationBadge tier="BASIC" />);
    expect(screen.getByText('Basic')).toBeTruthy();
    rerender(<VerificationBadge tier="VERIFIED" />);
    expect(screen.getByText('Verified')).toBeTruthy();
    rerender(<VerificationBadge tier="PREMIUM" />);
    expect(screen.getByText('Premium Trust')).toBeTruthy();
  });

  it('omits the label in compact mode', () => {
    render(<VerificationBadge tier="VERIFIED" compact />);
    expect(screen.queryByText('Verified')).toBeNull();
  });
});
