import { SetMetadata } from '@nestjs/common';

export const AUDIT_METADATA_KEY = 'operation-log:audit';

export interface AuditOptions {
  module: string;
  action: string;
  targetType?: string;
  targetParams?: Record<string, string>;
  businessKeyBodyField?: string;
  captureResponse?: boolean;
}

export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_METADATA_KEY, options);
