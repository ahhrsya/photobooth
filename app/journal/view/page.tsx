"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { JournalView } from "../[id]/JournalView";

// Static route — reads journal ID from ?id= query param instead of dynamic segment.
// This avoids Next.js static export limitations with unknown dynamic paths.
function ViewInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  return <JournalView overrideId={id} />;
}

export default function JournalViewPage() {
  return (
    <Suspense>
      <ViewInner />
    </Suspense>
  );
}
