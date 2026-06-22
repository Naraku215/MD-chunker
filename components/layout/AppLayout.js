'use client';

import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function AppLayout({ children }) {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {t('app.title')}
          </Typography>
          <LanguageSwitcher />
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}
