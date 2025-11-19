'use client'

import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion'
import { Badge } from '#/components/ui/badge'
import { CarePlan, Goal } from '#/types/schemas'

type CarePlanClientProps = {
  carePlans: CarePlan[]
  goals: Goal[]
}

export function CarePlanClient({ carePlans, goals }: CarePlanClientProps) {
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
                            <span>{goal.description.text}</span>
                            <Badge variant="secondary">
                              {goal.lifecycle_status}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-4 text-sm text-muted-foreground space-y-1">
                            <p>
                              <strong>Category:</strong> {goal.category.text}
                            </p>
                            <p>
                              <strong>Priority:</strong> {goal.priority.text}
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </div>
            )}

            {carePlan.activities && carePlan.activities.length > 0 && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Activities:</h3>
                <Accordion type="multiple" className="w-full">
                  {carePlan.activities.map((activity, index) => (
                    <AccordionItem value={`activity-${index}`} key={index}>
                      <AccordionTrigger>
                        {activity.detail.code.text}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-4 text-sm text-muted-foreground space-y-1">
                          <p>
                            <strong>Status:</strong> {activity.detail.status}
                          </p>
                          <p>
                            <strong>Description:</strong>{' '}
                            {activity.detail.description}
                          </p>
                          {activity.detail.scheduled_string && (
                            <p>
                              <strong>Scheduled:</strong>{' '}
                              {activity.detail.scheduled_string}
                            </p>
                          )}
                          {activity.detail.performer && (
                            <p>
                              <strong>Performer:</strong>{' '}
                              {activity.detail.performer.display}
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
