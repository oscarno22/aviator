import { defineKey } from "./storage";
import type { TaskResult } from "@/sim/scoring";

export const simResultsKey = defineKey<TaskResult[]>("sim-results", 1, []);
export const MAX_RESULTS = 60;
