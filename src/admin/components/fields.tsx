/** Small form building blocks shared by the pages. */
import { Box, NumberInput, SimpleGrid, Text, Textarea, TextInput, type NumberInputProps } from '@mantine/core';
import { useEffect, useState, type ReactNode } from 'react';
import type { L10n } from '../../content/schema';
import { blockHtml, inlineHtml } from '../../content/text';
import { useFieldError } from '../state';

/**
 * A number input that reports `undefined` while empty, and keeps what is being typed
 * ("5." or "") without fighting the stored value.
 */
export function NumberField({
  value,
  onChange,
  ...props
}: Omit<NumberInputProps, 'value' | 'onChange'> & {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  const [text, setText] = useState<string | number>(value ?? '');
  useEffect(() => {
    setText((current) => (Number(current) === value && current !== '' ? current : (value ?? '')));
  }, [value]);
  return (
    <NumberInput
      decimalSeparator=","
      {...props}
      value={text}
      onChange={(next) => {
        setText(next);
        const n = typeof next === 'number' ? next : next === '' ? undefined : Number(String(next).replace(',', '.'));
        onChange(n === undefined || Number.isNaN(n) ? undefined : n);
      }}
    />
  );
}

/** FR / EN text inputs side by side. `path` is where validation errors are reported (e.g. `works.3.title`). */
export function L10nInput({
  label,
  value,
  onChange,
  path,
  description,
  placeholderEn = 'Vide = même texte qu’en français',
  render,
}: {
  label: string;
  value: L10n;
  onChange: (value: L10n) => void;
  path?: string;
  description?: ReactNode;
  placeholderEn?: string;
  /** Custom input, e.g. an Autocomplete. */
  render?: (
    locale: 'fr' | 'en',
    props: {
      label: string;
      value: string;
      onChange: (v: string) => void;
      error?: string | undefined;
      placeholder?: string;
    },
  ) => ReactNode;
}) {
  const errorFr = useFieldError(`${path}.fr`);
  const errorEn = useFieldError(`${path}.en`);
  const field = (locale: 'fr' | 'en') => {
    const props = {
      label: `${label} (${locale === 'fr' ? 'français' : 'anglais'})`,
      value: value[locale],
      onChange: (v: string) => onChange({ ...value, [locale]: v }),
      error: locale === 'fr' ? errorFr : errorEn,
      ...(locale === 'en' ? { placeholder: placeholderEn } : {}),
    };
    return render ? (
      render(locale, props)
    ) : (
      <TextInput {...props} onChange={(e) => props.onChange(e.currentTarget.value)} />
    );
  };
  return (
    <Box>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        {field('fr')}
        {field('en')}
      </SimpleGrid>
      {description && (
        <Text size="xs" c="dimmed" mt={4}>
          {description}
        </Text>
      )}
    </Box>
  );
}

/** Rendered markdown, styled like the public site. */
export function Preview({
  text,
  mode = 'block',
  empty = 'Aperçu',
}: {
  text: string;
  mode?: 'block' | 'inline';
  empty?: string;
}) {
  if (!text.trim()) {
    return (
      <Text size="sm" c="dimmed" fs="italic">
        {empty}
      </Text>
    );
  }
  return (
    <div
      className={mode === 'block' ? 'lb-preview' : 'lb-preview lb-preview-inline'}
      dangerouslySetInnerHTML={{ __html: mode === 'block' ? blockHtml(text) : inlineHtml(text) }}
    />
  );
}

/** A long text with its live preview underneath. */
export function MarkdownField({
  label,
  value,
  onChange,
  error,
  minRows = 6,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  minRows?: number;
  placeholder?: string;
}) {
  return (
    <Box>
      <Textarea
        label={label}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        autosize
        minRows={minRows}
        maxRows={30}
        error={error}
        placeholder={placeholder}
      />
      <Box className="lb-preview-box" mt={6} aria-label={`Aperçu : ${label}`}>
        <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
          Aperçu
        </Text>
        <Preview text={value} />
      </Box>
    </Box>
  );
}

/** One-line help about the text syntax. */
export const SyntaxHelp = ({ long = false }: { long?: boolean }) => (
  <Text size="xs" c="dimmed" component="span">
    <code>*italique*</code> · <code>**gras**</code> · <code>[texte du lien](https://…)</code>
    {long && (
      <>
        {' '}
        · une ligne vide = nouveau paragraphe · <code>## Titre</code> en début de ligne = intertitre
      </>
    )}
  </Text>
);

export const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'element';
