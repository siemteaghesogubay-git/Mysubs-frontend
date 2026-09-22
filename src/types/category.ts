export interface CategoryResponse {
  id: number;
  name: string;
  color: string | null;
  isGlobal: boolean;
  canManage: boolean;
}

export interface CategoryRequest {
  name: string;
  color?: string | null;
}

export type CategoryCreate = CategoryRequest;
export type CategoryUpdate = CategoryRequest;