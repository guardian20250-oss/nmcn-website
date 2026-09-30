import { prisma } from "@/lib/prisma";

export const SITE_SETTING_KEYS = [
  "stat_creators",
  "stat_partner_agencies",
  "stat_battles_completed",
  "stat_countries",
  "hero_subtitle",
] as const;

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];

export type SiteSettingsData = Record<SiteSettingKey, string>;

export interface SiteSettingField {
  key: SiteSettingKey;
  label: string;
  hint: string;
  maxLength: number;
  multiline?: boolean;
}

export const SITE_SETTING_FIELDS: SiteSettingField[] = [
  {
    key: "stat_creators",
    label: "Creators",
    hint: "Shown in the home page stats grid. Accepts a suffix, e.g. 100+",
    maxLength: 12,
  },
  {
    key: "stat_partner_agencies",
    label: "Partner Agencies",
    hint: "Shown in the stats grid and repeated in the Growing Network blurb",
    maxLength: 12,
  },
  {
    key: "stat_battles_completed",
    label: "Battles Completed",
    hint: "Shown in the home page stats grid. Accepts a suffix, e.g. 500+",
    maxLength: 12,
  },
  {
    key: "stat_countries",
    label: "Countries",
    hint: "Shown in the home page stats grid, e.g. 2 for US & Canada",
    maxLength: 12,
  },
  {
    key: "hero_subtitle",
    label: "Home Page Intro",
    hint: "The paragraph under \"Your Empire Starts With The Right Family\"",
    maxLength: 500,
    multiline: true,
  },
];

const DEFAULT_SETTINGS: SiteSettingsData = {
  stat_creators: "100+",
  stat_partner_agencies: "14",
  stat_battles_completed: "500+",
  stat_countries: "2",
  hero_subtitle:
    "Nexus Mafia Creator Network LLC - Professional creator management, battle coordination, and personalized coaching for TikTok LIVE creators and agencies across the US & Canada.",
};

export function defaultSiteSettings(): SiteSettingsData {
  return { ...DEFAULT_SETTINGS };
}

function sanitize(raw: unknown): string {
  return String(raw ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .trim();
}

export function validateSiteSettings(
  input: Record<string, unknown>
): { data: Partial<SiteSettingsData>; error?: string } {
  const data: Partial<SiteSettingsData> = {};

  for (const field of SITE_SETTING_FIELDS) {
    if (!(field.key in input)) continue;
    const value = sanitize(input[field.key]);
    if (!value) {
      return { data: {}, error: `${field.label} cannot be empty` };
    }
    if (value.length > field.maxLength) {
      return {
        data: {},
        error: `${field.label} must be ${field.maxLength} characters or fewer`,
      };
    }
    data[field.key] = value;
  }

  if (!Object.keys(data).length) {
    return { data: {}, error: "No settings provided" };
  }

  return { data };
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  const settings = defaultSiteSettings();
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: [...SITE_SETTING_KEYS] } },
    });
    for (const row of rows) {
      const value = sanitize(row.value);
      if (value && row.key in settings) {
        settings[row.key as SiteSettingKey] = value;
      }
    }
  } catch (err) {
    console.error("Load site settings error:", err);
  }
  return settings;
}
