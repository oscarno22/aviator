import { defineKey } from "./storage";

/** Checked item indices per checklist id. */
export const checklistProgressKey = defineKey<Record<string, number[]>>("checklist-progress", 1, {});
