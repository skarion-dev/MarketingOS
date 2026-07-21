export interface PublishContent {
  title?: string;
  body: string;
  url?: string;
  imageUrl?: string;
}

export interface PublishResult {
  externalId: string;
  url: string;
}

export interface MetricsResult {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
}

export interface SocialPublisher {
  publish(content: PublishContent): Promise<PublishResult>;
  fetchMetrics(externalId: string): Promise<MetricsResult>;
  healthCheck(): Promise<boolean>;
  deletePost?(externalId: string): Promise<void>;
}

export const PUBLISHER_REGISTRY: Map<string, (token: string, accountId?: string) => SocialPublisher> = new Map();

export function registerPublisher(
  provider: string,
  factory: (token: string, accountId?: string) => SocialPublisher
) {
  PUBLISHER_REGISTRY.set(provider, factory);
}

export function getPublisher(
  provider: string,
  token: string,
  accountId?: string
): SocialPublisher {
  const factory = PUBLISHER_REGISTRY.get(provider);
  if (!factory) throw new Error(`Unknown publisher provider: ${provider}`);
  return factory(token, accountId);
}
