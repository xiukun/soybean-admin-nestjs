import { ApiParameter, ApiResponse, ApiSecurity, ApiStatus } from '@lib/bounded-contexts/api-config/domain/api-config.model';

export class UpdateApiConfigCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly path?: string,
    public readonly parameters?: ApiParameter[],
    public readonly responses?: ApiResponse[],
    public readonly security?: ApiSecurity,
    public readonly config?: any,
    public readonly status?: ApiStatus,
    public readonly updatedBy?: string,
  ) {}
}
