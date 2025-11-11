import random
from datetime import timedelta, datetime
from .utils import generate_uuid, get_random_datetime
from .config import TASK_STATUSES, TASK_PRIORITIES


def generate_tasks_for_resident(
    resident_id: str, staff_ids: list, start_date: datetime, end_date: datetime
) -> list:
    """Generates a list of tasks for a resident that conforms to the TaskSchema."""
    num_tasks = random.randint(1, 4)
    tasks = []

    sample_activities = {
        "386420003": "Follow up on lab results for bathing/hygiene assessment",
        "1230050000": "Ensure dressing assistance is provided as per care plan",
        "435441000124107": "Check medication reminder device setup and logs",
        "default": "General follow-up required",
    }

    for _ in range(num_tasks):
        activity_code = random.choice(list(sample_activities.keys()))
        description = sample_activities.get(activity_code, sample_activities["default"])
        created_time = get_random_datetime(start_date, end_date)
        performer_id = random.choice(staff_ids)

        task = {
            "id": generate_uuid(),
            "data": {
                "resident_id": resident_id,
                "activity_code": activity_code,
                "status": random.choice(TASK_STATUSES),
                "intent": "order",  # Assuming most tasks are orders
                "priority": random.choice(TASK_PRIORITIES),
                "requested_period": {
                    "start": created_time,
                    "end": (
                        datetime.fromisoformat(created_time.replace("Z", "+00:00"))
                        + timedelta(days=random.randint(1, 7))
                    ).isoformat()
                    + "Z",
                },
                "execution_period": {
                    "start": created_time,  # Can be updated later
                    "end": None,
                },
                "performer": {
                    "id": performer_id,
                    "name": f"Staff Member {staff_ids.index(performer_id) + 1}",
                    "period": {
                        "start": created_time,
                        "end": (
                            datetime.fromisoformat(created_time.replace("Z", "+00:00"))
                            + timedelta(minutes=random.randint(10, 60))
                        ).isoformat()
                        + "Z",
                    },
                },
                "notes": description,
                "authored_on": created_time,
                "last_modified": created_time,
                "do_not_perform": False,
            },
        }
        tasks.append(task)

    return tasks
