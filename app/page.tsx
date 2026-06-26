import dynamic from "next/dynamic";

// The whole app is client-side (it reads/writes localStorage and the clock),
// so it's loaded with SSR disabled. A light placeholder avoids a flash of
// unstyled content while the bundle hydrates.
const TodoApp = dynamic(() => import("@/components/TodoApp"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-screen place-items-center text-muted">
      <div className="animate-pulse text-sm">Laddar Pathly…</div>
    </div>
  ),
});

export default function Page() {
  return <TodoApp />;
}
