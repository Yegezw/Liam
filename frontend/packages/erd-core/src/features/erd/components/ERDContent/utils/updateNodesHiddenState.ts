import type { Node } from '@xyflow/react'
import { NON_RELATED_TABLE_GROUP_NODE_ID } from '../../../constants'

type Params = {
  nodes: Node[]
  hiddenNodeIds: string[]
}

export function updateNodesHiddenState({
  nodes,
  hiddenNodeIds,
}: Params): Node[] {
  const hiddenNodeIdSet = new Set(hiddenNodeIds)
  const shouldHideNonRelatedTableGroupNode = nodes
    .filter((node) => node.parentId === NON_RELATED_TABLE_GROUP_NODE_ID)
    .every((node) => hiddenNodeIdSet.has(node.id))

  return nodes.map((node) => ({
    ...node,
    hidden:
      hiddenNodeIdSet.has(node.id) ||
      (shouldHideNonRelatedTableGroupNode &&
        node.id === NON_RELATED_TABLE_GROUP_NODE_ID),
  }))
}
