export class DeleteApiConfigCommand {
  constructor(
    public readonly id: string,
  ) {}
}

export class PublishApiConfigCommand {
  constructor(
    public readonly id: string,
    public readonly updatedBy?: string,
  ) {}
}

export class DeprecateApiConfigCommand {
  constructor(
    public readonly id: string,
    public readonly updatedBy?: string,
  ) {}
}
