import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/commandes/")({
  component: Page,
});

function Page() {
  return <div className="p-4 pt-0">Commandes page</div>;
}
