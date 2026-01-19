from typing import List, Optional
from pydantic import BaseModel, Field


class PointInput(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    ident: Optional[str] = None


class AircraftInput(BaseModel):
    registration: str = "SP-N/A"
    model: str = "Unknown"
    tas: int = Field(..., gt=0)
    gph: float = Field(0.0, ge=0)


class WindInput(BaseModel):
    direction: int = Field(0, ge=0, lt=360)
    speed: int = Field(0, ge=0)


class FlightPlanInput(BaseModel):
    route_points: List[PointInput] = Field(..., min_length=2)
    aircraft: AircraftInput
    wind: WindInput


class PointOutput(BaseModel):
    lat: float
    lon: float
    ident: Optional[str]


class LegOutput(BaseModel):
    start_point: PointOutput
    end_point: PointOutput
    distance_nm: float
    true_course: int
    magnetic_declination: int


class WindOutput(BaseModel):
    direction: int
    speed: int


class NavLogLegOutput(BaseModel):
    leg: LegOutput
    wind: WindOutput
    ground_speed: int
    wca: int
    true_heading: int
    magnetic_heading: int
    time_min: int


class NavLogOutput(BaseModel):
    rows: List[NavLogLegOutput]
    total_time_min: int
    total_distance_nm: float


class AircraftOutput(BaseModel):
    registration: str
    model: str
    tas: int
    gph: float


class RouteOutput(BaseModel):
    points: List[PointOutput]
    legs: List[LegOutput]
    total_distance_nm: float


class FlightPlanOutput(BaseModel):
    route: RouteOutput
    aircraft: AircraftOutput
    wind: WindOutput
    nav_log: NavLogOutput