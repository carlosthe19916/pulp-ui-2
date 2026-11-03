import type {
  RepositoryAddRemoveContent,
  RepositoryResponse,
} from "@app/client";
import { useTaskStarted } from "@app/hooks/useTaskStarted";
import { contentChangeTitle } from "@app/utils/contentChangeNotify";

export interface IContentChangeWatchParams {
  taskHref: string;
  repository: RepositoryResponse;
  body?: RepositoryAddRemoveContent;
  /** Names the change in the started toast; else it's derived from `body`. */
  title?: string;
}

/** Reports a content change task (modify, add, remove, import) the user just started. */
export const useContentChangeTask = () => {
  const taskStarted = useTaskStarted();
  return {
    watch: ({ taskHref, repository, body, title }: IContentChangeWatchParams) =>
      taskStarted({
        taskHref,
        title:
          title ??
          contentChangeTitle({
            repositoryName: repository.name,
            body: body ?? {},
          }),
      }),
  };
};
