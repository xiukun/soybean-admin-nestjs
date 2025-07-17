declare namespace Api {
  namespace Lowcode {
    /** Project status */
    type ProjectStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

    /** Project */
    interface Project {
      /** Project ID */
      id: string;
      /** Project name */
      name: string;
      /** Project code */
      code: string;
      /** Project description */
      description?: string;
      /** Project version */
      version: string;
      /** Project configuration */
      config?: Record<string, any>;
      /** Project status */
      status: ProjectStatus;
      /** Created by */
      createdBy: string;
      /** Created time */
      createdAt: string;
      /** Updated by */
      updatedBy?: string;
      /** Updated time */
      updatedAt?: string;
    }

    /** Project search params */
    interface ProjectSearchParams extends Common.PaginatingQueryRecord {
      /** Project name or code search */
      search?: string;
      /** Project status */
      status?: ProjectStatus | null;
    }

    /** Project list */
    interface ProjectList extends Common.PaginatingQueryRecord {
      projects: Project[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }

    /** Project edit */
    interface ProjectEdit {
      /** Project name */
      name: string;
      /** Project code */
      code: string;
      /** Project description */
      description?: string;
      /** Project version */
      version: string;
      /** Project configuration */
      config?: Record<string, any>;
      /** Project status */
      status?: ProjectStatus;
    }

    /** Project statistics */
    interface ProjectStats {
      /** Total projects */
      total: number;
      /** Active projects */
      active: number;
      /** Inactive projects */
      inactive: number;
      /** Archived projects */
      archived: number;
    }

    /** Entity status */
    type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

    /** Entity */
    interface Entity {
      /** Entity ID */
      id: string;
      /** Project ID */
      projectId: string;
      /** Entity name */
      name: string;
      /** Entity code */
      code: string;
      /** Entity description */
      description?: string;
      /** Table name */
      tableName: string;
      /** Entity configuration */
      config?: Record<string, any>;
      /** Entity status */
      status: EntityStatus;
      /** Created by */
      createdBy: string;
      /** Created time */
      createdAt: string;
      /** Updated by */
      updatedBy?: string;
      /** Updated time */
      updatedAt?: string;
    }

    /** Entity search params */
    interface EntitySearchParams extends Common.PaginatingQueryRecord {
      /** Project ID */
      projectId: string;
      /** Entity name or code search */
      search?: string;
      /** Entity status */
      status?: EntityStatus | null;
    }

    /** Entity list */
    interface EntityList extends Common.PaginatingQueryRecord {
      entities: Entity[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }

    /** Entity edit */
    interface EntityEdit {
      /** Project ID */
      projectId: string;
      /** Entity name */
      name: string;
      /** Entity code */
      code: string;
      /** Entity description */
      description?: string;
      /** Table name */
      tableName: string;
      /** Entity configuration */
      config?: Record<string, any>;
      /** Entity status */
      status?: EntityStatus;
    }

    /** Field data type */
    type FieldDataType = 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'DATETIME' | 'TEXT' | 'JSON';

    /** Field */
    interface Field {
      /** Field ID */
      id: string;
      /** Entity ID */
      entityId: string;
      /** Field name */
      name: string;
      /** Field code */
      code: string;
      /** Field description */
      description?: string;
      /** Data type */
      dataType: FieldDataType;
      /** Field length */
      length?: number;
      /** Decimal places */
      precision?: number;
      /** Is required */
      required: boolean;
      /** Is unique */
      unique: boolean;
      /** Default value */
      defaultValue?: string;
      /** Field configuration */
      config?: Record<string, any>;
      /** Display order */
      displayOrder: number;
      /** Created by */
      createdBy: string;
      /** Created time */
      createdAt: string;
      /** Updated by */
      updatedBy?: string;
      /** Updated time */
      updatedAt?: string;
    }

    /** Field search params */
    interface FieldSearchParams extends Common.PaginatingQueryRecord {
      /** Entity ID */
      entityId: string;
      /** Field name or code search */
      search?: string;
      /** Data type */
      dataType?: FieldDataType | null;
    }

    /** Field list */
    interface FieldList extends Common.PaginatingQueryRecord {
      fields: Field[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }

    /** Field edit */
    interface FieldEdit {
      /** Entity ID */
      entityId: string;
      /** Field name */
      name: string;
      /** Field code */
      code: string;
      /** Field description */
      description?: string;
      /** Data type */
      dataType: FieldDataType;
      /** Field length */
      length?: number;
      /** Decimal places */
      precision?: number;
      /** Is required */
      required: boolean;
      /** Is unique */
      unique: boolean;
      /** Default value */
      defaultValue?: string;
      /** Field configuration */
      config?: Record<string, any>;
      /** Display order */
      displayOrder: number;
    }
  }
}
