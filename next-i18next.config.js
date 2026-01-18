import { Config } from 'next-i18next';

const config: Config = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'id', 'es', 'zh'],
  },
  ns: ['common', 'crew', 'accounting', 'compliance', 'navigation'],
  defaultNS: 'common',
  localePath: './public/locales',
  ns: ['common', 'crew', 'accounting', 'compliance', 'navigation'],
  defaultNS: 'common',
};

export default config;
