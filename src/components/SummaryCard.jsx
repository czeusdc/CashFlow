/**
 * SummaryCard.jsx
 *
 * A dashboard stat card that displays a labelled monetary amount.
 * The amount animates from 0 to its target value on mount/change via
 * the internal CountUp component, using requestAnimationFrame for smoothness.
 *
 * Props:
 *   label   - display title (e.g. "Income")
 *   amount  - numeric value to format and animate
 *   type    - CSS modifier class suffix: "onhand" | "income" | "expense" | "savings"
 *   sub     - optional subtitle (e.g. the selected period label)
 *   icon    - optional emoji string displayed as a decorative background icon
 */

import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';

/**
 * CountUp
 *
 * Animates a number from 0 to `target` over `duration` ms using an
 * ease-in-out quadratic curve for a natural feel.
 */
function CountUp({ target, fmt, duration = 800 }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const step = (now) => {
      // t goes from 0 → 1 over the duration
      const t = Math.min((now - start) / duration, 1);
      // Ease-in-out: accelerates then decelerates
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setValue(target * eased);
      if (t < 1) requestAnimationFrame(step);
      else setValue(target); // snap to exact value at the end
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return <span>{fmt(value)}</span>;
}

export default function SummaryCard({ label, amount, type, sub, icon }) {
  const { fmt } = useApp();
  return (
    <div className={`summary-card summary-card-${type} fade-up`}>
      <div className="summary-card-label">{label}</div>
      <div className="summary-card-amount">
        <CountUp target={amount} fmt={fmt} />
      </div>
      {sub  && <div className="summary-card-sub">{sub}</div>}
      {icon && <div className="summary-card-icon">{icon}</div>}
    </div>
  );
}
