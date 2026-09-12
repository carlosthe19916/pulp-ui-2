import { registerDescriptor } from "./registry";

import { fileContentDescriptor } from "./file/file-content";
import { fileDistributionDescriptor } from "./file/file-distribution";
import { filePublicationDescriptor } from "./file/file-publication";
import { fileRemoteDescriptor } from "./file/file-remote";
import { fileRepositoryDescriptor } from "./file/file-repository";

registerDescriptor(fileRepositoryDescriptor);
registerDescriptor(fileRemoteDescriptor);
registerDescriptor(fileDistributionDescriptor);
registerDescriptor(filePublicationDescriptor);
registerDescriptor(fileContentDescriptor);

export {
  getDescriptor,
  getDescriptorsForKind,
  getAllDescriptors,
  getAvailableDescriptors,
} from "./registry";
export type {
  IResourceDescriptor,
  ResourceKind,
  IFieldDescriptor,
  FieldType,
} from "./types";
