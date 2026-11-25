'use client';
import { useI18n } from '@/lib/i18n';

export default function LanguageToggle({ className = '' }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div className={`lang-toggle ${className}`} role="group" aria-label={t('lang.label')}>
      <button
        type="button"
        className={lang === 'id' ? 'on' : ''}
        aria-pressed={lang === 'id'}
        onClick={() => setLang('id')}
      >
        ID
      </button>
      <button
        type="button"
        className={lang === 'en' ? 'on' : ''}
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
      >
        EN
      </button>
    </div>
  );
}
