
import json
import random

file_path = "/home/darealestninja/dev-projects/lean-ehr/packages/assisted-living/demo-data/residents/data.json"

legal_relationships = [
    "HCP_AGENT_DURABLE",
    "POA_FINANCIAL",
    "GUARDIAN_OF_PERSON",
    "GUARDIAN_OF_ESTATE",
    "TRUSTEE",
]

other_relationships = [
    "SPOUSE",
    "DOMESTIC_PARTNER",
    "PARENT",
    "CHILD",
    "SIBLING",
    "EMERGENCY_CONTACT",
    "CARETAKER",
    "FRIEND",
    "OTHER_RELATIVE",
]

with open(file_path, 'r') as f:
    data = json.load(f)

for resident in data:
    if "emergency_contacts" in resident["data"]:
        for contact in resident["data"]["emergency_contacts"]:
            relationships = []
            relationships.append(random.choice(other_relationships))
            if random.random() < 0.5:
                relationships.append(random.choice(legal_relationships))
            contact["encrypted_relationship"] = relationships

with open(file_path, 'w') as f:
    json.dump(data, f, indent=2)

print(f"Successfully updated {file_path}")
