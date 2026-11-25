'use client';
import { useI18n } from '@/lib/i18n';

export default function Loading({ style }) {
  const { t } = useI18n();
  return <p className="center muted" style={style}>{t('common.loading')}</p>;
}
