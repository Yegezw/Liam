import {
  Table2,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import { Handle, Position, useStore } from '@xyflow/react'
import clsx from 'clsx'
import {
  type CSSProperties,
  type FC,
  type MouseEvent,
  useMemo,
  useState,
} from 'react'
import { match } from 'ts-pattern'
import {
  useSchemaOrThrow,
  useUserEditingOrThrow,
} from '../../../../../../../stores'
import { DiffIcon } from '../../../../../../diff/components/DiffIcon'
import diffStyles from '../../../../../../diff/styles/Diff.module.css'
import type { TableNodeData } from '../../../../../types'
import { getChangeStatus } from './getChangeStatus'
import styles from './TableHeader.module.css'

type Props = {
  data: TableNodeData
}

const TABLE_HEADER_TOOLTIP_SIDE_OFFSET = 4
const tableHeaderTooltipStyle = {
  maxWidth: 360,
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
} satisfies CSSProperties
const tableCommentTooltipStyle = {
  color: 'var(--tooltip-foreground)',
} satisfies CSSProperties
const tableCommentWithNameTooltipStyle = {
  ...tableCommentTooltipStyle,
  marginTop: 4,
  paddingTop: 4,
  borderTop: '1px solid var(--tooltip-border)',
} satisfies CSSProperties

export const TableHeader: FC<Props> = ({ data }) => {
  const name = data.table.name
  const tableComment = data.table.comment?.trim()
  const [isNameTooltipVisible, setIsNameTooltipVisible] = useState(false)
  const zoomLevel = useStore((store) => store.transform[2])
  const { showMode: _showMode, showDiff } = useUserEditingOrThrow()

  const { operations } = useSchemaOrThrow()
  const showMode = data.showMode ?? _showMode

  const isTarget = data.targetColumnCardinalities !== undefined
  const isSource = data.sourceColumnName !== undefined

  // Only calculate diff-related values when showDiff is true
  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId: name,
      operations: operations ?? [],
    })
  }, [showDiff, name, operations])

  const diffStyle = useMemo(() => {
    if (!showDiff || !changeStatus) return undefined
    return match(changeStatus)
      .with('added', () => diffStyles.addedBg)
      .with('removed', () => diffStyles.removedBg)
      .with('modified', () => diffStyles.modifiedBg)
      .otherwise(() => undefined)
  }, [showDiff, changeStatus])

  const handleHoverEvent = (event: MouseEvent<HTMLSpanElement>) => {
    // Get computed styles to check if text is truncated
    const element = event.currentTarget
    // Create a range to measure the text
    const range = document.createRange()
    range.selectNodeContents(element)

    // Get the text width using getBoundingClientRect
    const textWidth = range.getBoundingClientRect().width
    const containerWidth = element.getBoundingClientRect().width
    const isTruncated = textWidth > containerWidth + 0.018

    setIsNameTooltipVisible(isTruncated)
  }

  const tooltipStyle = useMemo<CSSProperties>(
    () => ({
      ...tableHeaderTooltipStyle,
      transform: `scale(${zoomLevel})`,
      transformOrigin: 'var(--radix-tooltip-content-transform-origin)',
    }),
    [zoomLevel],
  )

  const shouldShowTooltip = isNameTooltipVisible || !!tableComment

  return (
    <div
      className={clsx(
        styles.wrapper,
        showMode === 'TABLE_NAME' && styles.wrapperTableNameMode,
      )}
    >
      {showDiff && changeStatus && (
        <div
          className={clsx(
            styles.diffBox,
            showMode === 'TABLE_NAME' && styles.diffBoxTableNameMode,
            diffStyle,
          )}
        >
          <DiffIcon changeStatus={changeStatus} />
        </div>
      )}

      <div
        className={clsx(
          styles.container,
          showMode === 'TABLE_NAME' && styles.containerTableNameMode,
          showDiff && styles.containerDiffView,
          showDiff && diffStyle,
        )}
      >
        <Table2 className={styles.tableIcon} />

        <TooltipProvider>
          <TooltipRoot>
            <TooltipTrigger asChild>
              <span className={styles.name} onMouseEnter={handleHoverEvent}>
                {name}
              </span>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent
                side="top"
                sideOffset={TABLE_HEADER_TOOLTIP_SIDE_OFFSET * zoomLevel}
                hidden={!shouldShowTooltip}
                style={tooltipStyle}
              >
                {isNameTooltipVisible && <div>{name}</div>}
                {tableComment && (
                  <div
                    style={
                      isNameTooltipVisible
                        ? tableCommentWithNameTooltipStyle
                        : tableCommentTooltipStyle
                    }
                  >
                    {tableComment}
                  </div>
                )}
              </TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
        </TooltipProvider>

        {showMode === 'TABLE_NAME' && (
          <>
            {isTarget && (
              <Handle
                id={name}
                type="target"
                position={Position.Left}
                className={styles.handle}
              />
            )}
            {isSource && (
              <Handle
                id={name}
                type="source"
                position={Position.Right}
                className={styles.handle}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
