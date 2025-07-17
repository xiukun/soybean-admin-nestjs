export class GetApiConfigQuery {
  constructor(
    public readonly id: string,
  ) {}
}

export class GetApiConfigByCodeQuery {
  constructor(
    public readonly projectId: string,
    public readonly code: string,
  ) {}
}

export class GetApiConfigsByProjectQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}

export class GetApiConfigsPaginatedQuery {
  constructor(
    public readonly projectId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: any,
  ) {}
}

export class GetApiConfigsByEntityQuery {
  constructor(
    public readonly entityId: string,
  ) {}
}

export class GetApiConfigStatsQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}

export class GetPublishedApiConfigsQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}

export class GetApiConfigVersionsQuery {
  constructor(
    public readonly projectId: string,
    public readonly code: string,
  ) {}
}
