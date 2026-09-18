export type WithId<T> = {
  id: string;
  object: T;
};

export const withId = <T>(id: string, object: T): WithId<T> => ({ id, object });
