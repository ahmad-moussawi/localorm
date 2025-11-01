# IndexedDB based ORM
The ORM should provide the ability for users to define models to do CRUD operations against IndexedDB store.

##  IDB entity manager
First we should define the `Idb` object that should hold and manage all types of models (like EntityManager).

a simple usage would be like.
```
class User extends Model {}
class Project extends Model {}

class MyDb extends Idb {
    public users = new Entity<User>("user"); // the first parameter is the store name
    public projects = new Entity<Project>("project");
}

const db = new MyDb();
const users = await db.users.get();
```

## Operations
Model instances and Relations expose two type of methods, the fluent builder methods where they can build a query, and execution methods to execute the built queries. execution methods are async.

The fluent methods are:
- where
- limit
- skip
- with

The execution methods are:
- find
- get 


### Where
A fluent builder to build multiple where conditions. It uses a MongoDB-style query object.

```
const users = db.users
    .where({ age: { $gt: 5 } })
    .where({ name: { $startsWith: 'AB' } })
    .get();
```

### Limit
Limit the result to the top N

```
const top5Users = db.users.where(u => u.age > 20).limit(5).get();
```

### Skip
Offset the result by N

```
const top5Users = db.users.where(u => u.age > 20).limit(5).skip(2).get();
```

### With
Eagerly load relations

```
const users = db.users.with({
    'addresses': (addressQuery) => addressQuery.where(a => a.isActive),
    'profile': (profileQuery) => profileQuery,
})
```

### Async Get
Execute the fluent query and return an array of the result

```
const users = db.users.get();
```


### Async Find
find one record by id
```
const user = db.users.find(1);
```


## Relations
Models should also be able to define relations with other models, we have the following relations types:
- OneToOne
- OneToMany
- ManyToMany

relations should be defined like this

```
class User extends Model {

 public relations: Record<string, Relation> = {
    phones: new OneToMany<Phone>(),
    profile: new OneToOne<Profile>(),
    projects: new ManyToMany<Project>(),
 }

  public name: string;
  public age: number;

  public phones?: Array<Phone>;
  public profile?: Profile;
  public projects?: Array<Project>;

}
```

and the usage of the relations would be like:

```
const user = db.users.find(1);
const userProjects = user.relation('projects').get();
const userProfile = user.relation('profile').first();
const userFirstAddress = user.relation('addresses').first();
```

Relations can be filtered similar to model instances

```
const addresses = db.users.find(1)?.relation('addresses')
    .where(a => a.isActive)
    .get();
```

### Loading relations
We should be able to eagerly load relations using the `with` method on a model.

```
const usersWithProjects: Array<User> = db.users.with({
    projects: (query) => query.where(p => p.includes('ABC'))
}).get()
```