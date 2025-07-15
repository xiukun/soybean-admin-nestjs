import { LowcodePage, LowcodePageCreateProperties, LowcodePageUpdateProperties } from './lowcode-page.model';
import { LowcodePageVersion, LowcodePageVersionCreateProperties } from './lowcode-page-version.model';

export interface ILowcodePageRepository {
  create(page: LowcodePageCreateProperties): Promise<LowcodePage>;
  update(page: LowcodePageUpdateProperties): Promise<LowcodePage>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<LowcodePage | null>;
  findByCode(code: string): Promise<LowcodePage | null>;
  findByMenuId(menuId: number): Promise<LowcodePage | null>;
  findAll(page: number, perPage: number, search?: string): Promise<{
    items: LowcodePage[];
    total: number;
  }>;
  createVersion(version: LowcodePageVersionCreateProperties): Promise<LowcodePageVersion>;
  findVersionsByPageId(pageId: string): Promise<LowcodePageVersion[]>;
  findVersionById(id: string): Promise<LowcodePageVersion | null>;
}
