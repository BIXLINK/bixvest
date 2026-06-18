import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ ACTIVATION ============
export const activateMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ code: z.string().trim().min(4) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const code = data.code.toUpperCase().trim();

    const { data: codeRow, error: codeErr } = await supabase
      .from("activation_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (codeErr) throw new Error(codeErr.message);
    if (!codeRow) throw new Error("Invalid activation code.");
    if (codeRow.status !== "unused") throw new Error("This code has already been used or is disabled.");

    const { data: userRow } = await supabase.auth.getUser();
    const email = userRow.user?.email?.toLowerCase();

    if (codeRow.assigned_email && email && codeRow.assigned_email.toLowerCase() !== email) {
      throw new Error("This activation code is assigned to a different email.");
    }

    const { error: updErr } = await supabase
      .from("activation_codes")
      .update({ status: "used", used_by: userId, used_at: new Date().toISOString() })
      .eq("id", codeRow.id)
      .eq("status", "unused");
    if (updErr) throw new Error(updErr.message);

    const { error: profErr } = await supabase
      .from("profiles")
      .update({ membership_status: "active", activated_at: new Date().toISOString() })
      .eq("id", userId);
    if (profErr) throw new Error(profErr.message);

    return { ok: true };
  });

// ============ STAKE ============
export const stakeVst = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ level: z.number().int().min(1).max(10) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: lvl, error: lvlErr } = await supabase
      .from("stake_levels").select("*").eq("level", data.level).maybeSingle();
    if (lvlErr || !lvl) throw new Error("Invalid stake level.");

    const { data: profile, error: pErr } = await supabase
      .from("profiles").select("vst_balance, vst_locked, current_stake_level").eq("id", userId).maybeSingle();
    if (pErr || !profile) throw new Error("Profile not found.");

    if (data.level <= profile.current_stake_level) throw new Error("You already hold this level or higher.");
    const needed = Number(lvl.vst_required) - Number(profile.vst_locked ?? 0);
    if (Number(profile.vst_balance) < needed) throw new Error("Insufficient VST balance.");

    const newBal = Number(profile.vst_balance) - needed;
    const newLocked = Number(profile.vst_locked ?? 0) + needed;

    const { error: updErr } = await supabase
      .from("profiles")
      .update({ vst_balance: newBal, vst_locked: newLocked, current_stake_level: data.level })
      .eq("id", userId);
    if (updErr) throw new Error(updErr.message);

    const { data: stake } = await supabase
      .from("stakes")
      .insert({ user_id: userId, level: data.level, amount: needed })
      .select().single();

    await supabase.from("wallet_transactions").insert({
      user_id: userId, type: "stake", amount: -needed, balance_after: newBal,
      note: `Staked into ${lvl.name}`, reference_table: "stakes", reference_id: stake?.id,
    });

    return { ok: true, level: data.level };
  });

// ============ ADMIN: generate activation codes ============
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
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userId });
    if (!isAdmin) throw new Error("Forbidden");

    const rows = Array.from({ length: data.count }, () => ({
      code: randCode(),
      assigned_email: data.assigned_email ?? null,
      created_by: userId,
    }));
    const { data: inserted, error } = await supabase.from("activation_codes").insert(rows).select();
    if (error) throw new Error(error.message);
    return { codes: inserted };
  });

export const disableActivationCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userId });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabase.from("activation_codes").update({ status: "disabled" }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ ADMIN: adjust VST ============
export const adminAdjustVst = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    amount: z.number().int(),
    note: z.string().max(500).default(""),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userId });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: target, error } = await supabase
      .from("profiles").select("vst_balance").eq("id", data.user_id).maybeSingle();
    if (error || !target) throw new Error("User not found.");

    const newBal = Number(target.vst_balance) + data.amount;
    if (newBal < 0) throw new Error("Adjustment would put balance below zero.");

    await supabase.from("profiles").update({ vst_balance: newBal }).eq("id", data.user_id);
    await supabase.from("wallet_transactions").insert({
      user_id: data.user_id, type: "admin_adjust", amount: data.amount, balance_after: newBal, note: data.note,
    });
    return { ok: true, balance: newBal };
  });

export const setMembershipStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    status: z.enum(["pending", "active", "suspended"]),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userId });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabase.from("profiles").update({ membership_status: data.status }).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ TASKS: submit + review ============
export const submitTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    task_id: z.string().uuid(),
    proof: z.string().max(2000).default(""),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
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
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userId });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: sub, error: sErr } = await supabase
      .from("task_submissions").select("*, tasks(*)").eq("id", data.submission_id).maybeSingle();
    if (sErr || !sub) throw new Error("Submission not found.");
    if (sub.status !== "pending") throw new Error("Already reviewed.");

    let awarded = 0;
    if (data.decision === "approved" && sub.tasks) {
      awarded = Number(sub.tasks.vst_reward ?? 0);
      const { data: prof } = await supabase.from("profiles").select("vst_balance").eq("id", sub.user_id).maybeSingle();
      const newBal = Number(prof?.vst_balance ?? 0) + awarded;
      await supabase.from("profiles").update({ vst_balance: newBal }).eq("id", sub.user_id);
      await supabase.from("wallet_transactions").insert({
        user_id: sub.user_id, type: "earn", amount: awarded, balance_after: newBal,
        note: `Task: ${sub.tasks.title}`, reference_table: "task_submissions", reference_id: sub.id,
      });
    }

    await supabase.from("task_submissions").update({
      status: data.decision, vst_awarded: awarded, reviewed_by: userId, reviewed_at: new Date().toISOString(),
    }).eq("id", data.submission_id);

    return { ok: true, awarded };
  });

// ============ ANALYTICS ============
export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userId });
    if (!isAdmin) throw new Error("Forbidden");

    const [{ count: totalUsers }, { count: activeMembers }, { data: vstAgg }, { count: campaigns }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("membership_status", "active"),
      supabase.from("profiles").select("vst_balance, vst_locked"),
      supabase.from("campaigns").select("*", { count: "exact", head: true }),
    ]);

    const totalIssued = (vstAgg ?? []).reduce((s, r) => s + Number(r.vst_balance) + Number(r.vst_locked), 0);
    const totalStaked = (vstAgg ?? []).reduce((s, r) => s + Number(r.vst_locked), 0);

    return {
      totalUsers: totalUsers ?? 0,
      activeMembers: activeMembers ?? 0,
      totalIssued,
      totalStaked,
      campaigns: campaigns ?? 0,
    };
  });
