import pytest
from pytest import approx
from itertools import product
from src.core.utils import calculations

DISTANCE_TOLERANCE_NM = 0.1
COURSE_TOLERANCE_DEG = 1.0
GS_TOLERANCE_KT = 1.0
WCA_TOLERANCE_DEG = 1.0

DIRECTIONS = {
    "N": 0, "NE": 45, "E": 90, "SE": 135,
    "S": 180, "SW": 225, "W": 270, "NW": 315
}


class TestCalcDistanceBasic:

    def test_along_equator(self):
        dist = calculations.calc_distance(0.0, 0.0, 0.0, 1.0)
        assert dist == approx(60.0, abs=DISTANCE_TOLERANCE_NM)

    def test_along_meridian(self):
        dist = calculations.calc_distance(0.0, 0.0, 1.0, 0.0)
        assert dist == approx(60.0, abs=DISTANCE_TOLERANCE_NM)

    def test_diagonal(self):
        dist = calculations.calc_distance(50.0, 20.0, 51.0, 21.0)
        assert dist == approx(71.1, abs=DISTANCE_TOLERANCE_NM)

    def test_same_point(self):
        dist = calculations.calc_distance(52.0, 21.0, 52.0, 21.0)
        assert dist == approx(0.0, abs=DISTANCE_TOLERANCE_NM)


class TestCalcDistanceSigns:
    BASE_LAT1, BASE_LON1 = 50.0, 20.0
    BASE_LAT2, BASE_LON2 = 51.0, 21.0
    EXPECTED_DISTANCE = 71.1  # distance for the base coordinates above

    @pytest.mark.parametrize("lat_sign, lon_sign", list(product([1, -1], repeat=2)))
    def test_quadrant_symmetry(self, lat_sign, lon_sign):
        lat1 = self.BASE_LAT1 * lat_sign
        lon1 = self.BASE_LON1 * lon_sign
        lat2 = self.BASE_LAT2 * lat_sign
        lon2 = self.BASE_LON2 * lon_sign

        dist = calculations.calc_distance(lat1, lon1, lat2, lon2)
        assert dist == approx(self.EXPECTED_DISTANCE, abs=DISTANCE_TOLERANCE_NM)


class TestCalcDistanceValidation:
    @pytest.mark.parametrize("lat1, lon1, lat2, lon2", [
        (91.0, 0.0, 0.0, 0.0),
        (-91.0, 0.0, 0.0, 0.0),
        (0.0, 0.0, 91.0, 0.0),
        (0.0, 0.0, -91.0, 0.0),
        (0.0, 181.0, 0.0, 0.0),
        (0.0, -181.0, 0.0, 0.0),
        (0.0, 0.0, 0.0, 181.0),
        (0.0, 0.0, 0.0, -181.0),
    ])
    def test_invalid_coordinates(self, lat1, lon1, lat2, lon2):
        with pytest.raises(ValueError):
            calculations.calc_distance(lat1, lon1, lat2, lon2)


class TestCalcCourseBasic:
    def test_north(self):
        course = calculations.calc_course(0.0, 0.0, 1.0, 0.0)
        assert course == approx(0.0, abs=COURSE_TOLERANCE_DEG) or course == approx(360.0, abs=COURSE_TOLERANCE_DEG)

    def test_south(self):
        course = calculations.calc_course(1.0, 0.0, 0.0, 0.0)
        assert course == approx(180.0, abs=COURSE_TOLERANCE_DEG)

    def test_east(self):
        course = calculations.calc_course(0.0, 0.0, 0.0, 1.0)
        assert course == approx(90.0, abs=COURSE_TOLERANCE_DEG)

    def test_west(self):
        course = calculations.calc_course(0.0, 1.0, 0.0, 0.0)
        assert course == approx(270.0, abs=COURSE_TOLERANCE_DEG)

    def test_diagonal(self):
        course = calculations.calc_course(50.0, 20.0, 51.0, 21.0)
        assert course == approx(32.0, abs=COURSE_TOLERANCE_DEG)

    def test_same_point(self):
        course = calculations.calc_course(52.0, 21.0, 52.0, 21.0)
        assert 0.0 <= course <= 360.0


class TestCalcCourseSigns:
    BASE_LAT1, BASE_LON1 = 50.0, 20.0
    BASE_LAT2, BASE_LON2 = 51.0, 21.0
    BASE_COURSE = 32.0  # course for the base coordinates above

    EXPECTED_COURSES = {
        (1, 1): BASE_COURSE,
        (-1, 1): 180.0 - BASE_COURSE,
        (-1, -1): 180.0 + BASE_COURSE,
        (1, -1): 360.0 - BASE_COURSE,
    }

    @pytest.mark.parametrize("lat_sign, lon_sign", list(product([1, -1], repeat=2)))
    def test_quadrant_courses(self, lat_sign, lon_sign):
        lat1 = self.BASE_LAT1 * lat_sign
        lon1 = self.BASE_LON1 * lon_sign
        lat2 = self.BASE_LAT2 * lat_sign
        lon2 = self.BASE_LON2 * lon_sign

        course = calculations.calc_course(lat1, lon1, lat2, lon2)
        expected = self.EXPECTED_COURSES[(lat_sign, lon_sign)]

        assert course == approx(expected, abs=COURSE_TOLERANCE_DEG)


class TestCalcCourseValidation:
    @pytest.mark.parametrize("lat1, lon1, lat2, lon2", [
        (91.0, 0.0, 0.0, 0.0),
        (-91.0, 0.0, 0.0, 0.0),
        (0.0, 0.0, 91.0, 0.0),
        (0.0, 0.0, -91.0, 0.0),
        (0.0, 181.0, 0.0, 0.0),
        (0.0, -181.0, 0.0, 0.0),
        (0.0, 0.0, 0.0, 181.0),
        (0.0, 0.0, 0.0, -181.0),
    ])
    def test_invalid_coordinates(self, lat1, lon1, lat2, lon2):
        with pytest.raises(ValueError):
            calculations.calc_course(lat1, lon1, lat2, lon2)


class TestWindTriangleHappyPath:
    TAS = 100.0
    WIND_SPEED = 10.0

    EXPECTED_BY_ANGLE_DIFF = {  # (GS, WCA) for TAS and WIND_SPEED above
        0: (90.0, 0.0),
        45: (92.7, 4.1),
        90: (99.5, 5.7),
        135: (106.8, 4.1),
        180: (110.0, 0.0),
        225: (106.8, -4.1),
        270: (99.5, -5.7),
        315: (92.7, -4.1),
    }

    @pytest.mark.parametrize("true_course", DIRECTIONS.values())
    @pytest.mark.parametrize("wind_dir", DIRECTIONS.values())
    def test_zero_wind(self, true_course, wind_dir):
        gs, wca = calculations.solve_wind_triangle(true_course, self.TAS, wind_dir, 0)
        assert gs == approx(self.TAS, abs=GS_TOLERANCE_KT)
        assert wca == approx(0.0, abs=WCA_TOLERANCE_DEG)

    @pytest.mark.parametrize("true_course", DIRECTIONS.values())
    @pytest.mark.parametrize("wind_dir", DIRECTIONS.values())
    def test_with_wind(self, true_course, wind_dir):
        gs, wca = calculations.solve_wind_triangle(
            true_course, self.TAS, wind_dir, self.WIND_SPEED
        )

        angle_diff = (wind_dir - true_course) % 360
        expected_gs, expected_wca = self.EXPECTED_BY_ANGLE_DIFF[angle_diff]

        assert gs == approx(expected_gs, abs=GS_TOLERANCE_KT)
        assert wca == approx(expected_wca, abs=WCA_TOLERANCE_DEG)


class TestWindTriangleValidation:
    def test_true_course_negative(self):
        with pytest.raises(ValueError):
            calculations.solve_wind_triangle(-1, 100, 0, 10)

    def test_true_course_too_large(self):
        with pytest.raises(ValueError):
            calculations.solve_wind_triangle(360, 100, 0, 10)

    def test_tas_zero(self):
        with pytest.raises(ValueError):
            calculations.solve_wind_triangle(0, 0, 0, 0)

    def test_tas_negative(self):
        with pytest.raises(ValueError):
            calculations.solve_wind_triangle(0, -100, 0, 10)

    def test_wind_dir_negative(self):
        with pytest.raises(ValueError):
            calculations.solve_wind_triangle(0, 100, -1, 10)

    def test_wind_dir_too_large(self):
        with pytest.raises(ValueError):
            calculations.solve_wind_triangle(0, 100, 360, 10)

    def test_wind_speed_negative(self):
        with pytest.raises(ValueError):
            calculations.solve_wind_triangle(0, 100, 0, -10)

    def test_wind_speed_equals_tas(self):
        with pytest.raises(ValueError):
            calculations.solve_wind_triangle(0, 100, 0, 100)

    def test_wind_speed_exceeds_tas(self):
        with pytest.raises(ValueError):
            calculations.solve_wind_triangle(0, 100, 0, 120)