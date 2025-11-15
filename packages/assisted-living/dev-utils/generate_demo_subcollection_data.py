import json
import os
from datetime import datetime
from random import choice, random
import pytz  # Added for timezone handling
from generators.utils import (
    convert_times,
    load_snomed_file,
    load_allergy_reactions,
    get_loinc_codes,
    generate_uuid,
    get_random_datetime,
)
from generators.config import (
    VITAL_RANGES,
    PRESCRIPTION_TEMPLATES,
    DOSAGE_INSTRUCTIONS,
)
from generators.allergies import generate_allergies_for_resident
from generators.prescriptions import generate_prescriptions_for_resident
from generators.prescription_administration import (
    generate_prescription_administration_for_resident,
)
from generators.observations import generate_observations_for_resident
from generators.diagnostic_history import generate_diagnostic_history_for_resident
from generators.episodes_of_care import generate_episodes_of_care_for_resident
from generators.care_plans import generate_care_plans_for_resident
from generators.addresses import generate_address_for_resident
from generators.identifiers import generate_identifiers_for_resident
from generators.financials import generate_financial_data_for_resident
from generators.tasks import generate_tasks_for_resident
from generators.procedures import generate_procedures_for_resident
from generators.encounters import generate_encounters_for_resident
from generators.goals import generate_goals

# --- Configuration ---
RESIDENTS_FILE = "demo-data/residents/data-plain.json"
SUBCOLLECTIONS_DIR = "demo-data"
SUBCOLLECTION_FILES = {
    "allergies": "allergies/data-plain.json",
    "prescriptions": "prescriptions/data-plain.json",
    "observations": "observations/data-plain.json",
    "diagnostic_history": "diagnostic_history/data-plain.json",
    "accounts": "accounts/data-plain.json",
    "charges": "charges/data-plain.json",
    "claims": "claims/data-plain.json",
    "coverages": "coverages/data-plain.json",
    "payments": "payments/data-plain.json",
    "adjustments": "adjustments/data-plain.json",
    "prescription_administration": "prescription_administration/data-plain.json",
    "episodes_of_care": "episodes_of_care/data-plain.json",
    "care_plans": "care_plans/data-plain.json",
    "care_plan_activities": "care_plans_activities/data-plain.json",
    "addresses": "addresses/data-plain.json",
    "identifiers": "identifiers/data-plain.json",
    "tasks": "tasks/data-plain.json",
    "procedures": "procedures/data-plain.json",
    "encounters": "encounters/data-plain.json",
    "goals": "goals/data-plain.json",
}

SNOMED_DISORDERS_FILE = "demo-data/snomed-examples/disorders.txt"
SNOMED_ALLERGY_NAMES_FILE = "demo-data/snomed-examples/allergies/name.txt"
SNOMED_ALLERGY_REACTIONS_FILE = "demo-data/snomed-examples/allergies/reaction.txt"
SNOMED_ALLERGY_SUBSTANCES_FILE = "demo-data/snomed-examples/allergies/substance.txt"


# --- Main Script ---
if __name__ == "__main__":
    START_DATE = pytz.utc.localize(datetime(2023, 1, 1))
    INTERMEDIARY_DATE = pytz.utc.localize(datetime(2024, 1, 1))
    END_DATE = datetime.now(pytz.utc) + timedelta(days=365 * 2)
    NUM_STAFF = 6
    STAFF_IDS = [generate_uuid() for _ in range(NUM_STAFF)]

    os.makedirs(os.path.dirname(RESIDENTS_FILE), exist_ok=True)

    try:
        with open(RESIDENTS_FILE, "r") as f:
            residents_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Residents file not found at {RESIDENTS_FILE}.")
        exit(1)

    all_allergies = []
    all_prescriptions = []
    all_observations = []
    all_diagnostic_history = []
    all_claims = []
    all_accounts = []
    all_charges = []
    all_payments = []
    all_adjustments = []
    all_coverages = []
    all_prescription_administration = []
    all_episodes_of_care = []
    all_care_plans = []
    all_care_plan_activities = []
    all_identifiers = []
    all_tasks = []
    all_procedures = []
    all_encounters = []
    all_goals = []
    all_goal_ids = []
    all_addresses = []

    snomed_allergy_names = load_snomed_file(SNOMED_ALLERGY_NAMES_FILE)
    snomed_allergy_reactions = load_allergy_reactions(SNOMED_ALLERGY_REACTIONS_FILE)
    snomed_allergy_substances = load_snomed_file(SNOMED_ALLERGY_SUBSTANCES_FILE)
    snomed_disorders = load_snomed_file(SNOMED_DISORDERS_FILE)
    loinc_codes = get_loinc_codes(VITAL_RANGES)

    for i, resident in enumerate(residents_data):
        resident_id = resident["id"]
        resident["data"]["resident_code"] = f"{i+1:05d}"  # Add resident_code
        resident["data"]["created_at"] = get_random_datetime(START_DATE, END_DATE)

        # Decide whether to deactivate the resident (e.g., 20% chance)
        if random() < 0.2:
            # Ensure deactivation date is after creation date
            deactivation_start_date = resident["data"]["created_at"]
            resident["data"]["deactivated_at"] = get_random_datetime(
                deactivation_start_date, END_DATE
            )
        else:
            resident["data"]["deactivated_at"] = None

        # Determine the effective end date for generating subcollection data
        effective_end_date = (
            resident["data"]["deactivated_at"]
            if resident["data"]["deactivated_at"]
            else END_DATE
        )

        # Generate data for each subcollection
        goal_data = generate_goals(resident_id)
        all_allergies.extend(
            generate_allergies_for_resident(
                resident_id,
                STAFF_IDS,
                START_DATE,
                effective_end_date,
                snomed_allergy_names,
                snomed_allergy_reactions,
                snomed_allergy_substances,
            )
        )
        resident_prescriptions = generate_prescriptions_for_resident(
            resident_id,
            STAFF_IDS,
            START_DATE,
            INTERMEDIARY_DATE,
            effective_end_date,
            PRESCRIPTION_TEMPLATES,
            DOSAGE_INSTRUCTIONS,
        )
        all_prescriptions.extend(resident_prescriptions)
        if resident_prescriptions:
            all_prescription_administration.extend(
                generate_prescription_administration_for_resident(
                    resident_id, resident_prescriptions, STAFF_IDS, effective_end_date
                )
            )
        all_observations.extend(
            generate_observations_for_resident(
                resident_id, STAFF_IDS, START_DATE, effective_end_date, loinc_codes
            )
        )
        all_diagnostic_history.extend(
            generate_diagnostic_history_for_resident(
                resident_id, STAFF_IDS, START_DATE, effective_end_date, snomed_disorders
            )
        )
        episodes_of_care_data = generate_episodes_of_care_for_resident(resident_id)
        all_episodes_of_care.extend(episodes_of_care_data)
        all_goals.extend(goal_data["goals"])
        all_goal_ids.extend(goal_data["goal_ids"])
        care_plan_data = generate_care_plans_for_resident(
            resident_id, STAFF_IDS, effective_end_date, all_goal_ids
        )
        all_care_plans.extend(care_plan_data["care_plans"])
        all_care_plan_activities.extend(care_plan_data["care_plan_activities"])
        all_addresses.extend(generate_address_for_resident(resident_id))
        all_identifiers.extend(
            generate_identifiers_for_resident(
                resident_id, resident["data"]["resident_code"]
            )
        )
        financial_data = generate_financial_data_for_resident(
            resident_id, resident["data"]["resident_name"], START_DATE, effective_end_date
        )
        all_accounts.extend(financial_data["accounts"])
        all_charges.extend(financial_data["charges"])
        all_claims.extend(financial_data["claims"])
        all_coverages.extend(financial_data["coverages"])
        all_payments.extend(financial_data["payments"])
        all_adjustments.extend(financial_data["adjustments"])

        all_tasks.extend(
            generate_tasks_for_resident(resident_id, STAFF_IDS, START_DATE, effective_end_date)
        )
        all_procedures.extend(
            generate_procedures_for_resident(
                resident_id,
                resident["data"]["resident_name"],
                STAFF_IDS,
                START_DATE,
                effective_end_date,
            )
        )
        all_encounters.extend(
            generate_encounters_for_resident(
                resident_id,
                resident["data"]["resident_name"],
                STAFF_IDS,
                START_DATE,
                effective_end_date,
                choice(episodes_of_care_data)["id"],
            )
        )

    # --- Write Sub-Collection Files (Corrected Pathing) ---
    for sub_dir, sub_file in SUBCOLLECTION_FILES.items():
        # Ensure the directory exists (e.g., 'demo-data/allergies')
        os.makedirs(
            os.path.join(SUBCOLLECTIONS_DIR, os.path.dirname(sub_file)), exist_ok=True
        )
        data_map = {
            "allergies": all_allergies,
            "prescriptions": all_prescriptions,
            "observations": all_observations,
            "diagnostic_history": all_diagnostic_history,
            "prescription_administration": all_prescription_administration,
            "episodes_of_care": all_episodes_of_care,
            "care_plans": all_care_plans,
            "care_plan_activities": all_care_plan_activities,
            "identifiers": all_identifiers,
            "accounts": all_accounts,
            "charges": all_charges,
            "claims": all_claims,
            "coverages": all_coverages,
            "payments": all_payments,
            "adjustments": all_adjustments,
            "tasks": all_tasks,
            "procedures": all_procedures,
            "encounters": all_encounters,
            "goals": all_goals,
            "addresses": all_addresses,
        }
        if sub_dir in data_map:
            # Write to the full path (e.g., 'demo-data/allergies/data-plain.json')
            with open(os.path.join(SUBCOLLECTIONS_DIR, sub_file), "w") as f:
                data = convert_times(data_map[sub_dir])
                json.dump(data, f, indent=2)

    print("FHIR-Aligned Demo data generation complete.")
