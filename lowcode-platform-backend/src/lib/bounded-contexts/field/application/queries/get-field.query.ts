export class GetFieldQuery {
  constructor(
    public readonly id: string,
  ) {}
}

export class GetFieldByCodeQuery {
  constructor(
    public readonly entityId: string,
    public readonly code: string,
  ) {}
}

export class GetFieldsByEntityQuery {
  constructor(
    public readonly entityId: string,
  ) {}
}

export class GetFieldsPaginatedQuery {
  constructor(
    public readonly entityId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: any,
  ) {}
}

export class GetFieldStatsQuery {
  constructor(
    public readonly entityId: string,
  ) {}
}
