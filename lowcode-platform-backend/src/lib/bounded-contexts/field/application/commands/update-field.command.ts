import { FieldDataType } from '../../domain/field.model';

export class UpdateFieldCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly dataType?: FieldDataType,
    public readonly length?: number,
    public readonly precision?: number,
    public readonly required?: boolean,
    public readonly unique?: boolean,
    public readonly defaultValue?: string,
    public readonly config?: any,
    public readonly displayOrder?: number,
    public readonly updatedBy?: string,
  ) {}
}
