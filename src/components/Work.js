import React, { Component } from 'react';
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Fade from 'react-reveal/Fade';
import Project from './Project'
import './Work.css'

export default class Work extends Component {

    images_func = () => {
        const images = []
        for (let i = 36; i > 0; i--) {
            images.push({
                id: i,
                imageSrc: `https://laulau.s3.ca-central-1.amazonaws.com/LB${i}.jpg`
            })
        }
        return images
    }

    render() {
        return (
            <Col id="work" className='work' md={{ span: 8, offset: 2 }}>
                <Row>
                    <h1 className='heading'>
                        <Fade bottom>laurence belzile</Fade>
                    </h1>
                </Row>
                <div className='content'>
                    {this.images_func().map((project) => (
                        <Project key={project.id}
                            title={project.id}
                            imageSrc={project.imageSrc}
                        ></Project>
                    ))}
                </div>
            </Col>
        )
    }
}