import { Entity } from "./entity";

export abstract class Idb {
  private db: IDBDatabase | null = null;
  private readonly dbName: string;
  private readonly dbVersion: number;

  constructor(dbName: string, version: number = 1) {
    this.dbName = dbName;
    this.dbVersion = version;
  }

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(this.db);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.initializeEntities();
        resolve();
      };

      request.onerror = (event) => {
        console.error(
          "Database error: ",
          (event.target as IDBOpenDBRequest).error
        );
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  public async disconnect() {
    this.db?.close();
  }

  public async dropDatabase() {
    const dbs = await indexedDB.databases();
    if (dbs.find((x) => x.name === this.dbName)) {
      this.disconnect();
      return new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(this.dbName);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
        deleteRequest.onblocked = () => {
          console.warn(`Deletion of database ${this.dbName} is blocked.`);
          reject("delete db is blocked");
        };
      });
    }

    return Promise.resolve();
  }

  private createObjectStores(db: IDBDatabase) {
    Object.values(this).forEach((prop) => {
      if (prop instanceof Entity) {
        if (!db.objectStoreNames.contains(prop.storeName)) {
          db.createObjectStore(prop.storeName, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      }
    });
  }

  private initializeEntities() {
    Object.values(this).forEach((prop) => {
      if (prop instanceof Entity) {
        prop.setDb(() => this.getDb());
      }
    });
  }

  public getDb(): IDBDatabase {
    if (!this.db) {
      throw new Error("Database is not connected. Call connect() first.");
    }
    return this.db;
  }
}
