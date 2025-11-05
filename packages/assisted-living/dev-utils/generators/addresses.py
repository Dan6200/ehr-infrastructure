import random

# A small pool of realistic-looking Nigerian address components
STREET_NAMES = ["Adeola Odeku St", "Allen Avenue", "Bode Thomas St", "Adetokunbo Ademola Crescent", "Ozumba Mbadiwe Avenue"]
CITIES = ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt"]
STATES = ["Lagos", "FCT", "Kano", "Oyo", "Rivers"]


def generate_address_for_resident(resident_id: str) -> dict:
    """Generates a single, structured address for a resident."""
    street_number = random.randint(1, 200)
    street_name = random.choice(STREET_NAMES)
    city = random.choice(CITIES)
    state = random.choice(STATES)

    address = {
        "resident_id": resident_id,  # Only for the encrypt resident data script to run successfully
        "id": f"addr_{resident_id}",
        "data": {
            "use": "home",
            "type": "physical",
            "line": [f"{street_number} {street_name}"],
            "city": city,
            "state": state,
            "postalCode": str(random.randint(100000, 999999)),
            "country": "NGN",
        }
    }
    return address
