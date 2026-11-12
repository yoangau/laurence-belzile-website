/** Sober black-and-white Mantine theme, close to the public site. */
import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'dark',
  black: '#111',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  headings: { fontFamily: 'Rokkitt, Georgia, serif', fontWeight: '500' },
  defaultRadius: 'sm',
  cursorType: 'pointer',
  focusRing: 'auto',
  components: {
    Title: { defaultProps: { order: 1 } },
  },
});
