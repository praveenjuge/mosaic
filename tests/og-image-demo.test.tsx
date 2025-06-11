import React from 'react';
import { render, screen } from '@testing-library/react';
import OGImageDemo from '../components/home/og-image-demo';
import { describe, it, expect } from 'vitest';

describe('OGImageDemo component', () => {
  it('renders input and button', () => {
    render(<OGImageDemo />);
    expect(screen.getByPlaceholderText('Enter your website URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get a Live Demo/i })).toBeInTheDocument();
  });
});
