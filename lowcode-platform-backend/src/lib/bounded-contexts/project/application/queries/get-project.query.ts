export class GetProjectQuery {
  constructor(
    public readonly id: string,
  ) {}
}

export class GetProjectByCodeQuery {
  constructor(
    public readonly code: string,
  ) {}
}

export class GetProjectsQuery {
  constructor() {}
}

export class GetProjectsPaginatedQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: any,
  ) {}
}
