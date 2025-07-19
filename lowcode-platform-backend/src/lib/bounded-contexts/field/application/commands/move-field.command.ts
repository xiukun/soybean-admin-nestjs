export class MoveFieldCommand {
  constructor(
    public readonly id: string,
    public readonly direction: 'up' | 'down',
  ) {}
}
