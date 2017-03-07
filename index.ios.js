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
// var Sound = require('react-native-sound');
// Sound.setCategory('Playback');
// var whoosh = new Sound('./music.mp3', Sound.MAIN_BUNDLE, (error) => {
//   if (error) {
//     console.log('failed to load the sound', error);
//     return;
//   }
// });
// whoosh.play((success) => {
//   if (success) {
//     console.log('successfully finished playing');
//   } else {
//     console.log('playback failed due to audio decoding errors');
//   }
// });

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
      action: "",
      message: "game has not started yet and noone is in the room",
      gameStatus: 'not started'
    }
  },
  componentDidMount(){
    this.state.socket.on('gameEnd', (userObject) => {
      this.setState({
        message: "This game is Over! The Winner is " + userObject.username + "!",
        gameStatus: 'end'
      });
    })
    this.state.socket.on('newUser', (data) => {
      console.log("new user has come in and his username is ", data)
      this.setState({
        message: data + " has enter the room."
      })
      this.state.socket.emit('requestState', null)
    });
    this.state.socket.on('updateStatus', () => {
      this.state.socket.emit('requestState', null);
    });
    this.state.socket.on(this.state.username + 'newGameStatus', (data) => {
      var userInfo = data.filter((x) => {
        return x.username===this.state.username
      })
      console.log("I am this user: ", userInfo)
      this.setState({
        playerObjects: data,
        coin: userInfo.coins
      });
    });

    this.state.socket.emit('requestState', null);

    this.state.socket.on('BSchance', (data) => {
      var msg = data.player + ': ' + data.action + (data.targetPlayer ? ' on ' + data.targetPlayer : '') + '. Call Bullshit?'
      Alert.alert(msg, null,
            [{text: 'no', onPress: this.bsresponse.bind(this, false, data)},
              {text: 'yes', onPress: this.bsresponse.bind(this, true, data)}]
      );
    });

    this.state.socket.on('blockChance', (data) => {
      if ((data.action === "FOREIGN AID" && data.player !== this.state.username) || data.targetPlayer === this.state.username) {
        var msg = data.player + ': ' + data.action + (data.targetPlayer ? ' on you' : '') + '. Block?'
        var choiceArray = ((data.action === "STEAL") ?
        [{text: 'no', onPress: this.block.bind(this, false, data)},
        {text: 'yes (Capt)', onPress: this.block.bind(this, true, data, "BLOCK STEAL CAPTAIN")},
        {text: 'yes (Amb)', onPress: this.block.bind(this, true, data, "BLOCK STEAL AMBASSADOR")}]
        :
        [{text: 'no', onPress: this.block.bind(this, false, data, "BLOCK " + data.action)},
        {text: 'yes', onPress: this.block.bind(this, true, data, "BLOCK " + data.action)}]);
        Alert.alert(msg, null, choiceArray);
      }
    });

    this.state.socket.on(this.state.username, (data) => {

      console.log("asked to lose an influence");

      var currentUser = this.state.playerObjects.filter((x) => {
        return x.username===this.state.username
      })
      var currentcard0 = currentUser[0].influence[0].role.toString();
      var currentcard1 = currentUser[0].influence[1].role.toString();
      if(currentUser[0].influence[0].alive && currentUser[0].influence[1].alive){
        Alert.alert('You Loss the Bet! Which card to loss?',
                    null,
                  [{text: currentcard0, onPress: this.loseInfluence.bind(this, currentcard0, data)},
                  {text: currentcard1, onPress: this.loseInfluence.bind(this, currentcard1, data)}]
        );
      }else{
        if(currentUser[0].influence[0].alive){
          Alert.alert('You Loss the Bet! You are finish!',
                      null,
                    [{text: "Comfirm", onPress: this.loseInfluence.bind(this, currentcard0, data)}]);
        }else{
          Alert.alert('You Loss the Bet! You are finish!',
                      null,
                    [{text: "Comfirm", onPress: this.loseInfluence.bind(this, currentcard1, data)}]);
        }
      }
    });

    this.state.socket.on("errorMessage", (msg) => {
      this.setState({message: msg});
    });
   },
   startGame(){
     this.state.socket.emit('startGame', null);
   },
  performAction(actionObject){
    this.state.socket.emit('action', actionObject)
  },
  bsresponse(resp, data){
    this.state.socket.emit('BS', {username: this.state.username, bs: resp, action: data})
  },
  block(resp, data, newAction) {
    if (resp) {
      data.action = newAction;
      data.targetPlayer = data.player;
      data.player = this.state.username; //switch player and target for a block
    }
    this.state.socket.emit('block', {username: this.state.username, block: resp, action: data}) //TODO change action to block? maybe only if blocked?
  },
  loseInfluence(resp, data){
    data.chosenRole = resp;
    this.state.socket.emit("LostInfluence", data);
  },
  restart(){
    this.state.socket()
  },
  render() {
    return <View style={styles.container}>
             {this.renderTiles()}
           </View>
  },
  renderTiles(){
    var playerOn = this.state.playerObjects;
    if(!playerOn[0]){
      return null;
    }
    if(playerOn[0]){
      while(this.state.username !== playerOn[0].username){
        var element = playerOn.shift();
        playerOn.push(element);
      }
    }
    console.log("this is play deck card: ", playerOn)
    if(playerOn[0]){
    var currentcard0 = playerOn[0].influence[0].role;
    var currentcard1 = playerOn[0].influence[1].role;
    }
    if(playerOn[1]){
      var card0 = playerOn[1].influence[0].role;
      var card1 = playerOn[1].influence[1].role;
    }
    if(playerOn[2]){
      var card2 = playerOn[2].influence[0].role;
      var card3 = playerOn[2].influence[1].role;
    }
    if(playerOn[3]){
      var card4 = playerOn[3].influence[0].role;
      var card5 = playerOn[3].influence[1].role;
    }
    var targets = playerOn.map((x,index) => {
      if(index !== 0){
        return <Button key={index} style={{backgroundColor: "white"}} onPress={() => {
          this.state.socket.emit('action', {player: this.state.username, action: this.state.action, targetPlayer: x.username})
          this.setState({
            open: false
          })
        }}>{x.username}</Button>
      }
      return null
     });

    console.log("this is play deck card1111111: ", playerOn)
    return (
      <View style={{backgroundColor: 'transparent'}}>
      <Image source={require('./download.jpg')} style={styles.piccontainer}>
      </Image>
       <View style={styles.otherPlayerBox}>
            <View style={styles.user1}>
              <View style={{alignItems: 'center', flex: 8}}>
              {playerOn[1] ? (
                  <Image
                    source={picture[playerOn[1].influence[0].role]}>
                    {!playerOn[1].influence[0].alive ? (
                        <Text style={styles.deadtext}>DEAD</Text>
                    ) : null}
                  </Image>
                ) : ( <Image
                  source={picture.Facedown}>
                </Image> ) }
              </View>

              <View style={{alignItems: 'center', flex: 8}}>
              {playerOn[1] ? (
                  <Image
                    source={picture[playerOn[1].influence[1].role]}>
                    {!playerOn[1].influence[1].alive ? (
                      <Text style={styles.deadtext}>DEAD</Text>
                    ) : null}
                  </Image>
                ) : ( <Image
                  source={picture.Facedown}>
                </Image> ) }
              </View>

              {playerOn[1] ? (
              <View style={styles.textBox}>
              <Text style={{textAlign: 'center', flex: 1}}>{playerOn[1].username}</Text>
              <Text style={{textAlign: 'center', flex: 1}}>Coins: {playerOn[1].coins}</Text>
              </View>
              ) : (
              <View style={styles.textBox}>
              <Text style={{textAlign: 'center', flex: 2}}>No Player</Text>
              </View>
              )}
            </View>

            <View style={styles.user2}>

                      <View style={{flex: 1}}>
                      {playerOn[2] ? (
                          <Image
                            source={picture[playerOn[2].influence[0].role]}>
                            {!playerOn[2].influence[0].alive ? (

                              <Text style={styles.deadtext}>DEAD</Text>

                            ) : null}
                          </Image>
                        ) : ( <Image
                          source={picture.Facedown}>
                        </Image> ) }
                      </View>

                      <View style={{ flex: 1}}>
                      {playerOn[2] ? (
                          <Image
                            source={picture[playerOn[2].influence[1].role]}>
                            {!playerOn[2].influence[1].alive ? (

                              <Text style={styles.deadtext}>DEAD</Text>

                            ) : null}
                          </Image>
                        ) : ( <Image
                          source={picture.Facedown}>
                        </Image> ) }
                      </View>

                      {playerOn[2] ? (
                      <View style={styles.textBox}>
                      <Text style={{textAlign: 'center', flex: 1}}>{playerOn[2].username}</Text>
                      <Text style={{textAlign: 'center', flex: 1}}>Coins: {playerOn[2].coins}</Text>
                      </View>
                      ) : (
                      <View style={styles.textBox}>
                      <Text style={{textAlign: 'center', flex: 2}}>No Player</Text>
                      </View>
                      )}
            </View>

            <View style={styles.user3}>
                <View style={{alignItems: 'center', flex: 8}}>
                  {playerOn[3] ? (
                    <Image
                      source={picture[playerOn[3].influence[0].role]}>
                      {!playerOn[3].influence[0].alive ? (

                        <Text style={styles.deadtext}>DEAD</Text>

                      ) : null}
                    </Image>
                  ) : ( <Image
                    source={picture.Facedown}>
                  </Image> ) }
                </View>

                <View style={{alignItems: 'center', flex: 8}}>
                  {playerOn[3] ? (
                      <Image
                        source={picture[playerOn[3].influence[1].role]}>
                        {!playerOn[3].influence[1].alive ? (

                          <Text style={styles.deadtext}>DEAD</Text>

                        ) : null}
                      </Image>
                    ) : ( <Image
                      source={picture.Facedown}>
                    </Image> ) }
                </View>

                  {playerOn[3] ? (
                  <View style={styles.textBox}>
                  <Text style={{textAlign: 'center', flex: 1}}>{playerOn[3].username}</Text>
                  <Text style={{textAlign: 'center', flex: 1}}>Coins: {playerOn[3].coins}</Text>
                  </View>
                  ) : (
                  <View style={styles.textBox}>
                  <Text style={{textAlign: 'center', flex: 2}}>No Player</Text>
                  </View>
                  )}
            </View>
        </View>

            <View style={styles.userContainer}>
                {playerOn[0] ? (
                <Text style={{textAlign: 'center', flex: 1, backgroundColor: "transparent"}}>{playerOn[0].username} </Text>
              ) : (<Text style={{textAlign: 'center', flex: 1, backgroundColor: "transparent"}}>"No Player"</Text>)}
                <View style={{flex: 1}}>
                    <Image
                      source={picture[playerOn[0].influence[0].role]}>
                      {!playerOn[0].influence[0].alive ? (

                          <Text style={styles.deadtext}>DEAD</Text>

                      ) : null}
                    </Image>
                </View>

                <View style={{ flex: 1}}>
                    <Image
                      source={picture[playerOn[0].influence[1].role]}>
                      {!playerOn[0].influence[1].alive ? (
                        <Text style={styles.deadtext}>DEAD</Text>
                      ) : null}
                    </Image>
                </View>
                {playerOn[0] ? (
                <Text style={{textAlign: 'center', flex: 1,backgroundColor: "transparent"}}>Coins: {playerOn[0].coins}</Text>
              ) : (<Text style={{textAlign: 'center', flex: 1, backgroundColor: "transparent"}}></Text>)}
            </View>

            {(playerOn[0].coins < 10) ? (
            <View style={styles.userAction}>
              <View style={{flex: 1}}>
                <Button style={{borderWidth: 1, borderColor: 'black', backgroundColor: "white", borderRadius: 70}} onPress={this.performAction.bind(this, {player: this.state.username, action: "TAX"})}  textStyle={{fontSize: 10}}>
                  Taxes
                </Button>
              </View>

              <View style={{flex: 1}}>
                <Button style={{borderWidth: 1, borderColor: 'black', backgroundColor: "white", borderRadius: 70}} onPress={this.performAction.bind(this, {player: this.state.username, action: "INCOME"})}    textStyle={{fontSize: 10}}>
                  Income
                </Button>
              </View>

              <View style={{flex: 1}}>
                  <Button style={{borderWidth: 1, borderColor: 'black', backgroundColor: "white", borderRadius: 70}} onPress={this.performAction.bind(this, {player: this.state.username, action: "FOREIGN AID"})}    textStyle={{fontSize: 10}}>
                  Foreign Aid
                  </Button>
              </View>

              <View style={{flex: 1}}>
              <Button style={{borderWidth: 1, borderColor: 'black', backgroundColor: "white", borderRadius: 70}} onPress={() => this.setState({action: "STEAL", open: true})}   textStyle={{fontSize: 10}}>
                Steal
                </Button>
              </View>

              <View style={{flex: 1}}>
              <Button style={{borderWidth: 1, borderColor: 'black', backgroundColor: "white", borderRadius: 70}} onPress={() => this.setState({action: "EXCHANGE", open: true})}   textStyle={{fontSize: 10}}>
                Exchange
                </Button>
              </View>

              {(playerOn[0].coins >= 3) ? (
              <View style={{flex: 1}}>
              <Button style={{borderWidth: 1, borderColor: 'black', backgroundColor: "white", borderRadius: 70}} onPress={() => this.setState({action: "ASSASSINATE", open: true})} textStyle={{fontSize: 10}}>
                Assassin
              </Button>
              </View>
                ) : null}

              {(playerOn[0].coins>= 7) ? (
              <View style={{ flex: 1}}>

                    <Button style={{borderWidth: 1, borderColor: 'black', backgroundColor: "white", borderRadius: 70}} onPress={() => this.setState({action: "COUP", open: true})}   textStyle={{fontSize: 10}}>
                      Coup
                    </Button>
              </View>
              ) : null}

            </View>
            ) : (
              <View style={styles.userAction}>
              <View style={{ flex: 1}}>
              <Button style={{borderWidth: 1, borderColor: 'black', backgroundColor: "white"}} onPress={() => this.setState({action: "COUP", open: true})}   textStyle={{fontSize: 12}}>
                Coup
              </Button>
              </View>
            </View>
              )
            }
            <View style={styles.ButtonBack}>
            <Modal
               offset={-100}
               open={this.state.open}
               modalDidOpen={() => console.log('modal did open')}
               modalDidClose={() => this.setState({open: false})}
               style={{alignItems: 'center', position: 'absolute', top: 100, backgroundColor: 'transparent'}}>
               <View style={{backgroundColor: "transparent"}}>
                  {targets}
                  <Button style={{backgroundColor: "white"}} onPress={() => this.setState({open: false})}>
                  Close
                  </Button>
               </View>
             </Modal>
             </View>

            <View style={styles.notif}>
              <Text style={{textAlign: 'center', flex: 1, fontWeight: 'bold'}}>{this.state.message}</Text>
              {this.state.gameStatus === 'end' ? (
                <Button style={{borderWidth: 1, borderColor: 'black', backgroundColor: "white", borderRadius: 70}} onPress={this.restart()} textStyle={{fontSize: 10}}>
                  Restart
                </Button>
              ) : null}
            </View>
     </View>
    )
  }
});


var styles = StyleSheet.create({
  container: {
    width: Style.DEVICE_WIDTH,
    height: Style.CARD_HEIGHT,
    backgroundColor: "transparent"
  },
  modalContainer: {

  },
  deadpic: {
    flex: 1,
    backgroundColor: 'gray',
    opacity: 0.3,
  },
  deadtext: {
    fontSize: 30,
    color: 'red',
    backgroundColor: "transparent",
    fontWeight: '900',
    fontFamily: 'Futura-CondensedExtraBold',
    position: 'absolute',
    top: 25,
    left: 5,
    transform: [{rotate: '25deg'}]
  },
  piccontainer: {
    width: Style.DEVICE_WIDTH,
    height: Style.DEVICE_HEIGHT,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: -999
  },
  otherPlayerBox: {
    width: Style.DEVICE_WIDTH,
    height: Style.CARD_HEIGHT/3,
    flex: 3,
    marginTop: Style.CARD_WIDTH/16,
    // backgroundColor: "pink",
    position: 'absolute',
    left: 0,
    top: 0,
    flexDirection: 'row'
  },
  textBox: {
    width: Style.DEVICE_WIDTH/4,
    backgroundColor: "transparent",
    position: 'absolute',
    left: 0,
    top: Style.CARD_HEIGHT/4,
    flexDirection: 'row'
  },
  user1: {
    // width: Style.CARD_WIDTH/5,
    // height: Style.CARD_HEIGHT*5.5/10,
    // marginTop: Style.CARD_WIDTH/16,
    // backgroundColor: "red",
    position: 'absolute',
    left:     0,
    top:      0,
    flex: 1,
    flexDirection: 'row'
  },
  user2: {
    // width: Style.DEVICE_WIDTH/2,
    // height: Style.CARD_HEIGHT/4,
    // marginTop: Style.CARD_WIDTH/16,
    // backgroundColor: "green",
    position: 'absolute',
    left:     Style.DEVICE_WIDTH/2.7,
    top:      0,
    flex: 1,
    flexDirection: 'row'
  },
  user3: {
    // width: Style.CARD_WIDTH/5,
    // height: Style.CARD_HEIGHT*5.5/10,
    // marginTop: Style.CARD_WIDTH/16,
    // backgroundColor: "blue",
    position: 'absolute',
    right:     0,
    top:      0,
    flex: 1,
    flexDirection: 'row'
  },
  userContainer: {
    width: Style.DEVICE_WIDTH/2,
    height: Style.CARD_HEIGHT/4,
    marginTop: Style.CARD_WIDTH/16,
    // backgroundColor: "black",
    position: 'absolute',
    left:     Style.DEVICE_WIDTH/4,
    bottom: -Style.DEVICE_HEIGHT,
    flex: 6,
    flexDirection: 'row'
  },
  userAction: {
    width: Style.DEVICE_WIDTH/2,
    height: Style.CARD_HEIGHT/8,
    marginTop: Style.CARD_WIDTH/16,
    // backgroundColor: "purple",
    position: 'absolute',
    left:     Style.DEVICE_WIDTH/4,
    bottom: -Style.DEVICE_HEIGHT/4*3,
    flex: 6,
    flexDirection: 'row'
  },
  ButtonBack: {
    position: 'absolute',
    left:     Style.DEVICE_WIDTH/3,
    top: Style.DEVICE_HEIGHT/4,
    zIndex: 99, width: 200,
    backgroundColor: "transparent"
  },
  notif: {
    width: Style.DEVICE_WIDTH/2,
    height: Style.CARD_HEIGHT/8,
    marginTop: Style.CARD_WIDTH/16,
    backgroundColor: "transparent",
    // backgroundColor: "purple",
    position: 'absolute',
    left:     Style.DEVICE_WIDTH/4,
    bottom: -Style.DEVICE_HEIGHT/5*3,
    flex: 1,
    flexDirection: 'row'
  }
});


AppRegistry.registerComponent('Coup', () => Coup);
