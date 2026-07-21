export interface FeatureFlags {
  xPublishing: boolean;
  talentosHandoff: boolean;
  publishDryRun: boolean;
}

const OVERRIDES: Record<string, Partial<FeatureFlags>> = {};

export function getFlags(workspaceId?: string): FeatureFlags {
  const defaults: FeatureFlags = {
    xPublishing: process.env.X_PUBLISHING_ENABLED === "true",
    talentosHandoff: process.env.TALENTOS_HANDOFF_ENABLED === "true",
    publishDryRun: process.env.PUBLISH_DRY_RUN !== "false",
  };

  if (workspaceId && OVERRIDES[workspaceId]) {
    return { ...defaults, ...OVERRIDES[workspaceId] };
  }

  return defaults;
}

export function setWorkspaceOverride(
  workspaceId: string,
  flags: Partial<FeatureFlags>
) {
  OVERRIDES[workspaceId] = flags;
}
