import React, { useState } from 'react';
import Fade from 'react-reveal/Fade';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { emailService } from '../service/email-service';

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
  margin-bottom: 2vh;
`;

const StyledSocialMedia = styled.a`
  margin-right: 1em;
`;

const StyledButton = styled.button`
  display: inline-block;
  outline: 0;
  cursor: pointer;
  padding: 5px 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
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

const StyledInput = styled.input`
  margin-right: 0.2em;
  padding: 5px 12px;
  font-size: 14px;
  line-height: 20px;
  color: #24292e;
  vertical-align: middle;
  background-color: #ffffff;
  background-repeat: no-repeat;
  background-position: right 8px center;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  outline: none;
  box-shadow: rgba(225, 228, 232, 0.2) 0px 1px 0px 0px inset;
  &:focus {
    border-color: #e1e4e8;
    outline: none;
    box-shadow: #e1e4e833 0px 0px 0px 3px;
  }
`;

const StyledThankYou = styled.p`
  font-size: 3vh;
  color: black;
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

export const Contact = () => {
  const [subEmail, setSubEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [thankyouToken, setThankyouToken] = useState('subscribed-success');
  const { t } = useTranslation('contact');

  return (
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
        <div>
          {submitted ? (
            <StyledThankYou>{t(thankyouToken)}</StyledThankYou>
          ) : (
            <>
              <StyledInput
                type="email"
                value={subEmail}
                onChange={(e) => setSubEmail(e.target.value)}
                placeholder={t('email')}
              />
              <StyledButton
                onClick={async () => {
                  const result = await emailService.subscribe(subEmail);
                  if (!result) {
                    setThankyouToken('subscribed-failed');
                  }
                  setSubmitted(true);
                  setTimeout(() => {
                    setSubmitted(false);
                  }, [3000]);
                }}
              >
                {t('subscribe')}
              </StyledButton>
            </>
          )}
        </div>
      </Fade>
    </>
  );
};
