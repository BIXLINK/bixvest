import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, AlertCircle, Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";

export const Route = createFileRoute("/_authenticated/withdraw")({
  component: WithdrawPage,
});

export default function WithdrawPage() {
  const { data: profile } = useProfile();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [loading, setLoading] = useState(false);

  async function handleWithdraw() {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }

    setLoading(true);
    // TODO: Implement withdrawal API call
    setTimeout(() => {
      alert("Withdrawal request submitted. Coming soon!");
      setLoading(false);
    }, 1000);
  }

  const minWithdraw = 100;
  const maxWithdraw = profile?.vst_balance || 0;
  const fee = parseFloat(amount || "0") * 0.01; // 1% fee

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <ArrowUpRight className="h-8 w-8" />
            Withdraw VST
          </h1>
          <p className="text-muted-foreground mt-2">
            Convert your VST balance to your preferred currency
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alert */}
            <div className="rounded-lg border border-blue-500/50 bg-blue-500/5 p-4 flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Withdrawal Feature Coming Soon</p>
                <p className="text-muted-foreground mt-1">
                  We're currently integrating payment processors. Withdrawals will be available
                  shortly.
                </p>
              </div>
            </div>

            {/* Current Balance */}
            <div className="rounded-xl border border-border bg-card p-6">
              <p className="text-sm font-medium text-muted-foreground mb-1">Available Balance</p>
              <p className="text-4xl font-display font-bold">
                {profile?.vst_balance?.toLocaleString() || "0"} VST
              </p>
            </div>

            {/* Withdrawal Method */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-4">Withdrawal Method</h2>
              <div className="space-y-3">
                {[
                  { id: "bank", label: "Bank Transfer", desc: "Direct to your bank account" },
                  { id: "crypto", label: "Crypto Wallet", desc: "Send to blockchain address" },
                  { id: "paypal", label: "PayPal", desc: "Transfer to PayPal account" },
                ].map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="method"
                      value={m.id}
                      checked={method === m.id}
                      onChange={(e) => setMethod(e.target.value)}
                      className="h-4 w-4"
                    />
                    <div>
                      <p className="font-medium text-sm">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Amount & Details */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Withdrawal Amount (VST)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled
                  className="mt-2 w-full rounded-lg border border-input bg-input px-4 py-2 opacity-50"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Min: {minWithdraw} VST | Max: {maxWithdraw?.toLocaleString()} VST
                </p>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{parseFloat(amount || "0").toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fee (1%)</span>
                  <span>-{fee.toLocaleString()}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-medium">
                  <span>You'll receive</span>
                  <span>{(parseFloat(amount || "0") - fee).toLocaleString()}</span>
                </div>
              </div>

              <Button disabled className="w-full">
                {loading ? "Processing..." : "Withdraw VST"}
              </Button>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-semibold mb-3">Withdrawal Info</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground mb-1">Processing Time</p>
                  <p>1-3 business days</p>
                </div>
                <div className="border-t border-border pt-2">
                  <p className="font-medium text-foreground mb-1">Fees</p>
                  <p>1% platform fee</p>
                </div>
                <div className="border-t border-border pt-2">
                  <p className="font-medium text-foreground mb-1">Minimum</p>
                  <p>{minWithdraw} VST</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/5 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-foreground">Security Notice</p>
                <p className="text-muted-foreground mt-1">
                  All withdrawals require 2FA verification for security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
