import { render, screen } from '@testing-library/react';

import Filesize from './Filesize';

describe('Filesize', () => {
  it('renders bytes below the selected threshold', () => {
    render(<Filesize bytes={999} />);
    expect(screen.getByText('999 B')).toBeInTheDocument();
  });

  it('formats binary units by default', () => {
    render(<Filesize bytes={1024} />);
    expect(screen.getByText('1.0 KiB')).toBeInTheDocument();
  });

  it('formats decimal units when SI units are requested', () => {
    render(<Filesize bytes={1000} si />);
    expect(screen.getByText('1.0 kB')).toBeInTheDocument();
  });

  it('supports custom precision and large units', () => {
    render(<Filesize bytes={1024 ** 4} digits={2} />);
    expect(screen.getByText('1.00 TiB')).toBeInTheDocument();
  });
});
