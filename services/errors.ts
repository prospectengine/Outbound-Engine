/**
 * ServiceError represents a structured error originating in the service layer,
 * distinguishing database/network/query failures from legitimate empty states.
 */
export class ServiceError extends Error {
  public readonly code?: string;
  public readonly serviceName: string;
  public readonly details?: unknown;

  constructor(serviceName: string, message: string, code?: string, details?: unknown) {
    super(`[${serviceName}] ${message}`);
    this.name = "ServiceError";
    this.serviceName = serviceName;
    this.code = code;
    this.details = details;
  }
}
