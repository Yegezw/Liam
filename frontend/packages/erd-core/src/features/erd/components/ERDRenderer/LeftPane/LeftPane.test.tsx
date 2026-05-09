import { aSchema } from '@liam-hq/schema'
import { SidebarProvider, ToastProvider } from '@liam-hq/ui'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Node, ReactFlowProvider } from '@xyflow/react'
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing'
import type { FC, PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VersionProvider } from '../../../../../providers'
import { SchemaProvider, UserEditingProvider } from '../../../../../stores'
import { compressToEncodedUriComponent } from '../../../../../utils/compressToEncodedUriComponent'
import { LeftPane } from './LeftPane'

const mockDefaultNodes = vi.fn<() => Node[]>()
const mockSchema = vi.fn(() => aSchema())
const onUrlUpdate = vi.fn<() => [UrlUpdateEvent]>()
const mockVersion = {
  version: '0.0.0',
  gitHash: 'abcdefg',
  envName: 'test',
  date: '2026-05-09',
  displayedOn: 'web',
} as const

const wrapper: FC<PropsWithChildren> = ({ children }) => (
  <NuqsTestingAdapter onUrlUpdate={onUrlUpdate}>
    <ReactFlowProvider defaultNodes={mockDefaultNodes()}>
      <SchemaProvider current={mockSchema()}>
        <UserEditingProvider>
          <VersionProvider version={mockVersion}>
            <ToastProvider>
              <SidebarProvider open>{children}</SidebarProvider>
            </ToastProvider>
          </VersionProvider>
        </UserEditingProvider>
      </SchemaProvider>
    </ReactFlowProvider>
  </NuqsTestingAdapter>
)

beforeEach(() => {
  mockDefaultNodes.mockReset()
  mockSchema.mockReset()
  mockSchema.mockReturnValue(aSchema())
  onUrlUpdate.mockReset()
})

describe('LeftPane table groups', () => {
  it('shows preset groups and reapplies a selected group', async () => {
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
      {
        id: 'accounts',
        type: 'table',
        data: { table: { name: 'accounts' } },
        position: { x: 0, y: 0 },
        hidden: false,
      },
      {
        id: 'users',
        type: 'table',
        data: { table: { name: 'users' } },
        position: { x: 0, y: 0 },
        hidden: true,
      },
      {
        id: 'orders',
        type: 'table',
        data: { table: { name: 'orders' } },
        position: { x: 0, y: 0 },
        hidden: false,
      },
    ])

    render(<LeftPane />, { wrapper })

    const user = userEvent.setup()

    expect(
      screen.getByRole('button', { name: /^Core Tables \(2 tables\)$/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Save Current' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Table Groups')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show All Tables' }))
    await user.click(
      screen.getByRole('button', { name: /^Core Tables \(2 tables\)$/i }),
    )

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
})
