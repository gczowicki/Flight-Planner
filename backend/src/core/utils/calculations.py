from math import atan2, degrees, radians, cos, sin, asin, sqrt


EARTH_RADIUS_NM = 3440.065
DEFAULT_DECLINATION = 6.0


def get_magnetic_declination(lat: float, lon: float) -> float:
    return DEFAULT_DECLINATION


def calc_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
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
