'use client';
import { useSettings } from '@/lib/useSettings';
import { useI18n } from '@/lib/i18n';
import { IconUsers } from '@/components/Icons';

export default function JoinGroup({ className = '', label, size = '' }) {
  const s = useSettings();
  const { t } = useI18n();
  if (!s.join_group_url) return null;
  return (
    <a
      className={`btn btn-ghost ${size} ${className}`.trim()}
      href={s.join_group_url}
      target="_blank"
      rel="noreferrer"
    >
      <IconUsers width={17} height={17} />
      {label || t('join.label')}
    </a>
  );
}
