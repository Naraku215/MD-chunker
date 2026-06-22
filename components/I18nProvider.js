'use client';

import i18nInstance from '@/lib/i18n';
import { I18nextProvider } from 'react-i18next';

export default function I18nProvider({ children }) {
  return (
    <I18nextProvider i18n={i18nInstance}>
      {children}
    </I18nextProvider>
  );
}
