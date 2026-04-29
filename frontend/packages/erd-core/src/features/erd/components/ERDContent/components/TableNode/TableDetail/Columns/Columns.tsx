import type { Table } from '@liam-hq/schema'
import { Rows3 as Rows3Icon } from '@liam-hq/ui'
import type { FC } from 'react'
import { groupTableColumns } from '../../utils/groupTableColumns'
import { CollapsibleHeader } from '../CollapsibleHeader'
import styles from './Columns.module.css'
import { ColumnsItem } from './ColumnsItem'

type Props = {
  table: Table
}

export const Columns: FC<Props> = ({ table }) => {
  const columnSections = groupTableColumns(table)
  const groupHeaderCount = columnSections.filter(
    (section) => section.name,
  ).length
  // NOTE: 300px is the height of one item in the list(when comments are lengthy)
  const contentMaxHeight =
    Object.keys(table.columns).length * 300 + groupHeaderCount * 80
  const renderColumn = (column: Table['columns'][string]) => (
    <ColumnsItem
      key={column.name}
      tableId={table.name}
      column={column}
      constraints={table.constraints}
    />
  )

  return (
    <CollapsibleHeader
      title="Columns"
      icon={<Rows3Icon width={12} />}
      isContentVisible={true}
      stickyTopHeight={0}
      contentMaxHeight={contentMaxHeight}
    >
      {columnSections.map((section) => {
        if (!section.name) {
          return section.columns.map(renderColumn)
        }

        return (
          <fieldset
            key={section.id}
            className={styles.group}
            aria-label={section.name}
          >
            <legend className={styles.groupHeader}>
              <span className={styles.groupTitle}>{section.name}</span>
              {section.comment && (
                <p className={styles.groupComment}>{section.comment}</p>
              )}
            </legend>
            {section.columns.map(renderColumn)}
          </fieldset>
        )
      })}
    </CollapsibleHeader>
  )
}
