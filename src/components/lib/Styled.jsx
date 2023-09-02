import styled from '@emotion/styled';
import { Carousel as AntdCarousel } from 'antd';

export const Button = styled.button`
  display: inline-block;
  outline: 0;
  cursor: pointer;
  padding: 5px 16px;
  font-size: 2vh;
  font-weight: 500;
  line-height: 2vh;
  vertical-align: middle;
  border: 1px solid;
  border-radius: 6px;
  color: #24292e;
  background-color: #fafbfc;
  border-color: #1b1f2326;
  box-shadow: rgba(27, 31, 35, 0.04) 0px 1px 0px 0px, rgba(255, 255, 255, 0.25) 0px 1px 0px 0px inset;
  transition: 0.2s cubic-bezier(0.3, 0, 0.5, 1);
  transition-property: color, background-color, border-color;
  &:hover {
    background-color: #f3f4f6;
    border-color: #1b1f2326;
    transition-duration: 0.1s;
  }
`;

export const SubHeader = styled.h3`
  font-size: 3vh;
  font-weight: 1000;
`;

export const Carousel = styled(AntdCarousel)`
  &:hover,
  &:focus {
    cursor: grab;
  }

  > .slick-dots li button {
    background: black;
    opacity: 0.5;
  }

  > .slick-dots li.slick-active button {
    background: black;
  }

  > .slick-prev,
  > .slick-prev:focus {
    font-size: 1.5em;
    left: 10px;
    z-index: 2;
    color: #aaa;
  }

  > .slick-next,
  > .slick-next:focus {
    font-size: 1.5em;
    right: 10px;
    z-index: 2;
    color: #aaa;
  }

  > .slick-prev:hover,
  > .slick-next:hover {
    color: black;
  }
`;

export const Spacer = styled.div`
  height: 3vh;
`;

export const PhotoCreditText = styled.div`
  text-align: right;
  width: 100%;
  color: #aaaaaa;
`;
