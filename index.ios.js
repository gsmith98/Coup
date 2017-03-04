import React, { Component } from 'react';
import Prompt from 'react-native-prompt';
import Button from 'apsl-react-native-button'
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  NavigatorIOS,
  ListView,
  AsyncStorage,
  Image
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
      <NavigatorIOS
        initialRoute={{
          component: Login,
          title: ""
        }}
        style={{flex: 1}}
      />
    );
  }
}

var Login = React.createClass({
  getInitialState: function() {
    return {
      username: '',
      socket: SocketIOClient('http://localhost:8081')
    }
  },
  componentDidMount(){
    this.state.socket.on('connect', function() {
     console.log('connected');
    });
   },
   signIn(username, event) {
    var self = this;
    this.setState({
      promptVisible: false,
      username: username
    })
    this.state.socket.emit('username', this.state.username);
    this.props.navigator.push({
        component: BoardView,
        title: "Game Board",
        passProps: {username: this.state.username}
    })
  },
  render: function() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }} onPress={() => this.setState({ promptVisible: true })}>
            Join the Room
          </Text>
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

// btile
var {width, height} = require('Dimensions').get('window');
var SIZE = 4; // four-by-four grid
var CELL_SIZE = Math.floor(width * .125); // 20% of the screen width
var CELL_PADDING = Math.floor(CELL_SIZE * .05); // 5% of the cell size
var BORDER_RADIUS = CELL_PADDING * 2;
var TILE_SIZE = CELL_SIZE - CELL_PADDING * 2;
var LETTER_SIZE = Math.floor(TILE_SIZE * .75);

// ctile
var {width, height} = require('Dimensions').get('window');
var SIZE = 4;
var CELL_SIZE1 =  Math.floor(width * .30);
var CELL_PADDING1 = Math.floor(CELL_SIZE1 * .05);
var BORDER_RADIUS1 = CELL_PADDING1 * 2;
var TILE_SIZE1 = CELL_SIZE1 - CELL_PADDING1 * 2;
var LETTER_SIZE1 = Math.floor(TILE_SIZE1 * .75);

var BoardView = React.createClass({
  getInitialState: function() {
    return {
      username: this.props.username,
      coin: [],
      userCard: []
    }
  },
  performAction(actionObject){
    this.state.socket.emit('action', actionObject)
  },
  render() {
    return <View style={styles.container}>
            <View style={styles.bcontainer}>
             {this.renderTiles()}
             </View>
           </View>
  },
  renderTiles(){
    return (
      <View style={styles.container}>
        <View style={{marginTop: 37.5, flex:.5}}>
          <View key={1} style={[styles.btile, {
            left: 1 * CELL_SIZE + CELL_PADDING,
            top: 0 * CELL_SIZE + CELL_PADDING}]}>
            <Image
              source={require('./imagesExporter')}>
            </Image>
          </View>
          <View key={2} style={[styles.btile, {
            left: 2 * CELL_SIZE + CELL_PADDING,
            top: 0 * CELL_SIZE + CELL_PADDING}]}>
            <Image
              source={require('./imagesExporter')}>
            </Image>
          </View>
          <View key={4} style={[styles.btile, {
            left: 0 * CELL_SIZE + CELL_PADDING,
            top: 1 * CELL_SIZE + CELL_PADDING}]}>
            <Image
              source={require('./imagesExporter')}>
            </Image>
          </View>
          <View key={7} style={[styles.btile, {
            left: 3 * CELL_SIZE + CELL_PADDING,
            top: 1 * CELL_SIZE + CELL_PADDING}]}>
            <Image
              source={require('./imagesExporter')}>
            </Image>
          </View>
          <View key={8} style={[styles.btile, {
            left: 0 * CELL_SIZE + CELL_PADDING,
            top: 2 * CELL_SIZE + CELL_PADDING}]}>
            <Image
              source={require('./imagesExporter')}>
            </Image>
          </View>
          <View key={11} style={[styles.btile, {
            left: 3 * CELL_SIZE + CELL_PADDING,
            top: 2 * CELL_SIZE + CELL_PADDING}]}>
            <Image
              source={require('./imagesExporter')}>
            </Image>
          </View>
          <View key={13} style={[styles.btile, {
            left: 1 * CELL_SIZE + CELL_PADDING,
            top: 3 * CELL_SIZE + CELL_PADDING}]}>
            <Image
              source={require('./imagesExporter')}>
            </Image>
          </View>
          <View key={14} style={[styles.btile, {
            left: 2 * CELL_SIZE + CELL_PADDING,
            top: 3 * CELL_SIZE + CELL_PADDING}]}>
            <Image
              source={require('./imagesExporter')}>
            </Image>
          </View>
        </View>

        <View style={{flex:.5}}>
          <View key={1} style={[styles.ctile, {
            left: .2 * CELL_SIZE + CELL_PADDING,
            top: 0 * CELL_SIZE + CELL_PADDING}]}>

              <Button onPress={this.performAction.bind(this, {player: this.state.username, action: "TAX"})} style={{backgroundColor: 'red'}} textStyle={{fontSize: 18}}>
              Taxes
              </Button>

              <Button onPress={this.income} style={{backgroundColor: 'red'}} textStyle={{fontSize: 18}}>
              Income
              </Button>

              <Button onPress={this.pressLogin} style={{backgroundColor: 'red'}} textStyle={{fontSize: 18}}>
              asdsad
              </Button>

              <Button onPress={this.pressLogin} style={{backgroundColor: 'red'}} textStyle={{fontSize: 18}}>
              Hello!
              </Button>

              <Button onPress={this.pressLogin} style={{backgroundColor: 'red'}} textStyle={{fontSize: 18}}>
              Hello!
              </Button>

              <Button onPress={this.pressLogin} style={{backgroundColor: 'red'}} textStyle={{fontSize: 18}}>
              Hello!
              </Button>

          </View>
        </View>

      </View>
    )
  }
});


var styles = StyleSheet.create({
  bcontainer: {
    width: CELL_SIZE * 7.8,
    height: CELL_SIZE * SIZE,
    backgroundColor: 'transparent',
  },
  btile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: '#BEE1D2',
  },
  ctile: {
    position: 'absolute',
    width: 1.5*TILE_SIZE1,
    height: 2*TILE_SIZE1,
    borderRadius: BORDER_RADIUS1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: '#BEE1D2',
  },
  letter: {
    color: '#333',
    fontSize: LETTER_SIZE,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: '#644B62',
  },
});


AppRegistry.registerComponent('Coup', () => Coup);
