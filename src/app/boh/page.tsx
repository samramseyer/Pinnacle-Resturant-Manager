import { PageHeader } from "@/components/ui";
import { BohClient } from "@/components/boh/BohClient";

export default function BohPage() {
  return (
    <div>
      <PageHeader
        title="BOH Controls"
        description="Instant 86, live stock countdowns, and daypart menus — syncs to POS in real time"
      />
      <BohClient />
    </div>
  );
}
