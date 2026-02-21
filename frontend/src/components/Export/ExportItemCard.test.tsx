import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportItemCard } from './ExportItemCard';
import type { ExportableItem } from '../../api/client';

describe('ExportItemCard', () => {
  const baseItem: ExportableItem = {
    id: 'album-1',
    name: 'Test Album',
    artist: 'Test Artist',
    trackCount: 10,
    totalDuration: 2400,
    coverMediaId: 'media-1',
  };

  it('should render item name and track count', () => {
    render(
      <ExportItemCard
        item={baseItem}
        isSelected={false}
        isExported={false}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText('Test Album')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getByText(/10 tracks/)).toBeInTheDocument();
  });

  it('should show singular "track" for single track items', () => {
    const singleTrackItem = { ...baseItem, trackCount: 1 };
    render(
      <ExportItemCard
        item={singleTrackItem}
        isSelected={false}
        isExported={false}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText(/1 track/)).toBeInTheDocument();
    expect(screen.queryByText(/1 tracks/)).not.toBeInTheDocument();
  });

  it('should show duration when available', () => {
    render(
      <ExportItemCard
        item={baseItem}
        isSelected={false}
        isExported={false}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText(/40 min/)).toBeInTheDocument();
  });

  it('should show "Not Exported" badge when not exported', () => {
    render(
      <ExportItemCard
        item={baseItem}
        isSelected={false}
        isExported={false}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText('Not Exported')).toBeInTheDocument();
  });

  it('should show "Exported" badge when exported', () => {
    render(
      <ExportItemCard
        item={baseItem}
        isSelected={false}
        isExported={true}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText('Exported')).toBeInTheDocument();
  });

  it('should have checkbox checked when selected', () => {
    render(
      <ExportItemCard
        item={baseItem}
        isSelected={true}
        isExported={false}
        onToggle={vi.fn()}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should call onToggle when card is clicked', () => {
    const onToggle = vi.fn();
    render(
      <ExportItemCard
        item={baseItem}
        isSelected={false}
        isExported={false}
        onToggle={onToggle}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should call onToggle when checkbox is clicked', () => {
    const onToggle = vi.fn();
    render(
      <ExportItemCard
        item={baseItem}
        isSelected={false}
        isExported={false}
        onToggle={onToggle}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should call onToggle when Enter key is pressed', () => {
    const onToggle = vi.fn();
    render(
      <ExportItemCard
        item={baseItem}
        isSelected={false}
        isExported={false}
        onToggle={onToggle}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should call onToggle when Space key is pressed', () => {
    const onToggle = vi.fn();
    render(
      <ExportItemCard
        item={baseItem}
        isSelected={false}
        isExported={false}
        onToggle={onToggle}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should have selected class when selected', () => {
    render(
      <ExportItemCard
        item={baseItem}
        isSelected={true}
        isExported={false}
        onToggle={vi.fn()}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveClass('selected');
  });

  it('should have exported class when exported', () => {
    render(
      <ExportItemCard
        item={baseItem}
        isSelected={false}
        isExported={true}
        onToggle={vi.fn()}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveClass('exported');
  });

  it('should show placeholder when no cover image', () => {
    const itemWithoutCover = { ...baseItem, coverMediaId: null };
    render(
      <ExportItemCard
        item={itemWithoutCover}
        isSelected={false}
        isExported={false}
        onToggle={vi.fn()}
      />
    );

    // Should show first letter of album name as placeholder
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <ExportItemCard
        item={baseItem}
        isSelected={false}
        isExported={false}
        onToggle={vi.fn()}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-pressed', 'false');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('should indicate selection state in aria-pressed', () => {
    render(
      <ExportItemCard
        item={baseItem}
        isSelected={true}
        isExported={false}
        onToggle={vi.fn()}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });
});
