# Flight Planner

The application is aimed primarily at General Aviation pilots, designed to serve as a simple tool assisting in the flight planning process. Currently, its main feature is the automation of navigation calculations based on given input parameters: TAS, wind, and route waypoints. This enables the pilot to evaluate multiple route variants in a relatively short time, making the entire planning phase faster and more efficient. Most free tools of this kind offer fairly limited functionality, while the more comprehensive ones are paid and, especially for student pilots, can contain unnecessary complexity.

## Key Features

- **Add/remove waypoints** (left-click / right-click) directly on the map or from the navigation log, which enables reuse of existing points (e.g. to close a route loop).
- **Automatic route recalculation** triggered by any parameter change.
- **Hovering over a waypoint** displays its coordinates and name (currently a fixed sequential identifier).
- **Clear route button**.
- **Reverse route button**.
- **State persisted** across page refreshes (localStorage).

## Current Limitations

- **Constant wind and magnetic declination** assumed for the entire route (can be worked around by splitting the route into smaller segments).
- **Magnetic declination** entered manually.
- **No reverse geocoding** or airport/airfield identification.
- **No fuel calculations**.

## Architecture

The architecture relies on several key design patterns:
- **Composition over inheritance** – e.g. navigation log legs are constructed from waypoints, route legs, and aircraft/weather parameters; at the same time, it makes sense for each of these components to function as a standalone entity and remain reusable in other places.
- **Factory methods** – follows naturally from the composition point: higher-level objects are constructed via class methods that handle the instantiation of the underlying lower-level components.
- **Immutability by default** – ensures that components at any given layer cannot be modified, as it would compromise data integrity (e.g. modifying a waypoint within an already established route).

## Tech Stack

- **Backend:** FastAPI, Pydantic
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Leaflet

## Calculations

The application uses standard VFR navigation calculations:
- **Distance:** Haversine formula (Great Circle).
- **True Course:** Initial bearing calculation.
- **Wind Correction:** Standard wind triangle to solve for WCA (Wind Correction Angle) and GS (Ground Speed).

## API Reference

### `POST /api/v1/flight-plan`

Calculates the flight log based on the provided route and conditions.

**Request:**
```json
{
  "route_points": [
    { "lat": 52.16, "lon": 20.96, "ident": "EPWA" },
    { "lat": 51.55, "lon": 19.53, "ident": "EPPT" }
  ],
  "aircraft": { 
    "tas": 105, 
    "gph": 8.5 
  },
  "wind": { 
    "direction": 270, 
    "speed": 15 
  },
  "magnetic_declination": 5.0
}
```

**Response:**

```json
{
  "route": {
    "total_distance_nm": 63.4,
    "points": [
      { "lat": 52.16, "lon": 20.96, "ident": "EPWA" },
      { "lat": 51.55, "lon": 19.53, "ident": "EPPT" }
    ],
    "legs": [
      {
        "distance_nm": 63.4,
        "true_course": 238,
        "magnetic_declination": 5
      }
    ]
  },
  "nav_log": {
    "total_time_min": 41,
    "total_distance_nm": 63.4,
    "rows": [
      {
        "leg": {
          "distance_nm": 63.4,
          "true_course": 238,
          "magnetic_declination": 5
        },
        "wind": { "direction": 270, "speed": 15 },
        "ground_speed": 94,
        "wca": -4,
        "true_heading": 234,
        "magnetic_heading": 229,
        "time_min": 41
      }
    ]
  },
  "aircraft": {
    "registration": "SP-N/A",
    "model": "Unknown",
    "tas": 105,
    "gph": 8.5
  },
  "wind": { "direction": 270, "speed": 15 }
}
```

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn src.api.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

API: `http://localhost:8000/docs`
App: `http://localhost:5173`