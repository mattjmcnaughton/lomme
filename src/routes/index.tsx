import { createFileRoute } from "@tanstack/react-router";
import PracticeScreen from "../practice/PracticeScreen";

export const Route = createFileRoute("/")({
  component: PracticeScreen,
});
