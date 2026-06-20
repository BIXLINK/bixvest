import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// All privileged writes use the admin client (RLS bypassed) AFTER server-side
// authorization checks via requireSupabaseAuth + is_admin. Money movement
// goes through the `post_ledger` SQL function so wallet_transactions stays
// authoritative.

async function postLedger(
  admin: any,
  args: {
    user_id: string;
    type: string;
    amount: number;
    source?: string;
    destination?: string;
    note?: string;
    reference_table?: string | null;
    reference_id?: string | null;
  },
) {
  const { data, error } = await admin.rpc("post_ledger", {
    _user_id: args.user_id,
    _type: args.type,
    _amount: args.amount,
    _source: args.source ?? "system",
    _destination: args.destination ?? "user",
    _note: args.note ?? "",
    _reference_table: args.reference_table ?? null,
    _reference_id: args.reference_id ?? null,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return { tx_id: row?.tx_id as string, balance_after: Number(row?.balance_after ?? 0) };
}

async function recomputeBix(admin: any, userId: string) {
  await admin.rpc("recompute_bix_score", { _user_id: userId });
}

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
  return supabaseAdmin;
}

async function logAudit(admin: any, actor: string, action: string, target_type: string | null, target_id: string | null, payload: any = {}) {
  await admin.rpc("log_audit", {
    _actor: actor,
    _action: action,
    _target_type: target_type,
    _target_id: target_id,
    _payload: payload,
  });
}

async function rateLimit(admin: any, userId: string, action: string, max: number, windowSec: number) {
  const { data, error } = await admin.rpc("check_rate_limit", {
    _user_id: userId, _action: action, _max: max, _window_seconds: windowSec,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Too many requests. Please slow down.");
}

// ============ ACTIVATION ============
export const activateMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ code: z.string().trim().min(4) }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await rateLimit(supabaseAdmin, userId, "activate", 5, 3600);
    const code = data.code.toUpperCase().trim();

    const { data: codeRow, error: codeErr } = await supabaseAdmin
      .from("activation_codes").select("*").eq("code", code).maybeSingle();
    if (codeErr) throw new Error(codeErr.message);
    if (!codeRow) throw new Error("Invalid activation code.");
    if (codeRow.status !== "unused") throw new Error("This code has already been used or is disabled.");

    const { data: userRow } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = userRow.user?.email?.toLowerCase();
    if (codeRow.assigned_email && email && codeRow.assigned_email.toLowerCase() !== email) {
      throw new Error("This activation code is assigned to a different email.");
    }

    const { data: claimed, error: updErr } = await supabaseAdmin
      .from("activation_codes")
      .update({ status: "used", used_by: userId, used_at: new Date().toISOString() })
      .eq("id", codeRow.id).eq("status", "unused").select().maybeSingle();
    if (updErr) throw new Error(updErr.message);
    if (!claimed) throw new Error("This code was just claimed by someone else.");

    await supabaseAdmin.from("profiles")
      .update({ membership_status: "active", activated_at: new Date().toISOString() })
      .eq("id", userId);

    // Seed onboarding missions
    const { data: missions } = await supabaseAdmin.from("onboarding_missions").select("id");
    if (missions && missions.length) {
      await supabaseAdmin.from("user_missions").upsert(
        missions.map((m: any) => ({ user_id: userId, mission_id: m.id, status: "pending" })),
        { onConflict: "user_id,mission_id", ignoreDuplicates: true },
      );
    }

    // Referral reward
    const { data: profile } = await supabaseAdmin.from("profiles")
      .select("referred_by").eq("id", userId).maybeSingle();
    if (profile?.referred_by) {
      const { data: cfg } = await supabaseAdmin.from("app_config").select("value").eq("key", "referral_reward").maybeSingle();
      const amount = Number(cfg?.value ?? 500);
      const { data: existing } = await supabaseAdmin.from("referral_rewards")
        .select("id").eq("referrer_id", profile.referred_by).eq("referred_id", userId).maybeSingle();
      if (!existing) {
        await supabaseAdmin.from("referral_rewards").insert({
          referrer_id: profile.referred_by, referred_id: userId, amount, status: "paid",
        });
        await postLedger(supabaseAdmin, {
          user_id: profile.referred_by, type: "referral", amount,
          source: "system", destination: "user",
          note: "Referral activation reward",
        });
        await recomputeBix(supabaseAdmin, profile.referred_by);
      }
    }

    return { ok: true };
  });

// ============ STAKE ============
export const stakeVst = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ level: z.number().int().min(1).max(10) }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: lvl } = await supabaseAdmin.from("stake_levels").select("*").eq("level", data.level).maybeSingle();
    if (!lvl) throw new Error("Invalid stake level.");

    const { data: profile } = await supabaseAdmin
      .from("profiles").select("vst_balance, vst_locked, current_stake_level, membership_status")
      .eq("id", userId).maybeSingle();
    if (!profile) throw new Error("Profile not found.");
    if (profile.membership_status !== "active") throw new Error("Activate your membership first.");
    if (data.level <= profile.current_stake_level) throw new Error("You already hold this level or higher.");
    if (data.level !== profile.current_stake_level + 1) throw new Error("Stake levels must be unlocked sequentially.");

    const needed = Number(lvl.vst_required) - Number(profile.vst_locked ?? 0);
    if (Number(profile.vst_balance) < needed) throw new Error("Insufficient VST balance.");

    // Post negative ledger entry (debit) — handles atomic balance update
    const { tx_id } = await postLedger(supabaseAdmin, {
      user_id: userId, type: "stake", amount: -needed,
      source: "user", destination: "vault",
      note: `Staked into ${lvl.name}`,
    });

    const newLocked = Number(profile.vst_locked ?? 0) + needed;
    await supabaseAdmin.from("profiles")
      .update({ vst_locked: newLocked, current_stake_level: data.level }).eq("id", userId);
    await supabaseAdmin.from("stakes").insert({
      user_id: userId, level: data.level, amount: needed,
    });
    return { ok: true, level: data.level, tx_id };
  });

// ============ ADMIN: activation codes ============
function randCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `VST-${part()}-${part()}`;
}

export const generateActivationCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    count: z.number().int().min(1).max(500),
    assigned_email: z.string().email().optional().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context.userId);
    const rows = Array.from({ length: data.count }, () => ({
      code: randCode(),
      assigned_email: data.assigned_email ?? null,
      created_by: context.userId,
    }));
    const { data: inserted, error } = await admin.from("activation_codes").insert(rows).select();
    if (error) throw new Error(error.message);
    await logAudit(admin, context.userId, "generate_codes", "activation_codes", null, { count: data.count });
    return { codes: inserted };
  });

export const disableActivationCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context.userId);
    const { error } = await admin.from("activation_codes").update({ status: "disabled" }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit(admin, context.userId, "disable_code", "activation_codes", data.id, {});
    return { ok: true };
  });

// ============ ADMIN: adjust VST (via ledger) ============
export const adminAdjustVst = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    amount: z.number().int(),
    note: z.string().max(500).default(""),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context.userId);
    const { balance_after } = await postLedger(admin, {
      user_id: data.user_id, type: "admin_adjust", amount: data.amount,
      source: "admin", destination: "user", note: data.note || "Admin adjustment",
    });
    await logAudit(admin, context.userId, "adjust_vst", "profiles", data.user_id, { amount: data.amount, note: data.note });
    return { ok: true, balance: balance_after };
  });

export const setMembershipStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    status: z.enum(["pending", "active", "suspended"]),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context.userId);
    const patch = data.status === "active"
      ? { membership_status: data.status, activated_at: new Date().toISOString() }
      : { membership_status: data.status };
    const { error } = await admin.from("profiles").update(patch).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    await logAudit(admin, context.userId, "set_status", "profiles", data.user_id, { status: data.status });
    return { ok: true };
  });

// ============ TASKS ============
export const submitTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    task_id: z.string().uuid(),
    proof: z.string().max(2000).default(""),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("task_submissions").select("id, status")
      .eq("user_id", userId).eq("task_id", data.task_id)
      .in("status", ["pending", "approved"]).maybeSingle();
    if (existing) {
      throw new Error(existing.status === "approved"
        ? "You already completed this task."
        : "You already have a pending submission for this task.");
    }
    const { error } = await supabase.from("task_submissions")
      .insert({ user_id: userId, task_id: data.task_id, proof: data.proof });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reviewSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    submission_id: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context.userId);
    const { data: sub } = await admin
      .from("task_submissions").select("*, tasks(*)").eq("id", data.submission_id).maybeSingle();
    if (!sub) throw new Error("Submission not found.");
    if (sub.status !== "pending") throw new Error("Already reviewed.");

    let awarded = 0;
    if (data.decision === "approved" && sub.tasks) {
      awarded = Number(sub.tasks.vst_reward ?? 0);
      await postLedger(admin, {
        user_id: sub.user_id, type: "earn", amount: awarded,
        source: "system", destination: "user",
        note: `Task: ${sub.tasks.title}`,
        reference_table: "task_submissions", reference_id: sub.id,
      });
      await recomputeBix(admin, sub.user_id);
    }
    await admin.from("task_submissions").update({
      status: data.decision, vst_awarded: awarded,
      reviewed_by: context.userId, reviewed_at: new Date().toISOString(),
    }).eq("id", data.submission_id);
    await logAudit(admin, context.userId, "review_submission", "task_submissions", data.submission_id, { decision: data.decision, awarded });
    return { ok: true, awarded };
  });

// ============ DAILY CLAIMS ============
export const claimDaily = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    type: z.enum(["login", "learning", "community"]),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await rateLimit(supabaseAdmin, userId, `daily_${data.type}`, 5, 60);

    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabaseAdmin.from("daily_claims")
      .select("id").eq("user_id", userId).eq("claim_type", data.type).eq("claim_date", today).maybeSingle();
    if (existing) throw new Error("Already claimed today.");

    const keyMap: Record<string, string> = {
      login: "daily_login_reward",
      learning: "daily_learning_reward",
      community: "daily_community_reward",
    };
    const { data: cfg } = await supabaseAdmin.from("app_config").select("value").eq("key", keyMap[data.type]).maybeSingle();
    const amount = Number(cfg?.value ?? 50);

    const { data: claim, error: cErr } = await supabaseAdmin.from("daily_claims")
      .insert({ user_id: userId, claim_type: data.type, amount }).select().single();
    if (cErr) throw new Error(cErr.message);

    await postLedger(supabaseAdmin, {
      user_id: userId, type: "daily", amount,
      source: "system", destination: "user",
      note: `Daily ${data.type} bonus`,
      reference_table: "daily_claims", reference_id: claim.id,
    });

    // Update streak
    const { data: prof } = await supabaseAdmin.from("profiles")
      .select("current_streak, last_claim_date").eq("id", userId).maybeSingle();
    let streak = prof?.current_streak ?? 0;
    const last = prof?.last_claim_date;
    if (data.type === "login") {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yesterday = y.toISOString().slice(0, 10);
      streak = last === today ? streak : last === yesterday ? streak + 1 : 1;
      await supabaseAdmin.from("profiles").update({
        current_streak: streak, last_claim_date: today,
      }).eq("id", userId);
    }
    await recomputeBix(supabaseAdmin, userId);
    return { ok: true, amount };
  });

// ============ MISSIONS ============
export const completeMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ mission_id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: m } = await supabaseAdmin.from("user_missions")
      .select("*, onboarding_missions(*)")
      .eq("user_id", userId).eq("mission_id", data.mission_id).maybeSingle();
    if (!m) throw new Error("Mission not assigned.");
    if (m.status === "completed") throw new Error("Already completed.");

    // Server-side validation per mission
    const { data: prof } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (!prof) throw new Error("Profile missing.");
    if (data.mission_id === "complete_profile" && !(prof.full_name && prof.full_name.length >= 2)) {
      throw new Error("Add your full name in Profile first.");
    }
    if (data.mission_id === "verify_email") {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!u.user?.email_confirmed_at) throw new Error("Email not yet verified.");
    }

    const reward = Number(m.onboarding_missions?.reward ?? 0);
    await supabaseAdmin.from("user_missions").update({
      status: "completed", completed_at: new Date().toISOString(), vst_awarded: reward,
    }).eq("id", m.id);
    if (reward > 0) {
      await postLedger(supabaseAdmin, {
        user_id: userId, type: "mission", amount: reward,
        source: "system", destination: "user",
        note: `Mission: ${m.onboarding_missions?.title ?? data.mission_id}`,
        reference_table: "user_missions", reference_id: m.id,
      });
    }
    if (data.mission_id === "verify_email") {
      await supabaseAdmin.from("profiles").update({ verified: true }).eq("id", userId);
    }
    await recomputeBix(supabaseAdmin, userId);
    return { ok: true, awarded: reward };
  });

// ============ CAMPAIGNS ============
export const participateInCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    campaign_id: z.string().uuid(),
    proof: z.string().max(2000).default(""),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await rateLimit(supabaseAdmin, userId, "campaign_join", 20, 3600);

    const { data: camp } = await supabaseAdmin.from("campaigns").select("*").eq("id", data.campaign_id).maybeSingle();
    if (!camp) throw new Error("Campaign not found.");
    if (camp.status !== "active") throw new Error("Campaign is not active.");
    if (camp.end_at && new Date(camp.end_at) < new Date()) throw new Error("Campaign has ended.");
    if (camp.budget && Number(camp.spent) + Number(camp.vst_reward) > Number(camp.budget)) {
      throw new Error("Campaign budget exhausted.");
    }

    const { data: prof } = await supabaseAdmin.from("profiles").select("bix_score").eq("id", userId).maybeSingle();
    if (Number(prof?.bix_score ?? 0) < Number(camp.min_bix_score ?? 0)) {
      throw new Error(`Requires BIX Score ≥ ${camp.min_bix_score}.`);
    }

    const { data: exists } = await supabaseAdmin.from("campaign_participations")
      .select("id, status").eq("campaign_id", data.campaign_id).eq("user_id", userId).maybeSingle();
    if (exists) throw new Error("Already participated in this campaign.");

    const { error } = await supabaseAdmin.from("campaign_participations")
      .insert({ campaign_id: data.campaign_id, user_id: userId, proof: data.proof });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reviewParticipation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context.userId);
    const { data: p } = await admin.from("campaign_participations")
      .select("*, campaigns(*)").eq("id", data.id).maybeSingle();
    if (!p) throw new Error("Not found.");
    if (p.status !== "pending") throw new Error("Already reviewed.");

    let awarded = 0;
    if (data.decision === "approved" && p.campaigns) {
      awarded = Number(p.campaigns.vst_reward ?? 0);
      await postLedger(admin, {
        user_id: p.user_id, type: "campaign", amount: awarded,
        source: "system", destination: "user",
        note: `Campaign: ${p.campaigns.title}`,
        reference_table: "campaign_participations", reference_id: p.id,
      });
      await admin.from("campaigns").update({
        spent: Number(p.campaigns.spent ?? 0) + awarded,
      }).eq("id", p.campaign_id);
      await recomputeBix(admin, p.user_id);
    }
    await admin.from("campaign_participations").update({
      status: data.decision, vst_awarded: awarded,
      reviewed_by: context.userId, reviewed_at: new Date().toISOString(),
    }).eq("id", data.id);
    await logAudit(admin, context.userId, "review_participation", "campaign_participations", data.id, { decision: data.decision, awarded });
    return { ok: true, awarded };
  });

// ============ ADMIN: ledger explorer ============
export const getLedgerPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid().optional(),
    type: z.string().optional(),
    limit: z.number().int().min(1).max(200).default(100),
    offset: z.number().int().min(0).default(0),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context.userId);
    let q = admin.from("wallet_transactions").select("*, profiles(full_name, email)", { count: "exact" })
      .order("created_at", { ascending: false }).range(data.offset, data.offset + data.limit - 1);
    if (data.user_id) q = q.eq("user_id", data.user_id);
    if (data.type) q = q.eq("type", data.type);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

// ============ ADMIN: app config ============
export const setAppConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    key: z.string().min(1),
    value: z.any(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context.userId);
    const { error } = await admin.from("app_config")
      .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString(), updated_by: context.userId });
    if (error) throw new Error(error.message);
    await logAudit(admin, context.userId, "set_config", "app_config", data.key, { value: data.value });
    return { ok: true };
  });

// ============ ADMIN: invest products ============
export const upsertInvestProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    description: z.string().default(""),
    min_amount: z.number().min(0),
    apr: z.number().min(0),
    status: z.enum(["draft", "active", "closed"]).default("draft"),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context.userId);
    if (data.id) {
      const { error } = await admin.from("invest_products").update({
        name: data.name, description: data.description, min_amount: data.min_amount, apr: data.apr, status: data.status,
      }).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await admin.from("invest_products").insert({
        name: data.name, description: data.description, min_amount: data.min_amount, apr: data.apr, status: data.status,
      });
      if (error) throw new Error(error.message);
    }
    await logAudit(admin, context.userId, "upsert_invest_product", "invest_products", data.id ?? null, data);
    return { ok: true };
  });

// ============ ANALYTICS ============
export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertAdmin(context.userId);
    const day = new Date(Date.now() - 86400_000).toISOString();
    const week = new Date(Date.now() - 7 * 86400_000).toISOString();

    const [
      { count: totalUsers },
      { count: activeMembers },
      { data: vstAgg },
      { count: campaigns },
      { count: pendingSubs },
      { count: pendingParts },
      { count: tasksCount },
      { count: codesUsed },
      { count: codesUnused },
      { data: vol24 },
      { data: vol7 },
    ] = await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin.from("profiles").select("*", { count: "exact", head: true }).eq("membership_status", "active"),
      admin.from("profiles").select("vst_balance, vst_locked"),
      admin.from("campaigns").select("*", { count: "exact", head: true }),
      admin.from("task_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("campaign_participations").select("*", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("tasks").select("*", { count: "exact", head: true }).eq("status", "active"),
      admin.from("activation_codes").select("*", { count: "exact", head: true }).eq("status", "used"),
      admin.from("activation_codes").select("*", { count: "exact", head: true }).eq("status", "unused"),
      admin.from("wallet_transactions").select("amount").gte("created_at", day),
      admin.from("wallet_transactions").select("amount").gte("created_at", week),
    ]);

    const totalIssued = (vstAgg ?? []).reduce((s: number, r: any) => s + Number(r.vst_balance) + Number(r.vst_locked), 0);
    const totalStaked = (vstAgg ?? []).reduce((s: number, r: any) => s + Number(r.vst_locked), 0);
    const volume24 = (vol24 ?? []).reduce((s: number, r: any) => s + Math.abs(Number(r.amount)), 0);
    const volume7d = (vol7 ?? []).reduce((s: number, r: any) => s + Math.abs(Number(r.amount)), 0);

    return {
      totalUsers: totalUsers ?? 0,
      activeMembers: activeMembers ?? 0,
      totalIssued,
      totalStaked,
      campaigns: campaigns ?? 0,
      pendingSubmissions: pendingSubs ?? 0,
      pendingParticipations: pendingParts ?? 0,
      activeTasks: tasksCount ?? 0,
      codesUsed: codesUsed ?? 0,
      codesUnused: codesUnused ?? 0,
      volume24,
      volume7d,
    };
  });
