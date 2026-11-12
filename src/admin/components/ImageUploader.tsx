/** Dropzone that runs the image pipeline on each dropped file and shows per-file progress. */
import { Alert, Box, Group, Progress, Stack, Text } from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { IconPhotoPlus } from '@tabler/icons-react';
import { useState } from 'react';
import type { Image } from '../../content/schema';
import { uploadImage } from '../images/upload';

/** Extensions are listed because some browsers give HEIC/TIFF files no type. */
const ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'image/tiff': ['.tif', '.tiff'],
};

type Job = { key: number; name: string; fraction: number; label: string; error?: string };

let nextKey = 0;

export function ImageUploader({
  prefix,
  credit,
  multiple = true,
  onUploaded,
  label = 'Glissez des photos ici, ou cliquez pour les choisir',
}: {
  /** Image ids start with this (the work id). */
  prefix: string;
  credit?: string | undefined;
  multiple?: boolean;
  onUploaded: (image: Image) => void;
  label?: string;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const update = (key: number, patch: Partial<Job>) =>
    setJobs((list) => list.map((job) => (job.key === key ? { ...job, ...patch } : job)));

  const start = (files: File[]) => {
    for (const file of files) {
      const key = nextKey++;
      setJobs((list) => [...list, { key, name: file.name, fraction: 0, label: 'En attente…' }]);
      uploadImage(file, {
        prefix,
        credit,
        onProgress: (fraction, label) => update(key, { fraction, label }),
      })
        .then((image) => {
          onUploaded(image);
          setJobs((list) => list.filter((job) => job.key !== key));
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          update(key, { error: message });
        });
    }
  };

  return (
    <Stack gap="xs">
      <Dropzone
        onDrop={start}
        onReject={(rejected) =>
          notifications.show({
            color: 'red',
            title: 'Fichier refusé',
            message: `${rejected.map((r) => r.file.name).join(', ')} : seules les images JPEG, PNG, WebP, HEIC ou TIFF sont acceptées.`,
          })
        }
        accept={ACCEPT}
        multiple={multiple}
        p="md"
        className="lb-dropzone"
      >
        <Group justify="center" gap="sm" mih={64} style={{ pointerEvents: 'none' }}>
          <IconPhotoPlus size={28} stroke={1.5} />
          <div>
            <Text size="sm">{label}</Text>
            <Text size="xs" c="dimmed">
              JPEG de préférence. Les différentes tailles sont préparées automatiquement.
            </Text>
          </div>
        </Group>
      </Dropzone>
      {jobs.map((job) =>
        job.error ? (
          <Alert
            key={job.key}
            color="red"
            title={`« ${job.name} » n’a pas pu être ajoutée`}
            withCloseButton
            onClose={() => setJobs((list) => list.filter((j) => j.key !== job.key))}
          >
            {job.error}
          </Alert>
        ) : (
          <Box key={job.key}>
            <Group justify="space-between" gap="xs">
              <Text size="xs" truncate>
                {job.name}
              </Text>
              <Text size="xs" c="dimmed">
                {job.label}
              </Text>
            </Group>
            <Progress value={job.fraction * 100} size="sm" animated aria-label={`Progression : ${job.name}`} />
          </Box>
        ),
      )}
    </Stack>
  );
}
