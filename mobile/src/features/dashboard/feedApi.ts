import { fetchRecommended, fetchTopMatches } from '@/features/referrers/referrersApi';
import { ReferrerCard } from '@/types/models';

/** A single Reels-style referral opportunity shown in the feed. */
export interface FeedItem {
  id: string; // referrer id — used for View Profile / Request Referral navigation
  matchScore: number;
  jobTitle: string;
  company: string;
  companyLogoUrl: string | null;
  companyVerified: boolean;
  location: string;
  experience: string; // e.g. "5+ Years"
  jobType: string; // e.g. "Full-time"
  skills: string[];
  description: string;
  referrer: {
    id: string;
    name: string;
    role: string; // "Senior Software Engineer @ Google"
    company: string;
    avatarUrl: string | null;
    online: boolean;
    verified: boolean;
    responseRate: number; // %
    referralsDone: number;
  };
  isSaved: boolean;
}

/** Stable pseudo-random from a string id (deterministic display-only stats). */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Map a referrer card into a feed opportunity. */
export function referrerToFeedItem(r: ReferrerCard): FeedItem {
  const firstName = r.fullName.split(' ')[0];
  const verified = r.verificationStatus === 'VERIFIED';
  return {
    id: r.id,
    matchScore: r.matchScore ?? 90,
    jobTitle: r.jobTitle ?? 'Open Role',
    company: r.company ?? 'Company',
    companyLogoUrl: r.companyLogoUrl,
    companyVerified: verified,
    location: r.location ?? 'Remote',
    experience: r.experienceYears != null ? `${r.experienceYears}+ Years` : 'Experienced',
    jobType: 'Full-time',
    skills: r.skills ?? [],
    description: `We're looking for a ${r.jobTitle ?? 'talented professional'} to join ${
      r.company ?? 'the team'
    } and build scalable, high-impact products. ${firstName} can refer you directly.`,
    referrer: {
      id: r.id,
      name: r.fullName,
      role: r.company ? `${r.jobTitle ?? 'Referrer'} @ ${r.company}` : (r.jobTitle ?? 'Referrer'),
      company: r.company ?? '',
      avatarUrl: r.avatarUrl,
      online: r.availabilityStatus === 'AVAILABLE_NOW',
      verified,
      // Display-only stats (the card API doesn't expose these yet).
      responseRate: Math.min(99, Math.max(70, Math.round((r.ratingAvg || 4.5) * 20))),
      referralsDone: 40 + (hashString(r.id) % 160),
    },
    isSaved: !!r.isSaved,
  };
}

/** Fetch the referral feed: top matches first, then recommended, de-duplicated. */
export async function fetchFeed(): Promise<FeedItem[]> {
  const [top, recommended] = await Promise.all([
    fetchTopMatches().catch(() => [] as ReferrerCard[]),
    fetchRecommended().catch(() => [] as ReferrerCard[]),
  ]);
  const seen = new Set<string>();
  const merged: ReferrerCard[] = [];
  for (const r of [...top, ...recommended]) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      merged.push(r);
    }
  }
  return merged.map(referrerToFeedItem);
}
