/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';

var Orientation = require('react-native-orientation')

export default class Coup extends Component {

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.tile}>
          <Text style={styles.letter}>
            L
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#644B62',
  },
  tile: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#BEE1D2',
  },
  letter: {
    color: '#333',
    fontSize: 80,
  },
});

AppRegistry.registerComponent('Coup', () => Coup);
