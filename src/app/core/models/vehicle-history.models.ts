export interface VehicleHistory {
  id: number;
  carId: number;
  description: string;
  serviceDate: string;
  mileage: number;
  provider: string;
  cost: number | null;
  recordType: string;
  documentUrl: string | null;
}

export interface SaveVehicleHistoryRequest {
  description: string;
  serviceDate: string;
  mileage: number;
  provider: string;
  cost?: number | null;
  recordType: string;
  document?: File | null;
}
