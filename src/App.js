import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import './App.css';
import NavBar from './components/NavBar';
import Work from './components/Work'
import Contact from './components/Contact'



function App() {
  return (
    <div className="App">
      <NavBar />
      <Work />
      <Contact />
    </div>
  );
}

export default App;