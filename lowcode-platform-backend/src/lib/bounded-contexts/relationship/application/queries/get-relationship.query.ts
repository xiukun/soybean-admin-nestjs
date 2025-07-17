export class GetRelationshipQuery {
  constructor(
    public readonly id: string,
  ) {}
}

export class GetRelationshipByCodeQuery {
  constructor(
    public readonly projectId: string,
    public readonly code: string,
  ) {}
}

export class GetRelationshipsByProjectQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}

export class GetRelationshipsPaginatedQuery {
  constructor(
    public readonly projectId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: any,
  ) {}
}

export class GetRelationshipsByEntityQuery {
  constructor(
    public readonly entityId: string,
  ) {}
}

export class GetRelationshipGraphQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}

export class GetRelationshipStatsQuery {
  constructor(
    public readonly projectId: string,
  ) {}
}
