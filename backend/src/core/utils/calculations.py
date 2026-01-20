from math import atan2, degrees, radians, cos, sin, asin, sqrt


EARTH_RADIUS_NM = 3440.065
DEFAULT_DECLINATION = 6.0


def _validate_coordinates(lat1: float, lon1: float, lat2: float, lon2: float) -> None:
    if not (-90 <= lat1 <= 90 and -90 <= lat2 <= 90):
        raise ValueError("Both latitudes must be in [-90, 90]")
    if not (-180 <= lon1 <= 180 and -180 <= lon2 <= 180):
        raise ValueError("Both longitudes must be in [-180, 180]")


def get_magnetic_declination(lat: float, lon: float, override: float | None = None) -> float:
    if override is not None:
        return override
    return DEFAULT_DECLINATION


def calc_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    _validate_coordinates(lat1, lon1, lat2, lon2)

    lat1_rad = radians(lat1)
    lon1_rad = radians(lon1)
    lat2_rad = radians(lat2)
    lon2_rad = radians(lon2)
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = sin(dlat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return c * EARTH_RADIUS_NM


def calc_course(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    _validate_coordinates(lat1, lon1, lat2, lon2)
    
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    dlon_rad = radians(lon2 - lon1)
    y = sin(dlon_rad) * cos(lat2_rad)
    x = cos(lat1_rad) * sin(lat2_rad) - sin(lat1_rad) * cos(lat2_rad) * cos(dlon_rad)
    course = degrees(atan2(y, x))
    return (course + 360) % 360


def solve_wind_triangle(
    true_course: float, tas: float, wind_dir: float, wind_speed: float
) -> tuple[float, float]:
    if true_course < 0 or true_course >= 360:
        raise ValueError("True course must be in [0, 360) degrees!")
    if tas <= 0:
        raise ValueError("TAS must be positive!")
    if wind_dir < 0 or wind_dir >= 360:
        raise ValueError("Wind direction must be in [0, 360) degrees!")
    if wind_speed < 0:
        raise ValueError("Wind speed cannot be negative!")
    if wind_speed >= tas:
        raise ValueError(f"Wind speed ({wind_speed} kt) >= TAS ({tas} kt)!")

    wd_rad = radians(wind_dir)
    tc_rad = radians(true_course)
    wind_angle = wd_rad - tc_rad
    cross_wind = wind_speed * sin(wind_angle)
    wca_rad = asin(cross_wind / tas)
    wca = degrees(wca_rad)
    ground_speed = tas * cos(wca_rad) - wind_speed * cos(wind_angle)
    return ground_speed, wca
