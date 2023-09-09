import React, { useState } from 'react';
import Fade from 'react-reveal/Fade';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { emailService } from '../service/email-service';
import { Button, Mail, SubHeader } from '../components/lib';

const StyledSocialNetworks = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: 8vh;
`;

const StyledSocialMedia = styled.a`
  margin-right: 1em;
`;

const StyledInput = styled.input`
  margin-right: 0.2em;
  padding: 5px 12px;
  font-size: 2vh;
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
        <SubHeader>{t('contact')}</SubHeader>
        <Mail />
        <SubHeader>{t('email-list')}</SubHeader>
        <div>
          <StyledInput
            type="email"
            value={subEmail}
            onChange={(e) => setSubEmail(e.target.value)}
            placeholder={t('email')}
          />
          <Button
            onClick={async () => {
              const result = await emailService.subscribe(subEmail);
              setThankyouToken(result ? 'subscribed-success' : 'subscribed-failed');
              setSubmitted(true);
              setTimeout(() => {
                setSubmitted(false);
              }, [10000]);
            }}
          >
            {t('subscribe')}
          </Button>
          {submitted && <StyledThankYou>{t(thankyouToken)}</StyledThankYou>}
        </div>
        <StyledSocialNetworks>
          {social.map((link, i) => (
            <StyledSocialMedia key={`${link.name}-${i}`} href={link.url}>
              <img src={link.source} alt={link.name} style={{ width: '3vh', height: '3vh' }} />
            </StyledSocialMedia>
          ))}
        </StyledSocialNetworks>
      </Fade>
    </>
  );
};
