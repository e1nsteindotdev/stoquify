import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/settings/settings-page";

export const Route = createFileRoute("/_dashboard/parametres/")({
  component: Page,
});

function Page() {
  return <SettingsPage />;
}
