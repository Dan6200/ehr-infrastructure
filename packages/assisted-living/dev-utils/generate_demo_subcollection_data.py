import json
import re
import uuid
import random
from datetime import datetime, timedelta, time
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
    'episodes_of_care': 'episodes_of_care/data-plain.json', # <-- ADDED
    'care_plans': 'care_plans/data-plain.json', # <-- ADDED
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
ADMINISTRATION_ROUTES = [{'snomed':{'display':'oral','code':'26643006'}},{'snomed':{ 'display':'intravenous','code':'47625008'}},{'snomed':{ 'display':'intramuscular','code':'78421000'}}, {'snomed': {'display':'subcutaneous','code':'34206005'}}, {'snomed': {'display':'topical','code':'6064005'}}]
FINANCIAL_TYPES = ['CHARGE', 'PAYMENT', 'ADJUSTMENT']
EPISODE_STATUSES = ['active', 'finished', 'cancelled', 'waitlist'] # <-- ADDED

# --- CarePlan Specific Configuration ---
CARE_PLAN_STATUSES = ['draft', 'active', 'on-hold', 'completed', 'revoked', 'entered-in-error', 'ended', 'unknown']

CARE_PLAN_GOALS = [
        {'title':'Maintain independence in bathing and dressing.', 'snomed': {'code':'284774007', 'display': 'Able to perform personal care activity'}}, 
        {'title':'Reduce risk of fall injuries (using mobility aids).', 'snomed': {'code':'301570003', 'display':'Able to mobilize using mobility aids'}},
        {'title': 'Improve social engagement and decrease isolation.', 'snomed': {'code':None, 'display':None}}, 
        {'title': 'Maintain current nutritional status/weight.', 'snomed': {'code':'1156958007', 'display':'Promotion of food and nutrient intake to support target weight and body mass'}},
        {'title': 'Effective management of chronic pain.', 'snomed': {'code':None, 'display':None}}
]

CARE_PLAN_ACTIVITIES = [
    {
        'code': '386420003',
        'display': 'Self-care assistance: bathing/hygiene',
        'timing': {
            'code': 'bid',
            'repeat': {
                'frequency': 2,
                'period': 1,
                'period_unit': 'd',
                'time_of_day': [time(8, 0), time(21, 0)],  # morning and night
            },
        },
    },
    {
        'code': '1230050000',
        'display': 'Assisting with dressing activity',
        'timing': {
            'code': 'qd',  # once daily
            'repeat': {
                'frequency': 1,
                'period': 1,
                'period_unit': 'd',
                'time_of_day': [time(8, 30)],  # after morning hygiene
            },
        },
    },
    {
        'code': None,
        'display': 'Daily 15-minute ambulation/walk',
        'timing': {
            'code': 'bid',
            'repeat': {
                'frequency': 2,
                'period': 1,
                'period_unit': 'd',
                'time_of_day': [time(10, 0), time(16, 0)],  # morning and afternoon walks
            },
        },
    },
    {
        'code': '435441000124107',
        'display': 'Medication reminder device set-up',
        'timing': {
            'code': 'once',
            'repeat': {
                'frequency': 1,
                'period': 1,
                'period_unit': 'wk',  # setup weekly (can adjust)
                'time_of_day': [time(9, 0)],
            },
        },
    },
    {
        'code': None,
        'display': 'Attend Thursday social group',
        'timing': {
            'code': 'weekly',
            'repeat': {
                'frequency': 1,
                'period': 1,
                'period_unit': 'wk',
                'day_of_week': ['thu'],
                'time_of_day': [time(14, 0)],  # Thursday at 2 PM
            },
        },
    },
    {
        'code': None,
        'display': 'Ensure pureed diet and fluid intake',
        'timing': {
            'code': 'tid',  # three times daily
            'repeat': {
                'frequency': 3,
                'period': 1,
                'period_unit': 'd',
                'time_of_day': [
                    time(8, 0),
                    time(12, 0),
                    time(18, 0),
                ],  # meal times
            },
        },
    },
    {
        'code': None,
        'display': 'Check skin integrity (daily)',
        'timing': {
            'code': 'qd',
            'repeat': {
                'frequency': 1,
                'period': 1,
                'period_unit': 'd',
                'time_of_day': [time(9, 0)],
            },
        },
    },
]

VITAL_RANGES = {
    '8480-6': {
        'loinc': {'code': '8480-6', 'display': 'Systolic Blood Pressure'},
        'unit': 'mmHg',
        'min': 100,
        'max': 140,
        'type': 'int',
        'body_site': {'snomed': {'display': 'upper arm', 'code': '40983000'}},
        'method': {'snomed': {'code': '371911009', 'display': 'Measurement of blood pressure using cuff method'}},
        'device': {'udi': {'display': 'Aneroid manual sphygmomanometer', 'code': '00616784710716'}},
    },
    '8462-4': {
        'loinc': {'code': '8462-4', 'display': 'Diastolic Blood Pressure'},
        'unit': 'mmHg',
        'min': 60,
        'max': 90,
        'type': 'int',
        'body_site': {'snomed': {'display': 'upper arm', 'code': '40983000'}},
        'method': {'snomed': {'code': '371911009', 'display': 'Measurement of blood pressure using cuff method'}},
        'device': {'udi': {'display': 'Aneroid manual sphygmomanometer', 'code': '00616784710716'}},
    },
    '8867-4': {
        'loinc': {'code': '8867-4', 'display': 'Heart Rate'},
        'unit': '/min',
        'min': 60,
        'max': 100,
        'type': 'int',
        'body_site': {'snomed': {'display': 'Structure of tip of index finger', 'code': '182266005'}},
        'method': {'snomed': {'code': '252465000', 'display': 'Pulse oximetry'}},
        'device': {'udi': {'display': 'Pulse Oximeter', 'code': '06924054300456'}},
    },
    '2708-6': {
        'loinc': {'code': '2708-6', 'display': 'Oxygen Saturation in Arterial Blood'},
        'unit': '%',
        'min': 94,
        'max': 100,
        'type': 'int',
        'body_site': {'snomed': {'display': 'Structure of tip of index finger', 'code': '182266005'}},
        'method': {'snomed': {'code': '252465000', 'display': 'Pulse oximetry'}},
        'device': {'udi': {'display': 'Pulse Oximeter', 'code': '06924054300456'}},
    },
    '8310-5': {
        'loinc': {'code': '8310-5', 'display': 'Body Temperature'},
        'unit': 'Cel',
        'min': 36.4,
        'max': 37.5,
        'type': 'float',
        'body_site': {'snomed': {'display': 'Middle ear structure', 'code': '25342003'}},
        'method': {'snomed': {'code': '448093005', 'display': 'Measurement of temperature using tympanic thermometer'}},
        'device': {'udi': {'display': 'Thermometer', 'code': '06947468554666'}},
    },
    '29463-7': {
        'loinc': {'code': '29463-7', 'display': 'Body Weight'},
        'unit': 'kg',
        'min': 54.4,
        'max': 113.4,
        'type': 'float',
        'body_site': {'snomed': {'display': 'Entire body as a whole', 'code': '38266002'}},
        'method': {'snomed': {'code': '39857003', 'display': 'Weighing patient'}},
        'device': {'udi': {'display': 'DIG MEDICAL SCALE W/HEIGHT ROD', 'code': '00809161310108'}},
    },
}

# --- Helper Functions ---
def convert_times(obj):
    if isinstance(obj, dict):
        return {k: convert_times(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_times(v) for v in obj]
    elif isinstance(obj, time):
        return obj.isoformat()
    else:
        return obj

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
                    data.append({'code': parts[0].strip(), 'display': (re.sub(r'\([^)]*\)','',parts[1])).strip()})
    return data

def load_allergy_reactions(filepath):
    reactions = []
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            for line in f:
                parts = line.strip().split('|')
                if len(parts) >= 3:
                    reactions.append({'code': parts[0].strip(), 'display': (re.sub(r'\([^)]*\)','',parts[1])).strip(), 'severity': parts[2].strip()})
    return reactions

def generate_loinc_examples():
    return [v['loinc'] for _, v in VITAL_RANGES.items()]

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
    all_episodes_of_care = [] # <-- ADDED
    all_care_plans = [] # <-- ADDED

    snomed_allergy_names = load_snomed_file(SNOMED_ALLERGY_NAMES_FILE)
    snomed_allergy_reactions = load_allergy_reactions(SNOMED_ALLERGY_REACTIONS_FILE)
    snomed_allergy_substances = load_snomed_file(SNOMED_ALLERGY_SUBSTANCES_FILE)
    snomed_disorders = load_snomed_file(SNOMED_DISORDERS_FILE)
    loinc_vitals = generate_loinc_examples()

    prescriptions_templates = [
            {'rxnorm': { 'code': '316151', 'display':'lisinopril 10 MG'}, 'snomed': {'code': '318859000', 'display': 'Lisinopril'}, 'strength': {'value':10, 'unit':'mg'}},
            {'rxnorm': { 'code': '860974', 'display':'metFORMIN hydrochloride 500 MG'}, 'snomed': {'code': '325278007','display': 'Metformin hydrochloride'}, 'strength': {'value':500, 'unit':'mg'}},
        {'rxnorm': { 'code': '597966', 'display':'atorvastatin 20 MG'}, 'snomed': {'code': '1145420004','display': 'Atorvastatin'}, 'strength': {'value':20,'unit':'mg'}},
        {'rxnorm': { 'code': '315369', 'display':'amoxicillin 250 MG'}, 'snomed': {'code': '323509004','display': 'Amoxicillin'}, 'strength': {'value':250,'unit':'mg'}},
        {'rxnorm': { 'code': '343226', 'display': 'insulin glargine 100 UNT/ML'}, 'snomed': {'code': '789679003','display': 'Insulin Glargine'}, 'strength': {'value': 100, 'unit': 'unt/ml'}},
    ]

    dosage_instructions = {
        'timing': [
            {
                'code': 'qd',  # once daily
                'repeat': {
                    'count': 20,
                    'frequency': 1,
                    'period': 1,
                    'period_unit': 'd',
                    'time_of_day': [time(9, 0)],  # 9:00 AM
                },
            },
            {
                'code': 'bid',  # twice daily
                'repeat': {
                    'count': 100,
                    'frequency': 2,
                    'period': 1,
                    'period_unit': 'd',
                    'time_of_day': [
                        time(9, 0),
                        time(21, 0),
                    ],  # 9:00 AM, 9:00 PM
                },
            },
            {
                'code': 'tid',  # three times daily
                'repeat': {
                    'frequency': 3,
                    'period': 1,
                    'period_unit': 'd',
                    'time_of_day': [
                        time(8, 0),
                        time(14, 0),
                        time(20, 0),
                    ],  # morning, noon, evening
                },
            },
            {
                'code': 'qid',  # four times daily
                'repeat': {
                    'frequency': 4,
                    'period': 1,
                    'period_unit': 'd',
                    'time_of_day': [
                        time(6, 0),
                        time(12, 0),
                        time(18, 0),
                        time(22, 0),
                    ],
                },
            },
            {
                'code': 'am',  # every morning
                'repeat': {
                    'frequency': 1,
                    'period': 1,
                    'period_unit': 'd',
                    'time_of_day': [time(8, 0)],
                },
            },
            {
                'code': 'pm',  # every evening
                'repeat': {
                    'frequency': 1,
                    'period': 1,
                    'period_unit': 'd',
                    'time_of_day': [time(20, 0)],
                },
            },
            {
                'code': 'qod',  # every other day
                'repeat': {
                    'frequency': 1,
                    'period': 2,
                    'period_unit': 'd',
                    'time_of_day': [time(9, 0)],
                },
            },
            {
                'code': 'q1h',  # every 1 hour
                'repeat': {
                    'frequency': 1,
                    'period': 1,
                    'period_unit': 'h',
                },
            },
            {
                'code': 'q2h',  # every 2 hours
                'repeat': {
                    'frequency': 1,
                    'period': 2,
                    'period_unit': 'h',
                },
            },
            {
                'code': 'q3h',  # every 3 hours
                'repeat': {
                    'frequency': 1,
                    'period': 3,
                    'period_unit': 'h',
                },
            },
            {
                'code': 'q4h',  # every 4 hours
                'repeat': {
                    'frequency': 1,
                    'period': 4,
                    'period_unit': 'h',
                },
            },
            {
                'code': 'q6h',  # every 6 hours
                'repeat': {
                    'frequency': 1,
                    'period': 6,
                    'period_unit': 'h',
                },
            },
            {
                'code': 'q8h',  # every 8 hours
                'repeat': {
                    'frequency': 1,
                    'period': 8,
                    'period_unit': 'h',
                },
            },
            {
                'code': 'bed',  # at bedtime
                'repeat': {
                    'frequency': 1,
                    'period': 1,
                    'period_unit': 'd',
                    'time_of_day': [time(22, 0)],  # 10:00 PM
                },
            },
        ],
            'site': [{'snomed': {'display':'mouth','code':'123851003'}},{'snomed':{'display':'cephalic vein', 'code':'20699002'}},
                     {'snomed':{'display':'gluteal muscle', 'code':'102291007'}}],
            'route': ADMINISTRATION_ROUTES, 
            'method': [{'snomed':{'display': 'Apply', 'code': '738991002'}}, {'snomed':{'display': 'Inject', 'code': '740685003'}},
                       {'snomed':{'display': 'Swallow', 'code': '738995006'}}, {'snomed':{'display': 'Chew', 'code': '738992009'}}]
    }

    for resident in residents_data:
        resident_id = resident['id']
        resident_prescriptions = []

        # --- CARE PLANS (The HACC/CACP equivalent for service definition) ---
        selected_goals = random.sample(CARE_PLAN_GOALS, random.randint(2, 3))
        selected_activities = random.sample(CARE_PLAN_ACTIVITIES, random.randint(3, 5))
        
        care_plan_activities_list = [{
            'id': generate_uuid(),
            'snomed': {'code': act['code'], 'display': act['display']},
            'status': 'scheduled',
            'timing': act['timing'],
            'staff_instructions': f"Ensure resident comfort during {act['display'].split('(')[0].strip().lower()}."
        } for act in selected_activities]
        
        all_care_plans.append({
            'id': generate_uuid(),
            'data': {
                'resident_id': resident_id,
                'status': 'active',
                'title': f"Personalized Care Plan - {datetime.now().year}",
                'author_id': random.choice(STAFF_IDS),
                'created_date': get_random_datetime(datetime(2024, 1, 1), END_DATE),
                'goals': selected_goals,
                'activities': care_plan_activities_list
            }
        })

        # --- EPISODES OF CARE (Admission/Discharge History) ---
        num_historical_episodes = random.randint(0, 1)
        for i in range(num_historical_episodes):
            start_year = random.randint(2018, 2022)
            end_year = random.randint(start_year + 1, 2023)
            episode_start = datetime(start_year, random.randint(1, 12), random.randint(1, 28))
            episode_end = datetime(end_year, random.randint(1, 12), random.randint(1, 28))
            
            if episode_end <= episode_start:
                episode_end = episode_start + timedelta(days=random.randint(30, 365))

            all_episodes_of_care.append({
                'id': generate_uuid(),
                'data': {
                    'resident_id': resident_id,
                    'status': random.choice(['finished', 'cancelled']),
                    'type': random.choice([
                        {'code':'pac','display':'Post-acute Care','system': 'http://terminology.hl7.org/CodeSystem/episodeofcare-type'},
                        {'code':'hacc', 'display':'Home and Community Care', 
                             'system': 'http://terminology.hl7.org/CodeSystem/episodeofcare-type'}, 
                        {'code':'cacp', 'display': 'Community-based aged Care',
                             'system': 'http://terminology.hl7.org/CodeSystem/episodeofcare-type'}, 
                        {'code':'daib', 'display': 'Post coordinated diabetes program',
                            'system':'http://terminology.hl7.org/CodeSystem/episodeofcare-type'}]),
                    'effective_period_start': get_random_datetime(episode_start, episode_start + timedelta(days=7)),
                    'effective_period_end': get_random_datetime(episode_end, episode_end + timedelta(days=7)),
                    'managing_organization': 'Golden Years Retreat Homes'
                }
            })

        current_start_date = datetime(2023, random.randint(1, 6), random.randint(1, 28))
        all_episodes_of_care.append({
            'id': generate_uuid(),
            'data': {
                'resident_id': resident_id,
                'status': 'active',
                'type': 'Long Term Care',
                'effective_period_start': get_random_datetime(current_start_date, current_start_date + timedelta(days=30)),
                'effective_period_end': None, # No end date for active episode
                'managing_organization': 'Golden Years Retreat Homes'
            }
        })

        # --- ALLERGIES ---
        num_allergies = random.randint(0, 2)
        for i in range(num_allergies):
            if snomed_allergy_names and snomed_allergy_reactions and snomed_allergy_substances:
                allergy_name = snomed_allergy_names[i % len(snomed_allergy_names)]
                reaction = snomed_allergy_reactions[i % len(snomed_allergy_reactions)]
                substance = snomed_allergy_substances[i % len(snomed_allergy_substances)]
                all_allergies.append({
                    'id': generate_uuid(),
                    'data': {
                        'resident_id': resident_id,
                        'recorder_id': random.choice(STAFF_IDS),
                        'clinical_status': random.choice(ALLERGY_STATUSES['clinical']),
                        'verification_status': random.choice(ALLERGY_STATUSES['verification']),
                        'name': {'snomed': allergy_name},
                        'type': random.choice(ALLERGY_TYPES),
                        'recorded_date': get_random_datetime(START_DATE, END_DATE),
                        'substance': {'snomed': substance},
                        'reaction': {'snomed': { 'code': reaction['code'], 'display': reaction['display']}, 'severity': reaction['severity']}
                    }
                })
        
        # --- PRESCRIPTIONS ---
        num_prescriptions = random.randint(1, 3)
        for _ in range(num_prescriptions):
            if prescriptions_templates:
                rx_template = random.choice(prescriptions_templates)
                
                dosage_obj = {
                    'timing': random.choice(dosage_instructions['timing']),
                    'site': random.choice(dosage_instructions['site']),
                    'route': random.choice(dosage_instructions['route']),
                    'method': random.choice(dosage_instructions['method']),
                    'dose_and_rate': [{
                        'dose_quantity': {
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
                        'dosage_instruction': [dosage_obj]
                    }
                }
                all_prescriptions.append(rx_record)
                resident_prescriptions.append(rx_record)

        # --- PRESCRIPTION ADMINISTRATION ---
        for rx_record in resident_prescriptions:
            timing = rx_record['data']['dosage_instruction'][0]['timing']
            doses_per_day = timing['repeat']['frequency']
            if doses_per_day == 0: continue

            start_date_str = rx_record['data']['effective_period_start']
            start_dt = datetime.fromisoformat(start_date_str.replace('Z', '+00:00')).replace(tzinfo=None)
            current_date = start_dt.date()
            time_of_day = timing['repeat'].get('time_of_day',[time(9,0)])
            while current_date <= END_DATE.date():
                for i, dose_num in enumerate(range(doses_per_day)):
                    hour = time_of_day[i].hour
                    minute = time_of_day[i].minute
                    hour_offset = random.randint(-2, 2)
                    minute_offset = random.randint(-30, 30)
                    admin_time = datetime(current_date.year, current_date.month, current_date.day, hour, 30, 0) + timedelta(hours=hour_offset, minutes=minute_offset)
                    
                    if admin_time > END_DATE: continue
                        
                    administered_dosage = rx_record['data']['dosage_instruction'][0]['dose_and_rate'][0]['dose_quantity']

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
                                'route': rx_record['data']['dosage_instruction'][0]['route'],
                                'administered_dose': administered_dosage
                            }
                        }
                    })
                current_date += timedelta(days=1)

        # --- OBSERVATIONS ---
        num_observations = random.randint(3, 8)
        for _ in range(num_observations):
            if loinc_vitals:
                vital_template = random.choice(loinc_vitals)
                loinc= vital_template
                value, unit = get_observation_value(loinc['code'])
                observation = {
                    'id': generate_uuid(),
                    'data': {
                        'resident_id': resident_id,
                        'recorder_id': random.choice(STAFF_IDS),
                        'status': random.choice(OBSERVATION_STATUSES),
                        'effective_datetime': get_random_datetime(START_DATE, END_DATE),
                        'loinc': loinc,
                        'value': value,
                        'unit': unit,
                        'body_site': VITAL_RANGES[loinc['code']]['body_site'],
                        'method': VITAL_RANGES[loinc['code']]['method'],
                        'device': VITAL_RANGES[loinc['code']]['device']
                    }
                }
                all_observations.append(observation)

        # --- DIAGNOSTIC HISTORY ---
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
                        'onset_datetime': get_random_datetime(datetime(2000, 1, 1), datetime(2023, 1, 1)),
                        'abatement_datetime': abatement_date,
                        'snomed': {'title': disorder_example['display'], 'code': disorder_example['code']}
                    }
                })

        # --- FINANCIALS ---
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

    # --- Write Sub-Collection Files (Corrected Pathing) ---
    for sub_dir, sub_file in SUBCOLLECTION_FILES.items():
        # Ensure the directory exists (e.g., 'demo-data/allergies')
        os.makedirs(os.path.join(SUBCOLLECTIONS_DIR, os.path.dirname(sub_file)), exist_ok=True)
        data_map = {
            'allergies': all_allergies,
            'prescriptions': all_prescriptions,
            'observations': all_observations,
            'diagnostic_history': all_diagnostic_history,
            'financials': all_financials,
            'prescription_administration': all_prescription_administration,
            'episodes_of_care': all_episodes_of_care, # <-- ADDED
            'care_plans': all_care_plans # <-- ADDED
        }
        if sub_dir in data_map:
            # Write to the full path (e.g., 'demo-data/allergies/data-plain.json')
            with open(os.path.join(SUBCOLLECTIONS_DIR, sub_file), 'w') as f:
                data = convert_times(data_map[sub_dir])
                json.dump(data, f, indent=2)

    print("FHIR-Aligned Demo data generation complete.")

