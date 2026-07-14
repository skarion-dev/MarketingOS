"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  channel_id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  goals: string | null;
  created_at: string;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/marketing/campaigns/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setCampaign(null);
        else setCampaign(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-zinc-400">Loading...</p>;
  if (!campaign) return <p className="text-red-400">Campaign not found.</p>;

  return (
    <div>
      <Link href="/marketing/campaigns" className="text-sm text-zinc-400 hover:text-zinc-200 mb-4 inline-block">
        &larr; Back to campaigns
      </Link>
      <h1 className="text-2xl font-bold mb-2">{campaign.name}</h1>
      <div className="flex gap-2 mb-4">
        <span className={`text-xs px-2 py-0.5 rounded ${
          campaign.status === "active" ? "bg-green-900 text-green-300" :
          campaign.status === "completed" ? "bg-zinc-700 text-zinc-300" :
          "bg-yellow-900 text-yellow-300"
        }`}>
          {campaign.status}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        {campaign.goals && (
          <p><span className="text-zinc-400">Goals:</span> {campaign.goals}</p>
        )}
        {campaign.start_date && (
          <p><span className="text-zinc-400">Start:</span> {new Date(campaign.start_date).toLocaleDateString()}</p>
        )}
        {campaign.end_date && (
          <p><span className="text-zinc-400">End:</span> {new Date(campaign.end_date).toLocaleDateString()}</p>
        )}
        <p><span className="text-zinc-400">Created:</span> {new Date(campaign.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
