import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/vault")({
  beforeLoad: () => {
    throw redirect({ to: "/staking", replace: true });
  },
});
