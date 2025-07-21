export class GetTemplatesQuery {
  constructor(
    public readonly type?: string,
    public readonly language?: string,
    public readonly framework?: string,
  ) {}
}
