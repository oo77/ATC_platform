/**
 * Репозиторий для управления реестром членов аттестационной комиссии
 */

import { executeQuery } from "../utils/db";
import { v4 as uuidv4 } from "uuid";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export interface CommissionMember {
  id: string;
  fullName: string;
  position: string | null;
  organization: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CommissionMemberRow extends RowDataPacket {
  id: string;
  full_name: string;
  position: string | null;
  organization: string | null;
  is_active: number | boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: CommissionMemberRow): CommissionMember {
  return {
    id: row.id,
    fullName: row.full_name,
    position: row.position,
    organization: row.organization,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCommissionMembers(
  includeInactive = true
): Promise<CommissionMember[]> {
  const rows = await executeQuery<CommissionMemberRow[]>(
    `SELECT * FROM commission_members
     ${includeInactive ? "" : "WHERE is_active = TRUE"}
     ORDER BY full_name ASC`
  );
  return rows.map(mapRow);
}

export async function getCommissionMemberById(
  id: string
): Promise<CommissionMember | null> {
  const rows = await executeQuery<CommissionMemberRow[]>(
    "SELECT * FROM commission_members WHERE id = ? LIMIT 1",
    [id]
  );
  return rows.length ? mapRow(rows[0]) : null;
}

export async function createCommissionMember(data: {
  fullName: string;
  position?: string | null;
  organization?: string | null;
}): Promise<CommissionMember> {
  const id = uuidv4();
  const now = new Date();

  await executeQuery(
    `INSERT INTO commission_members (id, full_name, position, organization, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, TRUE, ?, ?)`,
    [id, data.fullName, data.position || null, data.organization || null, now, now]
  );

  const created = await getCommissionMemberById(id);
  if (!created) throw new Error("Failed to create commission member");
  return created;
}

export async function updateCommissionMember(
  id: string,
  data: {
    fullName?: string;
    position?: string | null;
    organization?: string | null;
    isActive?: boolean;
  }
): Promise<CommissionMember | null> {
  const existing = await getCommissionMemberById(id);
  if (!existing) return null;

  const updates: string[] = [];
  const params: any[] = [];

  if (data.fullName !== undefined) {
    updates.push("full_name = ?");
    params.push(data.fullName);
  }
  if (data.position !== undefined) {
    updates.push("position = ?");
    params.push(data.position);
  }
  if (data.organization !== undefined) {
    updates.push("organization = ?");
    params.push(data.organization);
  }
  if (data.isActive !== undefined) {
    updates.push("is_active = ?");
    params.push(data.isActive);
  }

  if (updates.length === 0) return existing;

  updates.push("updated_at = ?");
  params.push(new Date());
  params.push(id);

  await executeQuery(
    `UPDATE commission_members SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  return getCommissionMemberById(id);
}

export async function deleteCommissionMember(id: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    "DELETE FROM commission_members WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
