'use server';

import { db } from '@/db';
import { familyGroups, familyGroupMembers, members } from '@/db/schema';
import { toFamilyGroup, toFamilyGroupMember, toMember } from '@/db/mappers';
import { eq, desc } from 'drizzle-orm';
import type { FamilyGroup, FamilyGroupMember, FamilyGroupWithMembers, FamilyRelationship } from '@/domain/models';
import { requireAdmin, requireAuth } from '@/app/actions/auth';

export async function createFamilyGroup(
  name: string,
  primaryMemberId: string
): Promise<FamilyGroup> {
  await requireAdmin();
  const rows = await db
    .insert(familyGroups)
    .values({ name, primaryMemberId })
    .returning();
  const group = toFamilyGroup(rows[0]);

  // Add primary member to the group
  await db.insert(familyGroupMembers).values({
    familyGroupId: group.id,
    memberId: primaryMemberId,
    relationship: 'primary',
  });

  return group;
}

export async function addFamilyMember(
  familyGroupId: string,
  memberId: string,
  relationship: FamilyRelationship
): Promise<FamilyGroupMember> {
  await requireAdmin();
  const rows = await db
    .insert(familyGroupMembers)
    .values({ familyGroupId, memberId, relationship })
    .returning();
  return toFamilyGroupMember(rows[0]);
}

export async function removeFamilyMember(familyGroupMemberId: string): Promise<void> {
  await requireAdmin();
  await db
    .delete(familyGroupMembers)
    .where(eq(familyGroupMembers.id, familyGroupMemberId));
}

export async function getFamilyGroup(id: string): Promise<FamilyGroupWithMembers | null> {
  await requireAuth();
  const groupRows = await db
    .select()
    .from(familyGroups)
    .where(eq(familyGroups.id, id));
  if (groupRows.length === 0) return null;
  const group = toFamilyGroup(groupRows[0]);

  const memberRows = await db
    .select()
    .from(familyGroupMembers)
    .innerJoin(members, eq(familyGroupMembers.memberId, members.id))
    .where(eq(familyGroupMembers.familyGroupId, id));

  return {
    ...group,
    members: memberRows.map((row) => ({
      ...toFamilyGroupMember(row.family_group_members),
      member: toMember(row.members),
    })),
  };
}

export async function listFamilyGroups(): Promise<FamilyGroupWithMembers[]> {
  await requireAdmin();
  const groupRows = await db
    .select()
    .from(familyGroups)
    .orderBy(desc(familyGroups.createdAt));
  if (groupRows.length === 0) return [];

  const groups = groupRows.map(toFamilyGroup);
  const allMemberRows = await db
    .select()
    .from(familyGroupMembers)
    .innerJoin(members, eq(familyGroupMembers.memberId, members.id));

  return groups.map((group) => ({
    ...group,
    members: allMemberRows
      .filter((row) => row.family_group_members.familyGroupId === group.id)
      .map((row) => ({
        ...toFamilyGroupMember(row.family_group_members),
        member: toMember(row.members),
      })),
  }));
}

export async function getMyFamilyGroup(): Promise<FamilyGroupWithMembers | null> {
  const user = await requireAuth();
  if (!user.memberId) return null;

  const myMembership = await db
    .select()
    .from(familyGroupMembers)
    .where(eq(familyGroupMembers.memberId, user.memberId));
  if (myMembership.length === 0) return null;

  return getFamilyGroup(myMembership[0].familyGroupId);
}

export async function deleteFamilyGroup(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(familyGroupMembers).where(eq(familyGroupMembers.familyGroupId, id));
  await db.delete(familyGroups).where(eq(familyGroups.id, id));
}
