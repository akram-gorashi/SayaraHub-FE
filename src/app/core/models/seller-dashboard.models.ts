import { CarDetails } from './car.models';

export interface SellerCarImage {
  id: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  isMain: boolean;
  processingStatus: string;
  processingError: string | null;
  processingAttempts: number;
}

export interface SellerCarDetails extends CarDetails {
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
