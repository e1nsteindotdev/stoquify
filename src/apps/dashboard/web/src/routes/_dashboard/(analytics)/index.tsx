import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/(analytics)/")({
  component: Page,
});

function Page() {
  return <div className="p-4 pt-0">Analytics page</div>;
}
