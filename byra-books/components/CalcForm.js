'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n';
import { CURRENCY_LABEL, CURRENCY_SYMBOL, formatIdr, formatForeign } from '@/lib/calc';

export default function CalcForm() {
  const { t } = useI18n();
  const [currencies, setCurrencies] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [cur, setCur] = useState('USD');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    supabase.rpc('calc_currencies').then(({ data, error: err }) => {
      if (!alive) return;
      if (err) { setLoadError(t('calc.unavailable')); setCurrencies([]); return; }
      const list = Array.isArray(data) ? data : [];
      setCurrencies(list);
      if (list.length > 0) setCur((c) => (list.includes(c) ? c : list[0]));
    });
    return () => { alive = false; };
  }, [t]);

  const p = parseFloat(price);
  const q = parseFloat(qty);
  const w = parseFloat(weight);
  const okPrice = p > 0;
  const okQty = q >= 1 && Number.isInteger(q);
  const okWeight = w > 0;
  const complete = okPrice && okQty && okWeight;

  useEffect(() => {
    setError('');
    if (!currencies || currencies.length === 0 || !complete) { setResult(null); return undefined; }
    let alive = true;
    const timer = setTimeout(async () => {
      const { data, error: err } = await supabase.rpc('calc_quote', {
        p_currency: cur, p_price: p, p_qty: q, p_weight: w,
      });
      if (!alive) return;
      if (err) { setResult(null); setError(err.message || t('calc.unavailable')); return; }
      setResult(data);
    }, 300);
    return () => { alive = false; clearTimeout(timer); };
  }, [cur, p, q, w, complete, currencies, t]);

  const showWarn = !result;
  let message = '';
  if (currencies === null) message = t('calc.loading');
  else if (currencies.length === 0) message = loadError || t('calc.unavailable');
  else if (error) message = error;
  else if (!complete) message = qty !== '' && !okQty && q > 0 ? t('calc.qtyInteger') : t('calc.incomplete');
  else if (!result) message = t('calc.calculating');

  const disabled = currencies === null || currencies.length === 0;

  return (
    <div className="calc-card">
      <h1 className="calc-h1">byra <em>books</em></h1>
      <div className="calc-sub">{t('calc.title')}</div>

      {currencies && currencies.length > 1 && (
        <div className="calc-seg" role="group" aria-label={t('calc.currencyGroup')}>
          {currencies.map((c) => (
            <button key={c} type="button" className={c === cur ? 'on' : ''} aria-pressed={c === cur} onClick={() => setCur(c)}>
              {CURRENCY_LABEL[c] || c}
            </button>
          ))}
        </div>
      )}

      <div className="calc-field">
        <label htmlFor="calc-price">{t('calc.price')} ({cur}) <span className="calc-req">*</span></label>
        <div className="calc-pre">
          <span>{CURRENCY_SYMBOL[cur] || cur}</span>
          <input id="calc-price" type="number" inputMode="decimal" step="0.01" min="0.01" placeholder={t('calc.pricePlaceholder')}
            className={!okPrice ? 'empty' : ''} value={price} disabled={disabled} onChange={(e) => setPrice(e.target.value)} />
        </div>
      </div>
      <div className="calc-field">
        <label htmlFor="calc-qty">{t('calc.qty')} <span className="calc-req">*</span></label>
        <input id="calc-qty" type="number" inputMode="numeric" step="1" min="1" placeholder={t('calc.qtyPlaceholder')}
          className={!okQty ? 'empty' : ''} value={qty} disabled={disabled} onChange={(e) => setQty(e.target.value)} />
      </div>
      <div className="calc-field">
        <label htmlFor="calc-w">{t('calc.weight')} <span className="calc-req">*</span></label>
        <div className="calc-suf">
          <input id="calc-w" type="number" inputMode="decimal" min="1" placeholder={t('calc.weightPlaceholder')}
            className={!okWeight ? 'empty' : ''} value={weight} disabled={disabled} onChange={(e) => setWeight(e.target.value)} />
          <span>g</span>
        </div>
      </div>

      <div className={`calc-result ${showWarn ? 'warn' : ''}`} aria-live="polite">
        <div className="lbl">{t('calc.total')}</div>
        <div className="amt" id="calc-total">{result ? formatIdr(result.total) : '-'}</div>
        <div className="eq">{result ? `≈ ${formatForeign(result.currency, result.equivalent)}` : ''}</div>
        <div className="msg">{message}</div>
      </div>
    </div>
  );
}
