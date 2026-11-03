// src/main.tsx
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./index.css";
import { createQueryClient } from "./lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  AppErrorBoundary,
  RouteErrorComponent,
} from "@/components/error-boundary";
import { initSentry } from "./lib/sentry";

const router = createRouter({
  routeTree,
  defaultErrorComponent: RouteErrorComponent,
});
const queryClient = createQueryClient();

// Registers the router type globally, which makes Link, useNavigate, etc. type-safe
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

initSentry();

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <AppErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </AppErrorBoundary>
    </StrictMode>,
  );
}
