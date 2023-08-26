import React from 'react';
import LazyLoad from 'react-lazyload';
import styled from '@emotion/styled';
import { Image } from 'antd';
import Fade from 'react-reveal';
import { Link } from 'react-router-dom';
import { PROJECT_BASE } from '../constants/routes';
import { COMPRESSED_FOLDER, PLACEHOLDER_FOLDER } from '../constants/folders';

const StyledProject = styled.div`
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  justify-content: flex-start;
  margin-top: 4em;
  margin-bottom: 8em;
  max-width: 80vw;
`;

const ClickableImage = styled(Image)`
  &:hover,
  &:focus {
    cursor: pointer;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  }
`;

export const Project = ({ id, src, title, width, year, isYearAnchor }) => {
  return (
    <>
      {isYearAnchor && <div id={year} />}
      <StyledProject id={id}>
        <LazyLoad once debounce height={'100%'} offset={200}>
          <Link to={(location) => `${PROJECT_BASE}/${id}`}>
            <Fade bottom>
              <ClickableImage
                width={width}
                fluid="fluid"
                src={`${COMPRESSED_FOLDER}/${src}`}
                decoding="async"
                preview={false}
                alt={title}
                placeholder={<Image width="100%" src={`${PLACEHOLDER_FOLDER}/${src}`} preview={false} alt={title} />}
              />
            </Fade>
          </Link>
        </LazyLoad>
      </StyledProject>
    </>
  );
};
