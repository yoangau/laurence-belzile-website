/** A work's images: upload, reorder (first = main image), photo credit, remove. */
import { ActionIcon, Badge, Box, Group, Paper, Select, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconArrowLeft, IconArrowRight, IconTrash } from '@tabler/icons-react';
import type { Image } from '../../content/schema';
import { imageUrl } from '../../content/format';
import { useContent, useFieldError, useMediaUrl } from '../state';
import { updateWork } from '../works';
import { ImageUploader } from './ImageUploader';
import { moveItem, SortableList } from './Sortable';

export const NO_CREDIT = '';

export function useCreditOptions() {
  const { photographers } = useContent().settings;
  return [{ value: NO_CREDIT, label: 'Aucun crédit' }, ...photographers.map((p) => ({ value: p.id, label: p.name }))];
}

export function ImagesField({ workId, images, path }: { workId: string; images: Image[]; path: string }) {
  const mediaUrl = useMediaUrl();
  const credits = useCreditOptions();
  const defaultCredit = useContent().settings.photographers[0]?.id;
  const error = useFieldError(path);

  const move = (from: number, to: number) =>
    updateWork(workId, (w) => {
      moveItem(w.images, from, to);
    });
  const setCredit = (index: number, credit: string) =>
    updateWork(workId, (w) => {
      const image = w.images[index];
      if (!image) return;
      if (credit) image.credit = credit;
      else delete image.credit;
    });
  const remove = (index: number) =>
    updateWork(workId, (w) => {
      w.images.splice(index, 1);
    });

  return (
    <Stack gap="sm">
      {images.length > 0 && (
        <SortableList
          items={images}
          getId={(image) => image.id}
          onMove={move}
          layout="grid"
          container={(children) => <SimpleGrid cols={{ base: 2, xs: 3, md: 4 }}>{children}</SimpleGrid>}
        >
          {(image, index, handle) => (
            <Paper withBorder radius="sm" p={6} h="100%">
              <Box className="lb-image-tile" style={{ backgroundColor: image.color }}>
                <img src={imageUrl(mediaUrl, image, Math.min(...image.widths))} alt={`Image ${index + 1}`} loading="lazy" />
                {index === 0 && (
                  <Badge className="lb-image-main" size="sm" color="dark">
                    Principale
                  </Badge>
                )}
              </Box>
              <Group justify="space-between" gap={0} mt={4} wrap="nowrap">
                {handle}
                <Group gap={0} wrap="nowrap">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="Déplacer avant"
                    title="Déplacer avant"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <IconArrowLeft size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="Déplacer après"
                    title="Déplacer après"
                    disabled={index === images.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <IconArrowRight size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label="Retirer cette image"
                    title="Retirer cette image"
                    onClick={() => remove(index)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Group>
              <Select
                size="xs"
                aria-label="Crédit photo"
                data={credits}
                value={image.credit ?? NO_CREDIT}
                onChange={(v) => setCredit(index, v ?? NO_CREDIT)}
                allowDeselect={false}
                comboboxProps={{ withinPortal: true }}
              />
            </Paper>
          )}
        </SortableList>
      )}
      {error && (
        <Text c="red" size="sm">
          {error}
        </Text>
      )}
      <ImageUploader
        prefix={workId}
        credit={defaultCredit}
        onUploaded={(image) =>
          updateWork(workId, (w) => {
            w.images.push(image);
          })
        }
      />
      {images.length > 1 && (
        <Text size="xs" c="dimmed">
          La première image est l’image principale (dans le fil et pour les partages). Glissez les images ou utilisez les
          flèches pour changer l’ordre.
        </Text>
      )}
    </Stack>
  );
}
