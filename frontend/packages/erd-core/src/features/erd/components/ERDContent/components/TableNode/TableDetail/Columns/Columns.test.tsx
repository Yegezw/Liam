import { aColumn, aTable } from '@liam-hq/schema'
import { render, screen, within } from '@testing-library/react'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import type { FC, PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'
import {
  SchemaProvider,
  UserEditingProvider,
} from '../../../../../../../../stores'
import { Columns } from './Columns'

const wrapper: FC<PropsWithChildren> = ({ children }) => (
  <NuqsTestingAdapter>
    <SchemaProvider current={{ enums: {}, extensions: {}, tables: {} }}>
      <UserEditingProvider>{children}</UserEditingProvider>
    </SchemaProvider>
  </NuqsTestingAdapter>
)

describe('column groups', () => {
  it('renders grouped column sections with group comments', () => {
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

    render(<Columns table={table} />, { wrapper })

    const identityGroup = screen.getByRole('group', { name: 'Identity' })
    const auditGroup = screen.getByRole('group', { name: 'Audit' })
    const ungroupedGroup = screen.getByRole('group', { name: 'Other columns' })

    expect(screen.getByText('Primary login columns')).toBeInTheDocument()
    expect(within(identityGroup).getByText('id')).toBeInTheDocument()
    expect(within(identityGroup).getByText('email')).toBeInTheDocument()
    expect(within(auditGroup).getByText('created_at')).toBeInTheDocument()
    expect(within(ungroupedGroup).getByText('display_name')).toBeInTheDocument()
  })
})
