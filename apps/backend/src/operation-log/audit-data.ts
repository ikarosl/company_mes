const SENSITIVE_KEY_PATTERN =
  /password|passwd|secret|token|authorization|cookie|credential|private[-_]?key/i;

const MAX_DEPTH = 6;
const MAX_ARRAY_LENGTH = 50;
const MAX_OBJECT_KEYS = 100;
const MAX_STRING_LENGTH = 2_000;

export const sanitizeAuditData = (value: unknown, depth = 0): unknown => {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Buffer.isBuffer(value)) {
    return `[binary ${value.length} bytes]`;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (depth >= MAX_DEPTH) {
    return '[max depth reached]';
  }

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_LENGTH)
      .map((item) => sanitizeAuditData(item, depth + 1));
    if (value.length > MAX_ARRAY_LENGTH) {
      items.push(`[${value.length - MAX_ARRAY_LENGTH} more items]`);
    }
    return items;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const sanitized: Record<string, unknown> = {};

    for (const [key, item] of entries.slice(0, MAX_OBJECT_KEYS)) {
      sanitized[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? '[REDACTED]'
        : sanitizeAuditData(item, depth + 1);
    }

    if (entries.length > MAX_OBJECT_KEYS) {
      sanitized.__truncatedKeys = entries.length - MAX_OBJECT_KEYS;
    }

    return sanitized;
  }

  return String(value);
};

const truncateString = (value: string) =>
  value.length > MAX_STRING_LENGTH
    ? `${value.slice(0, MAX_STRING_LENGTH)}...[truncated ${value.length - MAX_STRING_LENGTH} chars]`
    : value;
