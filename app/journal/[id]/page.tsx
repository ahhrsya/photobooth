import { JournalView } from "./JournalView";

// generateStaticParams must live in a Server Component (no "use client").
// Journal IDs are runtime-generated, so we pre-render a single placeholder
// shell "__". Cloudflare Pages _redirects rewrites /journal/[any-id] → /journal/__/
// and useParams() in JournalView reads the real URL at runtime.
export function generateStaticParams() {
  return [{ id: "__" }];
}

export default function Page() {
  return <JournalView />;
}
