'use client';
import Link from 'next/link';
import { useSettings } from '@/lib/useSettings';
import { useI18n } from '@/lib/i18n';
import CalcForm from '@/components/CalcForm';
import { IconArrowLeft, IconCalculator, IconTruck, IconCreditCard } from '@/components/Icons';

export default function CalculatorPage({ className = '' }) {
  const s = useSettings();
  const { t } = useI18n();
  const enabled = s.show_calculator === '1' || s.show_calculator === 'true';

  return (
    <div className={`calc-bg ${className}`}>
      <div className="calc-wrap">
        {enabled ? (
          <>
            <CalcForm />
            <div className="calc-help">
              <b style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--navy)', marginBottom: 8 }}>
                <IconCalculator width={17} height={17} /> {t('calc.how')}
              </b>
              <ol>
                <li>{t('calc.how1')}</li>
                <li>{t('calc.how2')}</li>
                <li>{t('calc.how3')}</li>
              </ol>
              <p>
                <IconTruck width={15} height={15} /> {t('calc.shippingNote')}
                <br />
                <IconCreditCard width={15} height={15} /> {t('calc.paymentNote')}
              </p>
            </div>
          </>
        ) : (
          <div className="calc-card">
            <div className="empty-state" style={{ border: 0, padding: '24px 8px' }}>
              <div className="icon"><IconCalculator width={30} height={30} /></div>
              <h3>{t('calc.disabled.title')}</h3>
              <p className="muted">{t('calc.disabled.body')}</p>
              <Link href="/katalog" className="btn">{t('calc.disabled.cta')}</Link>
            </div>
          </div>
        )}

        <Link href="/katalog" className="section-link" style={{ justifyContent: 'center', marginTop: 20, width: '100%' }}>
          <IconArrowLeft width={16} height={16} /> {t('calc.back')}
        </Link>
      </div>
    </div>
  );
}
