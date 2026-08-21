import { usersRepository } from './users.repository';
import { authRepository } from '../auth/auth.repository';
import { sanitizeUser } from '../auth/auth.service';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { normalizePagination, buildPaginationMeta } from '../../utils/pagination';
import type { CreateUserInput, UpdateUserInput } from './users.validator';
import type { PaginationQuery } from '@intvwplt/shared';
import type { UserRole } from '@prisma/client';
import argon2 from 'argon2';

export const usersService = {
  async list(
    query: PaginationQuery & { companyId?: string; role?: UserRole; search?: string },
  ) {
    const pagination = normalizePagination(query, 'createdAt');
    const { items, total } = await usersRepository.findAll(pagination, {
      companyId: query.companyId,
      role: query.role,
      search: query.search,
    });
    return { items, pagination: buildPaginationMeta(total, pagination.page, pagination.limit) };
  },

  async getById(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) throw new NotFoundError('User');
    return user;
  },

  async create(data: CreateUserInput) {
    const existing = await authRepository.findUserByEmail(data.email);
    if (existing) throw new ConflictError('A user with this email already exists', 'EMAIL_ALREADY_EXISTS');

    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await authRepository.createUser({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || undefined,
      role: data.role as UserRole,
      companyId: data.companyId || undefined,
    });

    return sanitizeUser(user);
  },

  async update(id: string, data: UpdateUserInput) {
    await usersService.getById(id);

    const updatePayload: any = {};
    if (data.firstName !== undefined) updatePayload.firstName = data.firstName;
    if (data.lastName !== undefined) updatePayload.lastName = data.lastName;
    if (data.role !== undefined) updatePayload.role = data.role as UserRole;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if (data.phone !== undefined) updatePayload.phone = data.phone || null;
    if (data.companyId !== undefined) updatePayload.companyId = data.companyId || null;

    return usersRepository.update(id, updatePayload);
  },

  async delete(id: string) {
    await usersService.getById(id);
    await usersRepository.softDelete(id);
  },
};
