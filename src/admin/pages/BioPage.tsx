/** Bio / démarche: the info page text, French and English side by side with a live preview. */
import { Alert, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { MarkdownField } from '../components/fields';
import { edit, useContent } from '../state';

export function BioPage() {
  const { bio } = useContent();
  return (
    <Stack gap="md">
      <div>
        <Title order={1}>Bio</Title>
        <Text c="dimmed" size="sm">
          Le texte de la page « info ».
        </Text>
      </div>
      <Alert color="gray" variant="light" title="Mise en forme">
        <Text size="sm">
          Une ligne vide commence un nouveau paragraphe. Une ligne qui commence par <code>## </code> devient un
          intertitre (ex. <code>## Démarche</code>). <code>*italique*</code>, <code>**gras**</code> et{' '}
          <code>[texte du lien](https://…)</code> fonctionnent aussi. L’aperçu montre le résultat.
        </Text>
      </Alert>
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        {(['fr', 'en'] as const).map((locale) => (
          <MarkdownField
            key={locale}
            label={locale === 'fr' ? 'Français' : 'Anglais'}
            value={bio[locale]}
            minRows={16}
            placeholder={locale === 'en' ? 'Vide = même texte qu’en français' : undefined}
            onChange={(text) =>
              edit((draft) => {
                draft.bio[locale] = text;
              })
            }
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
