export interface CategoryResponse {
  id: number;
  name: string;
  color: string | null;
}

export interface CategoryRequest {
  name: string;
  color?: string | null;
}