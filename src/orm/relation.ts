import { Entity } from './entity';
import { Model } from './model';

export abstract class Relation<T extends Model> extends Entity<T> {
    protected readonly foreignKey: string;
    protected readonly localKey: string;

    constructor(
        storeName: string,
        foreignKey: string,
        localKey: string = 'id'
    ) {
        super(storeName);
        this.foreignKey = foreignKey;
        this.localKey = localKey;
    }

    public abstract getRelated(model: Model): Entity<T>;
}

export class OneToOne<T extends Model> extends Relation<T> {
    public getRelated(model: Model): Entity<T> {
        const foreignKeyValue = (model as any)[this.localKey];
        return this.where({ [this.foreignKey]: foreignKeyValue } as any);
    }
}
export class OneToMany<T extends Model> extends Relation<T> {
    public getRelated(model: Model): Entity<T> {
        const foreignKeyValue = (model as any)[this.localKey];
        this.where({ [this.foreignKey]: foreignKeyValue } as any);
        return this;
    }
}
export class ManyToMany<T extends Model> extends Relation<T> {
    public getRelated(model: Model): Entity<T> {
        // This is more complex and requires a pivot table/store.
        // For now, we'll assume a simple array of IDs on the model.
        const foreignKeyValue = (model as any)[this.localKey];
        return this.where({ [this.foreignKey]: { $in: foreignKeyValue } } as any);
    }
}
