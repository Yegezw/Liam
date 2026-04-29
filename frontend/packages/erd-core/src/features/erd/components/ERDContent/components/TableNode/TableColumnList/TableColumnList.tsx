import { type Column, isPrimaryKey, type Table } from '@liam-hq/schema'
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import { useStore } from '@xyflow/react'
import { type CSSProperties, type FC, type ReactElement, useMemo } from 'react'
import type { TableNodeData } from '../../../../../types'
import { columnHandleId } from '../../../../../utils'
import { groupTableColumns } from '../utils/groupTableColumns'
import { TableColumn } from './TableColumn'
import styles from './TableColumnList.module.css'

type TableColumnListProps = {
  data: TableNodeData
  filter?: 'KEY_ONLY'
}

const shouldDisplayColumn = (
  column: Column,
  table: Table,
  filter: 'KEY_ONLY' | undefined,
  targetColumnCardinalities: TableNodeData['targetColumnCardinalities'],
): boolean => {
  if (filter === 'KEY_ONLY') {
    return (
      isPrimaryKey(column.name, table.constraints) ||
      targetColumnCardinalities?.[column.name] !== undefined
    )
  }
  return true
}

const groupCommentTooltipStyle = {
  maxWidth: 320,
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
} satisfies CSSProperties
const GROUP_COMMENT_TOOLTIP_SIDE_OFFSET = 8

type ColumnGroupLabelProps = {
  name: string
  columnCount: number
}

const ColumnGroupLabel: FC<ColumnGroupLabelProps> = ({ name, columnCount }) => (
  <>
    <span className={styles.groupName}>{name}</span>
    <span className={styles.groupColumnCount}>{columnCount}</span>
  </>
)

type ColumnGroupCommentTooltipProps = {
  comment: string
  children: ReactElement
}

const ColumnGroupCommentTooltip: FC<ColumnGroupCommentTooltipProps> = ({
  comment,
  children,
}) => {
  const zoomLevel = useStore((store) => store.transform[2])
  const tooltipStyle = useMemo<CSSProperties>(
    () => ({
      ...groupCommentTooltipStyle,
      transform: `scale(${zoomLevel})`,
      transformOrigin: 'var(--radix-tooltip-content-transform-origin)',
    }),
    [zoomLevel],
  )

  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipPortal>
          <TooltipContent
            side="right"
            sideOffset={GROUP_COMMENT_TOOLTIP_SIDE_OFFSET * zoomLevel}
            style={tooltipStyle}
          >
            {comment}
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </TooltipProvider>
  )
}

export const TableColumnList: FC<TableColumnListProps> = ({ data, filter }) => {
  const displayedColumns = Object.values(data.table.columns).filter((column) =>
    shouldDisplayColumn(
      column,
      data.table,
      filter,
      data.targetColumnCardinalities,
    ),
  )
  const columnSections = groupTableColumns(data.table, displayedColumns)
  const renderColumn = (column: Column) => {
    const handleId = columnHandleId(data.table.name, column.name)
    const isSource = data.sourceColumnNames?.includes(column.name) ?? false
    const targetColumnCardinalities = data.targetColumnCardinalities

    return (
      <TableColumn
        key={column.name}
        table={data.table}
        column={column}
        handleId={handleId}
        isSource={isSource}
        targetCardinality={targetColumnCardinalities?.[column.name]}
        isHighlightedTable={data.isHighlighted || data.isActiveHighlighted}
      />
    )
  }

  return (
    <ul className={styles.list}>
      {columnSections.map((section) => {
        if (!section.name) {
          return section.columns.map(renderColumn)
        }

        const groupComment = section.comment?.trim()
        const groupHeader: ReactElement = (
          <legend className={styles.groupHeader}>
            <ColumnGroupLabel
              name={section.name}
              columnCount={section.columns.length}
            />
          </legend>
        )

        return (
          <li key={section.id} className={styles.group}>
            <fieldset
              className={styles.groupFieldset}
              aria-label={section.name}
            >
              {groupComment ? (
                <ColumnGroupCommentTooltip comment={groupComment}>
                  {groupHeader}
                </ColumnGroupCommentTooltip>
              ) : (
                groupHeader
              )}
              <ul className={styles.groupColumns}>
                {section.columns.map(renderColumn)}
              </ul>
            </fieldset>
          </li>
        )
      })}
    </ul>
  )
}
