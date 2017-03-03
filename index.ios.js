import React, { Component } from 'react';
import Prompt from 'react-native-prompt';
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

window.navigator.userAgent = "react-native";
import SocketIOClient from 'socket.io-client';

var Orientation = require('react-native-orientation')

export default class Coup extends Component {
  constructor(props) {
    super(props);
    this.socket = SocketIOClient('http://localhost:8081');
  }
  render() {
    return (  
      <View>
        <App socket={this.socket}/>
      </View>
    );
  }
}

var App = React.createClass({
  getInitialState: function() {
    return {
      roomName: "Praise the jiang",
      username: '',
      socket: this.props.socket
    }
  },
   signIn(username, event) {
    this.setState({
      promptVisible: false
    })
    this.state.socket.emit('connect', function () {
        this.setState({
          username: username
        });

        this.state.socket.emit('username', this.state.username);
        this.props.navigator.push({
            component: Game,
            title: "Game Board"
          })
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

var {width, height} = require('Dimensions').get('window');
var SIZE = 4; // four-by-four grid
var CELL_SIZE = Math.floor(width * .15); // 20% of the screen width
var CELL_PADDING = Math.floor(CELL_SIZE * .05); // 5% of the cell size
var BORDER_RADIUS = CELL_PADDING * 2;
var TILE_SIZE = CELL_SIZE - CELL_PADDING * 2;
var LETTER_SIZE = Math.floor(TILE_SIZE * .75);

var BoardView = React.createClass({
  render() {
    return <View style={styles.bcontainer}>
             {this.renderTiles()}
           </View>;
  },

  renderTiles(){
    return (
      <View>

          <View key={1} style={[styles.btile, {
            left: 1 * CELL_SIZE + CELL_PADDING,
            top: 0 * CELL_SIZE + CELL_PADDING}]}>
            <Image
              source={require('./images/duke.png')}>
            </Image>
          </View>

        <View key={2} style={[styles.btile, {
          left: 2 * CELL_SIZE + CELL_PADDING,
          top: 0 * CELL_SIZE + CELL_PADDING}]}>
          <Image
            source={require('./images/contessa.png')}>
          </Image>
        </View>
        <View key={4} style={[styles.btile, {
          left: 0 * CELL_SIZE + CELL_PADDING,
          top: 1 * CELL_SIZE + CELL_PADDING}]}>
          <Image
            source={require('./images/assassin.png')}>
          </Image>
        </View>
        <View key={7} style={[styles.btile, {
          left: 3 * CELL_SIZE + CELL_PADDING,
          top: 1 * CELL_SIZE + CELL_PADDING}]}>
          <Image
            source={require('./images/captain.png')}>
          </Image>
        </View>
        <View key={8} style={[styles.btile, {
          left: 0 * CELL_SIZE + CELL_PADDING,
          top: 2 * CELL_SIZE + CELL_PADDING}]}>
          <Image
            source={require('./images/ambassador.png')}>
          </Image>
        </View>
        <View key={11} style={[styles.btile, {
          left: 3 * CELL_SIZE + CELL_PADDING,
          top: 2 * CELL_SIZE + CELL_PADDING}]}>
          <Image
            source={require('./images/coup.png')}>
          </Image>
        </View>
        <View key={13} style={[styles.btile, {
          left: 1 * CELL_SIZE + CELL_PADDING,
          top: 3 * CELL_SIZE + CELL_PADDING}]}>
          <Image
            source={require('./images/coup.png')}>
          </Image>
        </View>
        <View key={14} style={[styles.btile, {
          left: 2 * CELL_SIZE + CELL_PADDING,
          top: 3 * CELL_SIZE + CELL_PADDING}]}>
          <Image
            source={require('./images/coup.png')}>
          </Image>
        </View>
      </View>
    )
  }
});

var styles = StyleSheet.create({
  bcontainer: {
    width: CELL_SIZE * SIZE,
    height: CELL_SIZE * SIZE,
    backgroundColor: 'transparent',
  },
  btile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#BEE1D2',
  },
  letter: {
    color: '#333',
    fontSize: LETTER_SIZE,
    backgroundColor: 'transparent',
  },
});


AppRegistry.registerComponent('Coup', () => Coup);
