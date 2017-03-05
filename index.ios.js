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
  Alert,
  AsyncStorage,
  Image
} from 'react-native';

window.navigator.userAgent = "react-native";
import SocketIOClient from 'socket.io-client';

var Orientation = require('react-native-orientation')
import Modal from 'react-native-simple-modal';

var picture = {
    Duke: require('./images/duke1.png'),
    Contessa: require('./images/contessa1.png'),
    Captain: require('./images/captain1.png'),
    Assassin: require('./images/assassin1.png'),
    Facedown: require('./images/coup1.png'),
    Ambassador: require('./images/ambassador1.png')
};

export default class Coup extends Component {
  constructor(props) {
    super(props);
    this.socket = SocketIOClient('http://localhost:8080', {
      transports: ['websocket']
    })
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
      socket: SocketIOClient('http://localhost:8080', {
        transports: ['websocket']
      })
    }
  },
   signIn(username) {
    var self = this;
    this.setState({
      promptVisible: false,
      username: username
    })
    console.log("signing in!")
    this.state.socket.emit('username', username);
    this.props.navigator.push({
        component: BoardView,
        title: "Game Board",
        passProps: {username: username, socket: this.state.socket}
    })
  },
  render: function() {
    return (

          <Image
          source={require('./images/landing.jpeg')}
          style={{width:null, height:null, flex: 1, opacity: 0.75, justifyContent: 'center', alignItems: 'center'}}
          resizeMode = "stretch">
          <Button style={{ alignSelf:'center', marginTop:20, padding:10, height:45, width: 300, overflow:'hidden', borderRadius:12, backgroundColor: 'white'}} textStyle={{fontSize: 18}} onPress={() => this.setState({ promptVisible: true })}>Join the games</Button>
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

          </Image>

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
      playerObjects: [],
      username: this.props.username,
      coin: 2,
      socket: this.props.socket,
      open: false,
      action: ""
    }
  },
  componentDidMount(){
    this.state.socket.on(this.state.username + 'newGameStatus', (data) => {
      var userInfo = data.filter((x) => {
        return x.username===this.state.username
      })
      console.log("I am this user: ", userInfo)
      this.setState({
        playerObjects: data,
        coin: userInfo.coins
      })
    });

    this.state.socket.emit('requestState', null);

    this.state.socket.on('BSchance', (data) => {
        Alert.alert('Call Bullshit?',
                    null,
                  [{text: 'no', onPress: this.bsresponse.bind(this, false, data)},
                  {text: 'yes', onPress: this.bsresponse.bind(this, true, data)}]
        );
    });
    this.state.socket.on(this.state.username, (data) => {
      //TODO need to pick an influence card to lose
      console.log("asked to lose an influence");
      var choice = "TODO CHOICE NOT MADE"; //TODO make actual choice
      data.chosenRole = choice;
      this.state.socket.emit("LostInfluence", data);
    });
   },
  performAction(actionObject){
    this.state.socket.emit('action', actionObject)
  },
  bsresponse(resp, data){
    this.state.socket.emit('BS', {username: this.state.username, bs: resp, action: data})
  },
  render() {
    return <View style={styles.container}>
            <View style={styles.bcontainer}>
             {this.renderTiles()}
             </View>
           </View>
  },
  renderTiles(){
    var otherUser = this.state.playerObjects.filter((x) => {
      return x.username!==this.state.username
    })
    var currentUser = this.state.playerObjects.filter((x) => {
      return x.username===this.state.username
    })
    var targets = otherUser.map((x) => {
       return <Button onPress={() => {this.state.socket.emit('action', {player: this.state.username, action: this.state.action, targetPlayer: x.username})}}>{x.username}</Button>
     });
    if(currentUser[0]){
      console.log(currentUser[0] + "asdasdsadasdasasszxxzcxczcxczcz")
      var currentcard0 = currentUser[0].influence[0].role.toString();
      var currentcard1 = currentUser[0].influence[1].role.toString();
    }
    if(otherUser[0]){
      console.log(otherUser[0] + "asdasdsadasdasasszxxzcxczcxczcz")
      var card0 = otherUser[0].influence[0].role.toString();
      var card1 = otherUser[0].influence[1].role.toString();
    }
    if(otherUser[1]){
      var card2 = otherUser[1].influence[0].role.toString();
      var card3 = otherUser[1].influence[1].role.toString();
    }
    if(otherUser[2]){
      var card4 = otherUser[2].influence[0].role.toString();
      var card5 = otherUser[2].influence[1].role.toString();
    }

    return (
      <View style={styles.container}>
        <View style={{marginTop: 37.5, flex:.5}}>
          <View key={1} style={[styles.btile, {
            left: 1 * CELL_SIZE + CELL_PADDING,
            top: 0 * CELL_SIZE + CELL_PADDING}]}>
            {otherUser[0] ? (
              <Image
                source={picture[card0]}>
              </Image>
            ) : ( <Image
              source={picture.Facedown}>
            </Image> ) }
          </View>
          <View key={2} style={[styles.btile, {
            left: 2 * CELL_SIZE + CELL_PADDING,
            top: 0 * CELL_SIZE + CELL_PADDING}]}>
            {otherUser[0] ? (
              <Image
                source={picture[card1]}>
              </Image>
            ) : ( <Image
              source={picture.Facedown}>
            </Image> ) }
          </View>
          <View key={4} style={[styles.btile, {
            left: 0 * CELL_SIZE + CELL_PADDING,
            top: 1 * CELL_SIZE + CELL_PADDING}]}>
            {otherUser[1] ? (
              <Image
                source={picture[card2]}>
              </Image>
            ) : ( <Image
              source={picture.Facedown}>
            </Image> ) }
          </View>
          <View key={7} style={[styles.btile, {
            left: 3 * CELL_SIZE + CELL_PADDING,
            top: 1 * CELL_SIZE + CELL_PADDING}]}>
            {otherUser[1] ? (
              <Image
                source={picture[card3]}>
              </Image>
            ) : ( <Image
              source={picture.Facedown}>
            </Image> ) }
          </View>
          <View key={8} style={[styles.btile, {
            left: 0 * CELL_SIZE + CELL_PADDING,
            top: 2 * CELL_SIZE + CELL_PADDING}]}>
            {otherUser[2] ? (
              <Image
                source={picture[card3]}>
              </Image>
            ) : ( <Image
              source={picture.Facedown}>
            </Image> ) }
          </View>
          <View key={11} style={[styles.btile, {
            left: 3 * CELL_SIZE + CELL_PADDING,
            top: 2 * CELL_SIZE + CELL_PADDING}]}>
            {otherUser[3] ? (
              <Image
                source={picture[card4]}>
              </Image>
            ) : ( <Image
              source={picture.Facedown}>
            </Image> ) }
          </View>
          <View key={13} style={[styles.btile, {
            left: 1 * CELL_SIZE + CELL_PADDING,
            top: 3 * CELL_SIZE + CELL_PADDING}]}>
            {currentUser[0] ? (
              <Image
                source={picture[currentcard0]}>
              </Image>
            ) : ( <Image
              source={picture.Facedown}>
            </Image> ) }
          </View>
          <View key={14} style={[styles.btile, {
            left: 2 * CELL_SIZE + CELL_PADDING,
            top: 3 * CELL_SIZE + CELL_PADDING}]}>
            {currentUser[0] ? (
              <Image
                source={picture[currentcard1]}>
               <Text> {this.state.coin} </Text>
              </Image>
            ) : ( <Image
              source={picture.Facedown}>
            </Image> ) }
          </View>
        </View>

        <View style={{flex:.5}}>
          <View key={1} style={[styles.ctile, {
            left: .2 * CELL_SIZE + CELL_PADDING,
            top: 0 * CELL_SIZE + CELL_PADDING}]}>

              <Button onPress={this.performAction.bind(this, {player: this.state.username, action: "TAX"})} style={{backgroundColor: 'red'}} textStyle={{fontSize: 18}}>
              Taxes
              </Button>

              <Button onPress={this.performAction.bind(this, {player: this.state.username, action: "INCOME"})} style={{backgroundColor: 'red'}}  style={{backgroundColor: 'red'}} textStyle={{fontSize: 18}}>
              Income
              </Button>

              <Button onPress={this.performAction.bind(this, {player: this.state.username, action: "FOREIGN AID"})} style={{backgroundColor: 'red'}}  style={{backgroundColor: 'red'}} textStyle={{fontSize: 18}}>
              Foreign Aid
              </Button>

              <Button onPress={this.performAction.bind(this, {player: this.state.username, action: "EXCHANGE"})} style={{backgroundColor: 'red'}} style={{backgroundColor: 'red'}} textStyle={{fontSize: 18}}>
              Ambassador/Exchange 2 cards
              </Button>

              <Button onPress={() => this.setState({action: "STEAL", open: true})} style={{backgroundColor: 'red'}} style={{backgroundColor: 'red'}} textStyle={{fontSize: 18}}>
              Steal
              </Button>

              {(this.state.coins >= 3) ? (
                <Button onPress={this.performAction.bind(this, {player: this.state.username, action: "ASSASSINATE"})} style={{backgroundColor: 'red'}}  style={{backgroundColor: 'red'}} textStyle={{fontSize: 18}}>
                Assassin
                </Button>
                ) : null}

              {(this.state.coins >= 7) ? (
                <Button onPress={this.performAction.bind(this, {player: this.state.username, action: "COUP"})} style={{backgroundColor: 'red'}} style={{backgroundColor: 'red'}} textStyle={{fontSize: 18}}>
                Coup
                </Button>
                ) : null}

                <Modal
                   offset={this.state.offset}
                   open={this.state.open}
                   modalDidOpen={() => console.log('modal did open')}
                   modalDidClose={() => this.setState({open: false})}
                   style={{alignItems: 'center'}}>
                   <View>
                      {targets}
                   </View>
                </Modal>

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
  landborder: {
    width: width,
    marginTop: 65,
    height: height - 65,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderWidth: 30,
    borderColor: 'maroon',
  },
});


AppRegistry.registerComponent('Coup', () => Coup);
