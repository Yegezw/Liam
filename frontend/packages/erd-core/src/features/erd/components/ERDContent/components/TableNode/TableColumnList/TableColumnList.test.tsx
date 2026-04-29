import { aColumn, aTable } from '@liam-hq/schema'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider, useStoreApi } from '@xyflow/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { type FC, type PropsWithChildren, useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import {
  SchemaProvider,
  UserEditingProvider,
} from '../../../../../../../stores'
import type { TableNodeData } from '../../../../../types'
import { TableColumnList } from './TableColumnList'

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

const table = aTable({
  name: 'users',
  columns: {
    id: aColumn({ name: 'id', type: 'integer' }),
    email: aColumn({ name: 'email', type: 'text' }),
    created_at: aColumn({ name: 'created_at', type: 'timestamp' }),
    display_name: aColumn({ name: 'display_name', type: 'text' }),
  },
  columnGroups: [
    {
      name: 'Identity',
      columnNames: ['id', 'email'],
      comment: 'Primary login columns',
    },
    {
      name: 'Audit',
      columnNames: ['created_at'],
      comment: null,
    },
  ],
})

const data: TableNodeData = {
  table,
  isActiveHighlighted: false,
  isHighlighted: false,
  isTooltipVisible: false,
  sourceColumnNames: undefined,
  targetColumnCardinalities: undefined,
}

describe('column groups', () => {
  it('renders grouped columns with group labels', () => {
    render(<TableColumnList data={data} />, { wrapper })

    const identityGroup = screen.getByRole('group', { name: 'Identity' })
    const auditGroup = screen.getByRole('group', { name: 'Audit' })
    const ungroupedGroup = screen.getByRole('group', { name: 'Other columns' })

    expect(within(identityGroup).getByText('id')).toBeInTheDocument()
    expect(within(identityGroup).getByText('email')).toBeInTheDocument()
    expect(within(identityGroup).getByText('2')).toBeInTheDocument()
    expect(within(auditGroup).getByText('created_at')).toBeInTheDocument()
    expect(within(auditGroup).getByText('1')).toBeInTheDocument()
    expect(within(ungroupedGroup).getByText('display_name')).toBeInTheDocument()
  })

  it('shows the group comment on header hover and scales it with ER zoom', async () => {
    const user = userEvent.setup()

    render(<TableColumnList data={data} />, { wrapper })

    await user.hover(screen.getByText('email'))

    await expect(
      screen.findByRole(
        'tooltip',
        { name: 'Primary login columns' },
        { timeout: 300 },
      ),
    ).rejects.toThrow()

    await user.unhover(screen.getByText('email'))

    await user.hover(screen.getByText('Identity'))

    const tooltip = await screen.findByRole('tooltip', {
      name: 'Primary login columns',
    })

    expect(tooltip).toBeInTheDocument()
    expect(tooltip.parentElement).toHaveStyle({
      transform: `scale(${TEST_ZOOM_LEVEL})`,
    })
  })
})
