import React, { Component } from 'react';
import Fade from 'react-reveal/Fade';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import './Contact.css'

export default class Contact extends Component {

    email = 'laurence.belzile.arts@gmail.com'

    social = [
        // Add Or Remove The Link Accordingly
        {
            name: 'Facebook',
            url: 'https://www.facebook.com/laurence.belzile.art/',
            source: 'https://laulau.s3.ca-central-1.amazonaws.com/f_logo_RGB-Black_58.png'
        },
        {
            name: 'Instagram',
            url: 'https://www.instagram.com/laurencebelzile/',
            source: 'https://laulau.s3.ca-central-1.amazonaws.com/glyph-logo_May2016.png'
        }

    ]

    render() {
        return (
            <Col id="contact" md={{ span: 8, offset: 2 }} className="contact">
                <Fade bottom className='contact-content'>
                    <a href={`mailto:${this.email}`} className='email'>{this.email}</a>
                    <Row>
                        {this.social.map((link, index) => (
                            <Col
                                md={{ span: 1 }}
                                key={index}>
                                <a
                                    className='media-icon'
                                    href={link.url}>
                                    <img
                                        src={link.source}
                                        alt={link.name}
                                        style={{ width: "25px", height: "25px" }}
                                    />
                                </a>
                            </Col>
                        ))}
                    </Row>
                </Fade>
            </Col>
        )

    }
}