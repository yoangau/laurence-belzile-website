/**
 * Drag-and-drop reordering (dnd-kit) with a drag handle, so touch scrolling keeps working.
 * Keyboard: focus the handle, Space to pick up, arrows to move, Space to drop.
 * Always pair it with <MoveButtons> for a click-only alternative.
 */
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActionIcon, Group } from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconGripVertical } from '@tabler/icons-react';
import type { CSSProperties, ReactNode } from 'react';

type SortableListProps<T> = {
  items: readonly T[];
  getId: (item: T) => string;
  onMove: (from: number, to: number) => void;
  /** `grid` for wrapping layouts (image thumbnails). */
  layout?: 'list' | 'grid';
  children: (item: T, index: number, handle: ReactNode) => ReactNode;
  /** Wraps the items, e.g. a grid container. */
  container?: (children: ReactNode) => ReactNode;
};

const announcements = {
  onDragStart: () => 'Élément saisi. Utilisez les flèches pour le déplacer, Espace pour le déposer.',
  onDragOver: () => 'Élément déplacé.',
  onDragEnd: () => 'Élément déposé.',
  onDragCancel: () => 'Déplacement annulé.',
};

export function SortableList<T>({ items, getId, onMove, layout = 'list', children, container }: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from >= 0 && to >= 0) onMove(from, to);
  };
  const list = items.map((item, index) => (
    <SortableItem key={ids[index]} id={ids[index]!}>
      {(handle) => children(item, index, handle)}
    </SortableItem>
  ));
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{ announcements, screenReaderInstructions: { draggable: announcements.onDragStart() } }}
    >
      <SortableContext items={ids} strategy={layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}>
        {container ? container(list) : list}
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ id, children }: { id: string; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : undefined,
  };
  const handle = (
    <ActionIcon
      ref={setActivatorNodeRef}
      variant="subtle"
      color="gray"
      aria-label="Glisser pour déplacer"
      style={{ cursor: 'grab', touchAction: 'none' }}
      {...attributes}
      {...listeners}
    >
      <IconGripVertical size={18} />
    </ActionIcon>
  );
  return (
    <div ref={setNodeRef} style={style}>
      {children(handle)}
    </div>
  );
}

/** "Monter / Descendre" buttons, the accessible alternative to dragging. */
export function MoveButtons({
  index,
  count,
  onMove,
  labels = ['Monter', 'Descendre'],
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  labels?: [string, string];
}) {
  return (
    <Group gap={2} wrap="nowrap">
      <ActionIcon
        variant="subtle"
        color="gray"
        aria-label={labels[0]}
        title={labels[0]}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        <IconArrowUp size={16} />
      </ActionIcon>
      <ActionIcon
        variant="subtle"
        color="gray"
        aria-label={labels[1]}
        title={labels[1]}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <IconArrowDown size={16} />
      </ActionIcon>
    </Group>
  );
}

/** Moves an item within an array, in place (call it inside `edit()`). */
export const moveItem = <T,>(array: T[], from: number, to: number) => {
  const [item] = array.splice(from, 1);
  if (item !== undefined) array.splice(to, 0, item);
};
