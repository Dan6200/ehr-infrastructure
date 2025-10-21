import json
import uuid
import random
from datetime import datetime, timedelta
import os
import pytz # Import pytz for timezone awareness (standard for FHIR)

# --- Configuration ---
RESIDENTS_FILE = 'demo-data/residents/data-plain.json'

SUBCOLLECTIONS_DIR = 'demo-data'
SUBCOLLECTION_FILES = {
    'allergies': 'allergies/data-plain.json',
    'prescriptions': 'prescriptions/data-plain.json',
    'observations': 'observations/data-plain.json',
    'diagnostic_history': 'diagnostic_history/data-plain.json',
    'financials': 'financials/data-plain.json',
    'prescription_administration': 'prescription_administration/data-plain.json',
}

SNOMED_ALLERGIES_FILE = 'demo-data/snomed-examples/allergies.txt'
SNOMED_DISORDERS_FILE = 'demo-data/snomed-examples/disorders.txt'
LOINC_EXAMPLES_FILE = 'demo-data/loinc-examples.txt'

# --- FHIR-like Configuration Lists ---
OBSERVATION_STATUSES = ['final', 'amended']
ALLERGY_STATUSES = ['active', 'inactive', 'resolved']
CONDITION_STATUSES = ['active', 'recurrence', 'remission', 'resolved']
PRESCRIPTION_STATUSES = ['active', 'on-hold', 'stopped']
ADMINISTRATION_STATUSES = ['administered', 'missed', 'refused']
ADMINISTRATION_ROUTES = ['Oral', 'IV', 'Subcutaneous', 'Topical', 'Inhalation']
FINANCIAL_TYPES = ['CHARGE', 'PAYMENT', 'ADJUSTMENT']

# Define realistic ranges for common vitals (FHIR-aligned with UCUM units)
VITAL_RANGES = {
    '8480-6': {'name': 'Systolic Blood Pressure', 'unit': 'mmHg', 'min': 100, 'max': 140, 'type': 'int'},
    '8462-4': {'name': 'Diastolic Blood Pressure', 'unit': 'mmHg', 'min': 60, 'max': 90, 'type': 'int'},
    '8867-4': {'name': 'Heart Rate', 'unit': '/min', 'min': 60, 'max': 100, 'type': 'int'},
    '2708-6': {'name': 'Oxygen Saturation', 'unit': '%', 'min': 94, 'max': 100, 'type': 'int'},
    '8310-5': {'name': 'Body Temperature', 'unit': 'Cel', 'min': 36.4, 'max': 37.5, 'type': 'float'},
    '29463-7': {'name': 'Body Weight', 'unit': 'kg', 'min': 54.4, 'max': 113.4, 'type': 'float'},
}

# --- Helper Functions ---
def generate_uuid():
    return str(uuid.uuid4())

def get_random_datetime(start_date, end_date):
    time_between_dates = end_date - start_date
    seconds_between_dates = int(time_between_dates.total_seconds())
    random_number_of_seconds = random.randrange(seconds_between_dates)
    random_datetime = start_date + timedelta(seconds=random_number_of_seconds)
    return pytz.utc.localize(random_datetime).isoformat().replace('+00:00', 'Z')

def get_observation_value(code):
    config = VITAL_RANGES.get(code)
    if not config:
        return random.randint(10, 100), '10^3/uL'
    val = random.uniform(config['min'], config['max'])
    return int(round(val)) if config['type'] == 'int' else round(val, 1), config['unit']

def load_snomed_examples(filepath):
    examples = []
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            for line in f:
                parts = line.strip().split('|')
                if len(parts) >= 2:
                    name = parts[1].strip().replace('(finding)', '').replace('(disorder)', '').replace('(substance)', '').strip()
                    examples.append({'code': parts[0].strip(), 'name': name})
    return examples

def load_loinc_examples(filepath):
    return [{'code': k, 'name': v['name']} for k, v in VITAL_RANGES.items()]

# --- Main Script ---
if __name__ == '__main__':
    START_DATE = datetime(2023, 1, 1)
    END_DATE = datetime.now()
    NUM_STAFF = 6
    STAFF_IDS = [generate_uuid() for _ in range(NUM_STAFF)]

    os.makedirs(os.path.dirname(RESIDENTS_FILE), exist_ok=True)
    try:
        os.system(f'cp {RESIDENTS_FILE} {RESIDENTS_FILE}.bak')
    except Exception as e:
        print(f"Warning: Could not backup file {RESIDENTS_FILE}. {e}")
    
    try:
        with open(RESIDENTS_FILE, 'r') as f:
            residents_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Residents file not found at {RESIDENTS_FILE}.")
        exit(1)

    all_allergies = []
    all_prescriptions = []
    all_observations = []
    all_diagnostic_history = []
    all_financials = []
    all_prescription_administration = []

    snomed_allergies = load_snomed_examples(SNOMED_ALLERGIES_FILE)
    snomed_disorders = load_snomed_examples(SNOMED_DISORDERS_FILE)
    loinc_vitals = load_loinc_examples(LOINC_EXAMPLES_FILE)

    rxnorm_prescriptions = [
        {'code': '314076', 'name': 'Lisinopril', 'strength': '10mg'},
        {'code': '860975', 'name': 'Metformin', 'strength': '500mg'},
        {'code': '1048953', 'name': 'Atorvastatin', 'strength': '20mg'},
        {'code': '197358', 'name': 'Amoxicillin', 'strength': '250mg'},
        {'code': '1113000', 'name': 'Insulin Glargine', 'strength': '10 units'},
    ]

    for resident in residents_data:
        resident_id = resident['id']
        resident_prescriptions = []

        num_allergies = random.randint(0, 2)
        for _ in range(num_allergies):
            if snomed_allergies:
                allergy_example = random.choice(snomed_allergies)
                all_allergies.append({
                    'id': generate_uuid(),
                    'data': {
                        'resident_id': resident_id,
                        'recorder_id': random.choice(STAFF_IDS),
                        'clinical_status': random.choice(ALLERGY_STATUSES),
                        'recorded_date': get_random_datetime(START_DATE, END_DATE),
                        'substance_name': allergy_example['name'],
                        'snomed_code': allergy_example['code'],
                        'reaction_description': random.choice(['Urticaria (Hives)', 'Angioedema (Swelling)', 'Anaphylaxis', 'Gastrointestinal upset']),
                        'severity': random.choice(['mild', 'moderate', 'severe'])
                    }
                })
        
        num_prescriptions = random.randint(0, 3)
        for _ in range(num_prescriptions):
            if rxnorm_prescriptions:
                rx_example = random.choice(rxnorm_prescriptions)
                rx_record = {
                    'id': generate_uuid(),
                    'data': {
                        'resident_id': resident_id,
                        'recorder_id': random.choice(STAFF_IDS),
                        'effective_period_start': get_random_datetime(START_DATE, END_DATE),
                        'status': random.choice(PRESCRIPTION_STATUSES),
                        'name': rx_example['name'],
                        'rxnorm_code': rx_example['code'],
                        'dosage': rx_example['strength'],
                        'frequency': random.choice(['Daily', 'Twice a day', 'Three times a day', 'As needed'])
                    }
                }
                all_prescriptions.append(rx_record)
                resident_prescriptions.append(rx_record)

        for rx_record in resident_prescriptions:
            frequency = rx_record['data']['frequency']
            start_date_str = rx_record['data']['effective_period_start']
            
            doses_per_day = {'Daily': 1, 'Twice a day': 2, 'Three times a day': 3}.get(frequency, 0)
            if doses_per_day == 0: continue

            start_dt = datetime.fromisoformat(start_date_str.replace('Z', '+00:00')).replace(tzinfo=None)
            current_date = start_dt.date()
            while current_date <= END_DATE.date():
                for dose_num in range(doses_per_day):
                    hour = (9 + (dose_num * (24 // doses_per_day))) % 24
                    minute_offset = random.randint(-30, 30)
                    admin_time = datetime(current_date.year, current_date.month, current_date.day, hour, 30, 0) + timedelta(minutes=minute_offset)
                    
                    if admin_time > END_DATE: continue
                        
                    status = random.choices(ADMINISTRATION_STATUSES, weights=[0.9, 0.05, 0.05], k=1)[0]

                    all_prescription_administration.append({
                        'id': generate_uuid(),
                        'data': {
                            'resident_id': resident_id,
                            'prescription_id': rx_record['id'],
                            'prescription_name': rx_record['data']['name'],
                            'recorder_id': random.choice(STAFF_IDS),
                            'status': status,
                            'administration_route': random.choice(ADMINISTRATION_ROUTES),
                            'administered_dosage': rx_record['data']['dosage'],
                            'administration_datetime': pytz.utc.localize(admin_time).isoformat().replace('+00:00', 'Z')
                        }
                    })
                current_date += timedelta(days=1)

        num_observations = random.randint(3, 8)
        for _ in range(num_observations):
            if loinc_vitals:
                vital_example = random.choice(loinc_vitals)
                loinc_code = vital_example['code']
                value, unit = get_observation_value(loinc_code)
                observation = {
                    'id': generate_uuid(),
                    'data': {
                        'resident_id': resident_id,
                        'recorder_id': random.choice(STAFF_IDS),
                        'status': random.choice(OBSERVATION_STATUSES),
                        'effective_datetime': get_random_datetime(START_DATE, END_DATE),
                        'loinc_code': loinc_code,
                        'name': vital_example['name'],
                        'value': value,
                        'unit': unit,
                    }
                }
                if loinc_code in ['8310-5', '2708-6']:
                    observation['data']['body_site'] = random.choice(['Oral', 'Axillary', 'Finger'])
                all_observations.append(observation)

        num_disorders = random.randint(1, 3)
        for _ in range(num_disorders):
            if snomed_disorders:
                disorder_example = random.choice(snomed_disorders)
                clinical_status = random.choice(CONDITION_STATUSES)
                abatement_date = get_random_datetime(START_DATE, END_DATE) if clinical_status == 'resolved' else None
                all_diagnostic_history.append({
                    'id': generate_uuid(),
                    'data': {
                        'resident_id': resident_id,
                        'recorder_id': random.choice(STAFF_IDS),
                        'clinical_status': clinical_status,
                        'recorded_date': get_random_datetime(datetime(2020, 1, 1), END_DATE),
                        'onset_date': get_random_datetime(datetime(2000, 1, 1), datetime(2023, 1, 1)),
                        'abatement_date': abatement_date,
                        'title': disorder_example['name'],
                        'notes': f'Patient history of {disorder_example['name']}. Reviewed and confirmed.',
                        'snomed_code': disorder_example['code']
                    }
                })

        num_financials = random.randint(0, 5)
        for _ in range(num_financials):
            all_financials.append({
                'id': generate_uuid(),
                'data': {
                    'resident_id': resident_id,
                    'amount': round(random.uniform(50, 5000), 2),
                    'effective_datetime': get_random_datetime(START_DATE, END_DATE),
                    'type': random.choice(FINANCIAL_TYPES),
                    'description': random.choice(['Monthly Rent', 'Medication Fee', 'Therapy Session', 'Payment Received', 'Co-pay', 'Late Fee'])
                }
            })

    with open(RESIDENTS_FILE, 'w') as f:
        json.dump(residents_data, f, indent=2)

    for sub_dir, sub_file in SUBCOLLECTION_FILES.items():
        os.makedirs(os.path.join(SUBCOLLECTIONS_DIR, sub_dir), exist_ok=True)
        data_map = {
            'allergies': all_allergies,
            'prescriptions': all_prescriptions,
            'observations': all_observations,
            'diagnostic_history': all_diagnostic_history,
            'financials': all_financials,
            'prescription_administration': all_prescription_administration
        }
        if sub_dir in data_map:
            with open(os.path.join(SUBCOLLECTIONS_DIR, sub_file), 'w') as f:
                json.dump(data_map[sub_dir], f, indent=2)

    print("FHIR-Aligned Demo data generation complete.")
