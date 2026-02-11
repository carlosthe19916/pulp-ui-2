import React from "react";
import { generatePath, useNavigate } from "react-router-dom";

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
  Select,
  SelectList,
  SelectOption,
  Stack,
  StackItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Truncate,
  type MenuToggleElement,
} from "@patternfly/react-core";
import CertificateIcon from "@patternfly/react-icons/dist/esm/icons/certificate-icon";
import UserIcon from "@patternfly/react-icons/dist/esm/icons/user-icon";

import type {
  DistributionResponse,
  PythonPythonPackageContentResponse,
} from "@app/client";
import { ConditionalDataListBody } from "@app/components/DataListControls/ConditionalDataListBody";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useFetchUniquePackages } from "@app/queries/packages";
import { Paths } from "@app/Routes";
import { toCamelCase } from "@app/utils/utils";

import { WithPackage } from "./WithPackage";

type ICardListProps = {
  distribution: DistributionResponse;
};

export const CardList: React.FC<ICardListProps> = ({ distribution }) => {
  const navigate = useNavigate();
  const { packages, isFetching, fetchError } = useFetchUniquePackages({
    distributionPath: distribution.base_path,
  });

  // Sorting
  const [isSortByOpen, setIsSortByOpen] = React.useState<boolean>(false);

  // Table
  const tableControls = useLocalTableControls({
    tableName: "python-table",
    idProperty: "name",
    items: packages,
    isLoading: isFetching,
    columnNames: {
      name: "Name",
    },
    hasActionsColumn: false,
    isSortEnabled: true,
    sortableColumns: ["name"],
    initialSort: {
      columnKey: "name",
      direction: "asc",
    },
    getSortValues: (item) => {
      return {
        name: item.name,
      };
    },
    isPaginationEnabled: true,
    isFilterEnabled: true,
    filterCategories: [
      {
        categoryKey: "name",
        title: "Name",
        type: FilterType.search,
        placeholderText: "Search by name...",
        getItemValue: (item) => item.name || "",
      },
    ],
    isExpansionEnabled: false,
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

  const onClickCard = (item: PythonPythonPackageContentResponse) => {
    navigate(
      generatePath(Paths.pythonDetails, {
        pythonId: item.pulp_href ?? "",
      }),
    );
  };

  return (
    <Stack>
      <StackItem>
        <Toolbar {...toolbarProps}>
          <ToolbarContent>
            <FilterToolbar showFiltersSideBySide {...filterToolbarProps} />
            <ToolbarItem variant="separator" />
            <ToolbarItem>
              Sort by:
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
                idPrefix="python-list"
                isTop
                paginationProps={paginationProps}
              />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </StackItem>
      <StackItem>
        <Stack aria-label="python-list" hasGutter>
          <ConditionalDataListBody
            isLoading={isFetching}
            isError={!!fetchError}
            isNoData={packages.length === 0}
          >
            {currentPageItems?.map((item, rowIndex) => {
              return (
                <StackItem
                  key={`${item.name}`}
                  aria-labelledby={`Item-${rowIndex}`}
                >
                  <Card isCompact isClickable>
                    <WithPackage
                      distribution={distribution}
                      packageName={item.name}
                    >
                      {({ pkg }) => {
                        return (
                          <>
                            <CardHeader
                              selectableActions={{
                                onClickAction: () => onClickCard(item),
                                selectableActionAriaLabelledby: `${item.name}-card}`,
                              }}
                            >
                              <Flex spaceItems={{ default: "spaceItemsSm" }}>
                                <FlexItem>
                                  <Content component="h4">{item.name}</Content>
                                </FlexItem>
                                <FlexItem>
                                  <Label isCompact>{pkg?.info?.version}</Label>
                                </FlexItem>
                              </Flex>
                            </CardHeader>
                            <CardBody>
                              <Content component="small">
                                {pkg?.info?.summary}
                              </Content>
                            </CardBody>
                            <CardFooter>
                              <Flex spaceItems={{ default: "spaceItemsSm" }}>
                                <FlexItem>
                                  <Icon>
                                    <UserIcon />
                                  </Icon>{" "}
                                  {pkg && (
                                    <Truncate
                                      maxCharsDisplayed={35}
                                      content={
                                        pkg?.info?.author ||
                                        pkg?.info?.author_email ||
                                        pkg?.info?.maintainer_email ||
                                        "Unknown"
                                      }
                                    />
                                  )}
                                </FlexItem>
                                <FlexItem>
                                  <Icon>
                                    <CertificateIcon />
                                  </Icon>{" "}
                                  {pkg && (
                                    <Truncate
                                      maxCharsDisplayed={35}
                                      content={
                                        pkg?.info?.license ||
                                        pkg?.info?.license_expression ||
                                        "Unknown"
                                      }
                                    />
                                  )}
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
                          </>
                        );
                      }}
                    </WithPackage>
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
  );
};
