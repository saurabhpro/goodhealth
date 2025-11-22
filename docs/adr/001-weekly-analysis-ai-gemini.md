# ADR 001: Use Google Gemini AI for Weekly Workout Analysis

**Status:** Accepted
**Date:** 2025-11-22
**Deciders:** Development Team

## Context

Users need personalized insights into their workout performance. Manual analysis is not scalable. Need automated system to analyze weekly workout data and provide actionable recommendations.

## Decision

Use Google Gemini 2.5 Pro for AI-powered weekly workout analysis running via Vercel Cron every Monday at 8:00 AM.

## Rationale

**Why Gemini:**
- Cost-effective ($0.01 per analysis vs ChatGPT $0.05+)
- Fast response times (<2s)
- Good at structured output (JSON)
- Free tier available for development

**Why Monday 8AM:**
- Start of week motivation
- Users ready for new week planning
- Low server load time

**Why Vercel Cron:**
- Built-in, no external services
- Free tier sufficient
- Simple configuration
- Automatic scaling

## Alternatives Considered

1. **OpenAI GPT-4** - Rejected: 5x more expensive
2. **Manual scheduled job (AWS Lambda)** - Rejected: Extra infrastructure
3. **Real-time analysis on-demand** - Rejected: Higher costs, inconsistent user behavior

## Consequences

**Positive:**
- Low cost at scale
- Automated, reliable
- Personalized insights

**Negative:**
- Vendor lock-in to Google AI
- API rate limits (mitigated by batching)
- Requires GEMINI_API_KEY for production

## Implementation

- Service: `lib/weekly-analysis/ai-analyzer.ts`
- Cron: `app/api/cron/weekly-analysis/route.ts`
- Schedule: `vercel.json`
