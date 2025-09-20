import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ConvexProvider, ConvexReactClient } from "convex/react";
import "../App.css"

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
if (!CONVEX_URL) {
  console.error("missing envar VITE_CONVEX_URL");
}
const convex = new ConvexReactClient(CONVEX_URL);

export const Route = createRootRoute({
  component: () => (
    <>
      <ConvexProvider client={convex}>
        <div className='font-sans'>
          <Outlet />
        </div>
      </ConvexProvider>
    </>
  ),
})
