'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#root/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#root/components/ui/accordion'
import { Badge } from '#root/components/ui/badge'
import { CarePlanActivitySchema } from '#root/types/schemas/clinical/care-plan-activity'
import { CarePlanSchema } from '#root/types/schemas/clinical/care-plan'
import { GoalSchema } from '#root/types/schemas/clinical/goal'
import { z } from 'zod'

type CarePlanClientProps = {
  carePlans: z.infer<typeof CarePlanSchema>[]
  carePlanActivities: z.infer<typeof CarePlanActivitySchema>[]
  goals: z.infer<typeof GoalSchema>[]
}

export function CarePlanClient({
  carePlans,
  carePlanActivities,
  goals,
}: CarePlanClientProps) {
  // Map goals by ID for easy lookup
  const goalsMap = new Map(goals.map((goal) => [goal.id, goal]))

  return (
    <div className="space-y-6">
      {carePlans.length === 0 && (
        <p className="text-muted-foreground">
          No care plans found for this resident.
        </p>
      )}

      {carePlans.map((carePlan) => (
        <Card key={carePlan.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{carePlan.title}</span>
              <Badge>{carePlan.status}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Authored by {carePlan.author_id} on{' '}
              {new Date(carePlan.created_date).toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent>
            {carePlan.goal_ids && carePlan.goal_ids.length > 0 && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">
                  Associated Goals:
                </h3>
                <Accordion type="multiple" className="w-full">
                  {carePlan.goal_ids.map((goalId) => {
                    const goal = goalsMap.get(goalId)
                    if (!goal) return null
                    return (
                      <AccordionItem value={goal.id} key={goal.id}>
                        <AccordionTrigger>
                          <div className="flex items-center justify-between w-full pr-4">
                            <span>{goal.description.code.text}</span>
                            <Badge variant="secondary">
                              {goal.lifecycle_status}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-4 text-sm text-muted-foreground space-y-1">
                            <p>
                              <strong>Category:</strong> {goal.category}
                            </p>
                            <p>
                              <strong>Priority:</strong> {goal.priority}
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </div>
            )}

            {carePlanActivities &&
              carePlanActivities.filter((a) => a.careplan_id === carePlan.id)
                .length > 0 && (
                <div className="mt-4">
                  <h3 className="text-md font-semibold mb-2">Activities:</h3>
                  <Accordion type="multiple" className="w-full">
                    {carePlanActivities
                      .filter((a) => a.careplan_id === carePlan.id)
                      .map((activity, index) => (
                        <AccordionItem value={`activity-${index}`} key={index}>
                          <AccordionTrigger>
                            {activity.code.text}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-4 text-sm text-muted-foreground space-y-1">
                              <p>
                                <strong>Status:</strong> {activity.status}
                              </p>
                              {activity.description && (
                                <p>
                                  <strong>Instructions:</strong>{' '}
                                  {activity.description}
                                </p>
                              )}
                              {activity.scheduled_timing && (
                                <div className="mt-2 border-l-2 pl-2 border-muted">
                                  <p>
                                    <strong>Schedule:</strong>{' '}
                                    {activity.scheduled_timing.code?.text ||
                                      'Specific Time'}
                                  </p>
                                  {activity.scheduled_timing.repeat && (
                                    <div className="text-xs text-muted-foreground ml-2 mt-1">
                                      <p>
                                        Every{' '}
                                        {
                                          activity.scheduled_timing.repeat
                                            .frequency
                                        }{' '}
                                        time(s) per{' '}
                                        {
                                          activity.scheduled_timing.repeat
                                            .period
                                        }{' '}
                                        {
                                          activity.scheduled_timing.repeat
                                            .period_unit
                                        }
                                      </p>
                                      {activity.scheduled_timing.repeat
                                        .time_of_day &&
                                        activity.scheduled_timing.repeat
                                          .time_of_day.length > 0 && (
                                          <p>
                                            At:{' '}
                                            {activity.scheduled_timing.repeat.time_of_day.join(
                                              ', ',
                                            )}
                                          </p>
                                        )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {activity.performer.length > 0 && (
                                <p>
                                  <strong>Performer:</strong>{' '}
                                  {activity.performer
                                    .map((p) => p.display || p.reference)
                                    .join(', ')}
                                </p>
                              )}
                              {activity.do_not_perform && (
                                <p>
                                  <strong>Do not perform:</strong> Yes
                                </p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </div>
              )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
