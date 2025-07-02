'use client';
import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider as NextAppDirEmotionCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import getTheme from './theme';

export const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem('colorMode');
      if (savedMode === 'light' || savedMode === 'dark') {
        setMode(savedMode);
      }
    } catch (error) {
      console.warn('Could not load color mode from localStorage', error);
    }
  }, []);

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          try {
            window.localStorage.setItem('colorMode', newMode);
          } catch (error) {
            console.warn('Could not save color mode to localStorage', error);
          }
          return newMode;
        });
      },
    }),
    [],
  );

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </NextAppDirEmotionCacheProvider>
  );
}
