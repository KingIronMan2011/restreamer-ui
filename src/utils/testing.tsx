import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

import I18n from '../i18n';
import theme from '../lib/theme';

/*
This is wrapper for the render method in order to provide all required providers and
not to repeat them for each test.

If you want to debug a test by having a look at the current output of the component,
simply import the "screen" object from this file and use the "debug()" method:

    test('displays the header and paragraph text', () => {
        render(<Travel />)
        screen.debug()
    })

or of a specific element in the component:

    test('displays the header and paragraph text', () => {
        render(<Travel />)
        const header = screen.getByRole('heading', { name: /travel anywhere/i })
        screen.debug(header)
    })

More about "render" and "screen" on https://testing-library.com/docs

For testing assertions, see https://vitest.dev/api/expect and for running tests,
see https://vitest.dev/guide/cli.

As an alternative to fireEvent there is the userEvent which may simulate better
a user clicking around. Example:

    import { render, screen } from "@testing-library/react";
    import userEvent from "@testing-library/user-event";

    test("radio", () => {
        const user = userEvent.setup();
        render(
            <form>
            <label>
                First <input type="radio" name="radio1" value="first" />
            </label>
            <label>
                Second <input type="radio" name="radio1" value="second" />
            </label>
            </form>
        )

        await user.click(screen.getByLabelText("Second"));
    });
*/

const NoRoute = (props: any) => {
  return null;
};

const AllTheProviders =
  (initialEntries: any, path: any) =>
  ({ children }: { children: React.ReactNode }) => {
    return (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <I18n>
            <MemoryRouter initialEntries={[initialEntries]}>
              <Routes>
                <Route path={path} element={<>{children}</>} />
                <Route path="*" element={<NoRoute />} />
              </Routes>
            </MemoryRouter>
          </I18n>
        </ThemeProvider>
      </StyledEngineProvider>
    );
  };

const customRender = (
  ui: any,
  options: any = {},
  initialEntries = '/',
  path = '/',
) => render(ui, { wrapper: AllTheProviders(initialEntries, path), ...options });

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
