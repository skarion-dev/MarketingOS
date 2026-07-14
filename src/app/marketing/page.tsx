import { getActiveKeyByProvider } from "@/server/repositories/aiKeyRepository";

export default async function MarketingDashboard() {
  let providerStatus = "not configured";
  try {
    const key = await getActiveKeyByProvider("google");
    providerStatus = key ? "connected" : "not configured";
  } catch {
    providerStatus = "not configured";
  }

  const cards = [
    { label: "AI Provider", value: providerStatus },
    { label: "Campaigns", value: "—" },
    { label: "Prospects", value: "—" },
    { label: "Open Tasks", value: "—" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Marketing Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="border border-zinc-800 rounded-lg p-4 bg-zinc-900"
          >
            <p className="text-sm text-zinc-400">{card.label}</p>
            <p className="text-xl font-semibold mt-1">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
