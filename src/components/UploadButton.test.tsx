import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import UploadButton from './UploadButton';

const imageTypes = [{ mimetype: 'image/*', extension: 'png', maxSize: 4 }];

describe('UploadButton', () => {
  it('starts and uploads an accepted file', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const onUpload = vi.fn();
    const onError = vi.fn();
    const file = new File(['img'], 'logo.png', { type: 'image/png' });

    render(
      <UploadButton
        label="Upload image"
        acceptTypes={imageTypes}
        onStart={onStart}
        onUpload={onUpload}
        onError={onError}
      />,
    );
    await user.upload(screen.getByLabelText('Upload image'), file);

    expect(onStart).toHaveBeenCalledOnce();
    expect(onUpload).toHaveBeenCalledWith(file, 'png', 'image/*');
    expect(onError).not.toHaveBeenCalled();
  });

  it('reports disallowed mimetypes', async () => {
    const onError = vi.fn();
    render(
      <UploadButton
        label="Upload image"
        acceptTypes={imageTypes}
        onError={onError}
      />,
    );

    await userEvent
      .setup({ applyAccept: false })
      .upload(
        screen.getByLabelText('Upload image'),
        new File(['text'], 'note.txt', { type: 'text/plain' }),
      );

    expect(onError).toHaveBeenCalledWith({
      type: 'mimetype',
      actual: 'text/plain',
      allowed: ['image/*'],
    });
  });

  it('rejects the wrong subtype when the accepted MIME type is exact', async () => {
    const onError = vi.fn();
    render(
      <UploadButton
        label="Upload PNG"
        acceptTypes={[{ mimetype: 'image/png', extension: 'png', maxSize: 0 }]}
        onError={onError}
      />,
    );

    await userEvent
      .setup({ applyAccept: false })
      .upload(
        screen.getByLabelText('Upload PNG'),
        new File(['img'], 'photo.jpg', { type: 'image/jpeg' }),
      );

    expect(onError).toHaveBeenCalledWith({
      type: 'mimetype',
      actual: 'image/jpeg',
      allowed: ['image/png'],
    });
  });

  it('reports files exceeding their size limit', async () => {
    const onError = vi.fn();
    render(
      <UploadButton
        label="Upload image"
        acceptTypes={imageTypes}
        onError={onError}
      />,
    );

    await userEvent
      .setup()
      .upload(
        screen.getByLabelText('Upload image'),
        new File(['12345'], 'large.png', { type: 'image/png' }),
      );

    expect(onError).toHaveBeenCalledWith({
      type: 'size',
      actual: 5,
      allowed: 4,
    });
  });

  it('reports when the selection is cleared without choosing a file', () => {
    const onError = vi.fn();
    render(
      <UploadButton
        label="Upload image"
        acceptTypes={imageTypes}
        onError={onError}
      />,
    );

    fireEvent.change(screen.getByLabelText('Upload image'), {
      target: { files: [] },
    });

    expect(onError).toHaveBeenCalledWith({ type: 'nofiles' });
  });

  it('uploads a nonempty file list delivered by the input change event', () => {
    const onUpload = vi.fn();
    const input = render(
      <UploadButton
        label="Direct upload"
        acceptTypes={imageTypes}
        onUpload={onUpload}
      />,
    ).getByLabelText('Direct upload');
    const file = new File(['img'], 'logo.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [file],
    });

    fireEvent.change(input);

    expect(onUpload).toHaveBeenCalledWith(file, 'png', 'image/*');
  });

  it('does not start when disabled', async () => {
    const onStart = vi.fn();
    render(
      <UploadButton
        label="Upload image"
        acceptTypes={imageTypes}
        disabled
        onStart={onStart}
      />,
    );

    expect(screen.getByLabelText('Upload image')).toBeDisabled();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('accepts default handlers for upload and an empty selection', () => {
    render(<UploadButton label="Default upload" acceptTypes={imageTypes} />);
    const input = screen.getByLabelText('Default upload');
    fireEvent.change(input, {
      target: { files: [new File(['img'], 'logo.png', { type: 'image/png' })] },
    });
    fireEvent.change(input, { target: { files: [] } });
  });
});
