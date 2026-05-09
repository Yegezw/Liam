import type { TableGroup } from '@liam-hq/schema'
import { useNodes } from '@xyflow/react'
import { useCallback, useMemo } from 'react'
import {
  useSchemaOrThrow,
  useUserEditingOrThrow,
} from '../../../../../../stores'
import { useCustomReactflow } from '../../../../../reactflow/hooks'
import { computeAutoLayout, isTableNode } from '../../../../utils'
import { updateNodesHiddenState } from '../../../ERDContent/utils'

type TableVisibilityStatus = 'all-hidden' | 'all-visible' | 'partially-visible'

export const useTableVisibility = () => {
  const nodes = useNodes()
  const { current, merged } = useSchemaOrThrow()
  const schema = merged ?? current
  const tableNodes = useMemo(
    () => nodes.filter((node) => isTableNode(node)),
    [nodes],
  )
  const visibleTableNodeIds = useMemo(
    () =>
      tableNodes
        .filter((node) => !node.hidden)
        .map((node) => node.id)
        .sort(),
    [tableNodes],
  )
  const visibleTableNames = useMemo(
    () =>
      tableNodes
        .filter((node) => !node.hidden)
        .map((node) => node.data.table.name)
        .sort(),
    [tableNodes],
  )
  const tableGroups = schema.tableGroups ?? []

  const visibilityStatus: TableVisibilityStatus = useMemo(() => {
    if (visibleTableNodeIds.length === 0) {
      return 'all-hidden'
    }
    if (visibleTableNodeIds.length === tableNodes.length) {
      return 'all-visible'
    }

    return 'partially-visible'
  }, [tableNodes.length, visibleTableNodeIds.length])

  const { setHiddenNodeIds, resetSelectedNodeIds } = useUserEditingOrThrow()
  const { getEdges, fitView, setNodes } = useCustomReactflow()

  const updateVisibility = useCallback(
    (hiddenNodeIds: string[]) => {
      const updatedNodes = updateNodesHiddenState({
        nodes,
        hiddenNodeIds,
      })
      setNodes(updatedNodes)
      setHiddenNodeIds(hiddenNodeIds)
    },
    [nodes, setHiddenNodeIds, setNodes],
  )

  const showAllNodes = useCallback(() => {
    resetSelectedNodeIds()
    updateVisibility([])
  }, [resetSelectedNodeIds, updateVisibility])

  const hideAllNodes = useCallback(() => {
    resetSelectedNodeIds()
    updateVisibility(nodes.map((node) => node.id))
  }, [nodes, resetSelectedNodeIds, updateVisibility])

  const applyVisibilityGroup = useCallback(
    async (name: string) => {
      const tableGroup = tableGroups.find((group) => group.name === name)

      if (!tableGroup) {
        return
      }

      const visibleTableNameSet = new Set(tableGroup.tableNames)
      const hiddenNodeIds = tableNodes
        .filter((node) => !visibleTableNameSet.has(node.data.table.name))
        .map((node) => node.id)

      resetSelectedNodeIds()
      const updatedNodes = updateNodesHiddenState({
        nodes,
        hiddenNodeIds,
      })
      setNodes(updatedNodes)
      setHiddenNodeIds(hiddenNodeIds)

      const { nodes: layoutedNodes } = await computeAutoLayout(
        updatedNodes,
        getEdges(),
      )
      setNodes(layoutedNodes)
      fitView()
    },
    [
      fitView,
      getEdges,
      nodes,
      resetSelectedNodeIds,
      setHiddenNodeIds,
      setNodes,
      tableGroups,
      tableNodes,
    ],
  )

  const isTableGroupActive = useCallback(
    (tableGroup: TableGroup) => {
      const normalizedTableNames = [...tableGroup.tableNames].sort()

      if (normalizedTableNames.length !== visibleTableNames.length) {
        return false
      }

      return normalizedTableNames.every(
        (tableName, index) => tableName === visibleTableNames[index],
      )
    },
    [visibleTableNames],
  )

  return {
    visibilityStatus,
    tableGroups,
    showAllNodes,
    hideAllNodes,
    applyVisibilityGroup,
    isTableGroupActive,
  }
}
