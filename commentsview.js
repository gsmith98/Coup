'use strict';

import React, { Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image
} from 'react-native';
var {width, height} = require('Dimensions').get('window');
var SIZE = 4; // four-by-four grid
var CELL_SIZE = Math.floor(width * .30); // 20% of the screen width
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
            left: .2 * CELL_SIZE + CELL_PADDING,
            top: 0 * CELL_SIZE + CELL_PADDING}]}>
            <Text>
            Lisa - taxed (6 coins)
            Graham - stole from Junjie (8 coins)
            </Text>
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
    width: 1.5*TILE_SIZE,
    height: 2*TILE_SIZE,
    borderRadius: BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#BEE1D2',
  },
});

module.exports = BoardView;
