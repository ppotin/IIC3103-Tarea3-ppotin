import React from 'react';
import {
  AsyncStorage,
  Dimensions,
  ImageBackground,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TouchableNativeFeedbackBase,
  RefreshControl,
  ListView,
} from 'react-native';

import {
  Container,
  Header,
  Title,
  Content,
  Button,
  Icon,
  List,
  ListItem,
  Thumbnail,
  Left,
  Right,
  Body,
} from 'native-base';

import {Text} from 'galio-framework';

import Ionicons from 'react-native-vector-icons/Ionicons';
import chatFeedStyle from '../../css/chatFeedStyle';
import Constants from '../../parameters';
import {SearchBar, ThemeConsumer, Badge} from 'react-native-elements';
import Images from '../../img/Images';
import profileStyle from '../../css/profileStyle';
import theme from '../../css/theme';

const x = Constants.ip;
const IconComponent = Ionicons;
const {width, height} = Dimensions.get('screen');
var self;

export default class Chat_feed extends React.Component {
  constructor(props) {
    super(props);
    self = this;
    this.state = {
      currentUserId: undefined,
      chats: [],
      receiver: 'usuario',
      search: '',
      fetching: false,
      refreshing: false,
    };
    this.fetchChats = this.fetchChats.bind(this);
  }

  static navigationOptions = ({navigation}) => {
    const {params = {}} = navigation.state;
    if (params.fetching) {
      var r = (
        <View style={{padding: 10, marginLeft: 20}}>
          <ActivityIndicator size="small" color={theme.COLORS.LIGHT_BLUE} />
        </View>
      );
    } else {
      var r = (
        <TouchableOpacity
          // El navigation de props reemplaza el this.props.navigation
          onPress={() => params.refresh()}>
          <IconComponent
            name={Platform.OS === 'ios' ? 'ios-refresh' : 'md-refresh'}
            color={theme.COLORS.LIGHT_BLUE}
            size={24}
            style={{padding: 10, marginLeft: 20}}
          />
        </TouchableOpacity>
      );
    }
    return {
      headerLeft: () => r,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('NewChat', {
              currentUserId: navigation.getParam('currentUserId'),
            });
          }}>
          <IconComponent
            name={Platform.OS === 'ios' ? 'ios-add' : 'md-add'}
            color={theme.COLORS.LIGHT_BLUE}
            size={27}
            style={{padding: 10, marginRight: 20}}
          />
        </TouchableOpacity>
      ),
    };
  };

  async componentDidMount() {
    this.props.navigation.setParams({
      refresh: this.fetchChats,
      fetching: this.state.fetching,
    });
    this.props.navigation.addListener('didFocus', async () => {
      await this.fetchChats();
    });
  }

  async fetchChats() {
    this.props.navigation.setParams({
      fetching: true,
    });
    try {
      const token = await AsyncStorage.getItem('token');
      this.state.token = token;
      if (token != null) {
        // alert(token);
      }
    } catch (e) {
      console.log('Error fetching user', e);
      alert('no funca');
    }

    fetch(x + '/users/myuser', {
      headers: {
        Authorization: 'Bearer ' + this.state.token,
        Accept: 'application/json',
      },
    })
      .then(response => response.json())
      .then(res => {
        this.setState({
          currentUserId: res.data.attributes.id,
        });
        this.props.navigation.setParams({
          currentUserId: res.data.attributes.id,
        });
      })
      .catch(e =>
        alert(
          'algo salio mal al cargar mi perfil, estas conectado a internet?',
        ),
      );

    fetch(x + '/chats/mychats', {
      headers: {
        Authorization: 'Bearer ' + this.state.token,
        Accept: 'application/json',
      },
    })
      .then(response => response.json())
      .then(res => {
        console.log(res);
        this.setState({
          chats: res.data,
        });
        this.props.navigation.setParams({
          fetching: false,
        });
      })
      .catch(e =>
        // eslint-disable-next-line no-alert
        alert(e),
      );
  }

  updateSearch = search => {
    this.setState({search});
  };

  render() {
    var myloop = [];
    for (let i = this.state.chats.length - 1; i >= 0; i--) {
      var receiverName = '';
      var receiverSurname = '';
      var receiverImage = '';
      var noLeidos = 0;
      var badge = <View />;
      if (
        this.state.currentUserId ===
        this.state.chats[i].attributes['first-user'].id
      ) {
        receiverName = this.state.chats[i].attributes['second-user'].name;
        receiverSurname = this.state.chats[i].attributes['second-user'].surname;
        receiverImage = this.state.chats[i].attributes['second-user'].userImage;
      } else {
        receiverName = this.state.chats[i].attributes['first-user'].name;
        receiverSurname = this.state.chats[i].attributes['first-user'].surname;
        receiverImage = this.state.chats[i].attributes['first-user'].userImage;
      }
      for (
        let j = this.state.chats[i].attributes.messages.length - 1;
        j >= 0;
        j--
      ) {
        if (
          this.state.chats[i].attributes.messages[j].read === 0 &&
          this.state.chats[i].attributes.messages[j].user.id !==
            this.state.currentUserId
        ) {
          noLeidos += 1;
        }
      }
      if (noLeidos > 0) {
        badge = (
          <Badge
            status="error"
            containerStyle={{position: 'absolute', top: -4, right: -4}}
            value={noLeidos}
          />
        );
      }
      if (
        this.state.chats[i].attributes.title
          .toLowerCase()
          .includes(this.state.search.toLowerCase()) ||
        receiver.toLowerCase().includes(this.state.search.toLowerCase())
      ) {
        myloop.push({
          key: i.toString(),
          id: this.state.chats[i].id,
          title: this.state.chats[i].attributes.title,
          badge: badge,
          createdAtOriginal: this.state.chats[i].attributes['created-at'],
          createdAt: this.state.chats[i].attributes['created-at'].substring(
            0,
            10,
          ),
          userName: receiverName,
          userSurname: receiverSurname,
          img: receiverImage,
        });
      }

      myloop.sort(function(a, b) {
        var keyA = a.createdAtOriginal,
          keyB = b.createdAtOriginal;
        if (keyA < keyB) return 1;
        if (keyA > keyB) return -1;
        return 0;
      });
    }
    return (
      <Container style={chatFeedStyle.container}>
        <Content
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={() => this._refreshListView()}
            />
          }>
          <List
            dataArray={myloop}
            renderRow={data => (
              <ListItem
                thumbnail
                key={data.id}
                style={{width: width * 0.9}}
                button={true}
                onPress={() => {
                  this.props.navigation.navigate('Chat', {
                    chatTitle: data.title,
                    chatId: data.id,
                  });
                }}>
                <Left>
                  <Thumbnail source={{uri: data.img}} />
                  {data.badge}
                </Left>
                <Body>
                  <Text>{data.title}</Text>
                  <Text numberOfLines={1} muted>
                    {data.userName} {''}
                    {data.userSurname}
                  </Text>
                </Body>

                <Right>
                  <Text muted>{data.createdAt}</Text>
                </Right>
              </ListItem>
            )}
          />
        </Content>
      </Container>
    );
  }
  _refreshControl() {
    return (
      <RefreshControl
        refreshing={this.state.refreshing}
        onRefresh={() => this._refreshListView()}
      />
    );
  }

  wait(timeout) {
    return new Promise(resolve => {
      setTimeout(resolve, timeout);
    });
  }

  _refreshListView() {
    //Start Rendering Spinner
    this.setState({refreshing: true});
    this.fetchChats();
    this.wait(1500).then(() => this.setState({refreshing: false})); //Stop Rendering Spinner
  }
}
