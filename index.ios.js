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
import Style from "./Style";
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
  componentDidMount(){
    // var self = this;
    // AsyncStorage.getItem('user').then(result => {
    // var parsedResult = JSON.parse(result);
    // var username = parsedResult.username;
    // console.log("AsyncStorage: ",username)
    // if (username) {
    //         self.props.navigator.push({
    //           component: BoardView,
    //           title: "Game Board",
    //           passProps: {username: username, socket: this.state.socket}
    //         })
    //     }
    // })
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
    this.state.socket.on('newUser', (data) => {
      console.log("new user has come in and his username is ", data)
      this.state.socket.emit('requestState', null)
    });
    this.state.socket.on(this.state.username + 'newGameStatus', (data) => {
      var userInfo = data.filter((x) => {
        return x.username===this.state.username
      })
      console.log("asdsasadadssadasd: ", data)
      this.setState({
        playerObjects: data,
        coin: userInfo.coins
      })
    });
    this.state.socket.emit('requestState', null);

    this.state.socket.on('BSchance', () => {
        Alert.alert('Call Bullshit?',
                    null,
                  [{text: 'no', onPress: this.bsresponse.bind(this, false)},
                  {text: 'yes', onPress: this.bsresponse.bind(this, true)}]
        );
    });
    this.state.socket.on(this.state.username, (data) => {
      //TODO need to pick an influence card to lose
    });
   },
  performAction(actionObject){
    this.state.socket.emit('action', actionObject)
  },
  bsresponse(resp){
    this.state.socket.emit('BS', {username: this.state.username, bs: resp})
  },
  render() {
    return <View style={styles.container}>
             {this.renderTiles()}
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
      console.log(currentUser[0] + " is the current user!")
      var currentcard0 = currentUser[0].influence[0].role.toString();
      var currentcard1 = currentUser[0].influence[1].role.toString();
    }
    if(otherUser[0]){
      console.log(otherUser[0] + " is the other user!")
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
      <View>

          {otherUser[0] ? (
            <View style={styles.user1}>
              <Text style={{alignItems: 'center'}}>{otherUser[0].username}</Text>

            </View>
          ) : null }
            <View style={styles.user2}>

            </View>

            <View style={styles.user3}>

            </View>

            <View style={styles.userAction}>

            </View>

            <View style={styles.userContainer}>

            </View>
      </View>
    )
  }
});


var styles = StyleSheet.create({
  container: {
    width: Style.CARD_WIDTH,
    height: Style.CARD_HEIGHT,
  },
  user1: {
    width: Style.CARD_WIDTH/4,
    height: Style.CARD_HEIGHT*5.5/10,
    marginTop: Style.CARD_WIDTH/16,
    backgroundColor: "red",
    position: 'absolute',
    left:     0,
    top:      0,
  },
  user2: {

  },
  user3: {
    width: Style.CARD_WIDTH/4,
    height: Style.CARD_HEIGHT*5.5/10,
    marginTop: Style.CARD_WIDTH/16,
    backgroundColor: "blue",
    position: 'absolute',
    right:     0,
    top:      0,

  },
  userContainer: {

  }
});


AppRegistry.registerComponent('Coup', () => Coup);
