import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Idb } from "./idb";
import { Entity } from "./entity";
import { Model } from "./model";
import { OneToMany, Relation } from "./relation";

class Post extends Model {
  public title!: string;
  public userId!: number;
}

class User extends Model {
  public name!: string;
  public age!: number;

  public relations(): Record<string, Relation<any>> {
    return {
      posts: new OneToMany<Post>("posts", "userId", "id"),
    };
  }

  public posts?: Post[];
}

class TestDb extends Idb {
  public users = new Entity<User>("users", User);
  public posts = new Entity<Post>("posts", Post);
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

describe("ORM", () => {
  let db: TestDb;

  beforeEach(async () => {
    db = new TestDb("test-db", Date.now()); // Use a new version to ensure onupgradeneeded runs
    await db.connect();

    // @ts-ignore
    const idb = db.getDb();
    const userTransaction = idb.transaction("users", "readwrite");
    const userStore = userTransaction.objectStore("users");

    await Promise.all([
      promisify(userStore.add({ name: "Alice", age: 30 })),
      promisify(userStore.add({ name: "Bob", age: 25 })),
      promisify(userStore.add({ name: "Charlie", age: 35 })),
      promisify(userStore.add({ name: "David", age: 25 })),
    ]);

    const postTransaction = idb.transaction("posts", "readwrite");
    const postStore = postTransaction.objectStore("posts");
    await Promise.all([
      promisify(postStore.add({ title: "Post 1 by Alice", userId: 1 })),
      promisify(postStore.add({ title: "Post 2 by Alice", userId: 1 })),
      promisify(postStore.add({ title: "Post 1 by Bob", userId: 2 })),
    ]);
  });

  afterEach(async () => {
    db.dropDatabase();
  });

  it("should connect to the database", async () => {
    expect(db.getDb()).toBeDefined();
  });

  it("should find a user by id", async () => {
    const user = await db.users.find(1);
    expect(user).toBeDefined();
    expect(user?.name).toBe("Alice");
  });

  it("should get all users", async () => {
    const users = await db.users.get();
    expect(users.length).toBe(4);
  });

  it("should filter users with $gt", async () => {
    const users = await db.users.where({ age: { $gt: 30 } }).get();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Charlie");
  });

  it("should filter users with $gte", async () => {
    const users = await db.users.where({ age: { $gte: 30 } }).get();
    expect(users.length).toBe(2);
  });

  it("should filter users with $lt", async () => {
    const users = await db.users.where({ age: { $lt: 30 } }).get();
    expect(users.length).toBe(2);
  });

  it("should filter users with $lte", async () => {
    const users = await db.users.where({ age: { $lte: 25 } }).get();
    expect(users.length).toBe(2);
  });

  it("should filter users with $eq", async () => {
    const users = await db.users.where({ age: { $eq: 25 } }).get();
    expect(users.length).toBe(2);
  });

  it("should filter users with $ne", async () => {
    const users = await db.users.where({ age: { $ne: 25 } }).get();
    expect(users.length).toBe(2);
  });

  it("should filter users with $in", async () => {
    const users = await db.users.where({ age: { $in: [25, 35] } }).get();
    expect(users.length).toBe(3);
  });

  it("should filter users with $nin", async () => {
    const users = await db.users.where({ age: { $nin: [25, 35] } }).get();
    expect(users.length).toBe(1);
  });

  it("should filter users with $startsWith", async () => {
    const users = await db.users.where({ name: { $startsWith: "A" } }).get();
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Alice");
  });

  it("should filter users with $endsWith", async () => {
    const users = await db.users.where({ name: { $endsWith: "e" } }).get();
    expect(users.length).toBe(2);
  });

  it("should filter users with $contains", async () => {
    const users = await db.users.where({ name: { $contains: "li" } }).get();
    expect(users.length).toBe(2);
  });

  it("should limit results", async () => {
    const users = await db.users.limit(2).get();
    expect(users.length).toBe(2);
  });

  it("should skip results", async () => {
    const users = await db.users.skip(2).get();
    expect(users.length).toBe(2);
    expect(users[0].name).toBe("Charlie");
  });

  it("should skip and limit results", async () => {
    const users = await db.users.skip(1).limit(2).get();
    expect(users.length).toBe(2);
    expect(users[0].name).toBe("Bob");
  });

  it("should load a OneToMany relation", async () => {
    const user = await db.users
      .with({
        posts: (query) => query,
      })
      .find(1);

    expect(user).toBeDefined();
    expect(user?.posts).toBeDefined();
    expect(user?.posts?.length).toBe(2);
    expect(user?.posts?.[0].title).toBe("Post 1 by Alice");
  });

  it("should load all records for a OneToMany relation", async () => {
    const users = await db.users
      .with({
        posts: (query) => query,
      })
      .get();

    users.forEach((user) => {
      expect(user).toBeDefined();
      expect(user?.posts).toBeDefined();
    });
  });
});
