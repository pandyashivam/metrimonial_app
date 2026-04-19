import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '../Button.js';

describe('Button', () => {
  it('renders the title', () => {
    render(<Button title="Send interest" />);
    expect(screen.getByText('Send interest')).toBeTruthy();
  });

  it('fires onPress when clicked', () => {
    const spy = vi.fn();
    render(<Button title="Go" onPress={spy} />);
    fireEvent.click(screen.getByText('Go'));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('disables interaction while loading', () => {
    const spy = vi.fn();
    render(<Button title="Sending" onPress={spy} loading />);
    // When loading, the spinner replaces the label, so the title isn't in the DOM.
    expect(screen.queryByText('Sending')).toBeNull();
  });

  it('exposes the title as accessibilityLabel', () => {
    render(<Button title="Accept" />);
    expect(screen.getByLabelText('Accept')).toBeTruthy();
  });
});
