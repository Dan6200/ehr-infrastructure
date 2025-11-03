import random
from datetime import timedelta, datetime
from .utils import generate_uuid, get_random_datetime
from .config import ENCOUNTER_STATUSES, ENCOUNTER_TYPES


def generate_encounters_for_resident(
    resident_id: str, staff_ids: list, start_date: datetime, end_date: datetime
) -> list:
    """Generates a list of encounters for a resident."""
    num_encounters = random.randint(1, 5)
    encounters = []

    for _ in range(num_encounters):
        encounter_type = random.choice(ENCOUNTER_TYPES)
        encounter_start = get_random_datetime(start_date, end_date)
        encounter_end = (
            datetime.fromisoformat(encounter_start.replace("Z", "+00:00"))
            + timedelta(hours=random.randint(1, 4))
        ).isoformat() + "Z"

        encounter = {
            "id": generate_uuid(),
            "data": {
                "resident_id": resident_id,
                "status": random.choice(ENCOUNTER_STATUSES),
                "type": {"coding": [encounter_type], "text": encounter_type["display"]},
                "period": {"start": encounter_start, "end": encounter_end},
                "participant_id": random.choice(staff_ids),
                "recorded_at": encounter_start,
            },
        }
        encounters.append(encounter)

    return encounters
