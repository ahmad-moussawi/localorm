# LocalORM

A lightweight, TypeScript-based ORM (Object-Relational Mapping) library for IndexedDB. LocalORM provides an elegant and intuitive API for working with browser-based IndexedDB storage, with support for advanced querying, relationships, and type safety.

## Features

- 🎯 **TypeScript First** - Full TypeScript support with complete type inference
- 🔍 **Advanced Querying** - Support for multiple query operators ($gt, $gte, $lt, $lte, $eq, $ne, $in, $nin, $startsWith, $endsWith, $contains)
- 🔗 **Relationships** - Support for OneToOne, OneToMany, and ManyToMany relationships
- 🚀 **Simple API** - Fluent, chainable query builder interface
- 📦 **Lightweight** - Minimal dependencies (only `idb` for IndexedDB polyfill)
- ⚡ **Fast** - Direct IndexedDB access with optimized queries

## Installation

This is a TypeScript library for working with IndexedDB. To use it in your project, you can copy the source files from the `src/orm` directory or install dependencies:

```bash
npm install
```

The library requires the `idb` package as a dependency:

```bash
npm install idb
```

## Quick Start

### 1. Define Your Models

```typescript
import { Model } from './orm/model';

class User extends Model {
  public name!: string;
  public age!: number;
  public email!: string;
}

class Post extends Model {
  public title!: string;
  public content!: string;
  public userId!: number;
}
```

### 2. Create Your Database

```typescript
import { Idb } from './orm/idb';
import { Entity } from './orm/entity';

class MyDatabase extends Idb {
  public users = new Entity<User>('users', User);
  public posts = new Entity<Post>('posts', Post);
}

// Initialize the database
const db = new MyDatabase('my-app-db', 1);
await db.connect();
```

### 3. Perform CRUD Operations

```typescript
// Create (Add records) - using IndexedDB directly
const transaction = db.getDb().transaction('users', 'readwrite');
const userStore = transaction.objectStore('users');
await new Promise((resolve, reject) => {
  const request = userStore.add({ name: 'Alice', age: 30, email: 'alice@example.com' });
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

// Read all users
const users = await db.users.get();

// Read a specific user by ID
const user = await db.users.find(1);

// Query with filters
const youngUsers = await db.users
  .where({ age: { $lt: 30 } })
  .get();
```

## Query Operators

LocalORM supports a wide range of query operators for flexible data filtering:

### Comparison Operators

```typescript
// Equal
const users = await db.users.where({ age: { $eq: 25 } }).get();

// Not equal
const users = await db.users.where({ age: { $ne: 25 } }).get();

// Greater than
const users = await db.users.where({ age: { $gt: 25 } }).get();

// Greater than or equal
const users = await db.users.where({ age: { $gte: 25 } }).get();

// Less than
const users = await db.users.where({ age: { $lt: 30 } }).get();

// Less than or equal
const users = await db.users.where({ age: { $lte: 30 } }).get();
```

### Array Operators

```typescript
// In array
const users = await db.users
  .where({ age: { $in: [25, 30, 35] } })
  .get();

// Not in array
const users = await db.users
  .where({ age: { $nin: [25, 30] } })
  .get();
```

### String Operators

```typescript
// Starts with
const users = await db.users
  .where({ name: { $startsWith: 'A' } })
  .get();

// Ends with
const users = await db.users
  .where({ name: { $endsWith: 'son' } })
  .get();

// Contains
const users = await db.users
  .where({ name: { $contains: 'lic' } })
  .get();
```

## Pagination

```typescript
// Limit results
const firstTenUsers = await db.users.limit(10).get();

// Skip results
const skipFirstTen = await db.users.skip(10).get();

// Combine skip and limit for pagination
const page2 = await db.users.skip(10).limit(10).get();
```

## Relationships

LocalORM supports defining and loading relationships between models.

### Defining Relationships

```typescript
import { Model } from './orm/model';
import { OneToMany, Relation } from './orm/relation';

class User extends Model {
  public name!: string;
  public age!: number;
  public posts?: Post[];

  public relations(): Record<string, Relation<any>> {
    return {
      posts: new OneToMany<Post>('posts', 'userId', 'id'),
    };
  }
}

class Post extends Model {
  public title!: string;
  public userId!: number;
}
```

### Loading Relationships (Eager Loading)

```typescript
// Load a user with their posts
const user = await db.users
  .with({
    posts: (query) => query,
  })
  .find(1);

console.log(user?.posts); // Array of posts

// Load all users with their posts
const usersWithPosts = await db.users
  .with({
    posts: (query) => query,
  })
  .get();

// Load posts with additional filtering
const userWithRecentPosts = await db.users
  .with({
    posts: (query) => query.limit(5),
  })
  .find(1);
```

### Relationship Types

```typescript
import { OneToOne, OneToMany, ManyToMany, Relation } from './orm/relation';
import { Model } from './orm/model';

// One-to-One: A user has one profile
class User extends Model {
  public relations(): Record<string, Relation<any>> {
    return {
      profile: new OneToOne<Profile>('profiles', 'userId', 'id'),
    };
  }
}

// One-to-Many: A user has many posts
class User extends Model {
  public relations(): Record<string, Relation<any>> {
    return {
      posts: new OneToMany<Post>('posts', 'userId', 'id'),
    };
  }
}

// Many-to-Many: A user has many roles (through a pivot)
class User extends Model {
  public relations(): Record<string, Relation<any>> {
    return {
      roles: new ManyToMany<Role>('roles', 'roleIds', 'id'),
    };
  }
}
```

## Complete Example

```typescript
import { Idb } from './orm/idb';
import { Entity } from './orm/entity';
import { Model } from './orm/model';
import { OneToMany, Relation } from './orm/relation';

// Define models
class User extends Model {
  public name!: string;
  public age!: number;
  public posts?: Post[];

  public relations(): Record<string, Relation<any>> {
    return {
      posts: new OneToMany<Post>('posts', 'userId', 'id'),
    };
  }
}

class Post extends Model {
  public title!: string;
  public content!: string;
  public userId!: number;
}

// Define database
class BlogDatabase extends Idb {
  public users = new Entity<User>('users', User);
  public posts = new Entity<Post>('posts', Post);
}

// Helper function to promisify IndexedDB requests
function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Initialize and use
async function main() {
  const db = new BlogDatabase('blog-db', 1);
  await db.connect();

  // Add sample data
  const idb = db.getDb();
  const userTx = idb.transaction('users', 'readwrite');
  const userStore = userTx.objectStore('users');
  await promisify(userStore.add({ name: 'Alice', age: 30 }));
  await promisify(userStore.add({ name: 'Bob', age: 25 }));

  const postTx = idb.transaction('posts', 'readwrite');
  const postStore = postTx.objectStore('posts');
  await promisify(postStore.add({ title: 'First Post', content: 'Hello World', userId: 1 }));
  await promisify(postStore.add({ title: 'Second Post', content: 'TypeScript is great', userId: 1 }));

  // Query with filters
  const adults = await db.users
    .where({ age: { $gte: 30 } })
    .get();
  console.log('Adults:', adults);

  // Load relationships
  const userWithPosts = await db.users
    .with({
      posts: (query) => query,
    })
    .find(1);
  console.log('User with posts:', userWithPosts);

  // Pagination
  const firstUser = await db.users.limit(1).get();
  console.log('First user:', firstUser);

  // Cleanup
  await db.disconnect();
  await db.dropDatabase();
}

main();
```

## API Reference

### Database (Idb)

- `connect()`: Connect to the IndexedDB database
- `disconnect()`: Close the database connection
- `dropDatabase()`: Delete the entire database
- `getDb()`: Get the underlying IDBDatabase instance

### Entity

- `where(query)`: Add a filter condition
- `find(id)`: Find a record by ID
- `get()`: Execute the query and return all matching records
- `limit(count)`: Limit the number of results
- `skip(count)`: Skip a number of results
- `with(relations)`: Eager load relationships

### Model

- `relations()`: Define relationships for the model
- `relation(name)`: Get a specific relation instance

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.
