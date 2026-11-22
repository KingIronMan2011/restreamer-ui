import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import AbortStep from './Abort';
import ErrorStep from './Error';
import LicenseStep from './License';
import MetadataStep from './Metadata';
import ProbeStep from './Probe';
import SavingStep from './Saving';
import SourceStep from './Source';
import VideoStep from './Video';

describe('wizard steps', () => {
  it('runs default callbacks across wizard steps', () => {
    const license = render(<LicenseStep />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getAllByRole('button')[1]);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'CC BY 4.0' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    license.unmount();

    const metadata = render(<MetadataStep />);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    metadata.unmount();

    const source = render(<SourceStep />);
    fireEvent.click(screen.getByRole('button', { name: 'Advanced setup' }));
    source.unmount();

    const video = render(<VideoStep ready />);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    video.unmount();

    render(<AbortStep nchannels={2} />);
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
  });

  it('renders retry, invokes supplied callbacks, and supports default callbacks', () => {
    const onNext = vi.fn();
    const onAbort = vi.fn();
    const view = render(
      <ErrorStep onNext={onNext} onAbort={onAbort} onHelp={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onNext).toHaveBeenCalledOnce();
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onAbort).toHaveBeenCalledOnce();
    fireEvent.click(screen.getAllByRole('button')[1]);
    view.unmount();
    render(<ErrorStep />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  });

  it('renders probe and saving progress with abort callbacks', () => {
    const onAbort = vi.fn();
    const { unmount } = render(<ProbeStep onAbort={onAbort} />);
    expect(
      screen.getByText('Please wait. Probe stream data ...'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(onAbort).toHaveBeenCalledOnce();
    unmount();
    render(<SavingStep />);
    expect(
      screen.getByText('Please wait. Setting up the stream ...'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
  });

  it('renders source options and invokes advanced setup', () => {
    const onAdvanced = vi.fn();
    render(
      <SourceStep sources={<div>Camera source</div>} onAdvanced={onAdvanced} />,
    );
    expect(screen.getByText('Camera source')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Advanced setup' }));
    expect(onAdvanced).toHaveBeenCalledOnce();
  });

  it('passes metadata and license edits through the wizard controls', () => {
    const onMetadata = vi.fn();
    const metadata = render(
      <MetadataStep metadata={{ name: 'Show' }} onChange={onMetadata} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Show');
    expect(onMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Show' }),
      true,
    );
    metadata.unmount();

    const onLicense = vi.fn();
    render(
      <LicenseStep
        license="CC BY 4.0"
        onChange={onLicense}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('img', { name: 'CC BY 4.0' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  });
});
