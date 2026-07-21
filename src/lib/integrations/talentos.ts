export interface TalentOSCandidate {
  name: string;
  email: string;
  linkedinUrl: string;
  degree: string;
  school: string;
  authorization: string;
  source: string;
  notes: string;
}

export async function handoffToTalentOS(candidate: TalentOSCandidate): Promise<{ success: boolean; talentosId?: string }> {
  const enabled = process.env.TALENTOS_HANDOFF_ENABLED === "true";
  if (!enabled) {
    console.log("[talentos] Handoff disabled via TALENTOS_HANDOFF_ENABLED flag");
    return { success: false };
  }

  const endpoint = process.env.TALENTOS_INTAKE_ENDPOINT;
  if (!endpoint) {
    console.warn("[talentos] TALENTOS_INTAKE_ENDPOINT not configured");
    return { success: false };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: candidate.name,
        email: candidate.email,
        linkedin_url: candidate.linkedinUrl,
        degree: candidate.degree,
        school: candidate.school,
        authorization: candidate.authorization,
        source: candidate.source,
        notes: candidate.notes,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`TalentOS intake failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    return { success: true, talentosId: data.id };
  } catch (err: any) {
    console.error("[talentos] Handoff error:", err.message);
    return { success: false };
  }
}
