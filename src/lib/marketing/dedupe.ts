interface DedupeFields {
  email?: string;
  linkedin_url?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
}

export function generateDedupeKey(fields: DedupeFields): string {
  if (fields.email) return `email:${fields.email.toLowerCase().trim()}`;
  if (fields.linkedin_url) return `linkedin:${fields.linkedin_url.trim()}`;
  const name = [fields.first_name, fields.last_name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .trim();
  if (name && fields.company) {
    return `name:${name}|company:${fields.company.toLowerCase().trim()}`;
  }
  return `random:${crypto.randomUUID()}`;
}
