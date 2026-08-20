import pytz
import random
from datetime import datetime
from .utils import generate_uuid, get_random_datetime
from .config import CONDITION_STATUSES


def generate_diagnostic_history_for_resident(
    resident_id: str,
    staff_ids: list,
    start_date: datetime,
    end_date: datetime,
    snomed_disorders: list,
) -> list:
    num_disorders = random.randint(1, 3)
    diagnostic_history = []

    min_recorded_date = pytz.utc.localize(datetime(year=2020, month=1, day=1))
    min_onset_date = pytz.utc.localize(datetime(year=2000, month=1, day=1))
    max_onset_date = pytz.utc.localize(datetime(year=2023, month=1, day=1))

    for _ in range(num_disorders):
        if snomed_disorders:
            disorder_example = random.choice(snomed_disorders)
            clinical_status = random.choice(CONDITION_STATUSES)
            abatement_date = (
                get_random_datetime(start_date, end_date)
                if clinical_status == "resolved"
                else None
            )
            diagnostic_history.append(
                {
                    "id": generate_uuid(),
                    "data": {
                        "resident_id": resident_id,
                        "recorder_id": random.choice(staff_ids),
                        "clinical_status": clinical_status,
                        "recorded_date": get_random_datetime(
                            min_recorded_date, end_date
                        ),
                        "onset_datetime": get_random_datetime(
                            min_onset_date, max_onset_date
                        ),
                        "abatement_datetime": abatement_date,
                        "code": {
                            "coding": disorder_example,
                            "text": disorder_example[0]["display"],
                        },
                    },
                }
            )
    return diagnostic_history
