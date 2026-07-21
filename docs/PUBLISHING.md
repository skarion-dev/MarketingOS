# Publishing Setup

This document covers per-platform app setup for MarketingOS publishing adapters.

## Human approval guarantee

MarketingOS never auto-publishes. Content must go through the lifecycle:
`idea → draft → in_review → approved → scheduled → published`

Only `approved` content can be queued for publishing. There is no fully automated publish path.

## Platform app approvals — START EARLY

Each publishing adapter requires a real platform app. Review takes days to weeks:

### LinkedIn
- **App:** Developer app at https://www.linkedin.com/developers/
- **Scopes:** `w_member_social` (Share on LinkedIn)
- **Company pages:** Community Management API access required
- **Callback URL:** `{APP_URL}/api/marketing/connect/linkedin/callback`

### Meta (Facebook)
- **App:** Meta Developer app at https://developers.facebook.com/
- **Scopes:** `pages_manage_posts` (post to Facebook pages)
- **App Review:** Required for `pages_manage_posts` permission
- **Callback URL:** `{APP_URL}/api/marketing/connect/facebook/callback`

### Reddit
- **App:** Reddit OAuth2 app at https://www.reddit.com/prefs/apps
- **Scopes:** `submit`, `identity`, `read`
- **Callback URL:** `{APP_URL}/api/marketing/connect/reddit/callback`
- **Rate limits:** 60 requests/minute. Respect subreddit self-promotion rules.

### X (Twitter)
- **Feature flag:** `X_PUBLISHING_ENABLED=true` (off by default)
- **API:** X API v2 (paid tier required for posting)
- **Callback URL:** `{APP_URL}/api/marketing/connect/x/callback`

### Email
- **Provider:** Resend (default) or AWS SES
- **Domain:** Verify sending domain
- **API key:** `RESEND_API_KEY` env var

## Environment variables
```
PUBLISH_DRY_RUN=true          # Logs instead of posting (default: true for safety)
X_PUBLISHING_ENABLED=false    # Paid tier, off by default
TALENTOS_HANDOFF_ENABLED=false

# OAuth client IDs/secrets (per workspace, stored in secret vault)
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
META_CLIENT_ID=
META_CLIENT_SECRET=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
X_CLIENT_ID=
X_CLIENT_SECRET=
RESEND_API_KEY=
```

## Dry-run mode
When `PUBLISH_DRY_RUN=true`, the publish worker logs the action instead of calling the platform API. Queue items are marked as "published" with a `dry-run.local` URL. Use this for testing the full pipeline.

## Rate limiting
Per-connection token bucket prevents hitting platform rate limits:
- LinkedIn: 5/min, 50/hr, 100/day
- Facebook: 10/min, 100/hr, 200/day
- Reddit: 5/min, 30/hr, 60/day
- X: 1/min, 20/hr, 50/day

## Queue retry behavior
Failed publishes retry up to 3 times with exponential backoff (1s, 2s, 4s). After 3 failures, the queue item is marked as `failed` and can be manually retried from the Publish Queue page.
