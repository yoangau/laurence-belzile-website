import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import { animateScroll as scroll } from 'react-scroll';
import styled from '@emotion/styled';

const StyledLink = styled.p`
  color: #000000;
  border-radius: 0.25rem;
  margin: 0 0.25em;
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

export const NavBar = () => {
  const history = useHistory();
  const handleClick = (route) => {
    history.push(route);
    scroll.scrollToTop();
  };

  return (
    <StyledNavbar expand="lg" sticky="top">
      <Nav className="lg-column justify-content-end">
        <StyledLink onClick={() => handleClick('/travail')}> travail.</StyledLink>
        <StyledLink
          onClick={() =>
            window.open('https://laulau.s3.ca-central-1.amazonaws.com/oeuvres_disponibles.pdf', '_blank').focus()
          }
        >
          {' '}
          œuvres disponibles.
        </StyledLink>
        <StyledLink onClick={() => handleClick('/contact')}> contact.</StyledLink>
        <StyledLink onClick={() => handleClick('/cv')}> cv.</StyledLink>
      </Nav>
    </StyledNavbar>
  );
};
