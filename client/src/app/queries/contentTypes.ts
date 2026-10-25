import type {
  AnsibleAnsibleCollectionDeprecatedResponse,
  AnsibleAnsibleNamespaceMetadataResponse,
  AnsibleCollectionVersionResponse,
  AnsibleCollectionVersionSignatureResponse,
  AnsibleRoleResponse,
  ContainerManifestResponse,
  ContainerManifestSignatureResponse,
  ContainerTagResponse,
  ContentAnsibleCollectionDeprecationsListData,
  ContentAnsibleCollectionSignaturesListData,
  ContentAnsibleCollectionVersionsListData,
  ContentAnsibleNamespacesListData,
  ContentAnsibleRolesListData,
  ContentContainerManifestsListData,
  ContentContainerSignaturesListData,
  ContentContainerTagsListData,
  ContentDebPackagesListData,
  ContentDebReleaseArchitecturesListData,
  ContentDebReleaseComponentsListData,
  ContentDebReleasesListData,
  ContentDebSourcePackagesListData,
  ContentFileFilesListData,
  ContentGemGemListData,
  ContentHuggingFaceHuggingFaceListData,
  ContentMavenArtifactListData,
  ContentMavenPackageListData,
  ContentNpmPackagesListData,
  ContentOstreeCommitsListData,
  ContentOstreeRefsListData,
  ContentPythonPackagesListData,
  ContentPythonProvenanceListData,
  ContentPythonYanksListData,
  ContentRpmAdvisoriesListData,
  ContentRpmModulemdDefaultsListData,
  ContentRpmModulemdsListData,
  ContentRpmPackagegroupsListData,
  ContentRpmPackagesListData,
  DebPackageResponse,
  DebReleaseArchitectureResponse,
  DebReleaseComponentResponse,
  DebReleaseResponse,
  DebSourcePackageResponse,
  FileFileContentResponse,
  GemGemContentResponse,
  HuggingFaceHuggingFaceContentResponse,
  MavenMavenArtifactResponse,
  MavenMavenPackageResponse,
  NpmPackageResponse,
  OstreeOstreeCommitResponse,
  OstreeOstreeRefResponse,
  PaginatedansibleAnsibleCollectionDeprecatedResponseList,
  PaginatedansibleAnsibleNamespaceMetadataResponseList,
  PaginatedansibleCollectionVersionResponseList,
  PaginatedansibleCollectionVersionSignatureResponseList,
  PaginatedansibleRoleResponseList,
  PaginatedcontainerManifestResponseList,
  PaginatedcontainerManifestSignatureResponseList,
  PaginatedcontainerTagResponseList,
  PaginateddebPackageResponseList,
  PaginateddebReleaseArchitectureResponseList,
  PaginateddebReleaseComponentResponseList,
  PaginateddebReleaseResponseList,
  PaginateddebSourcePackageResponseList,
  PaginatedfileFileContentResponseList,
  PaginatedgemGemContentResponseList,
  PaginatedhuggingFaceHuggingFaceContentResponseList,
  PaginatedmavenMavenArtifactResponseList,
  PaginatedmavenMavenPackageResponseList,
  PaginatednpmPackageResponseList,
  PaginatedostreeOstreeCommitResponseList,
  PaginatedostreeOstreeRefResponseList,
  PaginatedpythonPackageProvenanceResponseList,
  PaginatedpythonPackageYankResponseList,
  PaginatedpythonPythonPackageContentResponseList,
  PaginatedrpmModulemdDefaultsResponseList,
  PaginatedrpmModulemdResponseList,
  PaginatedrpmPackageGroupResponseList,
  PaginatedrpmPackageResponseList,
  PaginatedrpmUpdateRecordResponseList,
  PythonPackageProvenanceResponse,
  PythonPackageYankResponse,
  PythonPythonPackageContentResponse,
  RpmModulemdDefaultsResponse,
  RpmModulemdResponse,
  RpmPackageGroupResponse,
  RpmPackageResponse,
  RpmUpdateRecordResponse,
} from "@app/client";

import type { MultiOrderListParams } from "./utils/listParams";

/**
 * Generated list types (row, page, `*ListData`) of each content type's own endpoint,
 * keyed by pulp_type; add a type here to list it.
 */
export interface IContentTypeMap {
  "ansible.collection_version": {
    row: AnsibleCollectionVersionResponse;
    page: PaginatedansibleCollectionVersionResponseList;
    data: ContentAnsibleCollectionVersionsListData;
  };
  "ansible.namespace": {
    row: AnsibleAnsibleNamespaceMetadataResponse;
    page: PaginatedansibleAnsibleNamespaceMetadataResponseList;
    data: ContentAnsibleNamespacesListData;
  };
  "ansible.role": {
    row: AnsibleRoleResponse;
    page: PaginatedansibleRoleResponseList;
    data: ContentAnsibleRolesListData;
  };
  "ansible.collection_signature": {
    row: AnsibleCollectionVersionSignatureResponse;
    page: PaginatedansibleCollectionVersionSignatureResponseList;
    data: ContentAnsibleCollectionSignaturesListData;
  };
  "ansible.collection_deprecation": {
    row: AnsibleAnsibleCollectionDeprecatedResponse;
    page: PaginatedansibleAnsibleCollectionDeprecatedResponseList;
    data: ContentAnsibleCollectionDeprecationsListData;
  };
  "container.tag": {
    row: ContainerTagResponse;
    page: PaginatedcontainerTagResponseList;
    data: ContentContainerTagsListData;
  };
  "container.manifest": {
    row: ContainerManifestResponse;
    page: PaginatedcontainerManifestResponseList;
    data: ContentContainerManifestsListData;
  };
  "container.signature": {
    row: ContainerManifestSignatureResponse;
    page: PaginatedcontainerManifestSignatureResponseList;
    data: ContentContainerSignaturesListData;
  };
  "rpm.package": {
    row: RpmPackageResponse;
    page: PaginatedrpmPackageResponseList;
    data: ContentRpmPackagesListData;
  };
  "rpm.advisory": {
    row: RpmUpdateRecordResponse;
    page: PaginatedrpmUpdateRecordResponseList;
    data: ContentRpmAdvisoriesListData;
  };
  "rpm.modulemd": {
    row: RpmModulemdResponse;
    page: PaginatedrpmModulemdResponseList;
    data: ContentRpmModulemdsListData;
  };
  "rpm.modulemd_defaults": {
    row: RpmModulemdDefaultsResponse;
    page: PaginatedrpmModulemdDefaultsResponseList;
    data: ContentRpmModulemdDefaultsListData;
  };
  "rpm.packagegroup": {
    row: RpmPackageGroupResponse;
    page: PaginatedrpmPackageGroupResponseList;
    data: ContentRpmPackagegroupsListData;
  };
  "deb.package": {
    row: DebPackageResponse;
    page: PaginateddebPackageResponseList;
    data: ContentDebPackagesListData;
  };
  "deb.source_package": {
    row: DebSourcePackageResponse;
    page: PaginateddebSourcePackageResponseList;
    data: ContentDebSourcePackagesListData;
  };
  "deb.release": {
    row: DebReleaseResponse;
    page: PaginateddebReleaseResponseList;
    data: ContentDebReleasesListData;
  };
  "deb.release_component": {
    row: DebReleaseComponentResponse;
    page: PaginateddebReleaseComponentResponseList;
    data: ContentDebReleaseComponentsListData;
  };
  "deb.release_architecture": {
    row: DebReleaseArchitectureResponse;
    page: PaginateddebReleaseArchitectureResponseList;
    data: ContentDebReleaseArchitecturesListData;
  };
  "python.python": {
    row: PythonPythonPackageContentResponse;
    page: PaginatedpythonPythonPackageContentResponseList;
    data: ContentPythonPackagesListData;
  };
  "python.python_yank": {
    row: PythonPackageYankResponse;
    page: PaginatedpythonPackageYankResponseList;
    data: ContentPythonYanksListData;
  };
  "python.provenance": {
    row: PythonPackageProvenanceResponse;
    page: PaginatedpythonPackageProvenanceResponseList;
    data: ContentPythonProvenanceListData;
  };
  "file.file": {
    row: FileFileContentResponse;
    page: PaginatedfileFileContentResponseList;
    data: ContentFileFilesListData;
  };
  "gem.gem": {
    row: GemGemContentResponse;
    page: PaginatedgemGemContentResponseList;
    data: ContentGemGemListData;
  };
  "npm.package": {
    row: NpmPackageResponse;
    page: PaginatednpmPackageResponseList;
    data: ContentNpmPackagesListData;
  };
  "maven.package": {
    row: MavenMavenPackageResponse;
    page: PaginatedmavenMavenPackageResponseList;
    data: ContentMavenPackageListData;
  };
  "maven.artifact": {
    row: MavenMavenArtifactResponse;
    page: PaginatedmavenMavenArtifactResponseList;
    data: ContentMavenArtifactListData;
  };
  "ostree.refs": {
    row: OstreeOstreeRefResponse;
    page: PaginatedostreeOstreeRefResponseList;
    data: ContentOstreeRefsListData;
  };
  "ostree.commit": {
    row: OstreeOstreeCommitResponse;
    page: PaginatedostreeOstreeCommitResponseList;
    data: ContentOstreeCommitsListData;
  };
  "hugging_face.hugging-face": {
    row: HuggingFaceHuggingFaceContentResponse;
    page: PaginatedhuggingFaceHuggingFaceContentResponseList;
    data: ContentHuggingFaceHuggingFaceListData;
  };
}

export type ContentTypeKey = keyof IContentTypeMap;

export type ContentTypeRow<K extends ContentTypeKey> =
  IContentTypeMap[K]["row"];

export type ContentTypePage<K extends ContentTypeKey> =
  IContentTypeMap[K]["page"];

/** A page of one content type's list: the spec's filters, multi-field `ordering`, required `limit`. */
export type IContentTypeListParams<K extends ContentTypeKey> =
  MultiOrderListParams<IContentTypeMap[K]["data"]>;
