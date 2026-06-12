import { Inject, Injectable } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import type { UserProfile } from '@company/api-contract';
import { DatabaseService } from '../database/database.service.js';

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  status: number;
}

interface RoleRow extends RowDataPacket {
  code: string;
}

interface PermissionRow extends RowDataPacket {
  code: string;
}

@Injectable()
export class AuthRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async findActiveUserByUsername(username: string) {
    const rows = await this.database.query<UserRow[]>(
      `
        SELECT id, username, password_hash, display_name, status
        FROM users
        WHERE username = ?
          AND status = 1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [username],
    );

    return rows[0] ?? null;
  }

  async findActiveUserById(userId: string) {
    const rows = await this.database.query<UserRow[]>(
      `
        SELECT id, username, password_hash, display_name, status
        FROM users
        WHERE id = ?
          AND status = 1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [userId],
    );

    return rows[0] ?? null;
  }

  async findUserRoleCodes(userId: string) {
    const rows = await this.database.query<RoleRow[]>(
      `
        SELECT r.code
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = ?
          AND r.status = 1
          AND r.deleted_at IS NULL
        ORDER BY r.id
      `,
      [userId],
    );

    return rows.map((row) => row.code);
  }

  async findUserPermissionCodes(userId: string) {
    const rows = await this.database.query<PermissionRow[]>(
      `
        SELECT DISTINCT p.code
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        JOIN role_permissions rp ON rp.role_id = r.id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = ?
          AND r.status = 1
          AND r.deleted_at IS NULL
          AND p.status = 1
          AND p.deleted_at IS NULL
        ORDER BY p.code
      `,
      [userId],
    );

    return rows.map((row) => row.code);
  }

  async touchLastLogin(userId: string) {
    await this.database.execute(
      `
        UPDATE users
        SET last_login_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [userId],
    );
  }

  /** 持久化一条 refreshToken 记录，每用户只保留最新一条 */
  async saveRefreshToken(userId: string, jti: string, expiresAt: Date) {
    await this.database.execute(
      `
        DELETE FROM refresh_tokens
        WHERE user_id = ?
      `,
      [userId],
    );

    await this.database.execute(
      `
        INSERT INTO refresh_tokens (user_id, jti, expires_at)
        VALUES (?, ?, ?)
      `,
      [userId, jti, expiresAt],
    );
  }

  /** 按 jti 查找有效 refreshToken 记录 */
  async findRefreshToken(jti: string) {
    const rows = await this.database.query<RowDataPacket[]>(
      `
        SELECT id, user_id, expires_at
        FROM refresh_tokens
        WHERE jti = ?
          AND expires_at > NOW()
        LIMIT 1
      `,
      [jti],
    );

    return rows[0] ?? null;
  }

  /** 按 jti 删除 refreshToken（登出/撤销） */
  async deleteRefreshToken(jti: string) {
    await this.database.execute(
      `
        DELETE FROM refresh_tokens
        WHERE jti = ?
      `,
      [jti],
    );
  }

  toProfile(
    user: Pick<UserRow, 'id' | 'username' | 'display_name'>,
    roles: string[],
    permissions: string[],
  ): UserProfile {
    return {
      id: String(user.id),
      username: user.username,
      displayName: user.display_name,
      roles,
      permissions,
    };
  }
}
