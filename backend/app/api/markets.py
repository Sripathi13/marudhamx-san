from fastapi import APIRouter
import json
import os

router = APIRouter()
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

@router.get("")
async def get_markets():
    with open(os.path.join(DATA_DIR, "markets.json")) as f:
        return json.load(f)["markets"]

@router.get("/crops")
async def get_crops():
    with open(os.path.join(DATA_DIR, "crops.json")) as f:
        return json.load(f)["crops"]

@router.get("/vehicles")
async def get_vehicles():
    with open(os.path.join(DATA_DIR, "vehicles.json")) as f:
        return json.load(f)
