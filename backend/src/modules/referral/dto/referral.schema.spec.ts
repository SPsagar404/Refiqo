import { REFERRAL_STATUS_TRANSITIONS } from '../../../contracts/enums';
import { updateStatusSchema } from './referral.schema';

describe('referral status transition map', () => {
  it('allows PENDING to advance to review/accept/reject', () => {
    expect(REFERRAL_STATUS_TRANSITIONS.PENDING).toEqual(
      expect.arrayContaining(['UNDER_REVIEW', 'ACCEPTED', 'REJECTED']),
    );
  });

  it('treats ACCEPTED and REJECTED as terminal', () => {
    expect(REFERRAL_STATUS_TRANSITIONS.ACCEPTED).toHaveLength(0);
    expect(REFERRAL_STATUS_TRANSITIONS.REJECTED).toHaveLength(0);
  });
});

describe('updateStatusSchema', () => {
  it('requires a rejectionReason when rejecting', () => {
    expect(() => updateStatusSchema.parse({ status: 'REJECTED' })).toThrow();
    expect(
      updateStatusSchema.parse({ status: 'REJECTED', rejectionReason: 'Not a fit' }),
    ).toMatchObject({ status: 'REJECTED' });
  });

  it('accepts ACCEPTED without a reason', () => {
    expect(updateStatusSchema.parse({ status: 'ACCEPTED' })).toMatchObject({ status: 'ACCEPTED' });
  });
});
