import React, { Component } from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar'
import './NavBar.css'

export default class NavBar extends Component {

    render() {
        return (

            <Navbar expand="lg" sticky="top">
                <Nav className="lg-column justify-content-end mr-lg-2">
                    <Nav.Link innerRef="work">travail</Nav.Link>
                    <Nav.Link innerRef="contact">contact</Nav.Link>
                    <Nav.Link href="https://laulau.s3.ca-central-1.amazonaws.com/laurence-belzile-cv.pdf">cv</Nav.Link>
                </Nav>
            </Navbar>
        )
    }
} 