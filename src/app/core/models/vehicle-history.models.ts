export interface VehicleHistory {
  id: number;
  carId: number;
  description: string;
}

export interface SaveVehicleHistoryRequest {
  description: string;
}
