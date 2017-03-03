/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import io from 'socket.io-client';
import Prompt from 'react-native-prompt';
// var socketConfig = { path: '/socket' };
// var socket = new SocketIO('localhost:3000', socketConfig);
// socket.connect();
//
// socket.on('connect', () => {
//     console.log('Wahey -> connected!');
// });
// socket.disconnect();
//
// socket.reconnect();
window.navigator.userAgent = 'ReactNative';

const socket = io('http://localhost:8081', {
  transports: ['websocket'] // you need to explicitly tell it to use websockets
});

import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TextInput,
  touchableOpacity,
  NavigatorIOS,
  ListView,
  AsyncStorage
} from 'react-native';

// componentDidMount(){
//   this.state.socket.on("Base On the Content", (data) => {
//     console.log(data);
//     this.setState({
//
//
//     })
//   })
// }

var App = React.createClass({
  getInitialState: function() {
    return {
      roomName: "Praise the jiang",
      username: '',
      socket: socket
    }
  },
  componentDidMount: function() {
    // this.state.socket.on('connect', function() {
    //   console.log('connected');
    //   this.setState({
    //     username: this.state.socket.username
    //   });
    //   this.state.socket.emit('username', this.state.socket.username)
    // }.bind(this));
    //
    // this.state.socket.on('errorMessage', function(message) {
    //   alert(message);
    // }.bind(this));
  },
  signIn(username, event) {
    this.setState({
      promptVisible: false
    })
    this.state.socket.on('connect', function() {
      console.log("You are connected")
      this.setState({
        username: username
      });
      this.state.socket.emit('username', this.state.socket.username)

      this.props.navigator.push({
          component: Game,
          title: "Game Board"
        })

    }.bind(this));

    this.state.socket.on('errorMessage', function(message) {
      alert(message);
    }.bind(this));
  },
  render: function() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ height: 600, justifyContent: 'flex-end'}}>
          <Text style={{ fontSize: 20 }} onPress={() => this.setState({ promptVisible: true })}>
            Join the Room
          </Text>
        </View>
        <Prompt
            title="What is your game name"
            placeholder="Start typing"
            defaultValue=""
            visible={ this.state.promptVisible }
            onCancel={ () => this.setState({
              promptVisible: false
            })}
            onSubmit={ (value) => this.signIn(value)}
          />
      </View>
      );
  }
});

export default class Coup extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (  
      <View>
        <App />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('Coup', () => Coup);
