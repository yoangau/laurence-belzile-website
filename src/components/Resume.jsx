import React from 'react';
import Fade from 'react-reveal/Fade';
import styled from '@emotion/styled';

const StyledTitle = styled.h5`
  margin-bottom: 0.5em;
  margin-top: 1em;
`;

const StyledYear = styled.div`
  margin-bottom: 1em;
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  justify-content: flex-start;
`;

const StyledDate = styled.div`
  width: 10ch;
  min-width: 10ch;
  max-width: 10ch;
  display: flex;
  flex-wrap: nowrap;
  flex-direction: column;
  align-content: flex-start;
`;

const StyledContentList = styled.div`
  display: flex;
  flex-wrap: nowrap;
  flex-direction: column;
  align-content: flex-start;
`;

const StyledLink = styled.a`
  color: inherit;
  &:hover,
  &:focus {
    color: #aaaaaa;
    cursor: pointer;
  }
`;

const content = [
  {
    title: 'Études',
    year: [
      {
        date: 2019,
        list: ['Maîtrise en arts visuels, Université Laval'],
      },
      {
        date: 2016,
        list: ['Baccalauréat en arts visuels avec majeure en peinture et dessin, Université Concordia'],
      },
      {
        date: 2013,
        list: ['DEC en arts plastiques, Cégep de Rivière-du-Loup'],
      },
    ],
  },
  {
    title: 'Expositions individuelles',
    year: [
      {
        date: 2022,
        list: ["S'arracher la douceur, Galerie Montcalm, Gatineau"],
      },
      {
        date: 2021,
        list: ['Marmonner le vide, Manif d’art, bibliothèque Aliette-Marchand, Québec',
              'Marmonner le vide, Manif d’art, bibliothèque Claire-Martin, Québec',
              ],
      },
      {
        date: 2020,
        list: [
          'Mesure et démesure, Centre d’art de Kamouraska & Galerie Champagne et Paradis, Kamouraska',
          'Mesure et démesure, Galerie d’art du Cégep de Jonquière, Jonquière',
        ],
      },
      {
        date: 2019,
        list: [
          'Arracher le rouge du jaune, Galerie AVE, Montréal',
          'Entre espace et objets, Galerie du Café Centre art, Boucherville',
        ],
      },
      {
        date: 2018,
        list: [
          'La chute des corps, Atelier du roulement à billes, Québec',
          'Entre toi et moi ; il y a ça et là, Centre culturel Georges P.-Vanier, Chateauguay',
          'Il y a dans cet autour, parfois, la trace de ce milieu, Salle Alphonse-Desjardins, Université Laval, Québec',
        ],
      },
      {
        date: 2017,
        list: ['Situations, Salle Georgianna-Juneau, Maison de la culture, Rivière-du-Loup'],
      },
    ],
  },
  {
    title: 'Expositions collectives',
    year: [
       {
        date: 2021,
        list: ['montagnes, local indépendant, Québec'],
      },
      {
        date: 2020,
        list: [
          'Foire en art actuel de Québec, Québec',
          'Foire d’art contemporain de Saint-Lambert, Saint-Lambert',
          '50e du Cégep de Rivière-du-Loup, Salle Gaetan-Blanchet, Rivière-du-Loup',
        ],
      },
      {
        date: 2019,
        list: ['Ombre diurne et réverbère, Galerie Champage et Paradis, Kamouraska', 'Festival SOIR, Québec'],
      },
      {
        date: 2018,
        list: [
          'Nature, Le livart, Montréal',
          'Voir loin, Centre d’art de Kamouraska, Kamouraska',
          'Sublime, Salle Alphonse-Desjardins, Université Laval, Québec',
          'Jaune Marine, Ancienne école des beaux-arts de Montréal, Montréal',
        ],
      },
      {
        date: 2017,
        list: [
          'Coming soon, Atelier du Roulement à billes, Québec ',
          'Exposition collective de Résidence nomade, Atelier du Roulement à billes, Québec',
          'Exposé Noir, Fonderie Darling en partenariat avec Centerfold, Montréal',
          'Abstraction sauvage, Le Livart, Montréal',
          'L’intemporalité du corps, Le Livart, Montréal',
        ],
      },
      {
        date: 2016,
        list: [
          'Off-FAAQ/FAAQ-OFF, Atelier du Roulement à billes, Québec',
          'Centerfold 11, Centerfold Gallery, Montréal',
          'Summer exhibition 1/3, VAV Gallery, Montréal',
          'Stay Awhile, Art Matters, Montréal',
        ],
      },
    ],
  },
  {
    title: 'Résidences de création',
    year: [
          {
        date: 2022,
        list: ['Centre de production en art actuel Les Ateliers, Baie-Saint-Paul'],
      },
      {
        date: 2019,
        list: ['NOUAISONS, Presbytère de Scott, Scott'],
      },
      {
        date: 2018,
        list: ['Marathon de la création, Trois-Pistoles', 'Centre d’art de Kamouraska, Kamouraska'],
      },
      {
        date: 2017,
        list: ['Résidence Nomade, île d’Anticosti'],
      },
    ],
  },
  {
    title: 'Emplois',
    year: [
      {
        date: '2018-2021',
        list: ['Coordonnatrice à la programmation, Folie/Culture'],
      },
      {
        date: 2018,
        list: ['Coordonnatrice des expositions, Centre d’art de Kamouraska, Kamouraska'],
      },
      {
        date: 2017,
        list: ['Auxiliaire d’enseignement dans le cours Ateliers I, Université Laval'],
      },
    ],
  },
  {
    title: 'Autres activités',
    year: [
        {
        date: 2021,
        list: ['Membre du conseil d’administration de Folie/Culture'],
      },
      {
        date: 2020,
        list: [
          'Participation aux encans de la quarantaine',
          'Collaboration avec les éditions OMRI pour le recueil Ramages de Laurence Langlois',
        ],
      },
      {
        date: 2019,
        list: ['Activités de médiation culturelle et de création avec le Café Centre Art, Boucherville'],
      },
      {
        date: '2018-2021',
        list: ['Membre du comité de programmation de Folie/Culture'],
      },
      {
        date: '2018-2021',
        list: ['Participation aux encans annuels du Centre d’art de Kamouraska'],
      },
    ],
  },
  {
    title: 'Collection',
    year: [
      {
        date: '',
        list: ['Ville de Boucherville'],
      },
    ],
  },
  {
    title: 'Représentation',
    year: [
      {
        date: '',
        list: [
          <StyledLink href="https://champagneparadis.com/collections/belzile-laurence">
            Galerie Champagne et Paradis, Kamouraska
          </StyledLink>,
        ],
      },
    ],
  },
  {
    title: 'Prix et bourses',
    year: [
       {
        date: '2020',
        list: ['Bourse au projet pour l’exposition collective montagnes, Première ovation, Manif d’art'],
      },
       {
        date: '2019',
        list: ['Bourse au projet pour l’exposition individuelle Mesure et démesure, Première ovation, Manif d’art'],
      },
      {
        date: 2018,
        list: [
          'Représentante de l’Université Laval pour l’exposition collective Jaune Marine, Forces Avenir, catégorie « Art, lettre et culture »',
          'Bourse de rayonnement, Université Laval',
        ],
      },
      {
        date: 2017,
        list: ['Bourse d’études supérieures, Fondation Desjardins'],
      },
      {
        date: 2014,
        list: [
          '2e prix du concours en arts visuels Polskafree25, Ambassade de la Pologne à Montréal et Université Concordia',
        ],
      },
    ],
  },
];

export const Resume = () => (
  <Fade bottom>
    <h1>Curriculum vitae</h1>
    {content.map((element, i) => (
      <div key={`${element.title}-${i}`}>
        <StyledTitle>{element.title}</StyledTitle>
        {element.year.map((year, j) => (
          <StyledYear key={`${year.date}-${j}`}>
            <StyledDate>{year.date}</StyledDate>
            <StyledContentList>
              {year.list.map((item, k) => (
                <div key={`${item}-${k}`}>{item}</div>
              ))}
            </StyledContentList>
          </StyledYear>
        ))}
      </div>
    ))}
  </Fade>
);
