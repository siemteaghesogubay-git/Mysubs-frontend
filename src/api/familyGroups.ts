import { apiClient } from "./client";
import type { AddMemberRequest, FamilyGroup, FamilyGroupCreateRequest } from "../types/family";

export async function getMyFamilyGroups() {
  const { data } = await apiClient.get<FamilyGroup[]>("/api/FamilyGroups");
  return data;
}

export async function createFamilyGroup(payload: FamilyGroupCreateRequest) {
  const { data } = await apiClient.post<FamilyGroup>("/api/FamilyGroups", payload);
  return data;
}

export async function addFamilyMember(groupId: number, payload: AddMemberRequest) {
  const { data } = await apiClient.post<FamilyGroup>(`/api/FamilyGroups/${groupId}/members`, payload);
  return data;
}

export async function removeFamilyMember(groupId: number, userId: string) {
  await apiClient.delete(`/api/FamilyGroups/${groupId}/members/${userId}`);
}