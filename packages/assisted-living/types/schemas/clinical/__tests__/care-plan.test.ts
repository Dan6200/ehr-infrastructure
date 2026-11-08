import { CarePlanSchema } from '../care-plan'
import {
  CarePlanActivitySchema,
  CarePlanActivityDetailSchema,
} from '../care-plan-activity'

const subject = { reference: 'Patient/resident-1', type: 'Patient' }

const baseCarePlan = {
  id: 'careplan-1',
  subject,
  status: 'active',
  title: 'Personalized Care Plan - 2026',
  author_id: 'staff-1',
  created_date: '2026-01-01T00:00:00.000Z',
}

describe('FHIR CarePlan.activity[]', () => {
  it('defaults activity to an empty array when omitted', () => {
    const plan = CarePlanSchema.parse(baseCarePlan)
    expect(plan.activity).toEqual([])
  })

  it('parses a nested activity with a detail element', () => {
    const plan = CarePlanSchema.parse({
      ...baseCarePlan,
      activity: [
        {
          id: 'activity-1',
          detail: {
            code: { coding: [] },
            status: 'scheduled',
          },
        },
      ],
    })

    const detail = plan.activity[0].detail
    expect(plan.activity[0].id).toBe('activity-1')
    expect(detail.status).toBe('scheduled')
    expect(detail.kind).toBe('ServiceRequest')
    expect(detail.performer).toEqual([])
    expect(detail.do_not_perform).toBe(false)
  })

  it('requires detail on an activity', () => {
    expect(() => CarePlanActivitySchema.parse({ id: 'activity-1' })).toThrow()
  })

  it('requires code and a valid status on detail', () => {
    expect(() =>
      CarePlanActivityDetailSchema.parse({ status: 'scheduled' }),
    ).toThrow()
    expect(() =>
      CarePlanActivityDetailSchema.parse({ code: { coding: [] } }),
    ).toThrow()
    expect(() =>
      CarePlanActivityDetailSchema.parse({
        code: { coding: [] },
        status: 'not-a-status',
      }),
    ).toThrow()
  })

  it('rejects an unknown activity kind', () => {
    expect(() =>
      CarePlanActivityDetailSchema.parse({
        code: { coding: [] },
        status: 'scheduled',
        kind: 'NotAKind',
      }),
    ).toThrow()
  })
})
