import { generateDedupeKey } from "./dedupe";

export interface ExternalContact {
  email?: string;
  linkedin_url?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  source: string;
}

export function crossSourceDedupe(
  contacts: ExternalContact[],
  existingDedupeKeys: Set<string>
): { newContacts: ExternalContact[]; duplicates: ExternalContact[] } {
  const newContacts: ExternalContact[] = [];
  const duplicates: ExternalContact[] = [];

  for (const contact of contacts) {
    const key = generateDedupeKey(contact);
    if (existingDedupeKeys.has(key)) {
      duplicates.push(contact);
    } else {
      existingDedupeKeys.add(key);
      newContacts.push(contact);
    }
  }

  return { newContacts, duplicates };
}
