import { PageHeader } from "@/components/ui";
import { ServerPosClient } from "@/components/pos/ServerPosClient";

export default function PosPage() {
  return (
    <div>
      <PageHeader
        title="Server POS"
        description="3-tap ordering — color-coded grid, forced modifiers, fire to kitchen"
      />
      <ServerPosClient />
    </div>
  );
}
