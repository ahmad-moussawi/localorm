import type { Relation } from './relation';

export abstract class Model {
    public id?: number;

    public relations(): Record<string, Relation<any>> {
        return {};
    }

    public relation<T extends Model>(name: string): Relation<T> {
        const relations = this.relations();
        if (!relations || !relations[name]) {
            throw new Error(`Relation '${name}' not defined on model.`);
        }
        return relations[name];
    }
}
