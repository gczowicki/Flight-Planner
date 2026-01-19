from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from src.api import schemas
from src.core import flight_planner


app = FastAPI(
    title="Flight Planner API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


def round_for_output(flight_plan: flight_planner.FlightPlan) -> dict:
    def round_leg(leg: flight_planner.Leg) -> dict:
        return {
            "start_point": {"lat": leg.start_point.lat, "lon": leg.start_point.lon, "ident": leg.start_point.ident},
            "end_point": {"lat": leg.end_point.lat, "lon": leg.end_point.lon, "ident": leg.end_point.ident},
            "distance_nm": round(leg.distance_nm, 1),
            "true_course": round(leg.true_course),
            "magnetic_declination": round(leg.magnetic_declination),
        }

    def round_navlog_leg(row: flight_planner.NavLogLeg) -> dict:
        return {
            "leg": round_leg(row.leg),
            "wind": {"direction": row.wind.direction, "speed": row.wind.speed},
            "ground_speed": round(row.ground_speed),
            "wca": round(row.wca),
            "true_heading": round(row.true_heading),
            "magnetic_heading": round(row.magnetic_heading),
            "time_min": row.time_min,
        }

    return {
        "route": {
            "points": [{"lat": p.lat, "lon": p.lon, "ident": p.ident} for p in flight_plan.route.points],
            "legs": [round_leg(leg) for leg in flight_plan.route.legs],
            "total_distance_nm": round(flight_plan.route.total_distance_nm, 1),
        },
        "aircraft": {
            "registration": flight_plan.aircraft.registration,
            "model": flight_plan.aircraft.model,
            "tas": flight_plan.aircraft.tas,
            "gph": flight_plan.aircraft.gph,
        },
        "wind": {
            "direction": flight_plan.wind.direction,
            "speed": flight_plan.wind.speed,
        },
        "nav_log": {
            "rows": [round_navlog_leg(row) for row in flight_plan.nav_log.rows],
            "total_time_min": flight_plan.nav_log.total_time_min,
            "total_distance_nm": round(flight_plan.nav_log.total_distance_nm, 1),
        },
    }


@app.post("/api/v1/flight-plan", response_model=schemas.FlightPlanOutput)
def create_flight_plan(payload: schemas.FlightPlanInput):
    try:
        points = [
            flight_planner.Point(lat=p.lat, lon=p.lon, ident=p.ident)
            for p in payload.route_points
        ]

        aircraft = flight_planner.Aircraft(
            registration=payload.aircraft.registration,
            model=payload.aircraft.model,
            tas=payload.aircraft.tas,
            gph=payload.aircraft.gph,
        )

        wind = flight_planner.Wind(
            direction=payload.wind.direction,
            speed=payload.wind.speed,
        )

        route = flight_planner.Route.from_points(points)
        flight_plan = flight_planner.FlightPlan.create_from_navlog(route, aircraft, wind)

        return round_for_output(flight_plan)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))