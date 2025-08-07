import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/clients/")({
  component: Page,
});

function Page() {
  return <div>Clients page</div>;
}
