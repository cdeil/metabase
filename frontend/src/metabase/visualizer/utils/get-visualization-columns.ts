import type { Dataset, DatasetColumn } from "metabase-types/api";
import type {
  VisualizerDataSource,
  VisualizerDataSourceId,
  VisualizerEntity,
} from "metabase-types/store/visualizer";

import {
  createDimensionColumn,
  createMetricColumn,
  isScalarFunnel,
} from "../visualizations/funnel";

import { copyColumn } from "./column";

/**
 * Creates visualization columns for a visualizer entity.
 * @param visualizerEntity The visualizer entity.
 * @param datasets The datasets by data source id.
 * @param dataSources The visualizer data sources.
 * @returns The visualization columns.
 */
export const getVisualizationColumns = (
  visualizerEntity: VisualizerEntity,
  datasets: Record<VisualizerDataSourceId, Dataset | null | undefined>,
  dataSources: VisualizerDataSource[],
): DatasetColumn[] => {
  const { columnValuesMapping, settings } = visualizerEntity;

  // Scalar funnel uses pre-defined metric and dimension columns
  if (isScalarFunnel(visualizerEntity)) {
    const [mainDataSource] = dataSources;
    const mainDataset = datasets[mainDataSource.id];

    const metricColumnName = settings["funnel.metric"];
    const dimensionColumnName = settings["funnel.dimension"];

    return [
      createMetricColumn(metricColumnName, mainDataset?.data.cols[0].base_type),
      createDimensionColumn(dimensionColumnName),
    ];
  }

  const visualizationColumns: DatasetColumn[] = [];
  // For all other chart types, create visualization columns from column mappings
  Object.entries(columnValuesMapping).forEach(
    ([_visualizationColumnName, columnMappings]) => {
      columnMappings.forEach((columnMapping) => {
        if (typeof columnMapping !== "string") {
          const datasetColumn = datasets[
            columnMapping.sourceId
          ]?.data.cols.find((col) => col.name === columnMapping.originalName);

          const dataSource = dataSources.find(
            (dataSource) => dataSource.id === columnMapping.sourceId,
          );

          if (!datasetColumn || !dataSource) {
            console.warn(
              `Could not find dataset column or data source for mapping ${JSON.stringify(columnMapping)}`,
            );
            return;
          }

          const visualizationColumn = copyColumn(
            columnMapping.name,
            datasetColumn,
            dataSource.name,
            visualizationColumns,
          );

          visualizationColumns.push(visualizationColumn);
        }
      });
    },
  );

  return visualizationColumns;
};
