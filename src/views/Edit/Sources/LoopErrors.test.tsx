import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from '../../../utils/testing';
import * as AudioLoop from './AudioLoop';
import * as VideoLoop from './VideoLoop';

vi.mock('../../../components/UploadButton', () => ({
  default: ({ onError }: { onError: (error: any) => void }) => (
    <div>
      {['nofiles', 'mimetype', 'size', 'read', 'unknown'].map((type) => (
        <button
          key={type}
          onClick={() =>
            onError({
              type,
              actual: type === 'size' ? 2048 : 'application/octet-stream',
              allowed: type === 'size' ? 1024 : ['audio/*', 'image/*'],
              message: 'disk read failed',
            })
          }
        >
          {type}
        </button>
      ))}
    </div>
  ),
}));

const sources = [
  ['audio', AudioLoop.component],
  ['video', VideoLoop.component],
] as const;

describe.each(sources)('%s loop upload errors', (_name, Source) => {
  it.each([
    ['nofiles', 'Please select a file to upload.'],
    ['mimetype', 'The selected file type'],
    ['size', 'The selected file is too big'],
    ['read', 'There was an error during upload: disk read failed'],
    ['unknown', 'Unknown upload error'],
  ])('displays and closes the %s error', async (type, message) => {
    render(<Source />);
    fireEvent.click(screen.getByRole('button', { name: type }));
    expect(await screen.findByText(new RegExp(message))).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    await waitForElementToBeRemoved(dialog);
  });
});
