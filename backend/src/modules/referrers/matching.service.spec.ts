import { AvailabilityStatus } from '../../contracts/enums';
import { MatchingService, MatchWeights, ReferrerCandidate } from './matching.service';

const WEIGHTS: MatchWeights = {
  skillOverlap: 0.4,
  companyPreference: 0.2,
  locationMatch: 0.15,
  rolePreference: 0.15,
  availabilityBoost: 0.1,
};

// SeekerContext is internal; build the shape the scorer expects.
const ctx = (over: Partial<Record<string, Set<string>>> = {}) => ({
  skillNames: new Set(['java', 'react.js']),
  preferredCompanies: new Set(['google']),
  preferredLocations: new Set(['bengaluru']),
  preferredRoles: new Set(['backend developer']),
  ...over,
});

const candidate = (over: Partial<ReferrerCandidate> = {}): ReferrerCandidate => ({
  id: 'r1',
  jobTitle: 'Backend Developer',
  skills: [{ skill: { name: 'Java' } }, { skill: { name: 'React.js' } }],
  company: { name: 'Google' },
  location: { city: 'Bengaluru', country: 'India' },
  availabilitySetting: { availabilityStatus: AvailabilityStatus.AVAILABLE_NOW },
  ...over,
});

describe('MatchingService.score', () => {
  const service = new MatchingService({} as never);

  it('returns 100 for a perfect match', () => {
    expect(service.score(candidate(), ctx() as never, WEIGHTS)).toBe(100);
  });

  it('returns 0 when nothing matches', () => {
    const c = candidate({
      jobTitle: 'Chef',
      skills: [{ skill: { name: 'Cooking' } }],
      company: { name: 'Unknown' },
      location: { city: 'Nowhere', country: 'Atlantis' },
      availabilitySetting: { availabilityStatus: AvailabilityStatus.NOT_AVAILABLE },
    });
    expect(service.score(c, ctx() as never, WEIGHTS)).toBe(0);
  });

  it('weights skill overlap at 40 points', () => {
    // half the seeker's skills overlap, everything else misses
    const c = candidate({
      jobTitle: 'Chef',
      skills: [{ skill: { name: 'Java' } }],
      company: { name: 'Unknown' },
      location: { city: 'Nowhere', country: 'Atlantis' },
      availabilitySetting: { availabilityStatus: AvailabilityStatus.NOT_AVAILABLE },
    });
    // overlap = 1/2 -> 0.4 * 0.5 = 0.20 -> 20
    expect(service.score(c, ctx() as never, WEIGHTS)).toBe(20);
  });

  it('scales availability (1-2 weeks gives partial boost)', () => {
    const base = candidate({
      jobTitle: 'Chef',
      skills: [{ skill: { name: 'Cooking' } }],
      company: { name: 'Unknown' },
      location: { city: 'Nowhere', country: 'Atlantis' },
      availabilitySetting: { availabilityStatus: AvailabilityStatus.AVAILABLE_1_2_WEEKS },
    });
    // 0.10 * 0.7 = 0.07 -> 7
    expect(service.score(base, ctx() as never, WEIGHTS)).toBe(7);
  });

  it('handles a seeker with no skills without dividing by zero', () => {
    const score = service.score(candidate(), ctx({ skillNames: new Set() }) as never, WEIGHTS);
    expect(Number.isFinite(score)).toBe(true);
  });
});

describe('MatchingService.getWeights', () => {
  it('returns defaults when no PlatformSetting row exists', async () => {
    const prisma = { platformSetting: { findUnique: jest.fn().mockResolvedValue(null) } };
    const svc = new MatchingService(prisma as never);
    await expect(svc.getWeights()).resolves.toMatchObject({ skillOverlap: 0.4 });
  });

  it('merges stored weights over the defaults', async () => {
    const prisma = {
      platformSetting: {
        findUnique: jest.fn().mockResolvedValue({ value: { skillOverlap: 0.9 } }),
      },
    };
    const svc = new MatchingService(prisma as never);
    const w = await svc.getWeights();
    expect(w.skillOverlap).toBe(0.9);
    expect(w.availabilityBoost).toBe(0.1); // default preserved
  });
});

describe('MatchingService.buildSeekerContext', () => {
  it('lowercases skills and preferences into sets', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          skills: [{ skill: { name: 'Java' } }],
          referralPreference: {
            preferredCompanies: ['Google'],
            preferredLocations: ['Bengaluru'],
            roles: ['Backend Developer'],
          },
        }),
      },
    };
    const svc = new MatchingService(prisma as never);
    const ctxBuilt = await svc.buildSeekerContext('u1');
    expect(ctxBuilt.skillNames.has('java')).toBe(true);
    expect(ctxBuilt.preferredCompanies.has('google')).toBe(true);
    expect(ctxBuilt.preferredRoles.has('backend developer')).toBe(true);
  });

  it('returns empty sets when the seeker has no preferences', async () => {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
    const svc = new MatchingService(prisma as never);
    const ctxBuilt = await svc.buildSeekerContext('missing');
    expect(ctxBuilt.skillNames.size).toBe(0);
  });
});
