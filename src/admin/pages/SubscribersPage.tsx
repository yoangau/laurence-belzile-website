/** Abonnés: newsletter subscribers, with delete and CSV export. */
import { ActionIcon, Alert, Button, Group, Loader, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconSearch, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api, type Subscriber } from '../api';

const dateFormat = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' });
export const formatDate = (iso: string, format = dateFormat) => {
  const date = new Date(iso.includes('T') || iso.endsWith('Z') ? iso : `${iso.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime()) ? iso : format.format(date);
};

const csvCell = (value: string) => (/[",\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/** Downloads the list as a CSV file that Numbers and Excel open with the accents intact. */
const exportCsv = (subscribers: Subscriber[]) => {
  const rows = [['courriel', 'langue', 'inscription'], ...subscribers.map((s) => [s.email, s.locale, s.createdAt])];
  const csv = `﻿${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: `abonnes-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .subscribers()
      .then(setSubscribers)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const remove = (subscriber: Subscriber) =>
    modals.openConfirmModal({
      title: 'Retirer cet abonné ?',
      children: (
        <Text size="sm">
          <b>{subscriber.email}</b> ne recevra plus l’infolettre. Cette action est immédiate.
        </Text>
      ),
      labels: { confirm: 'Retirer', cancel: 'Annuler' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await api.deleteSubscriber(subscriber.email);
          setSubscribers((list) => list?.filter((s) => s.email !== subscriber.email) ?? null);
          notifications.show({ color: 'dark', message: `${subscriber.email} a été retiré.` });
        } catch (e) {
          notifications.show({
            color: 'red',
            title: 'Suppression impossible',
            message: e instanceof Error ? e.message : String(e),
          });
        }
      },
    });

  const query = search.trim().toLowerCase();
  const visible = subscribers?.filter((s) => s.email.includes(query)) ?? [];

  return (
    <Stack gap="md" maw={900}>
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={1}>Abonnés</Title>
          <Text c="dimmed" size="sm">
            {subscribers ? `${subscribers.length} personne(s) inscrite(s) à l’infolettre` : 'Chargement…'}
          </Text>
        </div>
        <Button
          leftSection={<IconDownload size={18} />}
          variant="default"
          disabled={!subscribers?.length}
          onClick={() => subscribers && exportCsv(subscribers)}
        >
          Exporter CSV
        </Button>
      </Group>
      {error && <Alert color="red">{error}</Alert>}
      {!subscribers && !error && <Loader />}
      {subscribers && (
        <>
          <TextInput
            aria-label="Rechercher un courriel"
            placeholder="Rechercher un courriel"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            maw={360}
          />
          <Table.ScrollContainer minWidth={480}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Courriel</Table.Th>
                  <Table.Th>Langue</Table.Th>
                  <Table.Th>Inscription</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visible.map((s) => (
                  <Table.Tr key={s.email}>
                    <Table.Td>{s.email}</Table.Td>
                    <Table.Td>{s.locale === 'en' ? 'Anglais' : 'Français'}</Table.Td>
                    <Table.Td>{formatDate(s.createdAt)}</Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label={`Retirer ${s.email}`}
                        onClick={() => remove(s)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          {visible.length === 0 && (
            <Text c="dimmed" ta="center">
              Aucun abonné.
            </Text>
          )}
        </>
      )}
    </Stack>
  );
}
