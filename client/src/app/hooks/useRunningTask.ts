import {
  type IActiveResourceTask,
  type IResourceEntity,
  useResourceTasks,
} from "@app/hooks/useResourceTasks";

export type IRunningTask = Partial<
  Pick<IActiveResourceTask, "taskHref" | "kind">
>;

/** The task running on `entity`, if any (its kind and href when the probe names them). */
export const useRunningTask = (
  entity: IResourceEntity,
): IRunningTask | undefined => {
  const { getActiveCount, getTasks } = useResourceTasks({
    entities: [entity],
  });
  return getActiveCount(entity.prn) > 0
    ? (getTasks(entity.prn)[0] ?? {})
    : undefined;
};
