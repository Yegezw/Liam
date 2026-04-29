import type { Column, Table } from '@liam-hq/schema'

export const UNGROUPED_COLUMN_GROUP_NAME = 'Other columns'

export type ColumnGroupSection = {
  id: string
  name: string | null
  comment: string | null
  columns: Column[]
}

const ALL_COLUMNS_SECTION_ID = '__all_columns__'
const UNGROUPED_COLUMNS_SECTION_ID = '__ungrouped_columns__'

export const groupTableColumns = (
  table: Table,
  columns = Object.values(table.columns),
): ColumnGroupSection[] => {
  const columnGroups = table.columnGroups ?? []

  if (columnGroups.length === 0) {
    return [
      {
        id: ALL_COLUMNS_SECTION_ID,
        name: null,
        comment: null,
        columns,
      },
    ]
  }

  const visibleColumnsByName = new Map(
    columns.map((column) => [column.name, column]),
  )
  const usedColumnNames = new Set<string>()
  const groupedSections = columnGroups.flatMap((group, index) => {
    const groupColumns = group.columnNames.flatMap((columnName) => {
      const column = visibleColumnsByName.get(columnName)

      if (!column || usedColumnNames.has(column.name)) {
        return []
      }

      usedColumnNames.add(column.name)
      return [column]
    })

    if (groupColumns.length === 0) {
      return []
    }

    return [
      {
        id: `group-${index}`,
        name: group.name,
        comment: group.comment,
        columns: groupColumns,
      },
    ]
  })

  const ungroupedColumns = columns.filter(
    (column) => !usedColumnNames.has(column.name),
  )

  if (ungroupedColumns.length === 0) {
    return groupedSections
  }

  return [
    ...groupedSections,
    {
      id: UNGROUPED_COLUMNS_SECTION_ID,
      name: UNGROUPED_COLUMN_GROUP_NAME,
      comment: null,
      columns: ungroupedColumns,
    },
  ]
}
