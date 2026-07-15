import { CarDetails } from './car.models';

export interface SellerCarImage {
  id: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  isMain: boolean;
  displayOrder: number;
  processingStatus: string;
  processingError: string | null;
  processingAttempts: number;
}

export interface SellerCarDetails extends CarDetails {
  carBrandId: number;
  carModelId: number;
  bodyTypeId: number;
  carConditionId: number;
  transmissionId: number;
  fuelTypeId: number;
  featureIds: number[];
  moderationReason: string | null;
  favoritesCount: number;
  imageProcessing: SellerCarImage[];
}

export interface SellerDashboardStatistics {
  totalListings: number;
  activeListings: number;
  soldListings: number;
  reservedListings: number;
  inactiveListings: number;
  totalViews: number;
  favoritesReceived: number;
  averageRating: number;
  pendingImageCount: number;
  failedImageCount: number;
}

export interface UpdateCarStatusRequest {
  status: string;
}
