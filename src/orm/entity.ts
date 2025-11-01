import type { Query, WithQuery } from './types';
import { Model } from './model';

export class Entity<T extends Model> {
    public storeName: string;
    private db!: () => IDBDatabase;
    private queries: Query<T>[] = [];
    private take: number | null = null;
    private offset: number | null = null;
    private withs: WithQuery<T> = {};
    private modelClass?: new () => T;

    constructor(storeName: string, modelClass?: new () => T) {
        this.storeName = storeName;
        this.modelClass = modelClass;
    }

    public setDb(db: () => IDBDatabase) {
        this.db = db;
    }

    public where(query: Query<T>): this {
        this.queries.push(query);
        return this;
    }

    public limit(count: number): this {
        this.take = count;
        return this;
    }

    public skip(count: number): this {
        this.offset = count;
        return this;
    }

    public with(withs: WithQuery<T>): this {
        this.withs = withs;
        return this;
    }

    public async get(): Promise<T[]> {
        const transaction = this.db().transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = async () => {
                let results = request.result as T[];
                // apply where clauses
                this.queries.forEach(query => {
                    results = results.filter(item => this.matches(item, query));
                });

                // apply skip
                if (this.offset) {
                    results = results.slice(this.offset);
                }

                // apply limit
                if (this.take) {
                    results = results.slice(0, this.take);
                }

                if (Object.keys(this.withs).length > 0) {
                    for (const result of results) {
                        await this.loadRelations(result);
                    }
                }

                this.clear();
                resolve(results);
            };
            request.onerror = () => {
                this.clear();
                reject(request.error);
            };
        });
    }

    public async find(id: number): Promise<T | undefined> {
        const transaction = this.db().transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(id);

        return new Promise((resolve, reject) => {
            request.onsuccess = async () => {
                const result = request.result as T;
                if (result && Object.keys(this.withs).length > 0) {
                    await this.loadRelations(result);
                }
                this.clear();
                resolve(result);
            };
            request.onerror = () => {
                this.clear();
                reject(request.error);
            };
        });
    }

    private async loadRelations(model: T) {
        if (!this.modelClass) return;
        
        const modelInstance = new this.modelClass();
        const relations = modelInstance.relations();
        if (!relations || Object.keys(relations).length === 0) return;

        for (const relationName in this.withs) {
            const relation = modelInstance.relation(relationName);
            relation.setDb(this.db);
            const relatedQuery = relation.getRelated(model);

            const queryBuilder = this.withs[relationName as keyof T];
            const finalQuery = queryBuilder(relatedQuery);

            (model as any)[relationName] = await finalQuery.get();
        }
    }

    private matches(item: T, query: Query<T>): boolean {
        for (const key in query) {
            const queryValue = query[key as keyof T];
            const itemValue = item[key as keyof T];

            if (typeof queryValue === 'object' && queryValue !== null && !Array.isArray(queryValue)) {
                for (const op in queryValue) {
                    const operator = op as keyof typeof queryValue;
                    const operand = queryValue[operator];
                    switch (operator) {
                        case '$eq': if (itemValue !== operand) return false; break;
                        case '$ne': if (itemValue === operand) return false; break;
                        case '$gt': if ((itemValue as any) <= (operand as any)) return false; break;
                        case '$gte': if ((itemValue as any) < (operand as any)) return false; break;
                        case '$lt': if ((itemValue as any) >= (operand as any)) return false; break;
                        case '$lte': if ((itemValue as any) > (operand as any)) return false; break;
                        case '$in': if (!(operand as any[]).includes(itemValue)) return false; break;
                        case '$nin': if ((operand as any[]).includes(itemValue)) return false; break;
                        case '$startsWith': if (typeof itemValue === 'string' && typeof operand === 'string' && !itemValue.startsWith(operand)) return false; break;
                        case '$endsWith': if (typeof itemValue === 'string' && typeof operand === 'string' && !itemValue.endsWith(operand)) return false; break;
                        case '$contains': if (typeof itemValue === 'string' && typeof operand === 'string' && !itemValue.includes(operand)) return false; break;
                        default: return false;
                    }
                }
            } else {
                if (itemValue !== queryValue) {
                    return false;
                }
            }
        }
        return true;
    }

    private clear() {
        this.queries = [];
        this.take = null;
        this.offset = null;
        this.withs = {};
    }
}
