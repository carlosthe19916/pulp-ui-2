import type React from "react";
import { useEffect, useState } from "react";

import BookIcon from "@patternfly/react-icons/dist/esm/icons/book-icon";
import CloudDownloadAltIcon from "@patternfly/react-icons/dist/esm/icons/cloud-download-alt-icon";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";
import EllipsisHIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-h-icon";
import GlobeIcon from "@patternfly/react-icons/dist/esm/icons/globe-icon";
import LockIcon from "@patternfly/react-icons/dist/esm/icons/lock-icon";
import TagIcon from "@patternfly/react-icons/dist/esm/icons/tag-icon";
import {
  action,
  createTopologyControlButtons,
  DagreLayout,
  defaultControlButtonsOptions,
  DefaultEdge,
  DefaultNode,
  type EdgeModel,
  type Graph,
  GRAPH_LAYOUT_END_EVENT,
  GraphComponent,
  type GraphElement,
  LEFT_TO_RIGHT,
  type Model,
  ModelKind,
  type Node,
  type NodeModel,
  NodeStatus,
  observer,
  Point,
  SELECTION_EVENT,
  TopologyControlBar,
  TopologyView,
  Visualization,
  VisualizationProvider,
  VisualizationSurface,
  withPanZoom,
  withSelection,
  type WithSelectionProps,
} from "@patternfly/react-topology";

import {
  type ITopologyNodeData,
  TOPOLOGY_NODE_SIZE,
  type TopologyNodeKind,
} from "./buildRepositoryGraph";

const ICON_SIZE = 25;
const FIT_PADDING = 80;
// Below this, labels are unreadable: zoom in and let the user pan instead.
const MIN_READABLE_SCALE = 0.8;

const ICON_BY_KIND: Record<
  TopologyNodeKind,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  remote: CloudDownloadAltIcon,
  repository: CubesIcon,
  version: TagIcon,
  publication: BookIcon,
  distribution: GlobeIcon,
};

interface ITopologyNodeProps extends WithSelectionProps {
  // The factory contract types every element generically.
  element: GraphElement;
}

const TopologyNode: React.FC<ITopologyNodeProps> = observer(
  ({ element, selected, onSelect }: ITopologyNodeProps) => {
    const data = element.getData() as ITopologyNodeData;
    const Icon = data.isMore ? EllipsisHIcon : ICON_BY_KIND[data.kind];
    const offset = (TOPOLOGY_NODE_SIZE - ICON_SIZE) / 2;
    return (
      <DefaultNode
        element={element as Node}
        selected={selected}
        onSelect={onSelect}
        secondaryLabel={data.secondaryLabel}
        truncateLength={24}
        labelIcon={data.isGuarded ? <LockIcon title="Guarded" /> : undefined}
        nodeStatus={data.isRunning ? NodeStatus.info : undefined}
        showStatusDecorator={data.isRunning}
      >
        <g transform={`translate(${offset}, ${offset})`}>
          <Icon width={ICON_SIZE} height={ICON_SIZE} />
        </g>
      </DefaultNode>
    );
  },
);

/** Fits the graph, but never below a readable scale; the chain's start stays in view. */
const fitReadable = (graph: Graph) => {
  graph.fit(FIT_PADDING);
  const scale = graph.getScale();
  if (scale >= MIN_READABLE_SCALE) return;
  const left = Math.min(...graph.getNodes().map((node) => node.getBounds().x));
  const { height } = graph.getDimensions();
  graph.scaleBy(MIN_READABLE_SCALE / scale, new Point(0, height / 2));
  graph.setPosition(
    new Point(FIT_PADDING - left * graph.getScale(), graph.getBounds().y),
  );
};

const GRAPH: Model["graph"] = {
  id: "repository-topology",
  type: "graph",
  layout: "Dagre",
};

const createController = () => {
  const controller = new Visualization();
  controller.registerLayoutFactory(
    (_type, graph) =>
      new DagreLayout(graph, {
        rankdir: LEFT_TO_RIGHT,
        // The default tight-tree ranker pushes leaves to the last column.
        ranker: "network-simplex",
        nodesep: 40,
        ranksep: 80,
      }),
  );
  controller.registerComponentFactory((kind) => {
    switch (kind) {
      case ModelKind.graph:
        return withPanZoom()(GraphComponent);
      case ModelKind.node:
        return withSelection()(TopologyNode);
      case ModelKind.edge:
        return DefaultEdge;
      default:
        return undefined;
    }
  });
  controller.addEventListener(
    GRAPH_LAYOUT_END_EVENT,
    action(() => fitReadable(controller.getGraph())),
  );
  return controller;
};

interface IRepositoryTopologyViewProps {
  nodes: NodeModel[];
  edges: EdgeModel[];
  onNodeSelect: (data: ITopologyNodeData) => void;
}

/** Read-only, left-to-right graph of the repository's serving chain. */
export const RepositoryTopologyView: React.FC<IRepositoryTopologyViewProps> = ({
  nodes,
  edges,
  onNodeSelect,
}) => {
  const [controller] = useState(createController);
  // Keyed by content, not identity: each re-layout also re-fits and resets the zoom.
  const modelKey = JSON.stringify({ nodes, edges });

  useEffect(() => {
    const model = JSON.parse(modelKey) as Pick<Model, "nodes" | "edges">;
    controller.fromModel({ graph: GRAPH, ...model }, false);
  }, [controller, modelKey]);

  useEffect(() => {
    const listener = ([id]: string[]) => {
      const data = id ? controller.getNodeById(id)?.getData() : undefined;
      if (data) onNodeSelect(data as ITopologyNodeData);
    };
    controller.addEventListener(SELECTION_EVENT, listener);
    return () => {
      controller.removeEventListener(SELECTION_EVENT, listener);
    };
  }, [controller, onNodeSelect]);

  return (
    <VisualizationProvider controller={controller}>
      <TopologyView
        controlBar={
          <TopologyControlBar
            controlButtons={createTopologyControlButtons({
              ...defaultControlButtonsOptions,
              zoomInCallback: action(() =>
                controller.getGraph().scaleBy(4 / 3),
              ),
              zoomOutCallback: action(() =>
                controller.getGraph().scaleBy(0.75),
              ),
              fitToScreenCallback: action(() =>
                controller.getGraph().fit(FIT_PADDING),
              ),
              resetViewCallback: action(() => {
                controller.getGraph().reset();
                controller.getGraph().layout();
              }),
              legend: false,
            })}
          />
        }
      >
        <VisualizationSurface />
      </TopologyView>
    </VisualizationProvider>
  );
};
