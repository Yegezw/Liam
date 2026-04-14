import type { NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import type { FC } from 'react'
import { useUserEditingOrThrow } from '../../../../../../stores'
import type { TableNodeType } from '../../../../types'
import { TableColumnList } from './TableColumnList'
import { TableHeader } from './TableHeader'
import styles from './TableNode.module.css'

type Props = NodeProps<TableNodeType>

export const TableNode: FC<Props> = ({ data }) => {
  const { showMode: _showMode } = useUserEditingOrThrow()
  const showMode = data.showMode ?? _showMode

  return (
    <div
      className={clsx(
        styles.wrapper,
        data.isHighlighted && styles.wrapperHighlighted,
        data.isActiveHighlighted && styles.wrapperActive,
      )}
      data-erd={
        (data.isHighlighted || data.isActiveHighlighted) &&
        'table-node-highlighted'
      }
    >
      <TableHeader data={data} />
      {showMode === 'ALL_FIELDS' && <TableColumnList data={data} />}
      {showMode === 'KEY_ONLY' && (
        <TableColumnList data={data} filter="KEY_ONLY" />
      )}
    </div>
  )
}
