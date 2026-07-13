import { PageQuery, PagedResponse } from './api.models';

export interface MasterDataQuery extends PageQuery {
  name?: string;
}

export interface MasterDataItem {
  id: number;
  name: string;
}

export interface CarModelMasterData extends MasterDataItem {
  carBrandId: number;
  carBrandName: string;
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
