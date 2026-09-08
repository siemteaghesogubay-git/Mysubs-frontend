import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserPlus, X, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { addFamilyMember, createFamilyGroup, getMyFamilyGroups, removeFamilyMember } from "../../api/familyGroups";
import { FAMILY_ROLE_LABELS } from "../../types/family";
import { CreateGroupModal } from "./CreateGroupModal";
import { InviteMemberModal } from "./InviteMemberModal";

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function Family() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [invitingToGroupId, setInvitingToGroupId] = useState<number | null>(null);

  const groupsQuery = useQuery({ queryKey: ["family-groups"], queryFn: getMyFamilyGroups });

  const createMutation = useMutation({
    mutationFn: createFamilyGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["family-groups"] }),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, payload }: { groupId: number; payload: Parameters<typeof addFamilyMember>[1] }) =>
      addFamilyMember(groupId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["family-groups"] }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: string }) => removeFamilyMember(groupId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["family-groups"] }),
  });

  async function handleRemoveMember(groupId: number, member: { userId: string; firstName: string; lastName: string }) {
    if (!confirm(`Ta bort ${member.firstName} ${member.lastName} från gruppen?`)) return;
    await removeMemberMutation.mutateAsync({ groupId, userId: member.userId });
  }

  const groups = groupsQuery.data ?? [];
  const invitingGroup = groups.find((g) => g.id === invitingToGroupId);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Familjegrupper</h1>
          <p className="text-[13px] text-text-secondary">Hantera dina familjegrupper och medlemmar.</p>
        </div>
        <button
          onClick={() => setIsCreatingGroup(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary-hover"
        >
          <Plus size={15} />
          Skapa grupp
        </button>
      </div>

      {groupsQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
      ) : groupsQuery.isError ? (
        <p className="text-[13px] text-danger">Kunde inte hämta familjegrupper.</p>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-card">
          <Users size={22} className="mx-auto mb-2 text-text-muted" />
          <p className="text-[13px] font-medium text-text-primary">Ingen familjegrupp än</p>
          <p className="mt-1 text-[12px] text-text-secondary">
            Skapa en grupp för att dela prenumerationsöversikt med familjen.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="rounded-xl border border-border bg-surface p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-medium text-text-primary">{group.name}</h2>
                  <p className="text-[12px] text-text-secondary">
                    {group.members.length} {group.members.length === 1 ? "medlem" : "medlemmar"}
                  </p>
                </div>
                <button
                  onClick={() => setInvitingToGroupId(group.id)}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-text-primary hover:bg-background"
                >
                  <UserPlus size={14} />
                  Bjud in medlem
                </button>
              </div>

              <div className="divide-y divide-border">
                {group.members.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-[11px] font-medium text-primary">
                        {initials(member.firstName, member.lastName)}
                      </div>
                      <div>
                        <div className="text-[13px] text-text-primary">
                          {member.firstName} {member.lastName}
                          {member.userId === user?.id && (
                            <span className="ml-1.5 text-[11px] text-text-muted">(du)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-text-secondary">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-background px-2 py-0.5 text-[11px] text-text-secondary">
                        {FAMILY_ROLE_LABELS[member.role]}
                      </span>
                      {member.userId !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(group.id, member)}
                          aria-label={`Ta bort ${member.firstName} ${member.lastName}`}
                          className="rounded-md p-1 text-text-secondary hover:bg-danger-soft hover:text-danger"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreatingGroup && (
        <CreateGroupModal
          onClose={() => setIsCreatingGroup(false)}
          onSubmit={async (payload) => {
            await createMutation.mutateAsync(payload);
          }}
        />
      )}

      {invitingGroup && (
        <InviteMemberModal
          groupName={invitingGroup.name}
          onClose={() => setInvitingToGroupId(null)}
          onSubmit={async (payload) => {
            await addMemberMutation.mutateAsync({ groupId: invitingGroup.id, payload });
          }}
        />
      )}
    </div>
  );
}