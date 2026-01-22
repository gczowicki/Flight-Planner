import axios from 'axios';
import type { FlightPlanRequest, FlightPlanResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function createFlightPlan(
  request: FlightPlanRequest
): Promise<FlightPlanResponse> {
  const response = await apiClient.post<FlightPlanResponse>(
    '/api/v1/flight-plan',
    request
  );
  return response.data;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await apiClient.get('/health');
    return response.data.status === 'ok';
  } catch {
    return false;
  }
}
