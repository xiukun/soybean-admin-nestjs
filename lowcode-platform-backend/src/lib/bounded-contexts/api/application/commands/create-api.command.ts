import { ApiMethod } from '@api-context/domain/api.model';

export class CreateApiCommand {
  constructor(
    public readonly projectId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly path: string,
    public readonly method: ApiMethod,
    public readonly description?: string,
    public readonly entityId?: string,
    public readonly requestConfig?: any,
    public readonly responseConfig?: any,
    public readonly queryConfig?: any,
    public readonly authConfig?: any,
    public readonly createdBy?: string,
  ) {}
}
