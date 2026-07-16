export interface SavedSearchRequest {
  name: string;
  carBrandId: number | null;
  carModelId: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  city: string | null;
  notifyNewListings: boolean;
  notifyPriceDrops: boolean;
  notifySold: boolean;
  isEnabled: boolean;
}

export interface SavedSearch extends SavedSearchRequest {
  id: number;
  brandName: string | null;
  modelName: string | null;
  createdAt: string;
  updatedAt: string;
}
