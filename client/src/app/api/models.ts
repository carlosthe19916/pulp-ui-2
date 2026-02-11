export type WithUiId<T> = T & { _ui_unique_id: string };

/** Mark an object as "New" therefore does not have an `id` field. */
export type New<T extends { id: number }> = Omit<T, "id">;

export interface HubFilter {
  field: string;
  operator?: "=" | "!=" | "~" | ">" | ">=" | "<" | "<=";
  value:
    | string
    | number
    | {
        list: (string | number)[];
        operator?: "AND" | "OR";
      };
}

export interface HubRequestParams {
  filters?: HubFilter[];
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
  page?: {
    pageNumber: number; // 1-indexed
    itemsPerPage: number;
  };
}

export interface HubPaginatedResult<T> {
  data: T[];
  total: number;
  params: HubRequestParams;
}

// Unmapped Pulp types

export type UniquePackageResponse = {
  meta: {
    "api-version": string;
    "_last-serial": number;
  };
  projects: {
    name: string;
    "_last-serial": number;
  }[];
};

export type UniquePackageMetadataResponse = {
  last_serial?: number;
  info?: {
    name?: string;
    version?: string;
    summary?: string;
    keywords?: string;
    description?: string;
    description_content_type?: string;
    bugtrack_url?: string;
    docs_url?: string;
    downloads?: {
      last_day?: number;
      last_month?: number;
      last_week?: number;
    };
    download_url?: string;
    home_page?: string;
    author?: string;
    author_email?: string;
    maintainer?: string;
    maintainer_email?: string;
    license?: string;
    requires_python?: string;
    package_url?: string;
    project_url?: string;
    release_url?: string;
    project_urls?: Record<string, string>;
    platform?: string;

    requires_dist?: string[];
    classifiers?: string[];

    yanked?: boolean;
    yanked_reason?: string;

    provides_extras?: string[];
    dynamic?: string[];

    license_expression?: string;
    license_file?: string[];
  };

  releases?: Record<
    string,
    {
      comment_text?: string;
      digests?: {
        md5?: string;
        sha256?: string;
      };
      downloads?: number;
      filename?: string;
      has_sig?: boolean;
      md5_digest?: string;
      packagetype?: string;
      python_version?: string;
      requires_python?: string;
      size?: number;
      upload_time?: string;
      upload_time_iso_8601?: string;
      url?: string;
      yanked?: boolean;
      yanked_reason?: string;
    }[]
  >;
  urls?: {
    comment_text?: string;
    digests?: {
      md5?: string;
      sha256?: string;
    };
    downloads?: number;
    filename?: string;
    has_sig?: boolean;
    md5_digest?: string;
    packagetype?: string;
    python_version?: string;
    requires_python?: string;
    size?: number;
    upload_time?: string;
    upload_time_iso_8601?: string;
    url?: string;
    yanked?: boolean;
    yanked_reason?: string;
  }[];
};
