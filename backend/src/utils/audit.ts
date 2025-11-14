export interface AuditEvent {
  action: string;
  userId?: string;
  details?: Record<string, unknown>;
}

export function auditLog(event: AuditEvent) {
  const payload = {
    timestamp: new Date().toISOString(),
    action: event.action,
    userId: event.userId ?? 'system',
    details: event.details ?? {},
  };
  console.info('[AUDIT]', JSON.stringify(payload));
}
