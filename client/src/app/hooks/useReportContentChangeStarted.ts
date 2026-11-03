import type {
  RepositoryAddRemoveContent,
  RepositoryResponse,
} from "@app/client";
import { useTaskReporter } from "@app/hooks/useTaskReporter";
import { contentChangeTitle } from "@app/utils/contentChangeNotify";

export interface IContentChangeStartedParams {
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
export const useReportContentChangeStarted = () => {
  const { reportStarted } = useTaskReporter();
  return ({ taskHref, repository, body, title }: IContentChangeStartedParams) =>
    reportStarted({
      taskHref,
      title:
        title ??
        contentChangeTitle({
          repositoryName: repository.name,
          body: body ?? {},
        }),
    });
};
