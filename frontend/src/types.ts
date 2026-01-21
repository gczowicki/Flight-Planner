export interface PointInput {
  lat: number;
  lon: number;
  ident?: string | null;
}

export interface AircraftInput {
  registration: string;
  model: string;
  tas: number;
  gph: number;
}

export interface WindInput {
  direction: number;
  speed: number;
}

export interface FlightPlanRequest {
  route_points: PointInput[];
  aircraft: AircraftInput;
  wind: WindInput;
  magnetic_declination?: number | null;
}

export interface PointOutput {
  lat: number;
  lon: number;
  ident?: string | null;
}

export interface LegOutput {
  start_point: PointOutput;
  end_point: PointOutput;
  distance_nm: number;
  true_course: number;
  magnetic_declination: number;
}

export interface WindOutput {
  direction: number;
  speed: number;
}

export interface NavLogLegOutput {
  leg: LegOutput;
  wind: WindOutput;
  ground_speed: number;
  wca: number;
  true_heading: number;
  magnetic_heading: number;
  time_min: number;
}

export interface NavLogOutput {
  rows: NavLogLegOutput[];
  total_time_min: number;
  total_distance_nm: number;
}

export interface RouteOutput {
  points: PointOutput[];
  legs: LegOutput[];
  total_distance_nm: number;
}

export interface FlightPlanResponse {
  route: RouteOutput;
  aircraft: AircraftInput;
  wind: WindOutput;
  nav_log: NavLogOutput;
}
