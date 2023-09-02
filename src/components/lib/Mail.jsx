import styled from '@emotion/styled';

const StyledMail = styled.div`
  margin-bottom: 8vh;
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

const email = 'laurence.belzile.arts@gmail.com';

export const Mail = () => (
  <StyledMail>
    <StyledMailto href={`mailto:${email}`}>{email}</StyledMailto>
  </StyledMail>
);
