export interface Organization {
  id: string;
  code: string;
  inn?: string | null;
  name: string;
  shortName?: string | null;
  nameUz?: string | null;
  nameEn?: string | null;
  nameRu?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactPerson?: string | null;
  address?: string | null;
  legalAddress?: string | null;
  mfo?: string | null;
  accountNumber?: string | null;
  oked?: string | null;
  description?: string | null;
  isActive: boolean;
  studentsCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  totalCertificates?: number;
  issuedCertificates?: number;
  revokedCertificates?: number;
  latestCertificateDate?: string | Date | null;
}

export interface CreateOrganizationInput {
  code?: string;
  inn?: string | null;
  name: string;
  nameUz?: string | null;
  nameEn?: string | null;
  nameRu?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactPerson?: string | null;
  address?: string | null;
  legalAddress?: string | null;
  mfo?: string | null;
  accountNumber?: string | null;
  oked?: string | null;
  description?: string | null;
  isActive?: boolean;
}
