import React, { Component } from 'react';
import {
  StyleSheet,
  WebView,
  View,
  Dimensions,
  Platform,
  Text
} from 'react-native';

//const window = Dimensions.get('window');

export default class MainView extends Component {
  static propTypes = {
  };

  constructor(props) {
    super(props);

    this.state = {
      webviewLoadCompleted: false
    };
  }

  componentDidMount() {
  }

  onWebViewError(error) {
    console.log('web view error', error);

    this.setState({webviewError: error});
  }

  onWebViewLoadStarted() {
    console.log('web view load started');
  }

  onWebViewLoaded() {
    console.log('web view loaded');

    this.setState({webviewLoadCompleted: true});
  }

  createLoadingView(error) {
    const msg = error || 'loading..';

    return (
      <View style={styles.loadingView}>
        <Text style={styles.titleText}>
          tunnel.blast
        </Text>
        <Text style={styles.loadingText}>
          {msg}
        </Text>
      </View>
    );
  }

  render() {
    let loadingView;

    if (!this.state.webviewLoadCompleted || this.state.webviewError) {
      loadingView = this.createLoadingView(this.state.webviewError);
    }

    return (
      <View style={styles.view}>
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
        />
        {loadingView}
      </View>
    );
  }
}

const window = Dimensions.get('window');
const titleFontFamily = (Platform.OS === 'ios') ? 'HelveticaNeue-CondensedBold' : 'Roboto';
const loadingFontFamily = (Platform.OS === 'ios') ? 'HelveticaNeue-Light' : 'Roboto';

console.log('fonts', titleFontFamily, loadingFontFamily);

const styles = StyleSheet.create({
  view: {
    flex: 1,
    height: window.height,
  },
  webView: {
    backgroundColor: 'red'
  },
  loadingView: {
    flex: 1,
    height: window.height,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: titleFontFamily,
    fontSize: 34,
    textAlign: 'center',
    color: 'white'
  },
  loadingText: {
    fontFamily: loadingFontFamily,
    fontSize: 18,
    textAlign: 'center',
    color: 'white'
  }
});
