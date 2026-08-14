import { PageQuery, PagedResponse } from './api.models';

export interface MasterDataQuery extends PageQuery {
  name?: string;
}

export interface MasterDataItem {
  id: number;
  name: string;
  nameAr?: string;
}

export interface CarModelMasterData extends MasterDataItem {
  carBrandId: number;
  carBrandName: string;
  carBrandNameAr?: string;
}

export interface CarGenerationMasterData extends MasterDataItem {
  carModelId: number;
  carModelName: string;
  carModelNameAr?: string;
  carBrandId: number;
  carBrandName: string;
  carBrandNameAr?: string;
  yearFrom: number;
  yearTo: number | null;
}

export interface MasterData {
  bodyTypes: PagedResponse<MasterDataItem>;
  carBrands: PagedResponse<MasterDataItem>;
  carModels: PagedResponse<CarModelMasterData>;
  carConditions: PagedResponse<MasterDataItem>;
  features: PagedResponse<MasterDataItem>;
  fuelTypes: PagedResponse<MasterDataItem>;
  transmissions: PagedResponse<MasterDataItem>;
}
