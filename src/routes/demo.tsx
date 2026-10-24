import { createFileRoute } from "@tanstack/react-router";
import Demo from "@/App";

export const Route = createFileRoute("/demo")({
  component: Demo,
});
