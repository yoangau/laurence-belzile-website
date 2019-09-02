import React, { Component } from 'react';
import Fade from 'react-reveal/Fade';
import LazyLoad from 'react-lazy-load';
import Row from 'react-bootstrap/Row';

export default class Project extends Component {
    render() {
        return (
            <Fade bottom>
                <Row className='project'>
                    <LazyLoad offsetVertical={512}>
                        <img src={this.props.imageSrc} alt={this.props.title}></img>
                    </LazyLoad >
                </Row>
            </Fade>);
    }
}