import React, { useEffect, useState } from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { animateScroll as scroll } from 'react-scroll';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { ABOUT, CONTACT, CV, WORK } from '../constants/routes';
import { social } from '../pages/Contact';

const StyledLink = styled.p`
  color: #000000;
  font-size: 15pt;
  border-radius: 0.25rem;
  margin: 0 0.5em;
  &:hover,
  &:focus {
    color: #aaaaaa;
    cursor: pointer;
  }
`;

const StyledOutsideLink = styled.a`
  color: #000000;
  font-size: 15pt;
  border-radius: 0.25rem;
  margin: 0 0.5em;
  &:hover,
  &:focus {
    color: #aaaaaa;
    cursor: pointer;
  }
`;

const StyledIcon = styled.img`
  width: 14pt;
  height: 14pt;
  &:hover,
  &:focus {
    cursor: pointer;
    filter: opacity(50%);
  }
`;

const FitContentNav = styled(Nav)`
  width: fit-content;
  float: right;
`;

const StyledNavbar = styled(Navbar)`
  background-color: none;
  text-align: right;
  display: block;
`;

const languageSwitchMapper = {
  fr: 'en',
  en: 'fr',
};

export const NavBar = () => {
  const [language, setLanguage] = useState(i18n.language.slice(0, 2));
  const history = useHistory();
  const { t } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  const handleClick = (route) => {
    history.push(route);
    scroll.scrollToTop();
  };

  return (
    <StyledNavbar expand="lg" sticky="top">
      <FitContentNav className="lg-column justify-content-end">
        <StyledLink onClick={() => handleClick(WORK)}>{t('work-header')}</StyledLink>
        <StyledLink onClick={() => handleClick(CV)}>{t('resume-header')}</StyledLink>
        <StyledLink onClick={() => handleClick(ABOUT)}>{t('info-header')}</StyledLink>
        <StyledLink onClick={() => handleClick(CONTACT)}>{t('contact-header')}</StyledLink>
        <StyledOutsideLink href={social[1].url} target="_blank" rel="noreferrer">
          <StyledIcon src={social[1].source} alt={social[1].name} />
        </StyledOutsideLink>
        <StyledLink onClick={() => setLanguage(languageSwitchMapper[language])}>
          <b>{languageSwitchMapper[language]}</b>
        </StyledLink>
      </FitContentNav>
    </StyledNavbar>
  );
};
