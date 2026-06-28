import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wallet as WalletIcon,
  Lock,
  TrendingUp,
  TrendingDown,
  Send,
  ArrowDownToLine,
  ArrowUpFromLine,
  Vault as VaultIcon,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { requireActiveOrAdmin } from "@/lib/require-active";
import {
  transferVst,
  requestWithdrawal,
  createWithdrawalMethod,
} from "@/lib/bixvest.functions";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet — BIXVEST" }] }),
  beforeLoad: requireActiveOrAdmin,
  component: WalletHub,
});

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
}

function WalletHub() {
  const { data: profile } = useProfile();
  const userId = profile?.id;

  const { data: tx = [] } = useQuery({
    queryKey: ["wallet-tx", userId],
    enabled: !!userId,
    queryFn: async () =>
      (
        await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false })
          .limit(500)
      ).data ?? [],
  });

  const { data: vaultHoldings = [] } = useQuery({
    queryKey: ["vault-holdings", userId],
    enabled: !!userId,
    queryFn: async () =>
      (await supabase.from("vault_holdings").select("*").eq("user_id", userId!).eq("status", "active")).data ?? [],
  });

  const { data: investHoldings = [] } = useQuery({
    queryKey: ["invest-holdings", userId],
    enabled: !!userId,
    queryFn: async () =>
      (await supabase.from("invest_holdings").select("*").eq("user_id", userId!)).data ?? [],
  });

  const { data: stakesV2 = [] } = useQuery({
    queryKey: ["stakes-v2", userId],
    enabled: !!userId,
    queryFn: async () =>
      (
        await supabase
          .from("user_stakes_v2")
          .select("*")
          .eq("user_id", userId!)
          .in("status", ["active", "rewarding", "claimable"])
      ).data ?? [],
  });

  const { data: pendingW = [] } = useQuery({
    queryKey: ["pending-withdrawals", userId],
    enabled: !!userId,
    queryFn: async () =>
      (
        await supabase
          .from("withdrawals")
          .select("*")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false })
          .limit(20)
      ).data ?? [],
  });

  const totals = useMemo(() => {
    let earned = 0, spent = 0, todayEarn = 0;
    const today = new Date().toDateString();
    for (const t of tx) {
      const a = Number(t.amount);
      if (a >= 0) {
        earned += a;
        if (new Date(t.created_at).toDateString() === today) todayEarn += a;
      } else spent += Math.abs(a);
    }
    const vaultBal = vaultHoldings.reduce((s, h) => s + Number(h.principal) + Number(h.interest_accrued), 0);
    const investBal = investHoldings.reduce((s, h) => s + Number(h.amount ?? 0), 0);
    const stakedV2 = stakesV2.reduce((s, h) => s + Number(h.principal), 0);
    const pendW = pendingW.filter((w) => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0);
    return { earned, spent, todayEarn, vaultBal, investBal, stakedV2, pendW };
  }, [tx, vaultHoldings, investHoldings, stakesV2, pendingW]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Wallet</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your unified financial hub — every movement recorded on the BIXVEST ledger.
            </p>
          </div>
        </header>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="transfer">Transfer</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <Overview
              profile={profile}
              totals={totals}
              tx={tx.slice(0, 8)}
              pendingW={totals.pendW}
            />
          </TabsContent>

          <TabsContent value="deposit" className="mt-6">
            <DepositPanel />
          </TabsContent>

          <TabsContent value="withdraw" className="mt-6">
            <WithdrawPanel balance={Number(profile?.vst_balance ?? 0)} />
          </TabsContent>

          <TabsContent value="transfer" className="mt-6">
            <TransferPanel balance={Number(profile?.vst_balance ?? 0)} />
          </TabsContent>

          <TabsContent value="assets" className="mt-6">
            <AssetsPanel
              vaultBal={totals.vaultBal}
              investBal={totals.investBal}
              stakedV2={totals.stakedV2}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <HistoryPanel tx={tx} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function Overview({ profile, totals, tx, pendingW }: any) {
  const cards = [
    { label: "Available", value: Number(profile?.vst_balance ?? 0), icon: WalletIcon, accent: "text-primary" },
    { label: "Locked / Staked", value: Number(profile?.vst_locked ?? 0) + totals.stakedV2, icon: Lock, accent: "text-amber-500" },
    { label: "Smart Vault", value: totals.vaultBal, icon: VaultIcon, accent: "text-emerald-500" },
    { label: "Investments", value: totals.investBal, icon: TrendingUp, accent: "text-blue-500" },
    { label: "Total Earned", value: totals.earned, icon: TrendingUp, accent: "text-success" },
    { label: "Today's Earnings", value: totals.todayEarn, icon: Sparkles, accent: "text-success" },
    { label: "Pending Withdrawal", value: pendingW, icon: Clock, accent: "text-orange-500" },
    { label: "Total Spent", value: totals.spent, icon: TrendingDown, accent: "text-destructive" },
  ];

  const quick = [
    { to: "/wallet" as const, label: "Deposit", icon: ArrowDownToLine, tab: "deposit" },
    { to: "/wallet" as const, label: "Withdraw", icon: ArrowUpFromLine, tab: "withdraw" },
    { to: "/wallet" as const, label: "Transfer", icon: Send, tab: "transfer" },
    { to: "/vault" as const, label: "Vault", icon: VaultIcon },
    { to: "/invest" as const, label: "Invest", icon: TrendingUp },
    { to: "/staking" as const, label: "Stake", icon: Layers },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-transparent bg-gradient-card p-6 text-white shadow-elegant">
        <div className="text-xs uppercase tracking-[0.18em] text-white/60">VST Balance</div>
        <div className="mt-2 font-display text-5xl font-bold">{fmt(Number(profile?.vst_balance ?? 0))}</div>
        <div className="mt-1 text-sm text-white/60">VST · BIX Score {profile?.bix_score ?? 0}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {quick.map((q) => (
          <Link
            key={q.label}
            to={q.to}
            className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary hover:shadow-elegant"
          >
            <q.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 text-sm font-medium">{q.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
              <c.icon className={`h-4 w-4 ${c.accent}`} />
            </div>
            <div className="mt-3 font-display text-2xl font-bold">{fmt(c.value)}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">VST</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="font-display font-semibold">Recent Transactions</div>
          <span className="text-xs text-muted-foreground">{tx.length} entries</span>
        </div>
        {tx.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No transactions yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {tx.map((t: any) => (
              <TxRow key={t.id} t={t} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TxRow({ t }: { t: any }) {
  const pos = Number(t.amount) >= 0;
  return (
    <li className="flex items-center justify-between gap-3 px-6 py-3 text-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            pos ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
          }`}
        >
          {pos ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <div className="truncate font-medium">{t.note || t.type}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {String(t.type).replace(/_/g, " ")} ·{" "}
            {new Date(t.created_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {t.status && t.status !== "confirmed" ? ` · ${t.status}` : ""}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground/70">
            #TXN-{String(t.id).slice(0, 8).toUpperCase()}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={pos ? "font-medium text-success" : "font-medium text-destructive"}>
          {pos ? "+" : ""}
          {fmt(Number(t.amount))} VST
        </div>
        <div className="text-[10px] text-muted-foreground">bal {fmt(Number(t.balance_after))}</div>
      </div>
    </li>
  );
}

function DepositPanel() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <ArrowDownToLine className="mx-auto h-10 w-10 text-primary" />
      <h2 className="mt-4 font-display text-2xl font-bold">Deposit VST</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Purchase a VST activation code to top up your wallet. Stripe, Paystack and Flutterwave
        gateways are supported.
      </p>
      <Link to="/activate" className="mt-6 inline-block">
        <Button>Go to activation</Button>
      </Link>
    </div>
  );
}

function TransferPanel({ balance }: { balance: number }) {
  const qc = useQueryClient();
  const transfer = useServerFn(transferVst);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const m = useMutation({
    mutationFn: () =>
      transfer({ data: { recipient_code: recipient, amount: Number(amount), note } }),
    onSuccess: (r: any) => {
      toast.success(`Sent to ${r.recipient}`);
      setAmount("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["wallet-tx"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e.message || "Transfer failed"),
  });
  const amt = Number(amount || 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold">Send VST</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Instant peer-to-peer transfer using a referral code.
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <Label>Recipient code</Label>
            <Input
              placeholder="BIX-XXXXX"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <Label>Amount (VST)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="mt-1 text-xs text-muted-foreground">
              Available: {fmt(balance)} VST
            </div>
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          </div>
          <Button
            className="w-full"
            disabled={!recipient || amt <= 0 || amt > balance || m.isPending}
            onClick={() => m.mutate()}
          >
            {m.isPending ? "Sending..." : "Send transfer"}
          </Button>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display font-semibold">Review</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <Row k="Recipient" v={recipient || "—"} />
          <Row k="Amount" v={`${fmt(amt)} VST`} />
          <Row k="Fee" v="0 VST" />
          <Row k="They receive" v={`${fmt(amt)} VST`} />
        </dl>
      </div>
    </div>
  );
}

function WithdrawPanel({ balance }: { balance: number }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"bank" | "crypto" | "internal">("bank");
  const [label, setLabel] = useState("");
  const [details, setDetails] = useState("");
  const createMethod = useServerFn(createWithdrawalMethod);
  const reqWithdraw = useServerFn(requestWithdrawal);

  const { data: methods = [] } = useQuery({
    queryKey: ["w-methods"],
    queryFn: async () => (await supabase.from("withdrawal_methods").select("*")).data ?? [],
  });
  const { data: withdrawals = [] } = useQuery({
    queryKey: ["my-withdrawals"],
    queryFn: async () =>
      (await supabase.from("withdrawals").select("*").order("created_at", { ascending: false }).limit(20)).data ?? [],
  });

  const [methodId, setMethodId] = useState<string>("");
  const amt = Number(amount || 0);
  const fee = +(amt * 0.01).toFixed(2);
  const net = amt - fee;

  const addM = useMutation({
    mutationFn: () =>
      createMethod({
        data: { method_type: type, label, details: { value: details } },
      }),
    onSuccess: () => {
      toast.success("Method saved");
      setLabel("");
      setDetails("");
      qc.invalidateQueries({ queryKey: ["w-methods"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const submit = useMutation({
    mutationFn: () => reqWithdraw({ data: { method_id: methodId, amount: amt, source: "main" } }),
    onSuccess: () => {
      toast.success("Withdrawal submitted for review");
      setAmount("");
      qc.invalidateQueries({ queryKey: ["my-withdrawals"] });
      qc.invalidateQueries({ queryKey: ["wallet-tx"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Add destination</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank account</SelectItem>
                  <SelectItem value="crypto">Crypto wallet</SelectItem>
                  <SelectItem value="internal">Internal transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Label</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>{type === "bank" ? "Account number" : type === "crypto" ? "Wallet address" : "Username"}</Label>
              <Input value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
          </div>
          <Button
            className="mt-4"
            variant="outline"
            disabled={!label || !details || addM.isPending}
            onClick={() => addM.mutate()}
          >
            {addM.isPending ? "Saving..." : "Save method"}
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Request withdrawal</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Source</Label>
              <Select defaultValue="main">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Destination</Label>
              <Select value={methodId} onValueChange={setMethodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a saved method" />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label} ({m.method_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (VST)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Min 50"
              />
              <div className="mt-1 text-xs text-muted-foreground">
                Available: {fmt(balance)} VST · 1% platform fee
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!methodId || amt < 50 || amt > balance || submit.isPending}
              onClick={() => submit.mutate()}
            >
              {submit.isPending ? "Submitting..." : `Submit · receive ${fmt(net)} VST`}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display font-semibold">Recent requests</h3>
        {withdrawals.length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground">No requests yet.</div>
        ) : (
          <ul className="mt-4 space-y-3">
            {withdrawals.map((w: any) => (
              <li key={w.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{fmt(Number(w.amount))} VST</span>
                  <StatusBadge status={w.status} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(w.created_at).toLocaleString()}
                </div>
                {w.admin_note && (
                  <div className="mt-1 text-xs italic text-muted-foreground">"{w.admin_note}"</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { c: string; Icon: any }> = {
    pending: { c: "bg-amber-500/15 text-amber-500", Icon: Clock },
    approved: { c: "bg-blue-500/15 text-blue-500", Icon: CheckCircle2 },
    processing: { c: "bg-blue-500/15 text-blue-500", Icon: Clock },
    completed: { c: "bg-success/15 text-success", Icon: CheckCircle2 },
    rejected: { c: "bg-destructive/15 text-destructive", Icon: XCircle },
  };
  const it = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${it.c}`}>
      <it.Icon className="h-3 w-3" /> {status}
    </span>
  );
}

function AssetsPanel({ vaultBal, investBal, stakedV2 }: any) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <AssetCard title="Smart Vault" value={vaultBal} to="/vault" icon={VaultIcon} />
      <AssetCard title="Investments" value={investBal} to="/invest" icon={TrendingUp} />
      <AssetCard title="Staking" value={stakedV2} to="/staking" icon={Layers} />
    </div>
  );
}

function AssetCard({ title, value, to, icon: Icon }: any) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary hover:shadow-elegant"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{title}</span>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="mt-4 font-display text-3xl font-bold">{fmt(value)}</div>
      <div className="mt-1 text-xs text-muted-foreground">VST</div>
      <div className="mt-4 text-xs font-medium text-primary group-hover:underline">Manage →</div>
    </Link>
  );
}

const FILTERS: { id: string; label: string; match: (t: any) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "deposits", label: "Deposits", match: (t) => ["earn", "activation_payment", "transfer_in"].includes(t.type) },
  { id: "withdrawals", label: "Withdrawals", match: (t) => t.type === "withdrawal" },
  { id: "invest", label: "Investments", match: (t) => String(t.type).startsWith("invest") },
  { id: "vault", label: "Vault", match: (t) => String(t.type).startsWith("vault") },
  { id: "rewards", label: "Rewards", match: (t) => ["earn", "daily", "mission", "campaign", "task", "staking_reward"].includes(t.type) },
  { id: "transfers", label: "Transfers", match: (t) => ["transfer_in", "transfer_out"].includes(t.type) },
];

function HistoryPanel({ tx }: { tx: any[] }) {
  const [f, setF] = useState("all");
  const active = FILTERS.find((x) => x.id === f)!;
  const filtered = tx.filter(active.match);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((x) => (
          <button
            key={x.id}
            onClick={() => setF(x.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              f === x.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No transactions for this filter.</div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((t) => <TxRow key={t.id} t={t} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
