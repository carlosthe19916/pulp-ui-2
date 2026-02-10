import React from "react";

import {
  Bullseye,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  ClipboardCopy,
  Content,
  Flex,
  FlexItem,
  Icon,
  Label,
  MenuToggle,
  PageSection,
  Select,
  SelectList,
  SelectOption,
  Stack,
  StackItem,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Truncate,
  type MenuToggleElement,
} from "@patternfly/react-core";
import CertificateIcon from "@patternfly/react-icons/dist/esm/icons/certificate-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import UserIcon from "@patternfly/react-icons/dist/esm/icons/user-icon";

import { ConditionalDataListBody } from "@app/components/DataListControls/ConditionalDataListBody";
import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";
import { TablePersistenceKeyPrefixes } from "@app/Constants";
import {
  getHubRequestParams,
  useTableControlProps,
  useTableControlState,
} from "@app/hooks/table-controls";
import { useFetchPackages } from "@app/queries/packages";
import { toCamelCase } from "@app/utils/utils";
import dayjs from "dayjs";

export const PythonList: React.FC = () => {
  const [isSortByOpen, setIsSortByOpen] = React.useState<boolean>(false);

  const tableControlState = useTableControlState({
    tableName: "python",
    persistenceKeyPrefix: TablePersistenceKeyPrefixes.python_wheels,
    persistTo: "state",
    columnNames: {
      name: "Name",
    },
    isPaginationEnabled: true,
    isSortEnabled: true,
    sortableColumns: ["name"],
    isFilterEnabled: true,
    filterCategories: [
      {
        categoryKey: "name",
        title: "Name",
        placeholderText: "Search for packages",
        type: FilterType.search,
      },
    ],
    isExpansionEnabled: false,
  });

  const {
    result: { data: packages, total: totalItemCount },
    isFetching,
    fetchError,
  } = useFetchPackages(
    getHubRequestParams({
      ...tableControlState,
      hubSortFieldKeys: {
        name: "name",
      },
    }),
  );

  const tableControls = useTableControlProps({
    ...tableControlState,
    idProperty: "pulp_href",
    currentPageItems: packages,
    totalItemCount,
    isLoading: isFetching,
  });

  const {
    currentPageItems,
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
    },
    sortableColumns,
    sortState: { activeSort, setActiveSort },
  } = tableControls;

  return (
    <>
      <DocumentMetadata title={"Python"} />
      <PageSection>
        <Title headingLevel="h1" size="2xl">
          Python List
        </Title>
      </PageSection>
      <PageSection>
        <Stack>
          <StackItem>
            <Toolbar {...toolbarProps}>
              <ToolbarContent>
                <FilterToolbar showFiltersSideBySide {...filterToolbarProps} />
                <ToolbarItem variant="separator" />
                <ToolbarItem>
                  <Select
                    id="sort-by"
                    isOpen={isSortByOpen}
                    selected={activeSort?.columnKey}
                    onSelect={(_e, value) => {
                      setActiveSort({
                        // biome-ignore lint/suspicious/noExplicitAny: allowed
                        columnKey: value as any,
                        direction: activeSort?.direction ?? "asc",
                      });
                    }}
                    onOpenChange={(isOpen) => setIsSortByOpen(isOpen)}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setIsSortByOpen(!isSortByOpen)}
                        isExpanded={isSortByOpen}
                        style={
                          {
                            width: "200px",
                          } as React.CSSProperties
                        }
                      >
                        {toCamelCase(activeSort?.columnKey ?? "")}
                      </MenuToggle>
                    )}
                    shouldFocusToggleOnSelect
                  >
                    <SelectList>
                      {sortableColumns?.map((e) => (
                        <SelectOption key={e} value={e}>
                          {toCamelCase(activeSort?.columnKey ?? "")}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarItem>
                <ToolbarItem {...paginationToolbarItemProps}>
                  <SimplePagination
                    idPrefix="python-table"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
          </StackItem>
          <StackItem>
            <Stack aria-label="Python list" hasGutter>
              <ConditionalDataListBody
                isLoading={isFetching}
                isError={!!fetchError}
                isNoData={totalItemCount === 0}
              >
                {currentPageItems?.map((item, rowIndex) => {
                  return (
                    <StackItem
                      key={`${item.name}-${item.version}`}
                      aria-labelledby={`Item-${rowIndex}`}
                    >
                      <Card isCompact>
                        <CardHeader>
                          <Flex spaceItems={{ default: "spaceItemsSm" }}>
                            <FlexItem>
                              <Content component="h4">{item.name}</Content>
                            </FlexItem>
                            <FlexItem>
                              <Label isCompact>{item.version}</Label>
                            </FlexItem>
                          </Flex>
                        </CardHeader>
                        <CardBody>
                          <Content component="small">{item.summary}</Content>
                        </CardBody>
                        <CardFooter>
                          <Flex spaceItems={{ default: "spaceItemsSm" }}>
                            <FlexItem>
                              <Icon>
                                <ClockIcon />
                              </Icon>{" "}
                              {dayjs(item.pulp_last_updated).fromNow()}
                            </FlexItem>
                            <FlexItem>
                              <Icon>
                                <UserIcon />
                              </Icon>{" "}
                              <Truncate
                                maxCharsDisplayed={35}
                                content={
                                  item.author ||
                                  item.author_email ||
                                  item.maintainer_email ||
                                  "Unknown"
                                }
                              />
                            </FlexItem>
                            <FlexItem>
                              <Icon>
                                <CertificateIcon />
                              </Icon>{" "}
                              <Truncate
                                maxCharsDisplayed={35}
                                content={
                                  item.license ||
                                  item.license_expression ||
                                  "Unknown"
                                }
                              />
                            </FlexItem>
                            <FlexItem align={{ default: "alignRight" }}>
                              <ClipboardCopy
                                isReadOnly
                                hoverTip="Copy"
                                clickTip="Copied"
                                variant="inline-compact"
                              >
                                pip install {item.name ?? ""}
                              </ClipboardCopy>
                            </FlexItem>
                          </Flex>
                        </CardFooter>
                      </Card>
                    </StackItem>
                  );
                })}
              </ConditionalDataListBody>
            </Stack>
          </StackItem>
          <StackItem>
            <Bullseye>
              <SimplePagination
                idPrefix="python-list"
                isTop={false}
                paginationProps={paginationProps}
              />
            </Bullseye>
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};
