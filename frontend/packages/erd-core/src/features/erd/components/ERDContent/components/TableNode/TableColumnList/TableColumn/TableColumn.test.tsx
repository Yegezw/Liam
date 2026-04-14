import { aColumn, aTable } from '@liam-hq/schema'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider, useStoreApi } from '@xyflow/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { type FC, type PropsWithChildren, useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import {
  SchemaProvider,
  UserEditingProvider,
} from '../../../../../../../../stores'
import { TableColumn } from './TableColumn'

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

describe('column comment tooltip', () => {
  it('shows the column comment on hover', async () => {
    const user = userEvent.setup()
    const column = aColumn({
      name: 'email',
      type: 'text',
      comment: 'Email address used for login',
    })
    const table = aTable({
      name: 'users',
      columns: { email: column },
    })

    render(
      <ul>
        <TableColumn
          table={table}
          column={column}
          handleId="users-email"
          isSource={false}
        />
      </ul>,
      { wrapper },
    )

    await user.hover(screen.getByText('email'))

    const tooltip = await screen.findByRole('tooltip', {
      name: 'Email address used for login',
    })

    expect(tooltip).toBeInTheDocument()
    expect(tooltip.parentElement).toHaveStyle({
      transform: `scale(${TEST_ZOOM_LEVEL})`,
    })
  })
})
