/**
 * Репозиторий для управления группами аттестации инструкторов
 */

import { executeQuery } from "../utils/db";
import { v4 as uuidv4 } from "uuid";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type AttestationGroupStatus =
  | "draft"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type CommissionRole = "chairman" | "secretary" | "member";

export interface AttestationGroup {
  id: string;
  code: string;
  name: string;
  description: string | null;
  testTemplateId: string | null;
  certificateTemplateId: string | null;
  examStart: Date | null;
  examEnd: Date | null;
  location: string | null;
  responsiblePerson: string | null;
  status: AttestationGroupStatus;
  protocolFileId: number | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttestationGroupWithDetails extends AttestationGroup {
  templateName: string | null;
  templateCode: string | null;
  passingScore: number | null;
  certificateTemplateName: string | null;
  instructorsCount: number;
}

export interface AttestationGroupInstructor {
  id: string;
  groupId: string;
  instructorId: string;
  positionSnapshot: string | null;
  fullName: string;
  email: string | null;
}

export interface AttestationCommissionEntry {
  id: string;
  groupId: string;
  commissionMemberId: string;
  role: CommissionRole;
  orderIndex: number;
  fullName: string;
  position: string | null;
  organization: string | null;
}

interface GroupRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  description: string | null;
  test_template_id: string | null;
  certificate_template_id: string | null;
  exam_start: Date | null;
  exam_end: Date | null;
  location: string | null;
  responsible_person: string | null;
  status: AttestationGroupStatus;
  protocol_file_id: number | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  template_name?: string | null;
  template_code?: string | null;
  passing_score?: number | null;
  certificate_template_name?: string | null;
  instructors_count?: number;
}

function mapGroupRow(row: GroupRow): AttestationGroupWithDetails {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    testTemplateId: row.test_template_id,
    certificateTemplateId: row.certificate_template_id,
    examStart: row.exam_start,
    examEnd: row.exam_end,
    location: row.location,
    responsiblePerson: row.responsible_person,
    status: row.status,
    protocolFileId: row.protocol_file_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    templateName: row.template_name ?? null,
    templateCode: row.template_code ?? null,
    passingScore: row.passing_score ?? null,
    certificateTemplateName: row.certificate_template_name ?? null,
    instructorsCount: row.instructors_count ?? 0,
  };
}

const GROUP_SELECT = `
  SELECT
    ag.*,
    tt.name as template_name,
    tt.code as template_code,
    tt.passing_score as passing_score,
    ct.name as certificate_template_name,
    (SELECT COUNT(*) FROM attestation_group_instructors agi WHERE agi.group_id = ag.id) as instructors_count
  FROM attestation_groups ag
  LEFT JOIN test_templates tt ON ag.test_template_id = tt.id
  LEFT JOIN certificate_templates ct ON ag.certificate_template_id = ct.id
`;

export async function getAttestationGroups(filters: {
  status?: AttestationGroupStatus;
  search?: string;
} = {}): Promise<AttestationGroupWithDetails[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.status) {
    conditions.push("ag.status = ?");
    params.push(filters.status);
  }
  if (filters.search) {
    conditions.push("(ag.name LIKE ? OR ag.code LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await executeQuery<GroupRow[]>(
    `${GROUP_SELECT} ${whereClause} ORDER BY ag.created_at DESC`,
    params
  );
  return rows.map(mapGroupRow);
}

export async function getAttestationGroupById(
  id: string
): Promise<AttestationGroupWithDetails | null> {
  const rows = await executeQuery<GroupRow[]>(
    `${GROUP_SELECT} WHERE ag.id = ? LIMIT 1`,
    [id]
  );
  return rows.length ? mapGroupRow(rows[0]) : null;
}

export async function attestationGroupCodeExists(
  code: string,
  excludeId?: string
): Promise<boolean> {
  const params: any[] = [code];
  let query = "SELECT 1 FROM attestation_groups WHERE code = ?";
  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }
  const rows = await executeQuery<RowDataPacket[]>(query, params);
  return rows.length > 0;
}

export async function createAttestationGroup(data: {
  code: string;
  name: string;
  description?: string | null;
  createdBy?: string | null;
}): Promise<AttestationGroupWithDetails> {
  const id = uuidv4();
  const now = new Date();

  await executeQuery(
    `INSERT INTO attestation_groups (id, code, name, description, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`,
    [id, data.code, data.name, data.description || null, data.createdBy || null, now, now]
  );

  const created = await getAttestationGroupById(id);
  if (!created) throw new Error("Failed to create attestation group");
  return created;
}

export async function updateAttestationGroup(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    status?: AttestationGroupStatus;
    location?: string | null;
    responsiblePerson?: string | null;
    protocolFileId?: number | null;
  }
): Promise<AttestationGroupWithDetails | null> {
  const existing = await getAttestationGroupById(id);
  if (!existing) return null;

  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    params.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    params.push(data.description);
  }
  if (data.status !== undefined) {
    updates.push("status = ?");
    params.push(data.status);
  }
  if (data.location !== undefined) {
    updates.push("location = ?");
    params.push(data.location);
  }
  if (data.responsiblePerson !== undefined) {
    updates.push("responsible_person = ?");
    params.push(data.responsiblePerson);
  }
  if (data.protocolFileId !== undefined) {
    updates.push("protocol_file_id = ?");
    params.push(data.protocolFileId);
  }

  if (updates.length === 0) return existing;

  updates.push("updated_at = ?");
  params.push(new Date());
  params.push(id);

  await executeQuery(
    `UPDATE attestation_groups SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  return getAttestationGroupById(id);
}

export async function scheduleAttestationGroup(
  id: string,
  data: {
    testTemplateId: string;
    examStart: Date;
    examEnd: Date;
    location?: string | null;
  }
): Promise<AttestationGroupWithDetails | null> {
  await executeQuery(
    `UPDATE attestation_groups
     SET test_template_id = ?, exam_start = ?, exam_end = ?, location = ?, status = 'scheduled', updated_at = ?
     WHERE id = ?`,
    [data.testTemplateId, data.examStart, data.examEnd, data.location || null, new Date(), id]
  );
  return getAttestationGroupById(id);
}

export async function setCertificateTemplate(
  id: string,
  certificateTemplateId: string | null
): Promise<AttestationGroupWithDetails | null> {
  await executeQuery(
    "UPDATE attestation_groups SET certificate_template_id = ?, updated_at = ? WHERE id = ?",
    [certificateTemplateId, new Date(), id]
  );
  return getAttestationGroupById(id);
}

export async function deleteAttestationGroup(id: string): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    "DELETE FROM attestation_groups WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}

// ============================================================================
// ИНСТРУКТОРЫ ГРУППЫ
// ============================================================================

export async function getGroupInstructors(
  groupId: string
): Promise<AttestationGroupInstructor[]> {
  const rows = await executeQuery<RowDataPacket[]>(
    `SELECT agi.id, agi.group_id, agi.instructor_id, agi.position_snapshot,
            i.full_name, i.email
     FROM attestation_group_instructors agi
     JOIN instructors i ON agi.instructor_id = i.id
     WHERE agi.group_id = ?
     ORDER BY i.full_name ASC`,
    [groupId]
  );

  return rows.map((row) => ({
    id: row.id,
    groupId: row.group_id,
    instructorId: row.instructor_id,
    positionSnapshot: row.position_snapshot,
    fullName: row.full_name,
    email: row.email,
  }));
}

export async function addInstructorToGroup(
  groupId: string,
  instructorId: string,
  positionSnapshot?: string | null
): Promise<void> {
  const id = uuidv4();
  await executeQuery(
    `INSERT INTO attestation_group_instructors (id, group_id, instructor_id, position_snapshot, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE position_snapshot = VALUES(position_snapshot)`,
    [id, groupId, instructorId, positionSnapshot || null, new Date()]
  );
}

export async function removeInstructorFromGroup(
  groupId: string,
  instructorId: string
): Promise<boolean> {
  const result = await executeQuery<ResultSetHeader>(
    "DELETE FROM attestation_group_instructors WHERE group_id = ? AND instructor_id = ?",
    [groupId, instructorId]
  );
  return result.affectedRows > 0;
}

export async function isInstructorInGroup(
  groupId: string,
  instructorId: string
): Promise<boolean> {
  const rows = await executeQuery<RowDataPacket[]>(
    "SELECT 1 FROM attestation_group_instructors WHERE group_id = ? AND instructor_id = ? LIMIT 1",
    [groupId, instructorId]
  );
  return rows.length > 0;
}

// ============================================================================
// КОМИССИЯ ГРУППЫ
// ============================================================================

export async function getGroupCommission(
  groupId: string
): Promise<AttestationCommissionEntry[]> {
  const rows = await executeQuery<RowDataPacket[]>(
    `SELECT agc.id, agc.group_id, agc.commission_member_id, agc.role, agc.order_index,
            cm.full_name, cm.position, cm.organization
     FROM attestation_group_commission agc
     JOIN commission_members cm ON agc.commission_member_id = cm.id
     WHERE agc.group_id = ?
     ORDER BY FIELD(agc.role, 'chairman', 'secretary', 'member'), agc.order_index ASC`,
    [groupId]
  );

  return rows.map((row) => ({
    id: row.id,
    groupId: row.group_id,
    commissionMemberId: row.commission_member_id,
    role: row.role,
    orderIndex: row.order_index,
    fullName: row.full_name,
    position: row.position,
    organization: row.organization,
  }));
}

/**
 * Полностью заменяет состав комиссии группы указанным списком
 */
export async function setGroupCommission(
  groupId: string,
  members: Array<{ commissionMemberId: string; role: CommissionRole; orderIndex?: number }>
): Promise<void> {
  await executeQuery("DELETE FROM attestation_group_commission WHERE group_id = ?", [groupId]);

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const id = uuidv4();
    await executeQuery(
      `INSERT INTO attestation_group_commission (id, group_id, commission_member_id, role, order_index, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, groupId, member.commissionMemberId, member.role, member.orderIndex ?? i, new Date()]
    );
  }
}
