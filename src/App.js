import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import './App.css';
import NavBar from './components/NavBar';
import Work from './components/Work'
import Contact from './components/Contact'
import { animateScroll as scroll } from "react-scroll";


export default class App extends Component {

  componentDidMount() {
    scroll.scrollToTop();
  }

  render() {
    return (
      <div className="App">
        <NavBar />
        <Work />
        <Contact />
      </div>
    )
  }
}
