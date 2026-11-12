/** Historique: every published version, restorable as the draft. */
import { Alert, Button, Loader, Paper, Stack, Table, Text, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconRestore } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { api, type HistoryEntry } from '../api';
import { getState, replaceDraft, useStore } from '../state';
import { formatDate } from './SubscribersPage';

const dateTime = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long', timeStyle: 'short' });

export function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const publishedAt = useStore((s) => s.publishedAt);

  const refresh = useCallback(() => {
    api
      .history()
      .then(setEntries)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);
  // Reload after each publication made in this session.
  useEffect(refresh, [refresh, publishedAt]);

  const restore = (entry: HistoryEntry) => {
    const dirty = getState().content !== getState().saved;
    modals.openConfirmModal({
      title: 'Restaurer cette version ?',
      children: (
        <Stack gap="xs">
          <Text size="sm">
            La version publiée le <b>{formatDate(entry.publishedAt, dateTime)}</b> va remplacer le brouillon actuel.
          </Text>
          {dirty && (
            <Text size="sm" c="red">
              Vos modifications non enregistrées seront perdues.
            </Text>
          )}
          <Text size="sm">Le site ne change pas tant que vous ne cliquez pas sur « Publier ».</Text>
        </Stack>
      ),
      labels: { confirm: 'Restaurer', cancel: 'Annuler' },
      onConfirm: async () => {
        try {
          replaceDraft(await api.restore(entry.key));
          notifications.show({
            color: 'dark',
            title: 'Version restaurée',
            message: 'Elle est maintenant votre brouillon. Publiez-la pour la remettre en ligne.',
          });
        } catch (e) {
          notifications.show({ color: 'red', title: 'Restauration impossible', message: e instanceof Error ? e.message : String(e) });
        }
      },
    });
  };

  return (
    <Stack gap="md" maw={800}>
      <div>
        <Title order={1}>Historique</Title>
        <Text c="dimmed" size="sm">
          Chaque publication est conservée. Vous pouvez revenir à une version précédente.
        </Text>
      </div>
      {error && <Alert color="red">{error}</Alert>}
      {!entries && !error && <Loader />}
      {entries?.length === 0 && (
        <Paper withBorder p="lg">
          <Text c="dimmed">Aucune publication pour l’instant.</Text>
        </Paper>
      )}
      {!!entries?.length && (
        <Table.ScrollContainer minWidth={400}>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Publiée le</Table.Th>
                <Table.Th>Taille</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {entries.map((entry, index) => (
                <Table.Tr key={entry.key}>
                  <Table.Td>
                    {formatDate(entry.publishedAt, dateTime)}
                    {index === 0 && (
                      <Text span size="xs" c="dimmed">
                        {' '}
                        (en ligne)
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>{Math.round(entry.size / 1024)} Ko</Table.Td>
                  <Table.Td ta="right">
                    <Button size="compact-sm" variant="default" leftSection={<IconRestore size={14} />} onClick={() => restore(entry)}>
                      Restaurer
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  );
}
