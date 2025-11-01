import type { Entity } from "./entity";

export type Query<T> = {
    [P in keyof T]?: T[P] | {
        $eq?: T[P];
        $ne?: T[P];
        $gt?: number;
        $gte?: number;
        $lt?: number;
        $lte?: number;
        $in?: T[P][];
        $nin?: T[P][];
        $startsWith?: string;
        $endsWith?: string;
        $contains?: string;
    };
};

export type WithQuery<T> = {
    [key: string]: (query: Entity<any>) => Entity<any>;
};
