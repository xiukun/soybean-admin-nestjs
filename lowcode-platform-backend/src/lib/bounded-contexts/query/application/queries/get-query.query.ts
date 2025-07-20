export class GetQueryQuery {
  constructor(
    public readonly id: string,
  ) {}
}

export class GetQueriesByProjectQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}

export class GetQueriesPaginatedQuery {
  constructor(
    public readonly projectId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: any,
  ) {}
}

export class GetQueryStatsQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}
