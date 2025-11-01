import { Entity } from "./orm/entity";
import { Idb } from "./orm/idb";
import { Model } from "./orm/model";
import { OneToMany, type Relation } from "./orm/relation";

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

class User extends Model {
  public name!: string;
  public age!: number;

  public relations = {
    projects: new OneToMany<Project>("project", "userId", "id"),
  };
}

class Project extends Model {
  public name!: string;
}

class MyDb extends Idb {
  public users = new Entity<User>("users");
  public projects = new Entity<User>("projects");

  static async seed() {
    const idb = db.getDb();
    const transaction = idb.transaction("users", "readwrite");
    const userStore = transaction.objectStore("users");
    const projectStore = transaction.objectStore("projects");

    await Promise.all([
      promisifyRequest(userStore.add({ name: "Alice", age: 30 })),
      promisifyRequest(userStore.add({ name: "Bob", age: 25 })),
      promisifyRequest(userStore.add({ name: "Charlie", age: 35 })),
      promisifyRequest(userStore.add({ name: "David", age: 25 })),
      promisifyRequest(projectStore.add({ name: "Project 1" })),
    ]);
  }
}

const db = new MyDb("localdb", +new Date());
await db.connect();
await MyDb.seed();
console.log("db connected");

const users = await db.users.get();

console.log(users);

const usersAbove30 = await db.users
  .where({
    age: { $gte: 30 },
  })
  .get();

console.log(usersAbove30);

await db.disconnect();

await db.dropDatabase();
