import userEvent from '@testing-library/user-event';

import { render, screen } from '../utils/testing';
import Env from './Env';

describe('environment variable indicator', () => {
  it('shows the ENV chip and its explanatory tooltip on hover', async () => {
    const user = userEvent.setup();
    render(<Env />);

    const indicator = screen.getByText('ENV');
    expect(indicator).toBeInTheDocument();
    await user.hover(indicator);
    expect(
      await screen.findByText('An environment variable sets this value.'),
    ).toBeInTheDocument();
  });

  it('forwards a custom chip style', () => {
    render(<Env style={{ marginTop: 8 }} />);
    expect(screen.getByText('ENV').closest('.MuiChip-root')).toHaveStyle({
      marginTop: '8px',
    });
  });
});
