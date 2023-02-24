import React, { useEffect, useState } from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import { animateScroll as scroll } from 'react-scroll';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const StyledLink = styled.p`
  color: #000000;
  font-size: 1vw;
  border-radius: 0.25rem;
  margin: 0 0.5em;
  &:hover,
  &:focus {
    color: #aaaaaa;
    cursor: pointer;
  }
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
      <Nav className="lg-column justify-content-end">
        <StyledLink onClick={() => handleClick('/travail')}>{t('work-header')}</StyledLink>
        <StyledLink onClick={() => handleClick('/cv')}>{t('resume-header')}</StyledLink>
        <StyledLink onClick={() => handleClick('/info')}>{t('info-header')}</StyledLink>
        <StyledLink onClick={() => handleClick('/contact')}>{t('contact-header')}</StyledLink>
        <StyledLink onClick={() => setLanguage(languageSwitchMapper[language])}>
          <b>{languageSwitchMapper[language]}</b>
        </StyledLink>
      </Nav>
    </StyledNavbar>
  );
};
