import random
from datetime import datetime, timedelta
import pytz
from .utils import generate_uuid, get_random_datetime
from .config import EPISODE_STATUSES


def generate_episodes_of_care_for_resident(resident_id: str) -> list:
    episodes_of_care = []
    num_historical_episodes = random.randint(0, 1)

    for _ in range(num_historical_episodes):
        start_year = random.randint(2018, 2022)
        end_year = random.randint(start_year + 1, 2023)

        episode_start = pytz.utc.localize(
            datetime(start_year, random.randint(1, 12), random.randint(1, 28))
        )
        episode_end = pytz.utc.localize(
            datetime(end_year, random.randint(1, 12), random.randint(1, 28))
        )

        if episode_end <= episode_start:
            episode_end = episode_start + timedelta(days=random.randint(30, 365))

        episodes_of_care.append(
            {
                "id": generate_uuid(),
                "data": {
                    "resident_id": resident_id,
                    "status": random.choice(["finished", "cancelled"]),
                    "type": random.choice(
                        [
                            {
                                "code": "pac",
                                "display": "Post-acute Care",
                                "system": "http://terminology.hl7.org/CodeSystem/episodeofcare-type",
                            },
                            {
                                "code": "hacc",
                                "display": "Home and Community Care",
                                "system": "http://terminology.hl7.org/CodeSystem/episodeofcare-type",
                            },
                            {
                                "code": "cacp",
                                "display": "Community-based aged Care",
                                "system": "http://terminology.hl7.org/CodeSystem/episodeofcare-type",
                            },
                            {
                                "code": "daib",
                                "display": "Post coordinated diabetes program",
                                "system": "http://terminology.hl7.org/CodeSystem/episodeofcare-type",
                            },
                        ]
                    ),
                    "period": {
                        "start": get_random_datetime(
                            episode_start, episode_start + timedelta(days=7)
                        ),
                        "end": get_random_datetime(
                            episode_end, episode_end + timedelta(days=7)
                        ),
                    },
                    "managing_organization": "Golden Years Retreat Homes",
                },
            }
        )

    current_start_date = pytz.utc.localize(
        datetime(2023, random.randint(1, 6), random.randint(1, 28))
    )
    episodes_of_care.append(
        {
            "id": generate_uuid(),
            "data": {
                "resident_id": resident_id,
                "status": "active",
                "type": "Long Term Care",
                "period": {
                    "start": get_random_datetime(
                        current_start_date, current_start_date + timedelta(days=30)
                    ),
                    "end": None,
                },
                "managing_organization": "Golden Years Retreat Homes",
            },
        }
    )
    return episodes_of_care
