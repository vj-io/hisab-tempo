import { useCallback, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { api } from './api';
import { SessionCtx, ORG_NAMES, type Session } from './session';
import { ToastProvider } from './components/Toasts';
import { Header, type Tab } from './components/Header';
import { ControlBar } from './components/ControlBar';
import { DemoGuide } from './components/DemoGuide';
import { Phone, makeNotification, type PushNotification } from './components/Phone';
import { ExporterView } from './components/ExporterView';
import { FinancierView } from './components/FinancierView';
import { BankOpsView } from './components/BankOpsView';
import { ExplorerView } from './components/ExplorerView';
import { useEvents } from './useEvents';
import { Button } from './ui/Button';
import { Panel } from './ui/Panel';
import type { Org, DomainEventEnvelope } from './types';

const PERSONA_ORG_NAMES = Object.values(ORG_NAMES);

// Shown instead of the persona views when the local API cannot be reached, which is always the case on the public site.
function Offline({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Panel title="This console needs the local API">
        <p className="text-sm leading-relaxed">
          It is the original Hisab demo: mock UPI payouts and a SWIFT message matcher on a local chain. Nothing on this
          screen talks to Tempo.
        </p>
        <p className="mt-3 text-sm text-muted">To use it, run the stack from the repository root, then retry.</p>
        <div className="mt-2 overflow-x-auto rounded-ui bg-sunken p-3 font-mono text-[13px] leading-relaxed">
          <div>pnpm install</div>
          <div>pnpm dev</div>
        </div>
        <p className="mt-3 break-words font-mono text-[12px] text-muted">API said: {message}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button onClick={onRetry}>Retry</Button>
          <a className="text-sm text-accent-text underline underline-offset-2" href="/">
            Hisab on Tempo
          </a>
        </div>
      </Panel>
    </div>
  );
}

function AppInner() {
  const [tab, setTab] = useState<Tab>('exporter');
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [tokenByOrgName, setTokenByOrgName] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);

  const bumpRefresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  const loginAll = useCallback(async () => {
    try {
      const { orgs: allOrgs } = await api.getOrgs();
      setOrgs(allOrgs);
      const byName: Record<string, Org> = {};
      for (const o of allOrgs) byName[o.name] = o;

      const tokens: Record<string, string> = {};
      await Promise.all(
        PERSONA_ORG_NAMES.map(async (name) => {
          const org = byName[name];
          if (!org) return; // not seeded yet, fine, views handle missing tokens gracefully
          try {
            const res = await api.login(org.id);
            tokens[name] = res.token;
          } catch {
            // ignore, org may not exist before first seed
          }
        })
      );
      setTokenByOrgName(tokens);
      setOffline(null);
      setReady(true);
    } catch (e) {
      setOffline((e as Error).message);
      setReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loginAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDomainEvent = useCallback((e: DomainEventEnvelope) => {
    if (e.text) {
      setNotifications((cur) => [makeNotification(e.text as string), ...cur].slice(0, 12));
    }
    setRefreshTick((t) => t + 1);
  }, []);

  useEvents(onDomainEvent, bumpRefresh);

  const orgByName: Record<string, Org> = {};
  for (const o of orgs) orgByName[o.name] = o;

  const session: Session = { orgs, orgByName, tokenByOrgName, ready, refreshTick, bumpRefresh, relogin: loginAll };

  return (
    <SessionCtx.Provider value={session}>
      <div className="min-h-screen bg-bg pb-24">
        <Header tab={tab} onTab={setTab} />
        {offline === null && (
          <>
            <ControlBar />
            <DemoGuide />
          </>
        )}
        <main className="xl:pr-[288px]">
          {offline !== null ? (
            <Offline message={offline} onRetry={loginAll} />
          ) : (
            <>
              {tab === 'exporter' && <ExporterView />}
              {tab === 'financier' && <FinancierView />}
              {tab === 'bankops' && <BankOpsView />}
              {tab === 'explorer' && <ExplorerView />}
            </>
          )}
        </main>
        <Phone notifications={notifications} />
      </div>
    </SessionCtx.Provider>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </MotionConfig>
  );
}
