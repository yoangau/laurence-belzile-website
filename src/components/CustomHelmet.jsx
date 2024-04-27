import React from 'react';
import { Helmet } from 'react-helmet';
import { WEBSITE } from '../constants/routes';

export const CustomHelmet = ({ description }) => (
  <Helmet>
    <title>Laurence Belzile</title>
    <meta name="description" content={`Laurence Belzile - ${description}`} />
    <meta name="author" content="Laurence Belzile" />
    <meta name="og:title" content="Laurence Belzile" />
    <meta name="og:description" content={`Laurence Belzile - ${description}`} />
    <meta name="og:url" content={WEBSITE} />
    <meta property="og:image" content={`${WEBSITE}/Laurence_Belzile_profil.jpg`} />
    <meta property="og:image:secure_url" content={`${WEBSITE}/Laurence_Belzile_profil.jpg`} />
    <meta property="og:image:alt" content="Laurence Belzile" />
    <meta property="og:image:type" content="image/jpeg" />
  </Helmet>
);
