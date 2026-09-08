export const FAMILY_ROLE = { Parent: 0, Child: 1 } as const;
export type FamilyRole = (typeof FAMILY_ROLE)[keyof typeof FAMILY_ROLE];

export const FAMILY_ROLE_LABELS: Record<FamilyRole, string> = {
  [FAMILY_ROLE.Parent]: "Förälder",
  [FAMILY_ROLE.Child]: "Barn",
};

export interface FamilyMember {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: FamilyRole;
  joinedAt: string;
}

export interface FamilyGroup {
  id: number;
  name: string;
  createdByUserId: string;
  members: FamilyMember[];
}

export interface FamilyGroupCreateRequest {
  name: string;
}

export interface AddMemberRequest {
  email: string;
  role: FamilyRole;
}