import { Status } from '@prisma/client';

export type LowcodePageRequiredProperties = Readonly<
  Required<{
    name: string;
    title: string;
    code: string;
    schema: any; // JSON object for AMIS schema
    status: Status;
    createdAt: Date;
    createdBy: string;
  }>
>;

export type LowcodePageOptionalProperties = Readonly<
  Partial<{
    id: string;
    description: string | null;
    updatedAt: Date | null;
    updatedBy: string | null;
  }>
>;

export type LowcodePageCreateProperties = LowcodePageRequiredProperties & LowcodePageOptionalProperties;

export type LowcodePageUpdateProperties = Partial<LowcodePageRequiredProperties> & 
  Required<Pick<LowcodePageOptionalProperties, 'id'>> & 
  Omit<LowcodePageOptionalProperties, 'id'>;

export type LowcodePageProperties = LowcodePageRequiredProperties & LowcodePageOptionalProperties;

export class LowcodePage {
  id?: string;
  name: string;
  title: string;
  code: string;
  description?: string;
  schema: any;
  status: Status;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;

  constructor(properties: LowcodePageCreateProperties) {
    Object.assign(this, properties);
  }

  static create(properties: LowcodePageCreateProperties): LowcodePage {
    return new LowcodePage(properties);
  }

  update(properties: Partial<LowcodePageUpdateProperties>): void {
    Object.assign(this, properties);
  }

  toJSON(): LowcodePageProperties {
    return {
      id: this.id,
      name: this.name,
      title: this.title,
      code: this.code,
      description: this.description,
      schema: this.schema,
      status: this.status,
      createdAt: this.createdAt,
      createdBy: this.createdBy,
      updatedAt: this.updatedAt,
      updatedBy: this.updatedBy,
    };
  }
}
