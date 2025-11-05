def generate_identifiers_for_resident(resident_id: str, resident_code: str) -> list:
    """Generates a list of identifiers for a resident, including an MRN."""

    mrn_identifier = {
        "resident_id": resident_id,  # Only for the encrypt resident data script to run successfully
        "id": f"mrn_{resident_id}",
        "data": {
            "system": "http://www.acme-healthcare.com/mrn",
            "value": resident_code,
            "type": "MRN",
        },
    }

    return [mrn_identifier]
