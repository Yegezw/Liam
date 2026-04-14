import {
  type Cardinality as CardinalityType,
  type Column,
  isPrimaryKey,
  type Table,
} from '@liam-hq/schema'
import {
  DiamondFillIcon,
  DiamondIcon,
  KeyRound,
  Link,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import { Handle, Position, useStore } from '@xyflow/react'
import clsx from 'clsx'
import { type CSSProperties, type FC, type ReactElement, useMemo } from 'react'
import { match } from 'ts-pattern'
import {
  useSchemaOrThrow,
  useUserEditingOrThrow,
} from '../../../../../../../../stores'
import { DiffIcon } from '../../../../../../../diff/components/DiffIcon'
import diffStyles from '../../../../../../../diff/styles/Diff.module.css'
import { getChangeStatus } from './getChangeStatus'
import styles from './TableColumn.module.css'

type TableColumnProps = {
  table: Table
  column: Column
  handleId: string
  isSource: boolean
  targetCardinality?: CardinalityType | undefined
  isHighlightedTable?: boolean
}

type ColumnIconProps = {
  table: Table
  column: Column
  isSource: boolean
  targetCardinality?: CardinalityType | undefined
}

const columnCommentTooltipStyle = {
  maxWidth: 320,
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
} satisfies CSSProperties
const COLUMN_COMMENT_TOOLTIP_SIDE_OFFSET = 8

type TableColumnCommentTooltipProps = {
  comment: string
  children: ReactElement
}

const TableColumnCommentTooltip: FC<TableColumnCommentTooltipProps> = ({
  comment,
  children,
}) => {
  const zoomLevel = useStore((store) => store.transform[2])
  const tooltipStyle = useMemo<CSSProperties>(
    () => ({
      ...columnCommentTooltipStyle,
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
            sideOffset={COLUMN_COMMENT_TOOLTIP_SIDE_OFFSET * zoomLevel}
            style={tooltipStyle}
          >
            {comment}
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </TooltipProvider>
  )
}

const ColumnIcon: FC<ColumnIconProps> = ({
  table,
  column,
  isSource,
  targetCardinality,
}) => {
  if (isPrimaryKey(column.name, table.constraints)) {
    return (
      <KeyRound
        width={16}
        height={16}
        className={styles.primaryKeyIcon}
        role="img"
        aria-label="Primary Key"
        strokeWidth={1.5}
      />
    )
  }

  if (isSource || targetCardinality) {
    return (
      <Link
        width={16}
        height={16}
        className={styles.linkIcon}
        role="img"
        aria-label="Foreign Key"
        strokeWidth={1.5}
      />
    )
  }

  if (column.notNull) {
    return (
      <DiamondFillIcon
        width={16}
        height={16}
        className={styles.diamondIcon}
        role="img"
        aria-label="Not Null"
      />
    )
  }

  return (
    <DiamondIcon
      width={16}
      height={16}
      className={styles.diamondIcon}
      role="img"
      aria-label="Nullable"
    />
  )
}

export const TableColumn: FC<TableColumnProps> = ({
  table,
  column,
  handleId,
  isSource,
  targetCardinality,
  isHighlightedTable,
}) => {
  const { showDiff } = useUserEditingOrThrow()
  const { operations } = useSchemaOrThrow()

  // Only calculate diff-related values when showDiff is true
  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId: table.name,
      columnId: column.name,
      operations: operations ?? [],
    })
  }, [showDiff, table.name, column.name, operations])

  const diffStyle = useMemo(() => {
    if (!showDiff || !changeStatus) return undefined
    return match(changeStatus)
      .with('added', () => diffStyles.addedBg)
      .with('removed', () => diffStyles.removedBg)
      .with('modified', () => diffStyles.modifiedBg)
      .otherwise(() => undefined)
  }, [showDiff, changeStatus])

  const shouldHighlight =
    isHighlightedTable && (isSource || !!targetCardinality)

  const columnComment = column.comment?.trim()

  const columnItem = (
    <li
      className={clsx(
        styles.wrapper,
        showDiff && styles.wrapperWithDiff,
        shouldHighlight && styles.highlightRelatedColumn,
      )}
    >
      {showDiff && changeStatus && (
        <div className={clsx(styles.diffBox, diffStyle)}>
          <DiffIcon changeStatus={changeStatus} />
        </div>
      )}

      <div
        key={column.name}
        className={clsx(styles.columnWrapper, showDiff && diffStyle)}
      >
        <ColumnIcon
          table={table}
          column={column}
          isSource={isSource}
          targetCardinality={targetCardinality}
        />

        <span className={styles.columnNameWrapper}>
          <span>{column.name}</span>
          <span className={styles.columnType}>{column.type}</span>
        </span>

        {isSource && (
          <Handle
            id={handleId}
            type="source"
            position={Position.Right}
            className={styles.handle}
          />
        )}

        {targetCardinality && (
          <Handle
            id={handleId}
            type="target"
            position={Position.Left}
            className={clsx(styles.handle, showDiff && styles.handleWithDiff)}
          />
        )}
      </div>
    </li>
  )

  if (!columnComment) {
    return columnItem
  }

  return (
    <TableColumnCommentTooltip comment={columnComment}>
      {columnItem}
    </TableColumnCommentTooltip>
  )
}
