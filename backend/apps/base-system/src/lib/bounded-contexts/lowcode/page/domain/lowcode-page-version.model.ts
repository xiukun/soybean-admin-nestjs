export type LowcodePageVersionRequiredProperties = Readonly<
  Required<{
    pageId: string;
    version: string;
    schema: any; // JSON object for AMIS schema
    createdAt: Date;
    createdBy: string;
  }>
>;

export type LowcodePageVersionOptionalProperties = Readonly<
  Partial<{
    id: string;
    changelog: string | null;
  }>
>;

export type LowcodePageVersionCreateProperties = LowcodePageVersionRequiredProperties & LowcodePageVersionOptionalProperties;

export type LowcodePageVersionUpdateProperties = Partial<LowcodePageVersionRequiredProperties> & 
  Required<Pick<LowcodePageVersionOptionalProperties, 'id'>> & 
  Omit<LowcodePageVersionOptionalProperties, 'id'>;

export type LowcodePageVersionProperties = LowcodePageVersionRequiredProperties & LowcodePageVersionOptionalProperties;

export class LowcodePageVersion {
  id?: string;
  pageId: string;
  version: string;
  schema: any;
  changelog?: string;
  createdAt: Date;
  createdBy: string;

  constructor(properties: LowcodePageVersionCreateProperties) {
    Object.assign(this, properties);
  }

  static create(properties: LowcodePageVersionCreateProperties): LowcodePageVersion {
    return new LowcodePageVersion(properties);
  }

  toJSON(): LowcodePageVersionProperties {
    return {
      id: this.id,
      pageId: this.pageId,
      version: this.version,
      schema: this.schema,
      changelog: this.changelog,
      createdAt: this.createdAt,
      createdBy: this.createdBy,
    };
  }
}
