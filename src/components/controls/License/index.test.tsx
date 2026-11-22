import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import License from './index';

describe('License control', () => {
  it('shows the default license selector without license details', () => {
    render(<License />);
    expect(screen.getByRole('combobox')).toHaveTextContent('none');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it.each([
    ['CC0 1.0', 'https://creativecommons.org/licenses/zero/1.0/'],
    ['CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/'],
    ['CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0/'],
    ['CC BY-NC 4.0', 'https://creativecommons.org/licenses/by-nc/4.0/'],
    ['CC BY-NC-SA 4.0', 'https://creativecommons.org/licenses/by-nc-sa/4.0/'],
    ['CC BY-ND 4.0', 'https://creativecommons.org/licenses/by-nd/4.0/'],
    ['CC BY-NC-ND 4.0', 'https://creativecommons.org/licenses/by-nc-nd/4.0/'],
  ])('renders details and an image for %s', (license, url) => {
    render(<License license={license} />);
    expect(screen.getByRole('img', { name: license })).toBeInTheDocument();
    expect(
      screen.getAllByRole('link').map((link) => link.getAttribute('href')),
    ).toContain(url);
  });

  it('passes changed selection to the caller', () => {
    const onChange = vi.fn();
    render(<License onChange={onChange} />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'CC BY 4.0' }));
    expect(onChange).toHaveBeenCalledWith('CC BY 4.0');
  });
});
