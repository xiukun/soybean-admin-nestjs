export class GetEntityQuery {
  constructor(
    public readonly id: string,
  ) {}
}

export class GetEntityByCodeQuery {
  constructor(
    public readonly projectId: string,
    public readonly code: string,
  ) {}
}

export class GetEntitiesByProjectQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}

export class GetEntitiesPaginatedQuery {
  constructor(
    public readonly projectId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: any,
  ) {}
}

export class GetEntityStatsQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}
