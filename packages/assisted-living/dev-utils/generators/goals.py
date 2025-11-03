import random
from .utils import generate_uuid
from .config import CARE_PLAN_GOALS

def generate_goals() -> dict:
    """Generates a list of standalone goal documents and returns them along with their IDs."""
    goals = []
    goal_ids = []
    for goal_template in CARE_PLAN_GOALS:
        goal_id = generate_uuid()
        goal_ids.append(goal_id)
        goal = {
            "id": goal_id,
            "data": goal_template
        }
        goals.append(goal)
    
    return {"goals": goals, "goal_ids": goal_ids}