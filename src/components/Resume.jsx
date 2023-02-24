import React from 'react';
import Fade from 'react-reveal/Fade';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import content from '../data/resume.json';

const StyledTitle = styled.div`
  margin-bottom: 0.5em;
  margin-top: 3em;
  font-weight: bold;
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
  margin-right: 10em;
`;

const StyledLink = styled.a`
  color: inherit;
  &:hover,
  &:focus {
    color: #aaaaaa;
    cursor: pointer;
  }
`;

export const Resume = () => {
  const { t } = useTranslation('resume');
  return (
    <Fade bottom>
      {content.map((element, i) => (
        <div key={`${element.title}-${i}`}>
          <StyledTitle>{t(element.title)}</StyledTitle>
          {element.year.map((year, j) => (
            <StyledYear key={`${year.date}-${j}`}>
              <StyledDate>{year.date}</StyledDate>
              <StyledContentList>
                {year.list.map(({ val, link }, k) => (
                  <div key={`${val}-${k}`}>{link ? <StyledLink href={link}>{t(val)}</StyledLink> : t(val)}</div>
                ))}
              </StyledContentList>
            </StyledYear>
          ))}
        </div>
      ))}
    </Fade>
  );
};
