import random
from .utils import generate_uuid, get_random_datetime
from datetime import datetime

def generate_financial_data_for_resident(
    resident_id: str, resident_name: str, start_date: datetime, end_date: datetime
) -> dict:
    """Generates a dictionary of related financial data for a single resident."""
    accounts = []
    coverages = []
    charges = []
    claims = []
    payments = []
    adjustments = []

    # --- 1. Create the main Account for the resident ---
    account_id = f"acc_{resident_id}"
    accounts.append(
        {
            "id": account_id,
            "data": {
                "subject": {"id": resident_id, "name": resident_name},
                "balance": {"value": 0, "currency": "NGN"},  # Updated
                "created_at": get_random_datetime(start_date, end_date),
                "billing_status": {
                    "coding": [
                        {
                            "system": "http://hl7.org/fhir/account-billing-status",
                            "code": "open",
                            "display": "Open",
                        }
                    ]
                },
            },
        }
    )

    # --- 2. Create Coverage for the resident ---
    coverage_id = f"cov_{resident_id}"
    payor_org = "HMO-A"
    coverages.append(
        {
            "id": coverage_id,
            "data": {
                "status": "active",
                "type": "Private Insurance",
                "beneficiary_id": resident_id,
                "payor": {"id": f"org_{payor_org}", "organization": payor_org},
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat(),
                },
                "created_at": get_random_datetime(start_date, end_date),
            },
        }
    )

    # --- 3. Generate Charges ---
    total_charges_value = 0
    for _ in range(random.randint(2, 10)):
        unit_price_value = round(random.uniform(5000, 200000), 2)
        quantity = random.randint(1, 3)
        total_charges_value += unit_price_value * quantity

        charge = {
            "id": generate_uuid(),
            "data": {
                "service": random.choice(
                    [
                        "Monthly Rent",
                        "Physical Therapy",
                        "Medication Fee",
                        "Specialist Consultation",
                    ]
                ),
                "quantity": quantity,
                "unit_price": {"value": unit_price_value, "currency": "NGN"}, # Updated
                "occurrence_datetime": get_random_datetime(start_date, end_date),
            },
        }
        charges.append(charge)

    # --- 4. Create a Claim, Payment, and Adjustment ---
    claim_total_value = 0
    if charges:
        claim_charges = random.sample(
            charges, k=min(len(charges), random.randint(1, 5))
        )
        claim_total_value = sum(
            c["data"]["unit_price"]["value"] * c["data"]["quantity"] for c in claim_charges
        )

        claim_id = f"claim_{resident_id}"
        claims.append(
            {
                "id": claim_id,
                "data": {
                    "created": get_random_datetime(start_date, end_date),
                    "status": "adjudicated", # Changed to adjudicated to justify payment
                    "coverage_id": coverage_id,
                    "charge_ids": [c["id"] for c in claim_charges],
                    "total": {"value": claim_total_value, "currency": "NGN"}, # Updated
                },
            }
        )

        # 5. Generate a Payment for the claim
        paid_amount = round(claim_total_value * random.uniform(0.7, 0.95), 2) # Insurer pays 70-95%
        payments.append({
            "id": generate_uuid(),
            "data": {
                "claim_id": claim_id,
                "coverage_id": coverage_id,
                "amount": {"value": paid_amount, "currency": "NGN"},
                "payor": payor_org,
                "occurrence_datetime": get_random_datetime(start_date, end_date),
                "method": "EFT",
            }
        })

        # 6. Generate an Adjustment for the claim
        adjustment_amount = claim_total_value - paid_amount
        adjustments.append({
            "id": generate_uuid(),
            "data": {
                "claim_id": claim_id,
                "reason": "Contractual Adjustment",
                "approved_amount": {"value": adjustment_amount, "currency": "NGN"},
                "created_at": get_random_datetime(start_date, end_date),
            }
        })

    # --- 7. Update final Account Balance ---
    final_balance = total_charges_value - sum(p["data"]["amount"]["value"] for p in payments) - sum(a["data"]["approved_amount"]["value"] for a in adjustments)
    if accounts:
        accounts[0]["data"]["balance"]["value"] = round(final_balance, 2)

    return {
        "accounts": accounts,
        "coverages": coverages,
        "charges": charges,
        "claims": claims,
        "payments": payments,
        "adjustments": adjustments,
    }
