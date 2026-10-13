import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';

// The README's demo walkthrough, kept beside the controls it refers to. Open on a first visit, remembered once closed.
const STEPS = [
  { do: 'Seed demo, then accept the 88% offer on SB 6674321.', see: 'The bill turns FINANCED and the advance payout confirms.' },
  { do: 'Accept the second offer on the same bill.', see: 'Refused: the ledger reverts a second lock.' },
  { do: 'Jump 75 days, SWIFT arrives.', see: 'The wire reference has typos, the matcher still reaches 95%, and the bill realises by itself.' },
  { do: 'Open the realised bill.', see: 'Waterfall, eBRC and the four payouts.' },
  { do: 'Bundle remittance, then open Bank Ops.', see: 'One payment for two invoices waits at 70%. Approve both candidates.' },
  { do: 'Fraud remittance.', see: 'Three times the invoice value: it stays unmatched.' },
  { do: 'Open Explorer.', see: 'Verify the eBRC and read the stats.' },
];
const KEY = 'hisab-guide-closed';

function wasClosed() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function DemoGuide() {
  const [open, setOpen] = useState(() => !wasClosed());
  return (
    <details
      open={open}
      onToggle={(e) => {
        const now = e.currentTarget.open;
        setOpen(now);
        try {
          localStorage.setItem(KEY, now ? '0' : '1');
        } catch {
          // storage is unavailable in some private modes; the guide then simply reopens next time
        }
      }}
      className="group border-b border-line bg-surface"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2 text-sm font-medium text-text [&::-webkit-details-marker]:hidden">
        <CaretDown size={16} className="text-muted transition-transform group-open:rotate-180" aria-hidden />
        Demo guide
        <span className="font-normal text-muted">seven steps, in order</span>
      </summary>
      <ol className="grid gap-x-8 gap-y-3 px-4 pb-4 pt-1 md:grid-cols-2 xl:grid-cols-4 xl:pr-[288px]">
        {STEPS.map((s, i) => (
          <li key={s.do} className="flex gap-3 text-[13px] leading-relaxed">
            <span className="font-mono tabular text-accent-text">{i + 1}</span>
            <span>
              <span className="font-medium text-text">{s.do}</span> <span className="text-muted">{s.see}</span>
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}
