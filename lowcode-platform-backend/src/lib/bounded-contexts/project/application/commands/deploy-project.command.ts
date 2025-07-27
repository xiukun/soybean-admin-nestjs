export class DeployProjectCommand {
  constructor(
    public readonly projectId: string,
    public readonly port?: number,
    public readonly config?: any,
    public readonly deployedBy?: string,
  ) {}
}

export class StopProjectDeploymentCommand {
  constructor(
    public readonly projectId: string,
    public readonly stoppedBy?: string,
  ) {}
}

export class UpdateDeploymentStatusCommand {
  constructor(
    public readonly projectId: string,
    public readonly status: 'DEPLOYING' | 'DEPLOYED' | 'FAILED' | 'INACTIVE',
    public readonly logs?: string,
    public readonly errorMsg?: string,
    public readonly updatedBy?: string,
  ) {}
}
