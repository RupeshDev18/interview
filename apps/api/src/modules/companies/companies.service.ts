import { companiesRepository } from './companies.repository';
import { prisma } from '../../lib/prisma';
import { sanitizeUser } from '../auth/auth.service';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { normalizePagination, buildPaginationMeta } from '../../utils/pagination';
import type { CreateCompanyInput, UpdateCompanyInput, OnboardCompanyInput } from './companies.validator';
import type { PaginationQuery } from '@intvwplt/shared';
import argon2 from 'argon2';

export const companiesService = {
  async list(query: PaginationQuery & { search?: string }) {
    const pagination = normalizePagination(query, 'createdAt');
    const { items, total } = await companiesRepository.findAll(pagination, query.search);
    return {
      items,
      pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  },

  async getById(id: string) {
    const company = await companiesRepository.findById(id);
    if (!company) throw new NotFoundError('Company');
    return company;
  },

  async create(data: CreateCompanyInput) {
    return companiesRepository.create(data);
  },

  async onboard(data: OnboardCompanyInput) {
    const existingUser = await prisma.user.findFirst({
      where: { email: data.adminEmail, deletedAt: null },
    });
    if (existingUser) {
      throw new ConflictError('A user with this admin email already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const passwordToHash = data.adminPassword || 'Admin@123456';
    const passwordHash = await argon2.hash(passwordToHash, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: {
          name: data.companyName.trim(),
          email: data.companyEmail || undefined,
          phone: data.phone || undefined,
          website: data.website || undefined,
          isActive: true,
        },
      });

      // 2. Create Company Admin User
      const adminUser = await tx.user.create({
        data: {
          email: data.adminEmail,
          passwordHash,
          firstName: data.adminFirstName.trim(),
          lastName: data.adminLastName.trim(),
          role: 'COMPANY_ADMIN',
          companyId: company.id,
          isActive: true,
        },
      });

      // 3. Seed Default Interview Types
      const defaultTypes = [
        { name: 'Initial Technical Screening', durationMinutes: 45 },
        { name: 'Live Coding & Algorithms', durationMinutes: 60 },
        { name: 'System Design & Architecture', durationMinutes: 60 },
        { name: 'Hiring Manager & Culture Fit', durationMinutes: 45 },
      ];

      for (const t of defaultTypes) {
        await tx.interviewType.create({
          data: {
            companyId: company.id,
            name: t.name,
            durationMinutes: t.durationMinutes,
            isActive: true,
          },
        });
      }

      return { company, adminUser };
    });

    return {
      company: result.company,
      adminUser: sanitizeUser(result.adminUser),
    };
  },

  async update(id: string, data: UpdateCompanyInput) {
    await companiesService.getById(id); // 404 if not found
    return companiesRepository.update(id, data);
  },

  async delete(id: string) {
    await companiesService.getById(id);
    await companiesRepository.softDelete(id);
  },
};
