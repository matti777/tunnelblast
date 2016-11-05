import React, { Component } from 'react';
import {
  StyleSheet,
  WebView,
  View
} from 'react-native';

//const window = Dimensions.get('window');

export default class MainView extends Component {
  static propTypes = {
  };

  constructor(props) {
    super(props);

    this.state = {}
  }

  componentDidMount() {
  }

  onWebViewError(error, foo) {
    console.log('web view error', error, foo);
  }

  onWebViewLoadStarted() {
    console.log('web view load started');
  }

  onWebViewLoaded() {
    console.log('web view loaded');
  }

  render() {
    return (
      <WebView
        style={styles.webView}
        mediaPlaybackRequiresUserAction={false}
        onError={this.onWebViewError.bind(this)}
        onLoadStart={this.onWebViewLoadStarted.bind(this)}
        onLoad={this.onWebViewLoaded.bind(this)}
        bounces={false}
        scrollEnabled={false}
        automaticallyAdjustContentInsets={false}
        source={{uri: 'html/index.html'}}
      //  source={{uri: 'http://192.168.1.67:8000'}}
      />
    );
  }
}

const styles = StyleSheet.create({
  webView: {
    backgroundColor: 'red'
  }
});
