import { aSchema } from '@liam-hq/schema'
import { renderHook, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactFlowProvider } from '@xyflow/react'
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing'
import type { ReactNode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import {
  SchemaProvider,
  UserEditingProvider,
} from '../../../../../../../stores'
import { compressToEncodedUriComponent } from '../../../../../../../utils/compressToEncodedUriComponent'
import { useSubscribeTableVisibility } from './useSubscribeTableVisibility'

const onUrlUpdate = vi.fn<() => [UrlUpdateEvent]>()

const wrapper = ({ children }: { children: ReactNode }) => (
  <NuqsTestingAdapter onUrlUpdate={onUrlUpdate}>
    <SchemaProvider current={aSchema()}>
      <ReactFlowProvider
        defaultNodes={[
          {
            id: '1',
            type: 'table',
            data: { table: { name: '1' } },
            position: { x: 0, y: 0 },
            hidden: false,
          },
          {
            id: '2',
            type: 'table',
            data: { table: { name: '2' } },
            position: { x: 0, y: 0 },
            hidden: true,
          },
        ]}
      >
        <UserEditingProvider>{children}</UserEditingProvider>
      </ReactFlowProvider>
    </SchemaProvider>
  </NuqsTestingAdapter>
)

afterEach(() => {
  vi.clearAllMocks()
})

it('hides all table nodes by ⇧H', async () => {
  const user = userEvent.setup()
  renderHook(() => useSubscribeTableVisibility(), { wrapper })

  await user.keyboard('{Shift>}H{/Shift}')

  // hidden query parameter should be added with all node ids
  await waitFor(() => {
    expect(onUrlUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        queryString: `?hidden=${compressToEncodedUriComponent('1,2')}`,
      }),
    )
  })
})

it('shows all table nodes by ⇧A', async () => {
  const user = userEvent.setup()
  renderHook(() => useSubscribeTableVisibility(), { wrapper })

  await user.keyboard('{Shift>}A{/Shift}')

  // hidden query parameter should be added with all node ids
  await waitFor(() => {
    expect(onUrlUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        queryString: '?hidden=',
      }),
    )
  })
})
