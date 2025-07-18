import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';

export class CreateFieldCommand {
  constructor(
    public readonly entityId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly dataType: FieldDataType,
    public readonly description?: string,
    public readonly length?: number,
    public readonly precision?: number,
    public readonly required?: boolean,
    public readonly unique?: boolean,
    public readonly defaultValue?: string,
    public readonly config?: any,
    public readonly displayOrder?: number,
    public readonly createdBy?: string,
  ) {}
}
