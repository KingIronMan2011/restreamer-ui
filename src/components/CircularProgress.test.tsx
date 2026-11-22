import { render, screen } from '@testing-library/react';

import CircularProgress from './CircularProgress';

describe('CircularProgress', () => {
  it('renders an indeterminate spinner for negative values', () => {
    render(<CircularProgress />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute(
      'aria-valuenow',
    );
  });

  it('renders a rounded percentage for determinate values', () => {
    render(<CircularProgress value={42.7} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '42.7',
    );
    expect(screen.getByText('43%')).toBeInTheDocument();
  });
});
