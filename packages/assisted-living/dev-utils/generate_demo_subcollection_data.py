import json
import uuid
import random
from datetime import datetime, timedelta
import os
import pytz

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

SNOMED_DISORDERS_FILE = 'demo-data/snomed-examples/disorders.txt'
SNOMED_ALLERGY_NAMES_FILE = 'demo-data/snomed-examples/allergies/name.txt'
SNOMED_ALLERGY_REACTIONS_FILE = 'demo-data/snomed-examples/allergies/reaction.txt'
SNOMED_ALLERGY_SUBSTANCES_FILE = 'demo-data/snomed-examples/allergies/substance.txt'

# --- FHIR-like Configuration Lists ---
OBSERVATION_STATUSES = ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown']
ALLERGY_STATUSES = {'clinical': ['active', 'inactive', 'resolved'], 'verification':['unconfirmed', 'presumed', 'confirmed', 'refuted', 'entered-in-error']}
ALLERGY_TYPES = ['allergy', 'intolerance']
CONDITION_STATUSES = ['active', 'recurrence', 'remission', 'resolved']
PRESCRIPTION_STATUSES = ['recorded', 'entered-in-error', 'draft']
PRESCRIPTION_ADHERENCE_STATUSES = ['taking', 'taking-as-directed', 'taking-not-as-directed', 'not-taking', 'on-hold','on-hold-as-directed', 'on-hold-not-as-directed', 'stopped','stopped-as-directed','stopped-not-as-directed','unknown']
ADMINISTRATION_STATUSES = ['in-progress', 'not-done', 'on-hold', 'completed', 'entered-in-error', 'stopped', 'unknown']
ADMINISTRATION_ROUTES = [{'name':'oral','snomed_code':'26643006'},{'name':'intravenous','snomed_code':'47625008'},{'name':'intramuscular','snomed_code':'78421000'}, {'name':'subcutaneous','snomed_code':'34206005'}, {'name':'topical','snomed_code':'6064005'}]
FINANCIAL_TYPES = ['CHARGE', 'PAYMENT', 'ADJUSTMENT']

VITAL_RANGES = {
    '8480-6': {'name': 'Systolic Blood Pressure', 'unit': 'mmHg', 'min': 100, 'max': 140, 'type': 'int', 'body_site':{'name':'upper arm', 'snomed_code':'40983000'},'method':{'snomed_code':'371911009', 'name':'Measurement of blood pressure using cuff method'},'device':{'name':'Aneroid manual sphygmomanometer', 'udi_code': '00616784710716'}},
    '8462-4': {'name': 'Diastolic Blood Pressure', 'unit': 'mmHg', 'min': 60, 'max': 90, 'type': 'int','body_site':{'name':'upper arm', 'snomed_code':'40983000'},'method':{'snomed_code':'371911009', 'name':'Measurement of blood pressure using cuff method'},'device':{'name':'Aneroid manual sphygmomanometer', 'udi_code': '00616784710716'}},
    '8867-4': {'name': 'Heart Rate', 'unit': '/min', 'min': 60, 'max': 100, 'type': 'int','body_site':{'name':'Structure of tip of index finger', 'snomed_code':'182266005'},'method':{'snomed_code':'252465000', 'name':'Pulse oximetry'},'device':{'name':'Pulse Oximeter', 'udi_code': '06924054300456'}},
    '2708-6': {'name': 'Oxygen Saturation in Arterial Blood', 'unit': '%', 'min': 94, 'max': 100, 'type': 'int','body_site':{'name':'Structure of tip of index finger', 'snomed_code':'182266005'},'method':{'snomed_code':'252465000', 'name':'Pulse oximetry'},'device':{'name':'Pulse Oximeter', 'udi_code': '06924054300456'}},
    '8310-5': {'name': 'Body Temperature', 'unit': 'Cel', 'min': 36.4, 'max': 37.5, 'type': 'float','body_site':{'name':'Middle ear structure', 'snomed_code':'25342003'},'method':{'snomed_code':'448093005', 'name':'Measurement of temperature using tympanic thermometer'},'device':{'name':'Thermometer', 'udi_code': '06947468554666'}},
    '29463-7': {'name': 'Body Weight', 'unit': 'kg', 'min': 54.4, 'max': 113.4, 'type': 'float','body_site':{'name':'Entire body as a whole', 'snomed_code':'38266002'},'method':{'snomed_code':'39857003', 'name':'Weighing patient'},'device':{'name':'DIG MEDICAL SCALE W/HEIGHT ROD', 'udi_code': '00809161310108'}},
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

def load_snomed_file(filepath):
    data = []
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            for line in f:
                parts = line.strip().split('|')
                if len(parts) >= 2:
                    data.append({'code': parts[0].strip(), 'name': parts[1].strip()})
    return data

def load_allergy_reactions(filepath):
    reactions = []
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            for line in f:
                parts = line.strip().split('|')
                if len(parts) >= 3:
                    reactions.append({'code': parts[0].strip(), 'name': parts[1].strip(), 'severity': parts[2].strip()})
    return reactions

def generate_loinc_examples():
    return [{'code': k, 'name': v['name']} for k, v in VITAL_RANGES.items()]

# --- Main Script ---
if __name__ == '__main__':
    START_DATE = datetime(2023, 1, 1)
    INTERMEDIARY_DATE=datetime(2024, 1, 1)
    END_DATE = datetime.now()
    NUM_STAFF = 6
    STAFF_IDS = [generate_uuid() for _ in range(NUM_STAFF)]

    os.makedirs(os.path.dirname(RESIDENTS_FILE), exist_ok=True)
    
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

    snomed_allergy_names = load_snomed_file(SNOMED_ALLERGY_NAMES_FILE)
    snomed_allergy_reactions = load_allergy_reactions(SNOMED_ALLERGY_REACTIONS_FILE)
    snomed_allergy_substances = load_snomed_file(SNOMED_ALLERGY_SUBSTANCES_FILE)
    snomed_disorders = load_snomed_file(SNOMED_DISORDERS_FILE)
    loinc_vitals = generate_loinc_examples()

    prescriptions_templates = [
        {'rxnorm_code': '316151', 'snomed_code': '318859000', 'name': 'Lisinopril', 'strength': {'value':10, 'unit':'mg'}},
        {'rxnorm_code': '860974', 'snomed_code': '325278007','name': 'Metformin hydrochloride', 'strength': {'value':500, 'unit':'mg'}},
        {'rxnorm_code': '597966', 'snomed_code': '1145420004','name': 'Atorvastatin', 'strength': {'value':20,'unit':'mg'}},
        {'rxnorm_code': '315369', 'snomed_code': '323509004','name': 'Amoxicillin', 'strength': {'value':250,'unit':'mg'}},
        {'rxnorm_code': '343226', 'snomed_code': '789679003','name': 'Insulin Glargine', 'strength': {'value': 100, 'unit': 'unt/ml'}},
    ]

    dosage_instructions = {
        'timing': [ 'qd','bid','tid','qid', 'am','pm','qd','qod','q1h','q2h','q3h','q4h','q6h','q8h','bed','wk','mo'],
        'site': [{'name':'mouth','snomed_code':'123851003'},{'name':'cephalic vein', 'snomed_code':'20699002'},{'name':'gluteal muscle', 'snomed_code':'102291007'}],
        'route': ADMINISTRATION_ROUTES,
        'method': [{'name': 'Apply', 'snomed_code': '738991002'}, {'name': 'Inject', 'snomed_code': '740685003'},{'name': 'Swallow', 'snomed_code': '738995006'}, {'name': 'Chew', 'snomed_code': '738992009'}]
    }

    for resident in residents_data:
        resident_id = resident['id']
        resident_prescriptions = []

        num_allergies = random.randint(0, 2)
        for i in range(num_allergies):
            if snomed_allergy_names and snomed_allergy_reactions and snomed_allergy_substances:
                reaction = snomed_allergy_reactions[i % len(snomed_allergy_reactions)]
                substance = snomed_allergy_substances[i % len(snomed_allergy_substances)]
                all_allergies.append({
                    'id': generate_uuid(),
                    'data': {
                        'resident_id': resident_id,
                        'recorder_id': random.choice(STAFF_IDS),
                        'clinicalStatus': random.choice(ALLERGY_STATUSES['clinical']),
                        'verificationStatus': random.choice(ALLERGY_STATUSES['verification']),
                        'type': random.choice(ALLERGY_TYPES),
                        'recordedDate': get_random_datetime(START_DATE, END_DATE),
                        'substance': substance,
                        'reaction': reaction,
                    }
                })
        
        num_prescriptions = random.randint(1, 3)
        for _ in range(num_prescriptions):
            if prescriptions_templates:
                rx_template = random.choice(prescriptions_templates)
                
                dosage_obj = {
                    'timing': random.choice(dosage_instructions['timing']),
                    'site': random.choice(dosage_instructions['site']),
                    'route': random.choice(dosage_instructions['route']),
                    'method': random.choice(dosage_instructions['method']),
                    'doseAndRate': [{
                        'doseQuantity': {
                            'value': rx_template['strength']['value'],
                            'unit': rx_template['strength']['unit']
                        }
                    }]
                }

                rx_record = {
                    'id': generate_uuid(),
                    'data': {
                        'resident_id': resident_id,
                        'recorder_id': random.choice(STAFF_IDS),
                        'effective_period_start': get_random_datetime(START_DATE, INTERMEDIARY_DATE),
                        'effective_period_end': get_random_datetime(INTERMEDIARY_DATE, END_DATE),
                        'status': random.choice(PRESCRIPTION_STATUSES),
                        'adherence': random.choice(PRESCRIPTION_ADHERENCE_STATUSES),
                        'medication': rx_template,
                        'dosageInstruction': [dosage_obj]
                    }
                }
                all_prescriptions.append(rx_record)
                resident_prescriptions.append(rx_record)

        for rx_record in resident_prescriptions:
            timing = rx_record['data']['dosageInstruction'][0]['timing']
            doses_per_day = {'qd': 1, 'bid': 2, 'tid': 3, 'qid': 4, 'qam': 1, 'qpm': 1}.get(timing, 1)
            if doses_per_day == 0: continue

            start_date_str = rx_record['data']['effective_period_start']
            start_dt = datetime.fromisoformat(start_date_str.replace('Z', '+00:00')).replace(tzinfo=None)
            current_date = start_dt.date()
            while current_date <= END_DATE.date():
                for dose_num in range(doses_per_day):
                    hour = (9 + (dose_num * (24 // doses_per_day))) % 24
                    minute_offset = random.randint(-30, 30)
                    admin_time = datetime(current_date.year, current_date.month, current_date.day, hour, 30, 0) + timedelta(minutes=minute_offset)
                    
                    if admin_time > END_DATE: continue
                        
                    administered_dosage = rx_record['data']['dosageInstruction'][0]['doseAndRate'][0]['doseQuantity']

                    all_prescription_administration.append({
                        'id': generate_uuid(),
                        'data': {
                            'resident_id': resident_id,
                            'prescription_id': rx_record['id'],
                            'medication': rx_record['data']['medication'],
                            'recorder_id': random.choice(STAFF_IDS),
                            'status': random.choice(ADMINISTRATION_STATUSES),
                            'effective_datetime': pytz.utc.localize(admin_time).isoformat().replace('+00:00', 'Z'),
                            'dosage': {
                                'route': rx_record['data']['dosageInstruction'][0]['route'],
                                'administeredDose': administered_dosage
                            }
                        }
                    })
                current_date += timedelta(days=1)

        num_observations = random.randint(3, 8)
        for _ in range(num_observations):
            if loinc_vitals:
                vital_template = random.choice(loinc_vitals)
                loinc_code = vital_template['code']
                value, unit = get_observation_value(loinc_code)
                observation = {
                    'id': generate_uuid(),
                    'data': {
                        'resident_id': resident_id,
                        'recorder_id': random.choice(STAFF_IDS),
                        'status': random.choice(OBSERVATION_STATUSES),
                        'effective_datetime': get_random_datetime(START_DATE, END_DATE),
                        'loinc_code': loinc_code,
                        'name': vital_template['name'],
                        'value': value,
                        'unit': unit,
                        'body_site': VITAL_RANGES[loinc_code]['body_site'],
                        'method': VITAL_RANGES[loinc_code]['method'],
                        'device': VITAL_RANGES[loinc_code]['device']
                    }
                }
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
                        'clinicalStatus': clinical_status,
                        'recordedDate': get_random_datetime(datetime(2020, 1, 1), END_DATE),
                        'onsetDateTime': get_random_datetime(datetime(2000, 1, 1), datetime(2023, 1, 1)),
                        'abatementDateTime': abatement_date,
                        'title': disorder_example['name'],
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
                    'occurrence_datetime': get_random_datetime(START_DATE, END_DATE),
                    'type': random.choice(FINANCIAL_TYPES),
                    'description': random.choice(['Monthly Rent', 'Prescription Fee', 'Therapy Session', 'Payment Received', 'Co-pay', 'Late Fee'])
                }
            })

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
