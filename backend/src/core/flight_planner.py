from dataclasses import dataclass
from typing import List, Optional
from .utils import calculations


@dataclass(frozen=True)
class Point:
    lat: float
    lon: float
    ident: Optional[str] = None


@dataclass(frozen=True)
class Leg:
    start_point: Point
    end_point: Point
    distance_nm: float
    true_course: float
    magnetic_declination: float

    @classmethod
    def from_points(cls, p1: Point, p2: Point) -> "Leg":
        dist = calculations.calc_distance(p1.lat, p1.lon, p2.lat, p2.lon)
        tc = calculations.calc_course(p1.lat, p1.lon, p2.lat, p2.lon)

        md = calculations.get_magnetic_declination(p1.lat, p1.lon)

        return cls(
            start_point=p1,
            end_point=p2,
            distance_nm=dist,
            true_course=tc,
            magnetic_declination=md,
        )


@dataclass(frozen=True)
class Route:
    points: List[Point]
    legs: List[Leg]
    total_distance_nm: float

    @classmethod
    def from_points(cls, points: List[Point]) -> "Route":
        if len(points) < 2:
            return cls(points=points, legs=[], total_distance_nm=0.0)

        legs = []
        total_dist = 0.0

        for i in range(len(points) - 1):
            p1 = points[i]
            p2 = points[i + 1]
            leg = Leg.from_points(p1, p2)
            legs.append(leg)
            total_dist += leg.distance_nm

        return cls(points=points, legs=legs, total_distance_nm=total_dist)


@dataclass
class Aircraft:
    registration: str
    model: str
    tas: int
    gph: float  # placeholder for gallons per hour


@dataclass
class Wind:
    direction: int = 0
    speed: int = 0


@dataclass(frozen=True)
class NavLogLeg:
    leg: Leg
    wind: Wind

    ground_speed: float
    wca: float
    true_heading: float
    magnetic_heading: float

    time_min: int

    @classmethod
    def calculate(cls, leg: Leg, aircraft: Aircraft, wind: Wind) -> "NavLogLeg":
        gs, wca = calculations.solve_wind_triangle(
            true_course=leg.true_course,
            tas=aircraft.tas,
            wind_dir=wind.direction,
            wind_speed=wind.speed,
        )

        th = (leg.true_course + wca + 360) % 360
        mh = (th - leg.magnetic_declination + 360) % 360

        if gs <= 0:
            raise ValueError("Ground Speed non-positive!")

        hours = leg.distance_nm / gs
        minutes = int(round(hours * 60))

        return cls(
            leg=leg,
            wind=wind,
            ground_speed=gs,
            wca=wca,
            true_heading=th,
            magnetic_heading=mh,
            time_min=minutes,
        )


@dataclass(frozen=True)
class NavLog:
    rows: List[NavLogLeg]
    total_time_min: int
    total_distance_nm: float

    @classmethod
    def calculate(cls, route: Route, aircraft: Aircraft, wind: Wind) -> "NavLog":
        rows = []
        total_minutes = 0

        for leg in route.legs:
            row = NavLogLeg.calculate(leg, aircraft, wind)
            rows.append(row)
            total_minutes += row.time_min

        return cls(
            rows=rows,
            total_time_min=total_minutes,
            total_distance_nm=route.total_distance_nm,
        )


@dataclass(frozen=True)
class FlightPlan:
    route: Route
    aircraft: Aircraft
    wind: Wind
    nav_log: NavLog

    @classmethod
    def create_from_navlog(
        cls, route: Route, aircraft: Aircraft, wind: Wind
    ) -> "FlightPlan":
        nav_log = NavLog.calculate(route, aircraft, wind)

        return cls(route=route, aircraft=aircraft, wind=wind, nav_log=nav_log)
