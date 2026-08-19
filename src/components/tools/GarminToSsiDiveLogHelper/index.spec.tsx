import { suuntoOceanScubaFixture } from '@site/src/domain/diving/suunto/__fixtures__/index'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GarminToSsiDiveLogHelper from './index'

describe('GarminToSsiDiveLogHelper', () => {
  it('accepts multiple files at once', async () => {
    const { container } = render(<GarminToSsiDiveLogHelper />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const bytes = suuntoOceanScubaFixture()
    const file1 = new File([bytes], 'dive-1.fit')
    const file2 = new File([bytes], 'dive-2.fit')
    Object.defineProperty(input, 'files', { value: [file1, file2], configurable: true })

    fireEvent.input(input)

    await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'dive-1.fit' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'dive-2.fit' })).toBeInTheDocument(),
    )
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })

  it('parses files dropped on the page', async () => {
    render(<GarminToSsiDiveLogHelper />)
    const bytes = suuntoOceanScubaFixture()
    const file1 = new File([bytes], 'drop-1.fit')
    const file2 = new File([bytes], 'drop-2.fit')
    const dataTransfer = { files: [file1, file2] }

    fireEvent.dragEnter(window, { dataTransfer })
    fireEvent.drop(window, { dataTransfer })

    await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'drop-1.fit' })).toBeInTheDocument()
  })

  it('renders inside a ToolPage with the expected title', () => {
    render(<GarminToSsiDiveLogHelper />)

    expect(
      screen.getByRole('heading', { name: 'Garmin to SSI DiveLog helper' }),
    ).toBeInTheDocument()
  })

  it('explains the upload steps and that no data is stored', () => {
    render(<GarminToSsiDiveLogHelper />)

    expect(screen.getByText(/Upload or drag and drop your garmin/i)).toBeInTheDocument()
    expect(screen.getByText(/Scan the resulting QR code in the SSI app/i)).toBeInTheDocument()
    expect(screen.getByText(/This page does not store data/i)).toBeInTheDocument()
  })

  it('offers a file selector button', () => {
    render(<GarminToSsiDiveLogHelper />)

    expect(screen.getByRole('button', { name: /Select file/i })).toBeInTheDocument()
  })

  it('still converts a Suunto file but flags the vendor mismatch', async () => {
    const { container } = render(<GarminToSsiDiveLogHelper />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([suuntoOceanScubaFixture()], 'suunto-ocean-scuba.fit')
    Object.defineProperty(input, 'files', { value: [file], configurable: true })

    fireEvent.input(input)

    await waitFor(() => expect(screen.getByText('Importing your dive')).toBeInTheDocument())
    const notice = screen.getByRole('note')
    expect(notice).toHaveTextContent(/Suunto file/i)
    expect(
      within(notice).getByRole('link', { name: /Suunto to SSI dive log helper/i }),
    ).toHaveAttribute('href', '/tools/suunto-to-ssi-dive-log-helper')
  })
})
