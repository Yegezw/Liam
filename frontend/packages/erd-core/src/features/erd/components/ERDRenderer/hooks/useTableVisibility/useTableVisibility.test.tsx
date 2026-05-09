import { aSchema } from '@liam-hq/schema'
import { act, renderHook, waitFor } from '@testing-library/react'
import { type Node, ReactFlowProvider, useNodes } from '@xyflow/react'
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NON_RELATED_TABLE_GROUP_NODE_ID } from '../../../../constants'
import { SchemaProvider, UserEditingProvider } from '../../../../../../stores'
import { compressToEncodedUriComponent } from '../../../../../../utils/compressToEncodedUriComponent'
import { useTableVisibility } from './useTableVisibility'

const { mockComputeAutoLayout } = vi.hoisted(() => ({
  mockComputeAutoLayout: vi.fn(async (nodes, edges) => ({ nodes, edges })),
}))

vi.mock('../../../../utils', async () => {
  const actual = await vi.importActual('../../../../utils')
  return {
    ...actual,
    computeAutoLayout: mockComputeAutoLayout,
  }
})

const mockDefaultNodes = vi.fn<() => Node[]>()
const mockSchema = vi.fn(() => aSchema())
const onUrlUpdate = vi.fn<() => [UrlUpdateEvent]>()

const createTableNode = ({
  id,
  hidden,
}: {
  id: string
  hidden: boolean
}): Node => ({
  id,
  type: 'table',
  data: { table: { name: id } },
  position: { x: 0, y: 0 },
  hidden,
})

const createNonRelatedTableGroupNode = ({
  hidden,
}: {
  hidden: boolean
}): Node => ({
  id: NON_RELATED_TABLE_GROUP_NODE_ID,
  type: 'nonRelatedTableGroup',
  data: {},
  position: { x: 0, y: 0 },
  hidden,
})

const wrapper = ({ children }: { children: ReactNode }) => (
  <NuqsTestingAdapter onUrlUpdate={onUrlUpdate}>
    <ReactFlowProvider defaultNodes={mockDefaultNodes()}>
      <SchemaProvider current={mockSchema()}>
        <UserEditingProvider>{children}</UserEditingProvider>
      </SchemaProvider>
    </ReactFlowProvider>
  </NuqsTestingAdapter>
)

beforeEach(() => {
  mockDefaultNodes.mockReset()
  mockSchema.mockReset()
  mockSchema.mockReturnValue(aSchema())
  onUrlUpdate.mockReset()
  mockComputeAutoLayout.mockClear()
})

describe('visibilityStatus', () => {
  it('should be "all-hidden" when all table nodes are hidden', () => {
    mockDefaultNodes.mockReturnValueOnce([
      createTableNode({ id: '1', hidden: true }),
      createTableNode({ id: '2', hidden: true }),
    ])

    const { result } = renderHook(() => useTableVisibility(), { wrapper })

    expect(result.current.visibilityStatus).toBe('all-hidden')
  })

  it('should be "all-visible" when all table nodes are visible', () => {
    mockDefaultNodes.mockReturnValueOnce([
      createTableNode({ id: '1', hidden: false }),
      createTableNode({ id: '2', hidden: false }),
    ])

    const { result } = renderHook(() => useTableVisibility(), { wrapper })

    expect(result.current.visibilityStatus).toBe('all-visible')
  })

  it('should be "partially-visible" when some table nodes are hidden and the others are visible', () => {
    mockDefaultNodes.mockReturnValueOnce([
      createTableNode({ id: '1', hidden: true }),
      createTableNode({ id: '2', hidden: false }),
    ])

    const { result } = renderHook(() => useTableVisibility(), { wrapper })

    expect(result.current.visibilityStatus).toBe('partially-visible')
  })
})

describe('showAllNodes', () => {
  it('should make all nodes visible', async () => {
    mockDefaultNodes.mockReturnValueOnce([
      createTableNode({ id: '1', hidden: true }),
      createTableNode({ id: '2', hidden: false }),
    ])

    const { result } = renderHook(() => useTableVisibility(), { wrapper })

    expect(result.current.visibilityStatus).toBe('partially-visible')
    act(() => result.current.showAllNodes())

    expect(result.current.visibilityStatus).toBe('all-visible')
    // hidden query parameter should be removed
    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ queryString: '?hidden=' }),
      )
    })
  })
})

describe('hideAllNodes', () => {
  it('should make all nodes hidden', async () => {
    mockDefaultNodes.mockReturnValueOnce([
      createTableNode({ id: '1', hidden: true }),
      createTableNode({ id: '2', hidden: false }),
    ])

    const { result } = renderHook(() => useTableVisibility(), { wrapper })

    expect(result.current.visibilityStatus).toBe('partially-visible')
    act(() => result.current.hideAllNodes())

    expect(result.current.visibilityStatus).toBe('all-hidden')
    // hidden query parameter should be added with all node ids
    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          queryString: `?hidden=${compressToEncodedUriComponent('1,2')}`,
        }),
      )
    })
  })
})

describe('table groups', () => {
  it('returns preset table groups from schema', () => {
    mockSchema.mockReturnValueOnce(
      aSchema({
        tableGroups: [
          {
            name: 'Core Tables',
            tableNames: ['accounts', 'orders'],
            comment: 'Primary operational flow',
          },
        ],
      }),
    )

    const { result } = renderHook(() => useTableVisibility(), { wrapper })

    expect(result.current.tableGroups).toEqual([
      {
        name: 'Core Tables',
        tableNames: ['accounts', 'orders'],
        comment: 'Primary operational flow',
      },
    ])
  })

  it('applies a preset table group by hiding tables outside the preset', async () => {
    mockSchema.mockReturnValueOnce(
      aSchema({
        tableGroups: [
          {
            name: 'Core Tables',
            tableNames: ['accounts', 'orders'],
            comment: 'Primary operational flow',
          },
        ],
      }),
    )

    mockDefaultNodes.mockReturnValueOnce([
      createTableNode({ id: 'accounts', hidden: false }),
      createTableNode({ id: 'users', hidden: true }),
      createTableNode({ id: 'orders', hidden: false }),
    ])

    const { result } = renderHook(() => useTableVisibility(), { wrapper })

    act(() => result.current.showAllNodes())
    await act(async () => {
      await result.current.applyVisibilityGroup('Core Tables')
    })

    expect(result.current.visibilityStatus).toBe('partially-visible')
    const [tableGroup] = result.current.tableGroups
    if (!tableGroup) {
      throw new Error('Expected a preset table group')
    }
    expect(result.current.isTableGroupActive(tableGroup)).toBe(true)
    expect(mockComputeAutoLayout).toHaveBeenCalledTimes(1)

    await waitFor(() => {
      expect(onUrlUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          queryString: expect.stringContaining(
            `hidden=${compressToEncodedUriComponent('users')}`,
          ),
        }),
      )
    })
  })

  it('keeps the non-related table group visible when the selected preset contains orphan tables', async () => {
    mockSchema.mockReturnValueOnce(
      aSchema({
        tableGroups: [
          {
            name: 'Orphan Tables',
            tableNames: ['isolated_table'],
            comment: 'Tables without relationships',
          },
        ],
      }),
    )

    mockDefaultNodes.mockReturnValueOnce([
      createNonRelatedTableGroupNode({ hidden: false }),
      {
        ...createTableNode({ id: 'isolated_table', hidden: false }),
        parentId: NON_RELATED_TABLE_GROUP_NODE_ID,
      },
      createTableNode({ id: 'users', hidden: false }),
    ])

    const { result } = renderHook(
      () => ({
        visibility: useTableVisibility(),
        nodes: useNodes(),
      }),
      { wrapper },
    )

    await act(async () => {
      await result.current.visibility.applyVisibilityGroup('Orphan Tables')
    })

    expect(
      result.current.nodes.find(
        (node) => node.id === NON_RELATED_TABLE_GROUP_NODE_ID,
      )?.hidden,
    ).toBe(false)
    expect(
      result.current.nodes.find((node) => node.id === 'isolated_table')?.hidden,
    ).toBe(false)
    expect(
      result.current.nodes.find((node) => node.id === 'users')?.hidden,
    ).toBe(true)
  })
})
