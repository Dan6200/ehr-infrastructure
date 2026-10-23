import random
from datetime import datetime
from .utils import generate_uuid, get_random_datetime
from .config import CARE_PLAN_ACTIVITIES


def generate_care_plans_for_resident(
    resident_id: str,
    staff_ids: list,
    start_date: datetime,
    end_date: datetime,
    all_goal_ids: list,
) -> dict:
    """Generates a denormalized set of care plan data for a resident."""
    care_plans = []
    care_plan_activities = []

    # 1. Create the main Care Plan
    care_plan_id = generate_uuid()

    # 2. Select a random subset of goal IDs to reference
    selected_goal_ids = random.sample(
        all_goal_ids, k=min(len(all_goal_ids), random.randint(2, 3))
    )

    care_plan = {
        "id": care_plan_id,
        "data": {
            "resident_id": resident_id,
            "status": "active",
            "title": f"Personalized Care Plan - {start_date.now().year}",
            "author_id": random.choice(staff_ids),
            "created_date": get_random_datetime(start_date, end_date),
            "goal_ids": selected_goal_ids,  # Reference top-level goals
        },
    }
    care_plans.append(care_plan)

    # 3. Generate Activities linked to the Care Plan (FHIR CarePlan.activity.detail)
    selected_activities = random.sample(CARE_PLAN_ACTIVITIES, random.randint(3, 5))
    for act_template in selected_activities:
        coding = act_template["coding"]

        code_coding = []
        if coding.get("code"):
            code_coding.append(
                {
                    "system": coding["system"],
                    "code": coding["code"],
                    "display": coding["display"],
                }
            )

        performer = []
        if staff_ids:
            performer.append(
                {
                    "reference": f"Practitioner/{random.choice(staff_ids)}",
                    "type": "Practitioner",
                }
            )

        activity = {
            "id": generate_uuid(),
            "data": {
                "resident_id": resident_id,
                "careplan_id": care_plan_id,
                "kind": "ServiceRequest",
                "code": {
                    "coding": code_coding,
                    "text": coding["display"],
                },
                "status": "scheduled",
                "do_not_perform": False,
                "scheduled": act_template["timing"],
                "performer": performer,
                "description": f"Ensure resident comfort during {coding['display'].split('(')[0].strip().lower()}.",
            },
        }
        care_plan_activities.append(activity)

    # Activities are stored as a subcollection (not nested in the care plan) to
    # keep documents small; the `careplan_id` back-reference is on each activity.

    return {
        "care_plans": care_plans,
        "care_plan_activities": care_plan_activities,
    }

