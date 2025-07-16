import { openDB, DBSchema, IDBPDatabase } from "idb";

interface ApiDBSchema extends DBSchema {
  apiData: {
    key: string;
    value: {
      apiPath: string;
      method: string;
      id: string;
      name: string;
      responseProps?: { key: string; type: string; description: string }[];
    }[];
  };
}

class ApiDB {
  private db: IDBPDatabase<ApiDBSchema> | null = null;
  private static instance: ApiDB | null = null;

  private constructor() {}

  static getInstance(): ApiDB {
    if (!ApiDB.instance) {
      ApiDB.instance = new ApiDB();
    }
    return ApiDB.instance;
  }

  async init(): Promise<void> {
    if (!this.db) {
      this.db = await openDB<ApiDBSchema>("api-database", 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("apiData")) {
            db.createObjectStore("apiData");
          }
        },
      });
    }
  }

  async saveApiData(data: ApiDBSchema["apiData"]["value"]): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put("apiData", data, "OPEN_API_DATA");
  }

  async getApiData(): Promise<ApiDBSchema["apiData"]["value"]> {
    if (!this.db) await this.init();
    return (await this.db!.get("apiData", "OPEN_API_DATA")) || [];
  }
}

// 初始化数据库并挂载到window对象
const initApiDB = async () => {
  const apiDB = ApiDB.getInstance();
  await apiDB.init();
  (window as any).apiDB = apiDB;
};

export { ApiDB, initApiDB };
