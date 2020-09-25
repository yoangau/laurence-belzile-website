import React from 'react';
import Fade from 'react-reveal/Fade';
import styled from '@emotion/styled';

const StyledMail = styled.div`
  margin-bottom: 1vh;
`;

const StyledMailto = styled.a`
  font-size: 3vh;
  color: black;
  &:hover,
  &:focus {
    color: black;
    text-decoration: none;
  }
`;

const StyledSocialNetworks = styled.div`
  display: flex;
  flex-direction: row;
`;

const StyledSocialMedia = styled.a`
  margin-right: 1em;
`;

const email = 'laurence.belzile.arts@gmail.com';

const social = [
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/laurence.belzile.art/',
    source: 'https://laulau.s3.ca-central-1.amazonaws.com/f_logo_RGB-Black_58.png',
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/laurencebelzile/',
    source: 'https://laulau.s3.ca-central-1.amazonaws.com/glyph-logo_May2016.png',
  },
];

export const Contact = () => (
  <>
    <Fade bottom>
      <StyledMail>
        <StyledMailto href={`mailto:${email}`}>{email}</StyledMailto>
      </StyledMail>
      <StyledSocialNetworks>
        {social.map((link, i) => (
          <StyledSocialMedia key={`${link.name}-${i}`} href={link.url}>
            <img src={link.source} alt={link.name} style={{ width: '25px', height: '25px' }} />
          </StyledSocialMedia>
        ))}
      </StyledSocialNetworks>
    </Fade>
  </>
);
