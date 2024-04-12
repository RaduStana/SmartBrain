import React, { Component } from 'react'
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles"; // if you are going to use `loadFull`, install the "tsparticles" package too.
import Navigation from './components/navigation/Navigation.js'
import Rank from './components/Rank/Rank.js'
import Signin from './components/Signin/Signin.js'
import Register from './components/Register/Register.js'
import FaceRecognition from './components/FaceRecognition/FaceRecognition.js'
import Logo from './components/Logo/Logo.js'
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm.js'
import './App.css';

const particlesOptions = {
    particles:{
      move: {
        enable: true
      },
      line_linked: {
        enable_auto: true,
        color: '#ffffff',
        distance: 150,
        opacity: 0.4,
        width: 1
      },
      number: {
        value:120,
        density:{
          enable: true,
          value_area: 800
        }
      }
    }
}

const initalState = {
  input: '',
  setInit: false,
  imageUrl: '',
  box: {},
  route: 'signin',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
}
class App extends Component {
  constructor(){
    super();
    this.state = initalState;
  }
  
  loadUser = (data) => {
      this.setState({user: {
          id: data.id,
          name: data.name,
          email: data.email,
          entries: data.entries, 
          joined: data.joined
        }})
    }

  componentDidMount() {
    initParticlesEngine(async (engine) => {
        await loadFull(engine);
    }).then(() => {
        this.setState({setInit: true});
    });
  }    

  calculateFaceLocation = (data) => {
      const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
      const image = document.getElementById('inputimage');
      const width = Number(image.width);
      const height = Number(image.height);
      return {
        bottomRow: height - (clarifaiFace.bottom_row * height),
        leftCol: clarifaiFace.left_col * width,
        rightCol: width - (clarifaiFace.right_col * width),
        topRow: clarifaiFace.top_row * height,
      }
  }

  displayFaceBox = (box) => {
    this.setState({box:box});
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input});
    fetch('http://localhost:3000/imageurl',{
        method: 'post',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          input: this.state.input
          })
      })
      .then(response => response.json())
      .then(result  => {
        if(result){
          fetch('http://localhost:3000/image',{
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
            .then(response => response.json())
            .then(count => {
              this.setState(Object.assign(this.state.user, {entries: count}))
            })
            .catch(console.log);
        }
        this.displayFaceBox(this.calculateFaceLocation(result))
      })
      .catch(err => console.log('err',err));
  }

  onRouteChange = (route) => {
    if(route === 'signout'){
      this.setState(initalState)
    } else if(route === 'home'){
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }

  render(){
    const { isSignedIn, imageUrl, route, box } = this.state;
    return (
      <div className="App">
        <Particles className='particles' options = {particlesOptions}/> 
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange}/>
        { route === 'home' 
          ? <div>
              <Logo />
              <Rank name={this.state.user.name} entries={this.state.user.entries}/>
              <ImageLinkForm 
                onInputChange={this.onInputChange} 
                onButtonSubmit={this.onButtonSubmit}
              />
              <FaceRecognition box = {box} imageUrl = {imageUrl}/>
            </div>
          : (route === 'signin'
            ? <Signin loadUser={this.loadUser} onRouteChange = {this.onRouteChange}/>
            : <Register loadUser={this.loadUser} onRouteChange = {this.onRouteChange}/>
            ) 
        }        
      </div>
    );
  }
};

export default App;
