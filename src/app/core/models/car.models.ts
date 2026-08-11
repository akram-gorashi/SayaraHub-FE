import { PageQuery } from './api.models';

export interface CarSummary {
  id: number;
  title: string;
  price: number;
  status: string;
  brand: string;
  brandAr?: string;
  model: string;
  modelAr?: string;
  rating?: number;
  reviewCount?: number;
  condition: string;
  conditionAr?: string;
  year: number;
  mileage: number;
  transmission: string;
  transmissionAr?: string;
  fuelType: string;
  fuelTypeAr?: string;
  city: string;
  listedDate: string;
  mainImageUrl: string | null;
  moderationReason: string | null;
}

export interface SellerSummary {
  id: number;
  fullName: string;
  imageUrl: string | null;
  isVerified?: boolean;
  isPhoneVerified?: boolean;
}

export interface CarDetails {
  id: number;
  title: string;
  price: number;
  status: string;
  brand: string;
  brandAr?: string;
  model: string;
  modelAr?: string;
  rating: number;
  reviewCount: number;
  views: number;
  listedDate: string;
  bodyType: string;
  bodyTypeAr?: string;
  condition: string;
  conditionAr?: string;
  mileage: number;
  transmission: string;
  transmissionAr?: string;
  year: number;
  fuelType: string;
  fuelTypeAr?: string;
  color: string;
  doors: number;
  cylinders: number;
  engineSize: string;
  vin: string;
  description: string;
  city: string;
  address: string;
  seller: SellerSummary;
  images: string[];
  features: string[];
  featuresAr?: string[];
  vehicleHistories: string[];
}

export interface CarQuery extends PageQuery {
  search?: string;
  brandIds?: number[];
  modelIds?: number[];
  transmissionIds?: number[];
  fuelTypeIds?: number[];
  featureIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  city?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  afterListedDate?: Date | string;
  afterId?: number;
}

export interface SaveCarRequest {
  title: string;
  carBrandId: number;
  carModelId: number;
  price: number;
  bodyTypeId: number;
  carConditionId: number;
  mileage: number;
  year: number;
  transmissionId: number;
  fuelTypeId: number;
  city: string;
  featureIds: number[];
}

export interface CreateCarRequest extends SaveCarRequest {
  images: File[];
  address: string;
  description: string;
  color: string;
  doors: number;
  cylinders: number;
  engineSize: string;
  vin: string;
  mainImageIndex: number;
}

export interface UpdateCarRequest extends CreateCarRequest {
  existingImageIds: number[];
  imageOrder: string[];
  mainImageKey: string;
}
