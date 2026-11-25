import { NextResponse } from "next/server";
import { authorize, fail, readJson, ADMIN_ROLES, MANAGE_ROLES } from "@/lib/api";
import { AUTOMATION_DEFAULTS, getAutomation, saveAutomation, type AutomationSettings } from "@/lib/automation";

export async function GET() {
  const auth = await authorize(MANAGE_ROLES);
  if ("response" in auth) return auth.response;
  return NextResponse.json({ rules: await getAutomation() });
}

export async function PUT(request: Request) {
  const auth = await authorize(ADMIN_ROLES);
  if ("response" in auth) return auth.response;
  const body = await readJson(request);

  const rules: AutomationSettings = { ...AUTOMATION_DEFAULTS };
  for (const key of Object.keys(AUTOMATION_DEFAULTS) as Array<keyof AutomationSettings>) {
    const value = body[key];
    if (value === undefined) {
      continue;
    }
    if (key === "dueReminderHours") {
      if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 168) {
        return fail("Pengingat tenggat harus 0-168 jam.");
      }
      rules.dueReminderHours = value as number;
    } else {
      if (typeof value !== "boolean") return fail(`Nilai ${key} harus true/false.`);
      rules[key] = value;
    }
  }
  return NextResponse.json({ rules: await saveAutomation(rules) });
}
