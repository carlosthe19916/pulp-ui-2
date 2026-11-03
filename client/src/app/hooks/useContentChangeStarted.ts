import type {
  RepositoryAddRemoveContent,
  RepositoryResponse,
} from "@app/client";
import { useTaskFeedback } from "@app/hooks/useTaskFeedback";
import { contentChangeTitle } from "@app/utils/contentChangeNotify";

export interface IContentChangeStarted {
  taskHref: string;
  repository: RepositoryResponse;
  body?: RepositoryAddRemoveContent;
  /** Names the change in the started toast; else it's derived from `body`. */
  title?: string;
}

/**
 * Reports a content change (modify, add, remove, import) the user just started; it goes to
 * the task drawer.
 */
export const useContentChangeStarted = () => {
  const { started } = useTaskFeedback();
  return ({ taskHref, repository, body, title }: IContentChangeStarted) =>
    started({
      taskHref,
      title:
        title ??
        contentChangeTitle({
          repositoryName: repository.name,
          body: body ?? {},
        }),
    });
};
