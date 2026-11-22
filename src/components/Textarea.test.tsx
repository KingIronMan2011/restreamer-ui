import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen, waitFor } from '../utils/testing';
import Textarea from './Textarea';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Textarea', () => {
  it('copies, downloads, opens the expanded editor, and closes it', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(
      navigator,
      'clipboard',
    );
    const value = 'line one\nline two';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    const view = render(
      <Textarea
        title="Source text"
        value={value}
        rows={1}
        allowCopy
        allowModal
        allowDownload
        downloadName="source.txt"
        scrollTo="bottom"
      />,
    );
    const buttons = view.container.querySelectorAll('button');
    await fireEvent.click(buttons[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(value);

    fireEvent.click(buttons[1]);
    expect(anchorClick).toHaveBeenCalledOnce();
    fireEvent.click(buttons[2]);
    expect(screen.getByText('Source text')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Source text')).not.toBeInTheDocument();

    if (originalClipboard)
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    else Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('uses the document copy fallback and hides actions for empty or disabled values', () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(
      navigator,
      'clipboard',
    );
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    const originalExecCommand = Object.getOwnPropertyDescriptor(
      document,
      'execCommand',
    );
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });
    const view = render(<Textarea value="copy me" allowCopy />);
    fireEvent.click(view.container.querySelector('button')!);
    expect(execCommand).toHaveBeenCalledWith('copy');

    const empty = render(
      <Textarea
        value=""
        allowCopy
        allowModal
        allowDownload
        downloadName="empty.txt"
      />,
    );
    expect(empty.container.querySelectorAll('button')).toHaveLength(0);
    const disabled = render(
      <Textarea
        value="hidden"
        disabled
        allowCopy
        allowModal
        allowDownload
        downloadName="disabled.txt"
      />,
    );
    expect(disabled.container.querySelectorAll('button')).toHaveLength(0);

    if (originalExecCommand)
      Object.defineProperty(document, 'execCommand', originalExecCommand);
    else Reflect.deleteProperty(document, 'execCommand');
    if (originalClipboard)
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    else Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('uses default change handling and reports clipboard rejection', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(
      navigator,
      'clipboard',
    );
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Textarea value="copy me" readOnly={false} allowCopy />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'edited' },
    });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(warn).toHaveBeenCalledWith(expect.any(Error)));

    if (originalClipboard)
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    else Reflect.deleteProperty(navigator, 'clipboard');
  });
});
