import { ApiMethod, ApiParameter, ApiResponse, ApiSecurity } from '@lib/bounded-contexts/api-config/domain/api-config.model';

export class CreateApiConfigCommand {
  constructor(
    public readonly projectId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly method: ApiMethod,
    public readonly path: string,
    public readonly description?: string,
    public readonly entityId?: string,
    public readonly parameters?: ApiParameter[],
    public readonly responses?: ApiResponse[],
    public readonly security?: ApiSecurity,
    public readonly config?: any,
    public readonly createdBy?: string,
  ) {}
}
