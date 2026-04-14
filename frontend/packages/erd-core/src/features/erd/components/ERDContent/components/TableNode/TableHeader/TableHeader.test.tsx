import { aTable } from '@liam-hq/schema'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider, useStoreApi } from '@xyflow/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { type FC, type PropsWithChildren, useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SchemaProvider,
  UserEditingProvider,
} from '../../../../../../../stores'
import type { TableNodeData } from '../../../../../types'
import { TableHeader } from './TableHeader'

const TEST_ZOOM_LEVEL = 2

const ReactFlowZoom: FC = () => {
  const store = useStoreApi()

  useEffect(() => {
    store.setState({ transform: [0, 0, TEST_ZOOM_LEVEL] })
  }, [store])

  return null
}

const wrapper: FC<PropsWithChildren> = ({ children }) => (
  <NuqsTestingAdapter>
    <SchemaProvider current={{ enums: {}, extensions: {}, tables: {} }}>
      <UserEditingProvider>
        <ReactFlowProvider>
          <ReactFlowZoom />
          {children}
        </ReactFlowProvider>
      </UserEditingProvider>
    </SchemaProvider>
  </NuqsTestingAdapter>
)

const tableNodeData = (
  override: Partial<TableNodeData> = {},
): TableNodeData => ({
  table: aTable({ name: 'users' }),
  isActiveHighlighted: false,
  isHighlighted: false,
  isTooltipVisible: false,
  sourceColumnName: undefined,
  targetColumnCardinalities: undefined,
  showMode: 'ALL_FIELDS',
  ...override,
})

const rect = (width: number): DOMRect => new DOMRect(0, 0, width, 0)

const mockTruncatedTableName = () => {
  const range = document.createRange()
  vi.spyOn(range, 'selectNodeContents').mockImplementation(() => {})
  vi.spyOn(range, 'getBoundingClientRect').mockReturnValue(rect(200))
  vi.spyOn(document, 'createRange').mockReturnValue(range)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    rect(100),
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('table header tooltip', () => {
  it('shows the table comment on hover and scales it with ER zoom', async () => {
    const user = userEvent.setup()
    render(
      <TableHeader
        data={tableNodeData({
          table: aTable({
            name: 'users',
            comment: 'Stores registered users',
          }),
        })}
      />,
      { wrapper },
    )

    await user.hover(screen.getByText('users'))

    const tooltip = await screen.findByRole('tooltip', {
      name: 'Stores registered users',
    })
    expect(tooltip).toBeInTheDocument()
    expect(tooltip.parentElement).toHaveStyle({
      transform: `scale(${TEST_ZOOM_LEVEL})`,
    })
  })

  it('shows the full table name when truncated and scales it with ER zoom', async () => {
    mockTruncatedTableName()
    const user = userEvent.setup()
    const tableName = 'very_long_table_name_for_tooltip'

    render(
      <TableHeader
        data={tableNodeData({
          table: aTable({
            name: tableName,
            comment: null,
          }),
        })}
      />,
      { wrapper },
    )

    await user.hover(screen.getByText(tableName))

    const tooltip = await screen.findByRole('tooltip', { name: tableName })
    expect(tooltip).toBeInTheDocument()
    expect(tooltip.parentElement).toHaveStyle({
      transform: `scale(${TEST_ZOOM_LEVEL})`,
    })
  })
})
